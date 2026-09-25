"use client";

import { useId } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatYen } from "@/lib/transaction-wording";
import { formatYMD } from "@/lib/date-utils";
import type {
  BalancePoint,
  MonthEndPosition,
  MonthlyMovement,
} from "@/lib/movement-stats";

/*
 * 統計ページのグラフ。色は取引カードの名目チップに合わせる。
 *   緑 = 金額がプラス（自分が渡した: 貸した・返済した）
 *   赤 = 金額がマイナス（自分が受け取った: 借りた・返済された）
 * 返済は薄い色にして、新しい貸し借りと見分けられるようにする。
 */

const GREEN = { light: "oklch(0.596 0.145 163.225)", dark: "oklch(0.696 0.17 162.48)" };
const GREEN_SOFT = { light: "oklch(0.845 0.143 164.978)", dark: "oklch(0.432 0.095 166.913)" };
const RED = { light: "oklch(0.577 0.245 27.325)", dark: "oklch(0.704 0.191 22.216)" };
const RED_SOFT = { light: "oklch(0.808 0.114 19.571)", dark: "oklch(0.444 0.177 26.899)" };

/** 軸の目盛り用の短い金額（「¥1.2万」） */
function formatCompactYen(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 10000) {
    return `${sign}¥${(abs / 10000).toLocaleString(undefined, { maximumFractionDigits: 1 })}万`;
  }
  return `${sign}¥${abs.toLocaleString()}`;
}

/** ツールチップの1行。マイナスで持っている値も金額は絶対値で見せる */
function tooltipRow(
  value: unknown,
  name: unknown,
  item: { color?: string; payload?: { fill?: string } },
  config: ChartConfig,
) {
  const color = item.payload?.fill ?? item.color;
  return (
    <>
      <div
        className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
        style={{ backgroundColor: color }}
      />
      <div className="flex flex-1 items-center justify-between gap-3 leading-none">
        <span className="text-muted-foreground">
          {config[String(name)]?.label ?? String(name)}
        </span>
        <span className="font-mono font-medium tabular-nums text-foreground">
          {formatYen(Number(value))}
        </span>
      </div>
    </>
  );
}

const movementConfig = {
  lend: { label: "貸した", theme: GREEN },
  repayMade: { label: "返済した", theme: GREEN_SOFT },
  borrow: { label: "借りた", theme: RED },
  repayReceived: { label: "返済された", theme: RED_SOFT },
} satisfies ChartConfig;

/**
 * 月ごとの貸し借り。上に「渡したお金」（貸した・返済した）、
 * 下に「受け取ったお金」（借りた・返済された）を積み上げる。
 */
