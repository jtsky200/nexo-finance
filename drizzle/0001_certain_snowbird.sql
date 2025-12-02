CREATE TABLE `financeEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` timestamp NOT NULL,
	`type` enum('einnahme','ausgabe') NOT NULL,
	`category` varchar(100) NOT NULL,
	`amount` int NOT NULL,
	`currency` varchar(3) NOT NULL,
	`paymentMethod` varchar(100),
	`notes` text,
	`isRecurring` boolean NOT NULL DEFAULT false,
	`recurrenceRule` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `financeEntries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reminders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`type` enum('termin','zahlung','aufgabe') NOT NULL,
	`dueDate` timestamp NOT NULL,
	`isAllDay` boolean NOT NULL DEFAULT false,
	`amount` int,
	`currency` varchar(3),
	`recurrenceRule` text,
	`status` enum('offen','erledigt','überfällig') NOT NULL DEFAULT 'offen',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reminders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `taxProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`taxYear` int NOT NULL,
	`country` varchar(2) NOT NULL DEFAULT 'CH',
	`canton` varchar(2),
	`status` enum('unvollständig','vollständig','archiviert') NOT NULL DEFAULT 'unvollständig',
	`maritalStatus` varchar(50),
	`numberOfChildren` int DEFAULT 0,
	`grossIncome` int,
	`otherIncome` int,
	`deductions` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `taxProfiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `locale` varchar(10) DEFAULT 'de-CH' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `defaultCurrency` varchar(3) DEFAULT 'CHF' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `canton` varchar(2);