CREATE TABLE `creator_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`creator` text NOT NULL,
	`niches` text DEFAULT '' NOT NULL,
	`avatar_key` text DEFAULT '' NOT NULL,
	`avatar_name` text DEFAULT '' NOT NULL,
	`threads_url` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_creator_profiles_creator` ON `creator_profiles` (`creator`);--> statement-breakpoint
CREATE TABLE `payment_forms` (
	`id` text PRIMARY KEY NOT NULL,
	`product` text NOT NULL,
	`month` text NOT NULL,
	`url` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_payment_forms_month_product` ON `payment_forms` (`month`,`product`);--> statement-breakpoint
ALTER TABLE `streak_requests` ADD `start_task_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `streak_requests` ADD `started_at` text DEFAULT '' NOT NULL;