export function MonthlyMovementChart({ data }: { data: MonthlyMovement[] }) {
  const rows = data.map((m) => ({
    label: m.label,
    shortLabel: m.shortLabel,
    lend: m.lend,
    repayMade: m.repayMade,
    borrow: -m.borrow,
    repayReceived: -m.repayReceived,
  }));
  const keys = (Object.keys(movementConfig) as Array<keyof typeof movementConfig>)
    .filter((key) => rows.some((r) => r[key] !== 0));

  return (
    <ChartContainer config={movementConfig} className="aspect-auto h-56 w-full">
      <BarChart data={rows} stackOffset="sign" margin={{ left: 4, right: 4 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="shortLabel"
          tickLine={false}
          axisLine={false}
          tickMargin={6}
          minTickGap={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={52}
          tickFormatter={formatCompactYen}
        />
        <ReferenceLine y={0} stroke="var(--border)" />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelKey="label"
              labelFormatter={(_, payload) => payload?.[0]?.payload?.label}
              formatter={(value, name, item) =>
                Number(value) === 0
                  ? null
                  : tooltipRow(value, name, item, movementConfig)
              }
            />
          }
        />
        <ChartLegend itemSorter={null} content={<ChartLegendContent />} />
        {keys.map((key) => (
          <Bar
            key={key}
            dataKey={key}
            stackId="movement"
            fill={`var(--color-${key})`}
            maxBarSize={28}
          />
        ))}
      </BarChart>
    </ChartContainer>
  );
}

const positionConfig = {
  lending: { label: "貸している", theme: GREEN },
  borrowing: { label: "借りている", theme: RED },
} satisfies ChartConfig;

/** 月末時点の「貸している／借りている」の合計の推移 */
export function MonthEndPositionChart({ data }: { data: MonthEndPosition[] }) {
  const keys = (Object.keys(positionConfig) as Array<keyof typeof positionConfig>)
    .filter((key) => data.some((r) => r[key] !== 0));

  return (
    <ChartContainer config={positionConfig} className="aspect-auto h-48 w-full">
      <LineChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="shortLabel"
          tickLine={false}
          axisLine={false}
          tickMargin={6}
          minTickGap={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={52}
          tickFormatter={formatCompactYen}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => payload?.[0]?.payload?.label}
              formatter={(value, name, item) =>
                tooltipRow(value, name, item, positionConfig)
              }
            />
          }
        />
        <ChartLegend itemSorter={null} content={<ChartLegendContent />} />
        {keys.map((key) => (
          <Line
            key={key}
            dataKey={key}
            type="linear"
            stroke={`var(--color-${key})`}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
}

const balanceConfig = {
  balance: { label: "残高" },
  credit: { label: "貸している", theme: GREEN },
  debt: { label: "借りている", theme: RED },
} satisfies ChartConfig;

/**
 * 相手との残高の推移。0より上（貸している）は緑、下（借りている）は赤で塗り分ける。
 */
export function BalanceHistoryChart({ data }: { data: BalancePoint[] }) {
  const gradientId = `balance-${useId().replace(/:/g, "")}`;
  const values = data.map((p) => p.balance);
  const max = Math.max(0, ...values);
  const min = Math.min(0, ...values);
  // グラデーションの切り替え位置（上端 = 0、下端 = 1）
  const zeroOffset = max === min ? 1 : max / (max - min);
  // 片側にしか振れていないときは、0円の線もその側の色にする
  const upper = max > 0 || min === 0 ? "var(--color-credit)" : "var(--color-debt)";
  const lower = min < 0 ? "var(--color-debt)" : "var(--color-credit)";

  return (
    <ChartContainer config={balanceConfig} className="aspect-auto h-52 w-full">
      <AreaChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <defs>
          <linearGradient id={`${gradientId}-stroke`} x1="0" y1="0" x2="0" y2="1">
            <stop offset={zeroOffset} stopColor={upper} />
            <stop offset={zeroOffset} stopColor={lower} />
          </linearGradient>
          <linearGradient id={`${gradientId}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset={0} stopColor={upper} stopOpacity={0.35} />
            <stop offset={zeroOffset} stopColor={upper} stopOpacity={0.05} />
            <stop offset={zeroOffset} stopColor={lower} stopOpacity={0.05} />
            <stop offset={1} stopColor={lower} stopOpacity={0.35} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="time"
          type="number"
          scale="time"
          domain={["dataMin", "dataMax"]}
          tickLine={false}
          axisLine={false}
          tickMargin={6}
          minTickGap={24}
          tickFormatter={(time: number) => {
            const d = new Date(time);
            return `${d.getFullYear() % 100}/${d.getMonth() + 1}`;
          }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={52}
          tickFormatter={formatCompactYen}
        />
        <ReferenceLine y={0} stroke="var(--border)" />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => {
                const time = payload?.[0]?.payload?.time;
                return typeof time === "number" ? formatYMD(new Date(time)) : null;
              }}
              formatter={(value) => {
                const balance = Number(value);
                return (
                  <div className="flex flex-1 items-center justify-between gap-3 leading-none">
                    <span className="text-muted-foreground">
                      {balance > 0 ? "貸している" : balance < 0 ? "借りている" : "精算済み"}
                    </span>
                    <span className="font-mono font-medium tabular-nums text-foreground">
                      {formatYen(balance)}
                    </span>
                  </div>
                );
              }}
            />
          }
        />
        <Area
          dataKey="balance"
          type="stepAfter"
          stroke={upper === lower ? upper : `url(#${gradientId}-stroke)`}
          strokeWidth={2}
          fill={`url(#${gradientId}-fill)`}
          baseValue={0}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}
