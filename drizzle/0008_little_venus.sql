ALTER TABLE `rewards` ADD `submission_id` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `rewards` ADD `payment_form_checked` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `rewards` ADD `paid_at` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `submissions` ADD `engagement_rate` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `submissions` ADD `whatsapp` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `submissions` ADD `submitted_at` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `submissions` ADD `qualification_reason` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `reference_link` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `tutorial_link` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `starts_at` text DEFAULT '' NOT NULL;