ALTER TABLE "user_account" DROP CONSTRAINT IF EXISTS "user_account_phone_key";--> statement-breakpoint
ALTER TABLE "user_account" DROP COLUMN IF EXISTS "phone_number";
