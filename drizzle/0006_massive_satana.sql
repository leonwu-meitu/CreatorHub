CREATE TABLE `creator_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`creator` text NOT NULL,
	`task_id` text NOT NULL,
	`joined_at` text NOT NULL,
	`status` text DEFAULT 'Joined' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_creator_tasks_creator` ON `creator_tasks` (`creator`);