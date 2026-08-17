CREATE TABLE `app_expansion_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`creator` text NOT NULL,
	`current_apps` text NOT NULL,
	`requested_apps` text NOT NULL,
	`reason` text NOT NULL,
	`status` text DEFAULT 'In review' NOT NULL,
	`submitted` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_app_expansion_requests_creator` ON `app_expansion_requests` (`creator`);