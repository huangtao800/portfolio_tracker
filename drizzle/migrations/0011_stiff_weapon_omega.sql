ALTER TABLE `snapshots` DROP INDEX `snapshots_user_id_snapshot_date_unique`;--> statement-breakpoint
ALTER TABLE `snapshots` ADD `account_id` varchar(36);--> statement-breakpoint
ALTER TABLE `snapshots` ADD CONSTRAINT `snapshots_account_id_snapshot_date_unique` UNIQUE(`account_id`,`snapshot_date`);--> statement-breakpoint
CREATE INDEX `idx_snapshots_account_id` ON `snapshots` (`account_id`);