CREATE TABLE `holdings` (
	`holding_id` varchar(36) NOT NULL,
	`snapshot_id` varchar(36) NOT NULL,
	`ticker` varchar(20) NOT NULL,
	`broker` varchar(100) NOT NULL,
	`shares` decimal(18,6) NOT NULL,
	`share_price` decimal(18,4),
	`total_value` decimal(18,2) NOT NULL,
	`cost_basis` decimal(18,2),
	`total_value_gain_pct` decimal(10,4),
	`return_1d` decimal(10,4),
	`return_1m` decimal(10,4),
	`return_6m` decimal(10,4),
	CONSTRAINT `holdings_holding_id` PRIMARY KEY(`holding_id`)
);
--> statement-breakpoint
CREATE TABLE `securities` (
	`ticker` varchar(20) NOT NULL,
	`name` varchar(255) NOT NULL,
	`exchange` varchar(20),
	CONSTRAINT `securities_ticker` PRIMARY KEY(`ticker`)
);
--> statement-breakpoint
CREATE TABLE `snapshots` (
	`snapshot_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`snapshot_date` date NOT NULL,
	CONSTRAINT `snapshots_snapshot_id` PRIMARY KEY(`snapshot_id`),
	CONSTRAINT `snapshots_user_id_snapshot_date_unique` UNIQUE(`user_id`,`snapshot_date`)
);
--> statement-breakpoint
ALTER TABLE `holdings` ADD CONSTRAINT `holdings_snapshot_id_snapshots_snapshot_id_fk` FOREIGN KEY (`snapshot_id`) REFERENCES `snapshots`(`snapshot_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `holdings` ADD CONSTRAINT `holdings_ticker_securities_ticker_fk` FOREIGN KEY (`ticker`) REFERENCES `securities`(`ticker`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `snapshots` ADD CONSTRAINT `snapshots_user_id_users_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_holdings_snapshot_id` ON `holdings` (`snapshot_id`);--> statement-breakpoint
CREATE INDEX `idx_holdings_ticker` ON `holdings` (`ticker`);--> statement-breakpoint
CREATE INDEX `idx_snapshots_user_id` ON `snapshots` (`user_id`);