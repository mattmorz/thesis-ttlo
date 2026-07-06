CREATE TABLE "account" (
	"userId" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text
);
--> statement-breakpoint
CREATE TABLE "task_assignment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"assigned_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"status" varchar(50) DEFAULT 'pending',
	CONSTRAINT "task_assignment_task_id_user_id_key" UNIQUE("task_id","user_id"),
	CONSTRAINT "task_assignment_status_check" CHECK ((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('accepted'::character varying)::text, ('completed'::character varying)::text, ('rejected'::character varying)::text]))
);
--> statement-breakpoint
CREATE TABLE "tracking_code" (
	"tracking_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ip_application_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"code_hash" varchar(128) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone_number" varchar(30),
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"revoked_at" timestamp,
	"last_used_at" timestamp,
	CONSTRAINT "tracking_code_value_key" UNIQUE("code"),
	CONSTRAINT "tracking_code_hash_key" UNIQUE("code_hash")
);
--> statement-breakpoint
CREATE TABLE "tracking_otp" (
	"otp_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tracking_id" uuid NOT NULL,
	"channel" varchar(10) NOT NULL,
	"identifier" varchar(255) NOT NULL,
	"otp_hash" varchar(128) NOT NULL,
	"attempts" integer DEFAULT 0,
	"expires_at" timestamp NOT NULL,
	"last_sent_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "tracking_otp_channel_check" CHECK ((channel)::text = ANY (ARRAY[('email'::character varying)::text, ('sms'::character varying)::text]))
);
--> statement-breakpoint
ALTER TABLE "internal_validation_assignee" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ip_application_enrollment" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "phase_task_assignee" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "internal_validation_assignee" CASCADE;--> statement-breakpoint
DROP TABLE "ip_application_enrollment" CASCADE;--> statement-breakpoint
DROP TABLE "phase_task_assignee" CASCADE;--> statement-breakpoint
ALTER TABLE "client_profile" DROP CONSTRAINT "unique_client_profile_per_application";--> statement-breakpoint
ALTER TABLE "phase_reminder" DROP CONSTRAINT "phase_reminder_phase_id_key";--> statement-breakpoint
ALTER TABLE "calendar_event" DROP CONSTRAINT "calendar_event_event_type_check";--> statement-breakpoint
ALTER TABLE "client_profile" DROP CONSTRAINT "check_citizenship_jsonb";--> statement-breakpoint
ALTER TABLE "client_profile" DROP CONSTRAINT "check_gender_jsonb";--> statement-breakpoint
ALTER TABLE "client_profile" DROP CONSTRAINT "check_highest_degree_jsonb";--> statement-breakpoint
ALTER TABLE "external_collaboration" DROP CONSTRAINT "reminder_day_check";--> statement-breakpoint
ALTER TABLE "external_collaboration" DROP CONSTRAINT "reminder_type_check";--> statement-breakpoint
ALTER TABLE "internal_validation" DROP CONSTRAINT "internal_validation_validator_role_check";--> statement-breakpoint
ALTER TABLE "phase_reminder" DROP CONSTRAINT "reminder_day_check";--> statement-breakpoint
ALTER TABLE "phase_reminder" DROP CONSTRAINT "reminder_type_check";--> statement-breakpoint
ALTER TABLE "activity_log" DROP CONSTRAINT "fk_activity_log_user";
--> statement-breakpoint
ALTER TABLE "archives" DROP CONSTRAINT "fk_archive_user";
--> statement-breakpoint
ALTER TABLE "calendar_event" DROP CONSTRAINT "calendar_event_application_id_fkey";
--> statement-breakpoint
ALTER TABLE "client_profile" DROP CONSTRAINT "client_profile_ip_application_id_fkey";
--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT "documents_uploaded_by_fkey";
--> statement-breakpoint
ALTER TABLE "documents_validation" DROP CONSTRAINT "documents_validated_by_fkey";
--> statement-breakpoint
ALTER TABLE "event_participant" DROP CONSTRAINT "event_participant_event_id_fkey";
--> statement-breakpoint
ALTER TABLE "ip_application" DROP CONSTRAINT "fk_application_user";
--> statement-breakpoint
ALTER TABLE "ip_disclosure" DROP CONSTRAINT "ip_disclosure_application_id_fkey";
--> statement-breakpoint
ALTER TABLE "ip_disclosure_review" DROP CONSTRAINT "ip_disclosure_review_reviewer_id_fkey";
--> statement-breakpoint
ALTER TABLE "phase_review" DROP CONSTRAINT "phase_review_reviewer_id_fkey";
--> statement-breakpoint
DROP INDEX "idx_client_profile_application";--> statement-breakpoint
DROP INDEX "idx_ip_disclosure_application";--> statement-breakpoint
ALTER TABLE "other_documents" ALTER COLUMN "form_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "phase_reminder" ALTER COLUMN "reminder_time" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "calendar_event" ADD COLUMN "event_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "calendar_event" ADD COLUMN "priority" varchar(20);--> statement-breakpoint
ALTER TABLE "calendar_event" ADD COLUMN "application_id" uuid;--> statement-breakpoint
ALTER TABLE "calendar_event" ADD COLUMN "phase_id" uuid;--> statement-breakpoint
ALTER TABLE "client_profile" ADD COLUMN "is_affiliated" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "client_profile" ADD COLUMN "institution_name" varchar(255);--> statement-breakpoint
ALTER TABLE "client_profile" ADD COLUMN "department" varchar(255);--> statement-breakpoint
ALTER TABLE "external_collaboration" ADD COLUMN "office" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "internal_validation" ADD COLUMN "document_id" uuid;--> statement-breakpoint
ALTER TABLE "internal_validation" ADD COLUMN "assigned_to" uuid;--> statement-breakpoint
ALTER TABLE "ip_application" ADD COLUMN "other_ip_type" varchar(255);--> statement-breakpoint
ALTER TABLE "phase_reminder" ADD COLUMN "reminder_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "phase_reminder" ADD COLUMN "frequency" varchar(20);--> statement-breakpoint
ALTER TABLE "phase_reminder" ADD COLUMN "custom_days" integer;--> statement-breakpoint
ALTER TABLE "phase_reminder" ADD COLUMN "is_active" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "phase_task" ADD COLUMN "assignee_id" uuid;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_assignment" ADD CONSTRAINT "task_assignment_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."phase_task"("task_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_assignment" ADD CONSTRAINT "task_assignment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_code" ADD CONSTRAINT "tracking_code_application_id_fkey" FOREIGN KEY ("ip_application_id") REFERENCES "public"."ip_application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_code" ADD CONSTRAINT "tracking_code_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_otp" ADD CONSTRAINT "tracking_otp_tracking_id_fkey" FOREIGN KEY ("tracking_id") REFERENCES "public"."tracking_code"("tracking_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_tracking_code_application" ON "tracking_code" USING btree ("ip_application_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_tracking_code_user" ON "tracking_code" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_tracking_otp_tracking" ON "tracking_otp" USING btree ("tracking_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_tracking_otp_identifier" ON "tracking_otp" USING btree ("identifier" text_ops);--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "fk_activity_log_user" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "archives" ADD CONSTRAINT "fk_archive_user" FOREIGN KEY ("archived_by") REFERENCES "public"."user_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "public"."application_phase"("phase_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."ip_application"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents_validation" ADD CONSTRAINT "documents_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "public"."user_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_participant" ADD CONSTRAINT "event_participant_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."calendar_event"("event_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_validation" ADD CONSTRAINT "internal_validation_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ip_application" ADD CONSTRAINT "fk_application_user" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ip_disclosure_review" ADD CONSTRAINT "ip_disclosure_review_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."user_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_review" ADD CONSTRAINT "phase_review_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."user_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_task" ADD CONSTRAINT "phase_task_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_event" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "calendar_event" DROP COLUMN "project_id";--> statement-breakpoint
ALTER TABLE "calendar_event" DROP COLUMN "is_all_day";--> statement-breakpoint
ALTER TABLE "client_profile" DROP COLUMN "ip_application_id";--> statement-breakpoint
ALTER TABLE "client_profile" DROP COLUMN "has_company";--> statement-breakpoint
ALTER TABLE "client_profile" DROP COLUMN "college_name";--> statement-breakpoint
ALTER TABLE "client_profile" DROP COLUMN "department_name";--> statement-breakpoint
ALTER TABLE "external_collaboration" DROP COLUMN "office_name";--> statement-breakpoint
ALTER TABLE "external_collaboration" DROP COLUMN "reminder_type";--> statement-breakpoint
ALTER TABLE "external_collaboration" DROP COLUMN "reminder_day";--> statement-breakpoint
ALTER TABLE "external_collaboration" DROP COLUMN "reminder_time";--> statement-breakpoint
ALTER TABLE "external_collaboration" DROP COLUMN "file_name";--> statement-breakpoint
ALTER TABLE "external_collaboration" DROP COLUMN "file_type";--> statement-breakpoint
ALTER TABLE "external_collaboration" DROP COLUMN "file_size";--> statement-breakpoint
ALTER TABLE "internal_validation" DROP COLUMN "file_name";--> statement-breakpoint
ALTER TABLE "internal_validation" DROP COLUMN "file_type";--> statement-breakpoint
ALTER TABLE "internal_validation" DROP COLUMN "file_size";--> statement-breakpoint
ALTER TABLE "internal_validation" DROP COLUMN "title";--> statement-breakpoint
ALTER TABLE "ip_disclosure" DROP COLUMN "application_id";--> statement-breakpoint
ALTER TABLE "other_documents" DROP COLUMN "title";--> statement-breakpoint
ALTER TABLE "phase_reminder" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "phase_reminder" DROP COLUMN "reminder_type";--> statement-breakpoint
ALTER TABLE "phase_reminder" DROP COLUMN "reminder_day";--> statement-breakpoint
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_event_type_check" CHECK ((event_type)::text = ANY (ARRAY[('meeting'::character varying)::text, ('deadline'::character varying)::text, ('review'::character varying)::text, ('other'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "client_profile" ADD CONSTRAINT "check_affiliation_fields" CHECK (
        is_affiliated = false
        OR (
          institution_name IS NOT NULL
          AND department IS NOT NULL
        )
      );--> statement-breakpoint
ALTER TABLE "client_profile" ADD CONSTRAINT "check_citizenship_jsonb" CHECK (
        (citizenship ->> 'value'::text)
        = ANY (
          ARRAY[
            'filipino'::text,
            'other'::text
          ]
        )
      );--> statement-breakpoint
ALTER TABLE "client_profile" ADD CONSTRAINT "check_gender_jsonb" CHECK (
        (gender ->> 'value'::text)
        = ANY (
          ARRAY[
            'male'::text,
            'female'::text,
            'prefer_not_to_say'::text
          ]
        )
      );--> statement-breakpoint
ALTER TABLE "client_profile" ADD CONSTRAINT "check_highest_degree_jsonb" CHECK (
        (highest_degree ->> 'value'::text)
        = ANY (
          ARRAY[
            'bachelor'::text,
            'master'::text,
            'doctorate'::text,
            'other'::text
          ]
        )
      );--> statement-breakpoint
ALTER TABLE "internal_validation" ADD CONSTRAINT "internal_validation_validator_role_check" CHECK ((validator_role)::text = ANY (ARRAY[('superadmin'::character varying)::text, ('director'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "phase_reminder" ADD CONSTRAINT "phase_reminder_frequency_check" CHECK ((frequency)::text = ANY (ARRAY[('daily'::character varying)::text, ('weekly'::character varying)::text, ('custom'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "public"."ip_application" ALTER COLUMN "ip_type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "public"."ip_disclosure_attachment" ALTER COLUMN "ip_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."application_type";--> statement-breakpoint
CREATE TYPE "public"."application_type" AS ENUM('patent', 'copyright', 'trademark', 'utility_model');--> statement-breakpoint
ALTER TABLE "public"."ip_application" ALTER COLUMN "ip_type" SET DATA TYPE "public"."application_type" USING "ip_type"::"public"."application_type";--> statement-breakpoint
ALTER TABLE "public"."ip_disclosure_attachment" ALTER COLUMN "ip_type" SET DATA TYPE "public"."application_type" USING "ip_type"::"public"."application_type";