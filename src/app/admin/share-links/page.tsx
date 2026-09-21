/**
 * 発行済みの共有リンク（/share/[token]）の一覧。
 *
 * 共有リンクは未認証で残高・取引履歴が読める唯一の経路なので、
 * 「いまどのリンクが生きているか」を把握し、必要なら管理者が失効させられるようにする。
 * トークンそのものはここには出さない（見えてしまうと管理画面から中身を覗けてしまう）。
 */

import Link from "next/link";
import { getAdminShareLinks } from "@/actions/admin/queries";
import { SHARE_LINK_EXPIRING_DAYS } from "@/actions/admin/types";
import {
  Balance,
  EmptyRow,
  PageHeader,
  Panel,
  StatTile,
  TableWrap,
  Td,
  Th,
} from "@/components/features/admin/admin-ui";
import { RevokeShareLinkButton } from "@/components/features/admin/revoke-share-link-button";
import { Badge } from "@/components/ui/badge";
import { formatDateTimeForDisplay } from "@/lib/date-utils";

export default async function AdminShareLinksPage() {
  const links = await getAdminShareLinks();

  const active = links.filter((l) => !l.isExpired);
  const expiringSoon = links.filter((l) => l.isExpiringSoon);
  const expired = links.filter((l) => l.isExpired);

  return (
    <>
      <PageHeader
        title="共有リンク"
        description="相手に配布された公開ページのリンク。未認証で残高と取引履歴が読める唯一の経路"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatTile label="有効なリンク" value={active.length.toLocaleString()} />
        <StatTile
          label="まもなく期限切れ"
          value={expiringSoon.length.toLocaleString()}
          sub={`${SHARE_LINK_EXPIRING_DAYS}日以内に切れる`}
          tone={expiringSoon.length > 0 ? "warning" : "default"}
        />
        <StatTile
          label="期限切れ"
          value={expired.length.toLocaleString()}
          sub="トークンは残っているが開けない状態"
        />
      </div>

      <Panel
        title={`${links.length}件`}
        description="期限が近い順。失効させると配布済みのURLは開けなくなる（オーナーは発行し直せる）"
      >
        <TableWrap>
          <thead>
            <tr>
              <Th>相手</Th>
              <Th>オーナー</Th>
              <Th align="right">公開される残高</Th>
              <Th align="right">口座</Th>
              <Th>有効期限</Th>
              <Th align="center">状態</Th>
              <Th align="right"></Th>
            </tr>
          </thead>
          <tbody>
            {links.length === 0 ? (
              <EmptyRow colSpan={7}>
                発行されている共有リンクはありません
              </EmptyRow>
            ) : (
              links.map((link) => (
                <tr key={link.partnerId} className="border-t hover:bg-muted/40">
                  <Td>
                    <span className="font-medium">{link.partnerName}</span>
                    {link.partnerIsArchived && (
                      <Badge variant="outline" className="ml-2">
                        アーカイブ
                      </Badge>
                    )}
                  </Td>
                  <Td>
                    <Link
                      href={`/admin/accounts/${link.ownerId}`}
                      className="hover:underline"
                    >
                      {link.ownerName}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {link.ownerEmail}
                    </div>
                  </Td>
                  <Td align="right">
                    <Balance amount={link.balance} />
                  </Td>
                  <Td align="right">{link.ledgerCount}</Td>
                  <Td className="whitespace-nowrap text-xs text-muted-foreground">
                    {link.expiresAt
                      ? formatDateTimeForDisplay(link.expiresAt)
                      : "（期限なし）"}
                  </Td>
                  <Td align="center">
                    {link.isExpired ? (
                      <Badge variant="outline">期限切れ</Badge>
                    ) : link.isExpiringSoon ? (
                      <Badge variant="destructive">まもなく期限切れ</Badge>
                    ) : (
                      <Badge variant="secondary">有効</Badge>
                    )}
                  </Td>
                  <Td align="right">
                    <RevokeShareLinkButton
                      partnerId={link.partnerId}
                      partnerName={link.partnerName}
                      ownerName={link.ownerName}
                    />
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </TableWrap>
      </Panel>
    </>
  );
}
