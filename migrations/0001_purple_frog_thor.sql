CREATE TYPE "public"."contact_preference" AS ENUM('email', 'phone', 'both');--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "contact_phone" varchar(20);--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "contact_preference" "contact_preference" DEFAULT 'email';--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "best_time_to_contact" varchar(100);--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "location" varchar(100);