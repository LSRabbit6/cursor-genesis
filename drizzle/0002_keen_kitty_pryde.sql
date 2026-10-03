ALTER TABLE `tokens` ADD `scopes` text DEFAULT '["read","submit","evidence","withdraw"]' NOT NULL;--> statement-breakpoint
ALTER TABLE `tokens` ADD `expires_at` text;--> statement-breakpoint
ALTER TABLE `tokens` ADD `last_used` text;