CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`ticket_id` text NOT NULL,
	`actor` text NOT NULL,
	`kind` text NOT NULL,
	`payload` text NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `events_ticket_created` ON `events` (`ticket_id`,`created`);--> statement-breakpoint
CREATE TABLE `requests` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`project` text NOT NULL,
	`client_key` text NOT NULL,
	`digest` text NOT NULL,
	`receipt` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `requests_owner_key` ON `requests` (`owner`,`client_key`);--> statement-breakpoint
CREATE TABLE `tickets` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`project` text NOT NULL,
	`request_id` text NOT NULL,
	`kind` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`status` text NOT NULL,
	`body` text NOT NULL,
	`packs` text NOT NULL,
	`note` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL,
	FOREIGN KEY (`request_id`) REFERENCES `requests`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `tickets_owner_project_updated` ON `tickets` (`owner`,`project`,`updated`);--> statement-breakpoint
CREATE INDEX `tickets_owner_status` ON `tickets` (`owner`,`status`);--> statement-breakpoint
CREATE TABLE `tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`hash` text NOT NULL,
	`owner` text NOT NULL,
	`project` text NOT NULL,
	`created` text NOT NULL,
	`revoked` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tokens_hash` ON `tokens` (`hash`);--> statement-breakpoint
CREATE INDEX `tokens_owner` ON `tokens` (`owner`);