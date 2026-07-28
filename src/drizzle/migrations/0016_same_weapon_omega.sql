CREATE TABLE IF NOT EXISTS "documents_verification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"validation_status" varchar(50) DEFAULT 'pending' NOT NULL,
	"validated_by" uuid,
	"validated_at" timestamp,
	"validation_remarks" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "validation_status_check" CHECK ((validation_status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'needs_revision'::character varying])::text[]))
);
--> statement-breakpoint
ALTER TABLE "documents" RENAME COLUMN "document_id" TO "id";--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT "document_status_check";--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT "document_validation_status_check";--> statement-breakpoint
ALTER TABLE "other_documents" DROP CONSTRAINT "other_documents_status_check";--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT "documents_application_id_fkey";
--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT "documents_phase_id_fkey";
--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT "documents_validated_by_fkey";
--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT "documents_verified_by_fkey";
--> statement-breakpoint
ALTER TABLE "internal_validation" DROP CONSTRAINT "internal_validation_document_id_fkey";
--> statement-breakpoint
DROP INDEX "idx_documents_validation";--> statement-breakpoint
DROP INDEX "idx_ip_app_notification_read";--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "type" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "file_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "created_at" timestamp DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "documents_verification" ADD CONSTRAINT "documents_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents_verification" ADD CONSTRAINT "documents_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_documents_validation" ON "documents_verification" USING btree ("validation_status" text_ops);--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_project_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."ip_application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_validation" ADD CONSTRAINT "internal_validation_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ip_app_notification_read" ON "ip_application_notification" USING btree ("is_read" bool_ops);--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "phase_id";--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "file_path";--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "uploaded_at";--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "verified_by";--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "verified_at";--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "remarks";--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "validation_status";--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "validation_date";--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "validated_by";--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "validation_remarks";--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "document_type_check" CHECK ((category)::text = ANY ((ARRAY['application'::character varying, 'contract'::character varying, 'report'::character varying, 'form'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "other_documents" ADD CONSTRAINT "other_documents_status_check" CHECK ((status)::text = ANY (ARRAY[('active'::character varying)::text, ('archived'::character varying)::text, ('deleted'::character varying)::text]));