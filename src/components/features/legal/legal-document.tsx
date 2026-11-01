import type { ReactNode } from "react";

/** 利用規約・プライバシーポリシーに書く運営者の表記と、お問い合わせの窓口 */
export const OPERATOR_NAME = "ツケカン運営";
export const CONTACT_EMAIL = "daichi@paritto.dev";

export type LegalSection = {
  title: string;
  /** 段落 */
  body?: ReactNode[];
  /** 箇条書き。body の後ろに出す */
  list?: ReactNode[];
  /** 箇条書きの後ろに続ける段落 */
  after?: ReactNode[];
};

/** お問い合わせのメールアドレス（メールアプリで開くリンク） */
export function ContactEmail() {
  return (
    <a
      href={`mailto:${CONTACT_EMAIL}`}
      className="font-medium text-primary underline-offset-4 hover:underline"
    >
      {CONTACT_EMAIL}
    </a>
  );
}

/** 利用規約・プライバシーポリシーの本文。条ごとに見出しと段落・箇条書きを並べる */
export function LegalDocument({
  title,
  enactedAt,
  intro,
  sections,
}: {
  title: string;
  /** 制定日（「2026年11月2日」）。改定したら「最終改定日」を足す */
  enactedAt: string;
  intro?: ReactNode;
  sections: LegalSection[];
}) {
  return (
    <article className="mx-auto w-full max-w-[760px] px-4 py-14 md:px-8 md:py-20">
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
        {title}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">制定日：{enactedAt}</p>

      {intro && (
        <p className="mt-8 text-[15px] leading-[1.9] text-foreground">{intro}</p>
      )}

      <div className="mt-10 space-y-9 text-[15px] leading-[1.9] text-foreground">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="mb-2 text-base font-bold">{section.title}</h2>
            {section.body?.map((paragraph, i) => (
              <p key={i} className={i > 0 ? "mt-3" : undefined}>
                {paragraph}
              </p>
            ))}
            {section.list && (
              <ul className="mt-3 list-disc space-y-1.5 pl-5">
                {section.list.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            )}
            {section.after?.map((paragraph, i) => (
              <p key={i} className="mt-3">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
    </article>
  );
}
