ALTER TABLE "user_account" ADD COLUMN "google_access_token" text;
ALTER TABLE "user_account" ADD COLUMN "google_refresh_token" text;
ALTER TABLE "user_account" ADD COLUMN "google_token_expires_at" timestamp;
