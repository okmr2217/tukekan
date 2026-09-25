ALTER TABLE `Account` ADD `onboardingCompletedAt` integer;--> statement-breakpoint
-- 導入前からあるアカウントはオンボーディング済みとして扱う（手で追記）
UPDATE `Account` SET `onboardingCompletedAt` = `createdAt`;
