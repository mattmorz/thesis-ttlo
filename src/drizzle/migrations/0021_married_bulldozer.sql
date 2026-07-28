ALTER TABLE "substantial_use" DROP CONSTRAINT IF EXISTS "substantial_use_application_id_ip_application_id_fk";
--> statement-breakpoint
ALTER TABLE "deed_of_assignment" ADD COLUMN "application_id" uuid;--> statement-breakpoint
ALTER TABLE "deed_of_assignment" DROP CONSTRAINT IF EXISTS "deed_of_assignment_application_id_fkey";--> statement-breakpoint
ALTER TABLE "deed_of_assignment" ADD CONSTRAINT "deed_of_assignment_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."ip_application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_deed_of_assignment_application" ON "deed_of_assignment" USING btree ("application_id" uuid_ops);