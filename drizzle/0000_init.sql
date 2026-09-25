CREATE TABLE `Account` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`passwordHash` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`transactionLabelPreset` text DEFAULT 'BOTH' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Account_email_unique` ON `Account` (`email`);--> statement-breakpoint
CREATE TABLE `AdminAuditLog` (
	`id` text PRIMARY KEY NOT NULL,
	`actorEmail` text NOT NULL,
	`action` text NOT NULL,
	`targetType` text,
	`targetId` text,
	`summary` text NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `AdminAuditLog_createdAt_idx` ON `AdminAuditLog` (`createdAt`);--> statement-breakpoint
CREATE INDEX `AdminAuditLog_actorEmail_idx` ON `AdminAuditLog` (`actorEmail`);--> statement-breakpoint
CREATE TABLE `Ledger` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`annualInterestRateBp` integer DEFAULT 0 NOT NULL,
	`interestAccrualWeekday` integer DEFAULT 3 NOT NULL,
	`interestCompounding` integer DEFAULT false NOT NULL,
	`lastInterestAccruedAt` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`partnerId` text NOT NULL,
	FOREIGN KEY (`partnerId`) REFERENCES `Partner`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `Ledger_partnerId_idx` ON `Ledger` (`partnerId`);--> statement-breakpoint
CREATE TABLE `Partner` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`isArchived` integer DEFAULT false NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`shareToken` text,
	`shareTokenExpiresAt` integer,
	`shareNote` text,
	`ownerId` text NOT NULL,
	FOREIGN KEY (`ownerId`) REFERENCES `Account`(`id`) ON UPDATE cascade ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Partner_shareToken_unique` ON `Partner` (`shareToken`);--> statement-breakpoint
CREATE UNIQUE INDEX `Partner_ownerId_name_key` ON `Partner` (`ownerId`,`name`);--> statement-breakpoint
CREATE TABLE `Transaction` (
	`id` text PRIMARY KEY NOT NULL,
	`amount` integer NOT NULL,
	`purpose` text,
	`description` text,
	`date` integer NOT NULL,
	`kind` text DEFAULT 'NORMAL' NOT NULL,
	`isArchived` integer DEFAULT false NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`ownerId` text NOT NULL,
	`partnerId` text NOT NULL,
	`ledgerId` text,
	FOREIGN KEY (`ownerId`) REFERENCES `Account`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`partnerId`) REFERENCES `Partner`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`ledgerId`) REFERENCES `Ledger`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `Transaction_ownerId_idx` ON `Transaction` (`ownerId`);--> statement-breakpoint
CREATE INDEX `Transaction_partnerId_idx` ON `Transaction` (`partnerId`);--> statement-breakpoint
CREATE INDEX `Transaction_ledgerId_idx` ON `Transaction` (`ledgerId`);--> statement-breakpoint
CREATE INDEX `Transaction_date_idx` ON `Transaction` (`date`);