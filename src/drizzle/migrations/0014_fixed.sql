CREATE TYPE "public"."form_source_type" AS ENUM('client_profile', 'ip_disclosure', 'substantial_use', 'deed_of_assignment', 'other_document');
CREATE TYPE "public"."form_submission_status" AS ENUM('draft', 'submitted', 'processed', 'pending_review', 'failed');
CREATE TABLE "form_data_mapping" (
	"mapping_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registry_id" uuid NOT NULL,
	"fieldKey" varchar(100) NOT NULL,
	"fieldValue" text,
	"field_array_value" jsonb,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "form_submission_registry" (
	"registry_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"source_type" "form_source_type" NOT NULL,
	"source_id" uuid NOT NULL,
	"ip_application_id" uuid,
	"status" "form_submission_status" DEFAULT 'draft' NOT NULL,
	"title" varchar(255),
	"description" text,
	"inventors_creators" jsonb,
	"applicants" jsonb,
	"processing_errors" text,
	"attempts_count" integer DEFAULT 0,
	"submitted_at" timestamp,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "ip_application_notification" (
	"notification_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ip_application_id" uuid NOT NULL,
	"form_registry_id" uuid,
	"admin_id" uuid,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"is_priority" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"read_at" timestamp
);
CREATE TABLE "other_documents" (
	"document_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"file_path" text NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"category" varchar(100),
	"description" text,
	"uploaded_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"status" varchar(50) DEFAULT 'active',
	"metadata" jsonb,
	CONSTRAINT "other_documents_status_check" CHECK ((status)::text = ANY ((ARRAY['active'::character varying, 'archived'::character varying, 'deleted'::character varying])::text[]))
);
ALTER TABLE "form_data_mapping" ADD CONSTRAINT "fk_form_data_mapping_registry" FOREIGN KEY ("registry_id") REFERENCES "public"."form_submission_registry"("registry_id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "form_submission_registry" ADD CONSTRAINT "fk_form_submission_registry_user" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "form_submission_registry" ADD CONSTRAINT "fk_form_submission_registry_ip_application" FOREIGN KEY ("ip_application_id") REFERENCES "public"."ip_application"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "ip_application_notification" ADD CONSTRAINT "fk_ip_app_notification_ip_application" FOREIGN KEY ("ip_application_id") REFERENCES "public"."ip_application"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "ip_application_notification" ADD CONSTRAINT "fk_ip_app_notification_form_registry" FOREIGN KEY ("form_registry_id") REFERENCES "public"."form_submission_registry"("registry_id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "ip_application_notification" ADD CONSTRAINT "fk_ip_app_notification_admin" FOREIGN KEY ("admin_id") REFERENCES "public"."user_account"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "other_documents" ADD CONSTRAINT "other_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "idx_form_data_mapping_registry" ON "form_data_mapping" USING btree ("registry_id");
CREATE INDEX "idx_form_submission_registry_user" ON "form_submission_registry" USING btree ("user_id");
CREATE INDEX "idx_form_submission_registry_source" ON "form_submission_registry" ("source_type", "source_id");
CREATE INDEX "idx_form_submission_registry_status" ON "form_submission_registry" USING btree ("status");
CREATE INDEX "idx_form_submission_registry_ip_app" ON "form_submission_registry" USING btree ("ip_application_id");
CREATE INDEX "idx_ip_app_notification_app" ON "ip_application_notification" USING btree ("ip_application_id");
CREATE INDEX "idx_ip_app_notification_admin" ON "ip_application_notification" USING btree ("admin_id");
CREATE INDEX "idx_ip_app_notification_registry" ON "ip_application_notification" USING btree ("form_registry_id");
CREATE INDEX "idx_ip_app_notification_read" ON "ip_application_notification" USING btree ("is_read");
CREATE INDEX "idx_other_documents_form" ON "other_documents" USING btree ("form_id");
CREATE INDEX "idx_other_documents_user" ON "other_documents" USING btree ("user_id"); 