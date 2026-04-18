CREATE TABLE `accounts` (
	`account_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`plaid_item_id` varchar(36),
	`plaid_account_id` varchar(255),
	`name` varchar(255) NOT NULL,
	`type` varchar(50),
	`subtype` varchar(50),
	`source` varchar(20) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `accounts_account_id` PRIMARY KEY(`account_id`),
	CONSTRAINT `accounts_plaid_account_id_unique` UNIQUE(`plaid_account_id`)
);
--> statement-breakpoint
CREATE TABLE `plaid_items` (
	`item_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`plaid_item_id` varchar(255) NOT NULL,
	`access_token` varchar(255) NOT NULL,
	`institution_id` varchar(100),
	`institution_name` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `plaid_items_item_id` PRIMARY KEY(`item_id`),
	CONSTRAINT `plaid_items_plaid_item_id_unique` UNIQUE(`plaid_item_id`)
);
