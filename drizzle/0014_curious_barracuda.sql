ALTER TABLE `submissions` ADD `total_engagement` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `submissions` ADD `analytics_status` text DEFAULT 'Pending AI extraction' NOT NULL;