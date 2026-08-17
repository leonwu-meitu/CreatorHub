CREATE TABLE `streak_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`creator` text NOT NULL,
	`completed_tasks` integer NOT NULL,
	`selected_app` text NOT NULL,
	`status` text DEFAULT 'In review' NOT NULL,
	`vip_code` text DEFAULT '' NOT NULL,
	`submitted` text NOT NULL,
	`reviewed_at` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_streak_requests_creator` ON `streak_requests` (`creator`);--> statement-breakpoint
CREATE INDEX `idx_streak_requests_status` ON `streak_requests` (`status`);