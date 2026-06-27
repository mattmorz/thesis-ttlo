ALTER TABLE "user_account" DROP CONSTRAINT IF EXISTS "user_account_phone_key";--> statement-breakpoint
ALTER TABLE "user_account" ADD COLUMN IF NOT EXISTS "google_access_token" text;--> statement-breakpoint
ALTER TABLE "user_account" ADD COLUMN IF NOT EXISTS "google_refresh_token" text;--> statement-breakpoint
ALTER TABLE "user_account" ADD COLUMN IF NOT EXISTS "google_token_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "user_account" DROP COLUMN IF EXISTS "phone_number";
