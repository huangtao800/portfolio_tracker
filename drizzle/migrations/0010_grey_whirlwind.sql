ALTER TABLE `securities` ADD `plaid_security_id` varchar(255);--> statement-breakpoint
ALTER TABLE `securities` ADD `type` varchar(50);--> statement-breakpoint
ALTER TABLE `securities` ADD `subtype` varchar(50);--> statement-breakpoint
ALTER TABLE `securities` ADD `is_cash_equivalent` boolean;--> statement-breakpoint
ALTER TABLE `securities` ADD CONSTRAINT `securities_plaid_security_id_unique` UNIQUE(`plaid_security_id`);