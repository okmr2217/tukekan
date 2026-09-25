/**
 * オンボーディングのステップ（新規登録のあとに順に進む）。
 * 1ステップ = 1ページにしてあるので、途中でリロード・中断してもそのステップから続けられる。
 */
export const ONBOARDING_STEPS = [
  { path: "/onboarding/profile", label: "表示名" },
  { path: "/onboarding/labels", label: "ボタン表示" },
  { path: "/onboarding/partner", label: "相手" },
  { path: "/onboarding/transaction", label: "取引" },
] as const;

export const ONBOARDING_PATHS = {
  profile: ONBOARDING_STEPS[0].path,
  labels: ONBOARDING_STEPS[1].path,
  partner: ONBOARDING_STEPS[2].path,
  transaction: ONBOARDING_STEPS[3].path,
} as const;
