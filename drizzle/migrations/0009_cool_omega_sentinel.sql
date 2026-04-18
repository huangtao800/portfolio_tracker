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
