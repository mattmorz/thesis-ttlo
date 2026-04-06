ALTER TABLE "user_account" DROP CONSTRAINT "user_account_phone_key";--> statement-breakpoint
ALTER TABLE "user_account" ADD COLUMN "google_access_token" text;--> statement-breakpoint
ALTER TABLE "user_account" ADD COLUMN "google_refresh_token" text;--> statement-breakpoint
ALTER TABLE "user_account" ADD COLUMN "google_token_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "user_account" DROP COLUMN "phone_number";