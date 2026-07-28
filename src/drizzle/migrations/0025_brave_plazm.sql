ALTER TABLE "other_documents" ADD COLUMN "ip_application_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "other_documents" DROP CONSTRAINT IF EXISTS "other_documents_ip_application_id_fkey";--> statement-breakpoint
ALTER TABLE "other_documents" ADD CONSTRAINT "other_documents_ip_application_id_fkey" FOREIGN KEY ("ip_application_id") REFERENCES "public"."ip_application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_other_documents_application" ON "other_documents" USING btree ("ip_application_id" uuid_ops);