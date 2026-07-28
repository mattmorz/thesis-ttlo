CREATE TABLE "archives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"archive_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"archive_reason" text,
	"archived_by" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "archive" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "auth_session" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "inventory_item" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "inventory_transaction" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "archive" CASCADE;--> statement-breakpoint
DROP TABLE "auth_session" CASCADE;--> statement-breakpoint
DROP TABLE "inventory_item" CASCADE;--> statement-breakpoint
DROP TABLE "inventory_transaction" CASCADE;--> statement-breakpoint
DROP TABLE "user" CASCADE;--> statement-breakpoint
ALTER TABLE "activity_log" DROP CONSTRAINT IF EXISTS "activity_type_check";--> statement-breakpoint
ALTER TABLE "application_phase" DROP CONSTRAINT IF EXISTS "phase_progress_check";--> statement-breakpoint
ALTER TABLE "application_phase" DROP CONSTRAINT IF EXISTS "phase_status_check";--> statement-breakpoint
ALTER TABLE "client_profile" DROP CONSTRAINT IF EXISTS "client_profile_highest_degree_check";--> statement-breakpoint
ALTER TABLE "client_profile" DROP CONSTRAINT IF EXISTS "client_profile_gender_check";--> statement-breakpoint
ALTER TABLE "client_profile" DROP CONSTRAINT IF EXISTS "client_profile_research_output_status_check";--> statement-breakpoint
ALTER TABLE "client_profile" DROP CONSTRAINT IF EXISTS "client_profile_inst_materials_status_check";--> statement-breakpoint
ALTER TABLE "ip_application" DROP CONSTRAINT IF EXISTS "commercialization_status_check";--> statement-breakpoint
ALTER TABLE "ip_application" DROP CONSTRAINT IF EXISTS "ip_type_check";--> statement-breakpoint
ALTER TABLE "ip_application" DROP CONSTRAINT IF EXISTS "progress_check";--> statement-breakpoint
ALTER TABLE "ip_application" DROP CONSTRAINT IF EXISTS "status_check";--> statement-breakpoint
ALTER TABLE "account" DROP CONSTRAINT IF EXISTS "account_userId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "activity_log" DROP CONSTRAINT IF EXISTS "fk_activity_application";
--> statement-breakpoint
ALTER TABLE "activity_log" DROP CONSTRAINT IF EXISTS "fk_activity_phase";
--> statement-breakpoint
ALTER TABLE "activity_log" DROP CONSTRAINT IF EXISTS "fk_activity_user";
--> statement-breakpoint
ALTER TABLE "application_phase" DROP CONSTRAINT IF EXISTS "application_phase_application_id_fkey";
--> statement-breakpoint
ALTER TABLE "authenticator" DROP CONSTRAINT IF EXISTS "authenticator_userId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "calendar_event" DROP CONSTRAINT IF EXISTS "calendar_event_application_id_fkey";
--> statement-breakpoint
ALTER TABLE "calendar_event" DROP CONSTRAINT IF EXISTS "calendar_event_created_by_fkey";
--> statement-breakpoint
ALTER TABLE "client_profile" DROP CONSTRAINT IF EXISTS "client_profile_verified_by_fkey";
--> statement-breakpoint
ALTER TABLE "client_profile" DROP CONSTRAINT IF EXISTS "client_profile_user_id_fkey";
--> statement-breakpoint
ALTER TABLE "comment" DROP CONSTRAINT IF EXISTS "comment_user_id_fkey";
--> statement-breakpoint
ALTER TABLE "contact_message" DROP CONSTRAINT IF EXISTS "contact_message_assigned_to_fkey";
--> statement-breakpoint
ALTER TABLE "digital_signature" DROP CONSTRAINT IF EXISTS "digital_signature_signer_id_fkey";
--> statement-breakpoint
ALTER TABLE "document_management" DROP CONSTRAINT IF EXISTS "document_management_application_id_fkey";
--> statement-breakpoint
ALTER TABLE "document_management" DROP CONSTRAINT IF EXISTS "document_management_uploaded_by_fkey";
--> statement-breakpoint
ALTER TABLE "document_management" DROP CONSTRAINT IF EXISTS "document_management_verified_by_fkey";
--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "documents_application_id_fkey";
--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "documents_uploaded_by_fkey";
--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "documents_validated_by_fkey";
--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "documents_verified_by_fkey";
--> statement-breakpoint
ALTER TABLE "event_participant" DROP CONSTRAINT IF EXISTS "event_participant_user_id_fkey";
--> statement-breakpoint
ALTER TABLE "internal_validation" DROP CONSTRAINT IF EXISTS "internal_validation_assigned_to_fkey";
--> statement-breakpoint
ALTER TABLE "ip_application" DROP CONSTRAINT IF EXISTS "ip_application_client_id_fkey";
--> statement-breakpoint
ALTER TABLE "ip_application" DROP CONSTRAINT IF EXISTS "ip_application_user_id_fkey";
--> statement-breakpoint
ALTER TABLE "ip_contributors" DROP CONSTRAINT IF EXISTS "ip_contributors_application_id_fkey";
--> statement-breakpoint
ALTER TABLE "ip_details" DROP CONSTRAINT IF EXISTS "ip_details_application_id_fkey";
--> statement-breakpoint
ALTER TABLE "notification" DROP CONSTRAINT IF EXISTS "notification_user_id_fkey";
--> statement-breakpoint
ALTER TABLE "phase_review" DROP CONSTRAINT IF EXISTS "phase_review_reviewer_id_fkey";
--> statement-breakpoint
ALTER TABLE "phase_task" DROP CONSTRAINT IF EXISTS "phase_task_assignee_id_fkey";
--> statement-breakpoint
ALTER TABLE "session" DROP CONSTRAINT IF EXISTS "session_userId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "task_assignment" DROP CONSTRAINT IF EXISTS "task_assignment_staff_id_fkey";
--> statement-breakpoint
DROP INDEX IF EXISTS "idx_ip_application_type";--> statement-breakpoint
DROP INDEX IF EXISTS "ix_ip_application_status";--> statement-breakpoint
DROP INDEX IF EXISTS "ix_ip_application_type";--> statement-breakpoint
ALTER TABLE "activity_log" ALTER COLUMN "activity_type" SET DATA TYPE "public"."activity_type" USING "activity_type"::"public"."activity_type";--> statement-breakpoint
ALTER TABLE "client_profile" ALTER COLUMN "gender" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "client_profile" ALTER COLUMN "contact_number" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "client_profile" ALTER COLUMN "mailing_address" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "ip_application" ALTER COLUMN "ip_type" SET DATA TYPE "public"."application_type" USING "ip_type"::"public"."application_type";--> statement-breakpoint
ALTER TABLE "ip_application" ALTER COLUMN "status" SET DATA TYPE "public"."application_status" USING "status"::"public"."application_status";--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId");--> statement-breakpoint
ALTER TABLE "activity_log" ADD COLUMN "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "ip_application" ADD COLUMN "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "user_account" ADD COLUMN "image" text;--> statement-breakpoint
ALTER TABLE "user_account" ADD COLUMN "emailVerified" timestamp;--> statement-breakpoint
ALTER TABLE "archives" ADD CONSTRAINT "fk_archive_application" FOREIGN KEY ("application_id") REFERENCES "public"."ip_application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "archives" ADD CONSTRAINT "fk_archive_user" FOREIGN KEY ("archived_by") REFERENCES "public"."user_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_account_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "fk_activity_log_application" FOREIGN KEY ("application_id") REFERENCES "public"."ip_application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "fk_activity_log_phase" FOREIGN KEY ("phase_id") REFERENCES "public"."application_phase"("phase_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "fk_activity_log_user" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_phase" ADD CONSTRAINT "fk_phase_application" FOREIGN KEY ("application_id") REFERENCES "public"."ip_application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authenticator" ADD CONSTRAINT "authenticator_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."ip_application"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_profile" ADD CONSTRAINT "client_profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_message" ADD CONSTRAINT "contact_message_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "digital_signature" ADD CONSTRAINT "digital_signature_signer_id_fkey" FOREIGN KEY ("signer_id") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_management" ADD CONSTRAINT "document_management_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."ip_application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_management" ADD CONSTRAINT "document_management_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_management" ADD CONSTRAINT "document_management_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."ip_application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "public"."user_account"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_participant" ADD CONSTRAINT "event_participant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_validation" ADD CONSTRAINT "internal_validation_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ip_application" ADD CONSTRAINT "fk_application_user" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ip_contributors" ADD CONSTRAINT "ip_contributors_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."ip_application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ip_details" ADD CONSTRAINT "ip_details_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."ip_application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_review" ADD CONSTRAINT "phase_review_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."user_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_task" ADD CONSTRAINT "phase_task_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_assignment" ADD CONSTRAINT "task_assignment_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ip_application_type" ON "ip_application" USING btree ("ip_type" enum_ops);--> statement-breakpoint
CREATE INDEX "ix_ip_application_status" ON "ip_application" USING btree ("status" enum_ops);--> statement-breakpoint
CREATE INDEX "ix_ip_application_type" ON "ip_application" USING btree ("ip_type" enum_ops);--> statement-breakpoint
ALTER TABLE "activity_log" DROP COLUMN "log_id";--> statement-breakpoint
ALTER TABLE "client_profile" DROP COLUMN "highest_degree";--> statement-breakpoint
ALTER TABLE "client_profile" DROP COLUMN "other_degree";--> statement-breakpoint
ALTER TABLE "client_profile" DROP COLUMN "degree_program";--> statement-breakpoint
ALTER TABLE "client_profile" DROP COLUMN "profession";--> statement-breakpoint
ALTER TABLE "client_profile" DROP COLUMN "ip_experience_types";--> statement-breakpoint
ALTER TABLE "client_profile" DROP COLUMN "client_signature";--> statement-breakpoint
ALTER TABLE "client_profile" DROP COLUMN "staff_signature";--> statement-breakpoint
ALTER TABLE "client_profile" DROP COLUMN "signed_at";--> statement-breakpoint
ALTER TABLE "client_profile" DROP COLUMN "verified_at";--> statement-breakpoint
ALTER TABLE "client_profile" DROP COLUMN "verified_by";--> statement-breakpoint
ALTER TABLE "ip_application" DROP COLUMN "application_id";--> statement-breakpoint
ALTER TABLE "ip_application" DROP COLUMN "client_id";--> statement-breakpoint
ALTER TABLE "ip_application" DROP COLUMN "start_date";--> statement-breakpoint
ALTER TABLE "ip_application" DROP COLUMN "end_date";--> statement-breakpoint
ALTER TABLE "ip_application" DROP COLUMN "submission_date";--> statement-breakpoint
ALTER TABLE "ip_application" DROP COLUMN "application_date";--> statement-breakpoint
ALTER TABLE "ip_application" DROP COLUMN "application_number";--> statement-breakpoint
ALTER TABLE "ip_application" DROP COLUMN "registration_number";--> statement-breakpoint
ALTER TABLE "ip_application" DROP COLUMN "grant_date";--> statement-breakpoint
ALTER TABLE "ip_application" DROP COLUMN "expiry_date";--> statement-breakpoint
ALTER TABLE "ip_application" DROP COLUMN "substantial_use_id";--> statement-breakpoint
ALTER TABLE "ip_application" DROP COLUMN "deed_assignment_id";--> statement-breakpoint
ALTER TABLE "ip_application" DROP COLUMN "research_classification";--> statement-breakpoint
ALTER TABLE "ip_application" DROP COLUMN "development_status";--> statement-breakpoint
ALTER TABLE "ip_application" DROP COLUMN "archived_at";--> statement-breakpoint
ALTER TABLE "ip_application" DROP COLUMN "archived_reason";--> statement-breakpoint
ALTER TABLE "user_account" DROP COLUMN "email_verified_at";--> statement-breakpoint
ALTER TABLE "application_phase" ADD CONSTRAINT "ck_phase_progress" CHECK ((progress >= 0) AND (progress <= 100));--> statement-breakpoint
ALTER TABLE "application_phase" ADD CONSTRAINT "ck_phase_status" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'active'::character varying, 'completed'::character varying, 'blocked'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "client_profile" ADD CONSTRAINT "client_profile_gender_check" CHECK ((gender)::text = ANY ((ARRAY['male'::character varying, 'female'::character varying, 'other'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "client_profile" ADD CONSTRAINT "client_profile_research_output_status_check" CHECK ((research_output_status)::text = ANY ((ARRAY['yes'::character varying, 'submitted'::character varying, NULL::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "client_profile" ADD CONSTRAINT "client_profile_inst_materials_status_check" CHECK ((inst_materials_status)::text = ANY ((ARRAY['yes'::character varying, 'ongoing'::character varying, NULL::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "ip_application" ADD CONSTRAINT "ck_commercialization" CHECK ((commercialization_status)::text = ANY ((ARRAY['not_licensed'::character varying, 'licensed'::character varying, 'in_negotiation'::character varying, 'technology_transfer'::character varying, 'internal_use'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "ip_application" ADD CONSTRAINT "ck_progress" CHECK ((progress >= 0) AND (progress <= 100));--> statement-breakpoint
ALTER TABLE "public"."activity_log" ALTER COLUMN "activity_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."activity_type";--> statement-breakpoint
CREATE TYPE "public"."activity_type" AS ENUM('created', 'updated', 'deleted', 'viewed', 'downloaded', 'uploaded', 'validated', 'verified', 'archived', 'unarchived', 'assigned', 'unassigned', 'completed', 'incompleted', 'approved', 'rejected', 'commented', 'replied', 'signed', 'unsigned', 'sent', 'received', 'read', 'unread', 'other');--> statement-breakpoint
ALTER TABLE "public"."activity_log" ALTER COLUMN "activity_type" SET DATA TYPE "public"."activity_type" USING "activity_type"::"public"."activity_type";