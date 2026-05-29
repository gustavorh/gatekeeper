ALTER TABLE `role_permissions` DROP FOREIGN KEY `role_permissions_role_id_roles_id_fk`;
--> statement-breakpoint
ALTER TABLE `role_permissions` DROP FOREIGN KEY `role_permissions_permission_id_permissions_id_fk`;
--> statement-breakpoint
ALTER TABLE `shifts` DROP FOREIGN KEY `shifts_user_id_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `user_roles` DROP FOREIGN KEY `user_roles_user_id_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `user_roles` DROP FOREIGN KEY `user_roles_role_id_roles_id_fk`;
--> statement-breakpoint
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_unique` UNIQUE(`role_id`,`permission_id`);--> statement-breakpoint
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_unique` UNIQUE(`user_id`,`role_id`);--> statement-breakpoint
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_role_id_roles_id_fk` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_permission_id_permissions_id_fk` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shifts` ADD CONSTRAINT `shifts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_role_id_roles_id_fk` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `shifts_user_id_idx` ON `shifts` (`user_id`);--> statement-breakpoint
CREATE INDEX `shifts_status_idx` ON `shifts` (`status`);--> statement-breakpoint
CREATE INDEX `shifts_user_status_idx` ON `shifts` (`user_id`,`status`);--> statement-breakpoint
CREATE INDEX `shifts_created_at_idx` ON `shifts` (`created_at`);