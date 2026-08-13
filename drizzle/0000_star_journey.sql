CREATE TABLE `locations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`subtitle` text NOT NULL,
	`description` text NOT NULL,
	`stop_order` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `photos` (
	`id` text PRIMARY KEY NOT NULL,
	`location_id` text NOT NULL,
	`object_key` text NOT NULL,
	`filename` text NOT NULL,
	`mime_type` text NOT NULL,
	`size` integer NOT NULL,
	`sort_order` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `photos_object_key_unique` ON `photos` (`object_key`);
--> statement-breakpoint
CREATE INDEX `idx_photos_location_sort` ON `photos` (`location_id`,`sort_order`);
--> statement-breakpoint
INSERT INTO `locations` (`id`,`name`,`subtitle`,`description`,`stop_order`) VALUES
('sydney','悉尼','Sydney · Australia','故事从悉尼开始。海风、阳光，还有我们第一次一起出发的期待。',1),
('vanuatu','瓦努阿图','Vanuatu','在南太平洋的蓝色里，把快乐踩成一串小小的浪花。',2),
('new-zealand','新西兰','New Zealand','山、云和草地都很近，我们一起收集了好多绿色的记忆。',3),
('japan','日本','Japan','小街、列车和甜甜的点心，组成了闪闪发光的一站。',4),
('thailand','泰国','Thailand','热带的风吹过来，连笑声都变得暖暖的。',5),
('hong-kong','香港','Hong Kong','城市的灯亮起来，我们的星星旅程也多了一颗新收藏。',6);
