CREATE TABLE `shifts` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`clock_in_time` timestamp NOT NULL,
	`clock_out_time` timestamp,
	`status` enum('pending','active','completed') NOT NULL DEFAULT 'pending',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shifts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `shifts` ADD CONSTRAINT `shifts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;