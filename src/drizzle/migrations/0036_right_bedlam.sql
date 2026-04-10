CREATE TYPE "public"."form_source_type" AS ENUM('client_profile', 'ip_disclosure', 'substantial_use', 'deed_of_assignment', 'other_document');--> statement-breakpoint
CREATE TYPE "public"."form_submission_status" AS ENUM('draft', 'submitted', 'processed', 'pending_review', 'failed');--> statement-breakpoint
ALTER TYPE "public"."application_type" ADD VALUE 'industrial_design';--> statement-breakpoint
ALTER TYPE "public"."application_type" ADD VALUE 'trade_secret';--> statement-breakpoint
ALTER TYPE "public"."application_type" ADD VALUE 'not_sure';--> statement-breakpoint
ALTER TYPE "public"."application_type" ADD VALUE 'other';--> statement-breakpoint
CREATE TABLE "documents_validation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"validation_status" varchar(50) DEFAULT 'pending' NOT NULL,
	"validated_by" uuid,
	"validated_at" timestamp,
	"validation_remarks" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"file_name" text,
	"file_type" varchar(50),
	"file_size" integer,
	CONSTRAINT "documents_validation_document_id_unique" UNIQUE("document_id"),
	CONSTRAINT "validation_status_check" CHECK ((validation_status)::text = ANY (ARRAY[('pending'::character varying)::text, ('approved'::character varying)::text, ('rejected'::character varying)::text, ('needs_revision'::character varying)::text]))
);
--> statement-breakpoint
CREATE TABLE "form_data_mapping" (
	"mapping_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registry_id" uuid NOT NULL,
	"fieldKey" varchar(100) NOT NULL,
	"fieldValue" text,
	"field_array_value" jsonb,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE "internal_validation_assignee" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"internal_validation_id" uuid,
	"user_id" uuid,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "ip_application_enrollment" (
	"enrollment_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"role" varchar(50) DEFAULT 'manager' NOT NULL
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE "other_documents" (
	"document_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" uuid,
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
	"ip_application_id" uuid NOT NULL,
	"title" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "phase_task_assignee" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
ALTER TABLE "copyright_applicant" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "copyright_application" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "copyright_author_creator" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "copyright_work_creation" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "matrix_feature" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "matrix_features" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "matrix_prior_art" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "patent_basic_application" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "patent_inventors" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "patent_matrix" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "patent_search_documents" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "task_assignment" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "copyright_applicant" CASCADE;--> statement-breakpoint
DROP TABLE "copyright_application" CASCADE;--> statement-breakpoint
DROP TABLE "copyright_author_creator" CASCADE;--> statement-breakpoint
DROP TABLE "copyright_work_creation" CASCADE;--> statement-breakpoint
DROP TABLE "matrix_feature" CASCADE;--> statement-breakpoint
DROP TABLE "matrix_features" CASCADE;--> statement-breakpoint
DROP TABLE "matrix_prior_art" CASCADE;--> statement-breakpoint
DROP TABLE "patent_basic_application" CASCADE;--> statement-breakpoint
DROP TABLE "patent_inventors" CASCADE;--> statement-breakpoint
DROP TABLE "patent_matrix" CASCADE;--> statement-breakpoint
DROP TABLE "patent_search_documents" CASCADE;--> statement-breakpoint
DROP TABLE "task_assignment" CASCADE;--> statement-breakpoint
ALTER TABLE "application_phase" DROP CONSTRAINT "ck_phase_progress";--> statement-breakpoint
ALTER TABLE "application_phase" DROP CONSTRAINT "ck_phase_status";--> statement-breakpoint
ALTER TABLE "calendar_event" DROP CONSTRAINT "calendar_event_priority_check";--> statement-breakpoint
ALTER TABLE "calendar_event" DROP CONSTRAINT "calendar_event_event_type_check";--> statement-breakpoint
ALTER TABLE "calendar_event" DROP CONSTRAINT "calendar_event_status_check";--> statement-breakpoint
ALTER TABLE "contact_message" DROP CONSTRAINT "contact_message_status_check";--> statement-breakpoint
ALTER TABLE "deed_of_assignment" DROP CONSTRAINT "deed_of_assignment_status_check";--> statement-breakpoint
ALTER TABLE "digital_signature" DROP CONSTRAINT "digital_signature_signer_type_check";--> statement-breakpoint
ALTER TABLE "document_management" DROP CONSTRAINT "document_management_entity_type_check";--> statement-breakpoint
ALTER TABLE "document_management" DROP CONSTRAINT "document_status_check";--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT "document_status_check";--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT "document_validation_status_check";--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT "document_category_check";--> statement-breakpoint
ALTER TABLE "event_participant" DROP CONSTRAINT "event_participant_status_check";--> statement-breakpoint
ALTER TABLE "external_collaboration" DROP CONSTRAINT "external_collaboration_status_check";--> statement-breakpoint
ALTER TABLE "internal_validation" DROP CONSTRAINT "internal_validation_status_check";--> statement-breakpoint
ALTER TABLE "internal_validation" DROP CONSTRAINT "internal_validation_validator_role_check";--> statement-breakpoint
ALTER TABLE "ip_application" DROP CONSTRAINT "ck_commercialization";--> statement-breakpoint
ALTER TABLE "ip_contributors" DROP CONSTRAINT "ip_contributors_role_check";--> statement-breakpoint
ALTER TABLE "ip_details" DROP CONSTRAINT "ip_details_commercialization_status_check";--> statement-breakpoint
ALTER TABLE "ip_disclosure_review" DROP CONSTRAINT "ip_disclosure_review_status_check";--> statement-breakpoint
ALTER TABLE "notification" DROP CONSTRAINT "notification_status_check";--> statement-breakpoint
ALTER TABLE "notification" DROP CONSTRAINT "notification_type_check";--> statement-breakpoint
ALTER TABLE "patent_utility_model_application" DROP CONSTRAINT "patent_utility_model_application_type_check";--> statement-breakpoint
ALTER TABLE "phase_reminder" DROP CONSTRAINT "phase_reminder_frequency_check";--> statement-breakpoint
ALTER TABLE "phase_review" DROP CONSTRAINT "review_status_check";--> statement-breakpoint
ALTER TABLE "phase_task" DROP CONSTRAINT "task_priority_check";--> statement-breakpoint
ALTER TABLE "phase_task" DROP CONSTRAINT "task_status_check";--> statement-breakpoint
ALTER TABLE "substantial_use" DROP CONSTRAINT "substantial_use_status_check";--> statement-breakpoint
ALTER TABLE "activity_log" DROP CONSTRAINT "fk_activity_log_user";
--> statement-breakpoint
ALTER TABLE "archives" DROP CONSTRAINT "fk_archive_user";
--> statement-breakpoint
ALTER TABLE "calendar_event" DROP CONSTRAINT "calendar_event_phase_id_fkey";
--> statement-breakpoint
ALTER TABLE "calendar_event" DROP CONSTRAINT "calendar_event_application_id_fkey";
--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT "documents_application_id_fkey";
--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT "documents_phase_id_fkey";
--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT "documents_validated_by_fkey";
--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT "documents_verified_by_fkey";
--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT "documents_uploaded_by_fkey";
--> statement-breakpoint
ALTER TABLE "event_participant" DROP CONSTRAINT "event_participant_event_id_fkey";
--> statement-breakpoint
ALTER TABLE "internal_validation" DROP CONSTRAINT "internal_validation_assigned_to_fkey";
--> statement-breakpoint
ALTER TABLE "internal_validation" DROP CONSTRAINT "internal_validation_document_id_fkey";
--> statement-breakpoint
ALTER TABLE "ip_application" DROP CONSTRAINT "fk_application_user";
--> statement-breakpoint
ALTER TABLE "ip_disclosure_review" DROP CONSTRAINT "ip_disclosure_review_reviewer_id_fkey";
--> statement-breakpoint
ALTER TABLE "phase_review" DROP CONSTRAINT "phase_review_reviewer_id_fkey";
--> statement-breakpoint
ALTER TABLE "phase_task" DROP CONSTRAINT "phase_task_assignee_id_fkey";
--> statement-breakpoint
DROP INDEX "idx_copyright_transaction_part2_new_copyright";--> statement-breakpoint
DROP INDEX "idx_copyright_transaction_part2_new_disclosure";--> statement-breakpoint
DROP INDEX "idx_documents_validation";--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" ALTER COLUMN "transaction_details" SET DEFAULT '{"ipsoRegion":"","applicantType":{"heir":false,"agent":false,"licensee":false,"newOwner":false,"copyrightClaimant":false},"bulkFilingQty":"","transactionType":{"recordation":false,"resaleRights":false,"anonymousWork":false,"certifiedCopy":false,"reconstitution":false,"correctionEntry":false},"otherCertifications":"","numberOfCertificates":""}'::jsonb;--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" ALTER COLUMN "applicant_info" SET DEFAULT '{"personalInfo":{"sex":null,"address":"","surname":"","zipCode":"","firstName":"","middleName":"","civilStatus":null,"dateOfBirth":null,"nationality":"","emailAddress":"","mobileNumber":"","provinceState":"","municipalityCity":"","countryOfResidence":""},"applicantType":{"heir":false,"agent":false,"licensee":false,"newOwner":false,"authorCreator":false,"copyrightClaimant":false}}'::jsonb;--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" ALTER COLUMN "author_info" SET DEFAULT '{"personalInfo":{"sex":null,"address":"","surname":"","zipCode":"","firstName":"","middleName":"","civilStatus":null,"dateOfBirth":null,"nationality":"","emailAddress":"","mobileNumber":"","provinceState":"","municipalityCity":"","countryOfResidence":""},"isSameAsApplicant":false}'::jsonb;--> statement-breakpoint
ALTER TABLE "phase_reminder" ALTER COLUMN "reminder_time" SET DEFAULT '12:00:00';--> statement-breakpoint
ALTER TABLE "calendar_event" DROP CONSTRAINT IF EXISTS "calendar_event_pkey";--> statement-breakpoint
ALTER TABLE "calendar_event" ADD COLUMN IF NOT EXISTS "id" uuid;--> statement-breakpoint
UPDATE "calendar_event" SET "id" = gen_random_uuid() WHERE "id" IS NULL;--> statement-breakpoint
ALTER TABLE "calendar_event" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "calendar_event" ALTER COLUMN "id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_pkey" PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "calendar_event" ADD COLUMN "project_id" uuid;--> statement-breakpoint
ALTER TABLE "calendar_event" ADD COLUMN "other_event_type" text;--> statement-breakpoint
ALTER TABLE "calendar_event" ADD COLUMN "is_all_day" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "client_profile" ADD COLUMN "ip_application_id" uuid;--> statement-breakpoint
ALTER TABLE "client_profile" ADD COLUMN "has_company" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "client_profile" ADD COLUMN "college_name" varchar(255);--> statement-breakpoint
ALTER TABLE "client_profile" ADD COLUMN "department_name" varchar(255);--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "documents_pkey";--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "id" uuid;--> statement-breakpoint
UPDATE "documents" SET "id" = gen_random_uuid() WHERE "id" IS NULL;--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_pkey" PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "file_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "type" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "created_at" timestamp DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "external_collaboration" ADD COLUMN "office_name" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "external_collaboration" ADD COLUMN "reminder_type" varchar(20) DEFAULT 'none';--> statement-breakpoint
ALTER TABLE "external_collaboration" ADD COLUMN "reminder_day" varchar(20) DEFAULT 'none';--> statement-breakpoint
ALTER TABLE "external_collaboration" ADD COLUMN "reminder_time" time DEFAULT '12:00:00';--> statement-breakpoint
ALTER TABLE "external_collaboration" ADD COLUMN "file_name" text;--> statement-breakpoint
ALTER TABLE "external_collaboration" ADD COLUMN "file_type" text;--> statement-breakpoint
ALTER TABLE "external_collaboration" ADD COLUMN "file_size" integer;--> statement-breakpoint
ALTER TABLE "internal_validation" ADD COLUMN "file_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "internal_validation" ADD COLUMN "file_type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "internal_validation" ADD COLUMN "file_size" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "internal_validation" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "ip_disclosure" ADD COLUMN "application_id" uuid;--> statement-breakpoint
ALTER TABLE "phase_reminder" DROP CONSTRAINT IF EXISTS "phase_reminder_pkey";--> statement-breakpoint
ALTER TABLE "phase_reminder" ADD COLUMN IF NOT EXISTS "id" uuid;--> statement-breakpoint
UPDATE "phase_reminder" SET "id" = gen_random_uuid() WHERE "id" IS NULL;--> statement-breakpoint
ALTER TABLE "phase_reminder" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "phase_reminder" ALTER COLUMN "id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "phase_reminder" ADD CONSTRAINT "phase_reminder_pkey" PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "phase_reminder" ADD COLUMN "reminder_type" varchar(20) DEFAULT 'none';--> statement-breakpoint
ALTER TABLE "phase_reminder" ADD COLUMN "reminder_day" varchar(20) DEFAULT 'none';--> statement-breakpoint
ALTER TABLE "documents_validation" ADD CONSTRAINT "documents_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents_validation" ADD CONSTRAINT "documents_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_data_mapping" ADD CONSTRAINT "fk_form_data_mapping_registry" FOREIGN KEY ("registry_id") REFERENCES "public"."form_submission_registry"("registry_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_submission_registry" ADD CONSTRAINT "fk_form_submission_registry_ip_application" FOREIGN KEY ("ip_application_id") REFERENCES "public"."ip_application"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_submission_registry" ADD CONSTRAINT "fk_form_submission_registry_user" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_validation_assignee" ADD CONSTRAINT "fr_internal_validation_id" FOREIGN KEY ("internal_validation_id") REFERENCES "public"."internal_validation"("validation_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_validation_assignee" ADD CONSTRAINT "fr_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ip_application_enrollment" ADD CONSTRAINT "ip_application_enrollment_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."ip_application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ip_application_enrollment" ADD CONSTRAINT "ip_application_enrollment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ip_application_notification" ADD CONSTRAINT "fk_ip_app_notification_admin" FOREIGN KEY ("admin_id") REFERENCES "public"."user_account"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ip_application_notification" ADD CONSTRAINT "fk_ip_app_notification_form_registry" FOREIGN KEY ("form_registry_id") REFERENCES "public"."form_submission_registry"("registry_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ip_application_notification" ADD CONSTRAINT "fk_ip_app_notification_ip_application" FOREIGN KEY ("ip_application_id") REFERENCES "public"."ip_application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "other_documents" ADD CONSTRAINT "other_documents_ip_application_id_fkey" FOREIGN KEY ("ip_application_id") REFERENCES "public"."ip_application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "other_documents" ADD CONSTRAINT "other_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_task_assignee" ADD CONSTRAINT "fk_task_id" FOREIGN KEY ("task_id") REFERENCES "public"."phase_task"("task_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_task_assignee" ADD CONSTRAINT "fk_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_documents_validation" ON "documents_validation" USING btree ("validation_status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_form_data_mapping_registry" ON "form_data_mapping" USING btree ("registry_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_form_submission_registry_ip_app" ON "form_submission_registry" USING btree ("ip_application_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_form_submission_registry_source_id" ON "form_submission_registry" USING btree ("source_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_form_submission_registry_source_type" ON "form_submission_registry" USING btree ("source_type" enum_ops);--> statement-breakpoint
CREATE INDEX "idx_form_submission_registry_status" ON "form_submission_registry" USING btree ("status" enum_ops);--> statement-breakpoint
CREATE INDEX "idx_form_submission_registry_user" ON "form_submission_registry" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_ip_app_notification_admin" ON "ip_application_notification" USING btree ("admin_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_ip_app_notification_app" ON "ip_application_notification" USING btree ("ip_application_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_ip_app_notification_read" ON "ip_application_notification" USING btree ("is_read" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_ip_app_notification_registry" ON "ip_application_notification" USING btree ("form_registry_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_other_documents_application" ON "other_documents" USING btree ("ip_application_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_other_documents_form" ON "other_documents" USING btree ("form_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_other_documents_user" ON "other_documents" USING btree ("user_id" uuid_ops);--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "fk_activity_log_user" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "archives" ADD CONSTRAINT "fk_archive_user" FOREIGN KEY ("archived_by") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_application_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."ip_application"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_profile" ADD CONSTRAINT "client_profile_ip_application_id_fkey" FOREIGN KEY ("ip_application_id") REFERENCES "public"."ip_application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_project_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."ip_application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_participant" ADD CONSTRAINT "event_participant_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."calendar_event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ip_application" ADD CONSTRAINT "fk_application_user" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ip_disclosure" ADD CONSTRAINT "ip_disclosure_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."ip_application"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ip_disclosure_review" ADD CONSTRAINT "ip_disclosure_review_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_review" ADD CONSTRAINT "phase_review_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_client_profile_application" ON "client_profile" USING btree ("ip_application_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_ip_disclosure_application" ON "ip_disclosure" USING btree ("application_id" uuid_ops);--> statement-breakpoint
ALTER TABLE "application_phase" DROP COLUMN "progress";--> statement-breakpoint
ALTER TABLE "application_phase" DROP COLUMN "order_index";--> statement-breakpoint
ALTER TABLE "calendar_event" DROP COLUMN "event_id";--> statement-breakpoint
ALTER TABLE "calendar_event" DROP COLUMN "priority";--> statement-breakpoint
ALTER TABLE "calendar_event" DROP COLUMN "application_id";--> statement-breakpoint
ALTER TABLE "calendar_event" DROP COLUMN "phase_id";--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" DROP COLUMN "work_creation_form";--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" DROP COLUMN "documents_submitted";--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" DROP COLUMN "signature";--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "document_id";--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "phase_id";--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "file_path";--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "uploaded_at";--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "verified_by";--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "verified_at";--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "remarks";--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "validation_status";--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "validation_date";--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "validated_by";--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "validation_remarks";--> statement-breakpoint
ALTER TABLE "external_collaboration" DROP COLUMN "office";--> statement-breakpoint
ALTER TABLE "internal_validation" DROP COLUMN "document_id";--> statement-breakpoint
ALTER TABLE "internal_validation" DROP COLUMN "assigned_to";--> statement-breakpoint
ALTER TABLE "phase_reminder" DROP COLUMN "reminder_id";--> statement-breakpoint
ALTER TABLE "phase_reminder" DROP COLUMN "frequency";--> statement-breakpoint
ALTER TABLE "phase_reminder" DROP COLUMN "custom_days";--> statement-breakpoint
ALTER TABLE "phase_reminder" DROP COLUMN "is_active";--> statement-breakpoint
ALTER TABLE "phase_task" DROP COLUMN "completed";--> statement-breakpoint
ALTER TABLE "phase_task" DROP COLUMN "assignee_id";--> statement-breakpoint
ALTER TABLE "substantial_use" DROP COLUMN "source_id";--> statement-breakpoint
ALTER TABLE "archives" ADD CONSTRAINT "archives_application_id_unique" UNIQUE("application_id");--> statement-breakpoint
ALTER TABLE "client_profile" ADD CONSTRAINT "unique_client_profile_per_application" UNIQUE("user_id","ip_application_id");--> statement-breakpoint
ALTER TABLE "phase_reminder" ADD CONSTRAINT "phase_reminder_phase_id_key" UNIQUE("phase_id");--> statement-breakpoint
ALTER TABLE "application_phase" ADD CONSTRAINT "ck_phase_status" CHECK ((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('active'::character varying)::text, ('completed'::character varying)::text, ('blocked'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_event_type_check" CHECK ((event_type)::text = ANY (ARRAY[('meeting'::character varying)::text, ('phase'::character varying)::text, ('task'::character varying)::text, ('other'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_status_check" CHECK ((status)::text = ANY (ARRAY[('scheduled'::character varying)::text, ('in-progress'::character varying)::text, ('completed'::character varying)::text, ('cancelled'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "contact_message" ADD CONSTRAINT "contact_message_status_check" CHECK ((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('in-progress'::character varying)::text, ('resolved'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "deed_of_assignment" ADD CONSTRAINT "deed_of_assignment_status_check" CHECK ((status)::text = ANY (ARRAY[('draft'::character varying)::text, ('submitted'::character varying)::text, ('approved'::character varying)::text, ('rejected'::character varying)::text, ('pending_revision'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "digital_signature" ADD CONSTRAINT "digital_signature_signer_type_check" CHECK ((signer_type)::text = ANY (ARRAY[('author'::character varying)::text, ('applicant'::character varying)::text, ('representative'::character varying)::text, ('staff'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "document_management" ADD CONSTRAINT "document_management_entity_type_check" CHECK ((entity_type)::text = ANY (ARRAY[('application'::character varying)::text, ('phase'::character varying)::text, ('task'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "document_management" ADD CONSTRAINT "document_status_check" CHECK ((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('approved'::character varying)::text, ('rejected'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "document_type_check" CHECK ((type)::text = ANY (ARRAY[('application'::character varying)::text, ('contract'::character varying)::text, ('report'::character varying)::text, ('form'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "document_category_check" CHECK ((category)::text = ANY (ARRAY[('forms'::character varying)::text, ('attachments'::character varying)::text, ('requirements'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "event_participant" ADD CONSTRAINT "event_participant_status_check" CHECK ((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('accepted'::character varying)::text, ('declined'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "external_collaboration" ADD CONSTRAINT "reminder_day_check" CHECK ((reminder_day)::text = ANY (ARRAY[('none'::character varying)::text, ('mon'::character varying)::text, ('tue'::character varying)::text, ('wed'::character varying)::text, ('thu'::character varying)::text, ('fri'::character varying)::text, ('sat'::character varying)::text, ('sun'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "external_collaboration" ADD CONSTRAINT "reminder_type_check" CHECK ((reminder_type)::text = ANY (ARRAY[('none'::character varying)::text, ('daily'::character varying)::text, ('weekly'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "external_collaboration" ADD CONSTRAINT "external_collaboration_status_check" CHECK ((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('in_progress'::character varying)::text, ('completed'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "internal_validation" ADD CONSTRAINT "internal_validation_status_check" CHECK ((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('approved'::character varying)::text, ('rejected'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "internal_validation" ADD CONSTRAINT "internal_validation_validator_role_check" CHECK ((validator_role)::text = ANY (ARRAY[('admin'::character varying)::text, ('director'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "ip_application" ADD CONSTRAINT "ck_commercialization" CHECK ((commercialization_status)::text = ANY (ARRAY[('not_licensed'::character varying)::text, ('licensed'::character varying)::text, ('in_negotiation'::character varying)::text, ('technology_transfer'::character varying)::text, ('internal_use'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "ip_contributors" ADD CONSTRAINT "ip_contributors_role_check" CHECK ((role)::text = ANY (ARRAY[('inventor'::character varying)::text, ('author'::character varying)::text, ('applicant'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "ip_details" ADD CONSTRAINT "ip_details_commercialization_status_check" CHECK ((commercialization_status)::text = ANY (ARRAY[('not_licensed'::character varying)::text, ('licensed'::character varying)::text, ('in_negotiation'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "ip_disclosure_review" ADD CONSTRAINT "ip_disclosure_review_status_check" CHECK ((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('approved'::character varying)::text, ('rejected'::character varying)::text, ('needs_revision'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_status_check" CHECK ((status)::text = ANY (ARRAY[('read'::character varying)::text, ('unread'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_type_check" CHECK ((type)::text = ANY (ARRAY[('info'::character varying)::text, ('warning'::character varying)::text, ('success'::character varying)::text, ('error'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "patent_utility_model_application" ADD CONSTRAINT "patent_utility_model_application_type_check" CHECK ((type)::text = ANY (ARRAY[('patent'::character varying)::text, ('utility_model'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "phase_reminder" ADD CONSTRAINT "reminder_day_check" CHECK ((reminder_day)::text = ANY (ARRAY[('none'::character varying)::text, ('mon'::character varying)::text, ('tue'::character varying)::text, ('wed'::character varying)::text, ('thu'::character varying)::text, ('fri'::character varying)::text, ('sat'::character varying)::text, ('sun'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "phase_reminder" ADD CONSTRAINT "reminder_type_check" CHECK ((reminder_type)::text = ANY (ARRAY[('none'::character varying)::text, ('daily'::character varying)::text, ('weekly'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "phase_review" ADD CONSTRAINT "review_status_check" CHECK ((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('approved'::character varying)::text, ('rejected'::character varying)::text, ('needs_revision'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "phase_task" ADD CONSTRAINT "task_priority_check" CHECK ((priority)::text = ANY (ARRAY[('low'::character varying)::text, ('medium'::character varying)::text, ('high'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "phase_task" ADD CONSTRAINT "task_status_check" CHECK ((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('in_progress'::character varying)::text, ('completed'::character varying)::text, ('blocked'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "substantial_use" ADD CONSTRAINT "substantial_use_status_check" CHECK ((status)::text = ANY (ARRAY[('draft'::character varying)::text, ('submitted'::character varying)::text, ('approved'::character varying)::text, ('rejected'::character varying)::text]));
