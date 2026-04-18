-- Add unique index on ticker before dropping PK so the holdings FK remains valid throughout
ALTER TABLE `securities` ADD CONSTRAINT `securities_ticker_unique` UNIQUE(`ticker`);--> statement-breakpoint
ALTER TABLE `securities` MODIFY COLUMN `security_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `securities` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `securities` ADD PRIMARY KEY(`security_id`);--> statement-breakpoint
ALTER TABLE `securities` MODIFY COLUMN `ticker` varchar(20);
