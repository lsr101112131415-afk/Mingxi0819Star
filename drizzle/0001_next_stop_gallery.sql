CREATE TABLE `next_stop_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`object_key` text NOT NULL,
	`filename` text NOT NULL,
	`mime_type` text NOT NULL,
	`size` integer NOT NULL,
	`sort_order` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `next_stop_photos_object_key_unique` ON `next_stop_photos` (`object_key`);
--> statement-breakpoint
CREATE INDEX `idx_next_stop_photos_sort` ON `next_stop_photos` (`sort_order`);
