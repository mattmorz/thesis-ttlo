ALTER TYPE "public"."application_type" ADD VALUE 'industrial_design';--> statement-breakpoint
ALTER TYPE "public"."application_type" ADD VALUE 'trade_secret';--> statement-breakpoint
ALTER TYPE "public"."application_type" ADD VALUE 'not_sure';--> statement-breakpoint
ALTER TYPE "public"."application_type" ADD VALUE 'other';--> statement-breakpoint
CREATE TABLE "internal_validation_assignee" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"internal_validation_id" uuid,
	"user_id" uuid,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "phase_task_assignee" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
ALTER TABLE "calendar_event" DROP CONSTRAINT IF EXISTS "calendar_event_priority_check";--> statement-breakpoint
ALTER TABLE "calendar_event" DROP CONSTRAINT IF EXISTS "calendar_event_event_type_check";--> statement-breakpoint
ALTER TABLE "internal_validation" DROP CONSTRAINT IF EXISTS "internal_validation_validator_role_check";--> statement-breakpoint
ALTER TABLE "phase_reminder" DROP CONSTRAINT IF EXISTS "phase_reminder_frequency_check";--> statement-breakpoint
ALTER TABLE "calendar_event" DROP CONSTRAINT IF EXISTS "calendar_event_phase_id_fkey";
--> statement-breakpoint
ALTER TABLE "calendar_event" DROP CONSTRAINT IF EXISTS "calendar_event_application_id_fkey";
--> statement-breakpoint
ALTER TABLE "event_participant" DROP CONSTRAINT IF EXISTS "event_participant_event_id_fkey";
--> statement-breakpoint
ALTER TABLE "internal_validation" DROP CONSTRAINT IF EXISTS "internal_validation_assigned_to_fkey";
--> statement-breakpoint
ALTER TABLE "phase_reminder" ALTER COLUMN "reminder_time" SET DEFAULT '12:00:00';--> statement-breakpoint
ALTER TABLE "calendar_event" DROP CONSTRAINT IF EXISTS "calendar_event_pkey";--> statement-breakpoint
ALTER TABLE "calendar_event" ADD COLUMN "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "calendar_event" ADD COLUMN "project_id" uuid;--> statement-breakpoint
ALTER TABLE "calendar_event" ADD COLUMN "other_event_type" text;--> statement-breakpoint
ALTER TABLE "calendar_event" ADD COLUMN "is_all_day" boolean DEFAULT false;--> statement-breakpoint
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
ALTER TABLE "phase_reminder" DROP CONSTRAINT IF EXISTS "phase_reminder_pkey";--> statement-breakpoint
ALTER TABLE "phase_reminder" ADD COLUMN "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "phase_reminder" ADD COLUMN "reminder_type" varchar(20) DEFAULT 'none';--> statement-breakpoint
ALTER TABLE "phase_reminder" ADD COLUMN "reminder_day" varchar(20) DEFAULT 'none';--> statement-breakpoint
ALTER TABLE "internal_validation_assignee" ADD CONSTRAINT "fr_internal_validation_id" FOREIGN KEY ("internal_validation_id") REFERENCES "public"."internal_validation"("validation_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_validation_assignee" ADD CONSTRAINT "fr_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_task_assignee" ADD CONSTRAINT "fk_task_id" FOREIGN KEY ("task_id") REFERENCES "public"."phase_task"("task_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_task_assignee" ADD CONSTRAINT "fk_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_application_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."ip_application"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_participant" ADD CONSTRAINT "event_participant_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."calendar_event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_event" DROP COLUMN "event_id";--> statement-breakpoint
ALTER TABLE "calendar_event" DROP COLUMN "priority";--> statement-breakpoint
ALTER TABLE "calendar_event" DROP COLUMN "application_id";--> statement-breakpoint
ALTER TABLE "calendar_event" DROP COLUMN "phase_id";--> statement-breakpoint
ALTER TABLE "external_collaboration" DROP COLUMN "office";--> statement-breakpoint
ALTER TABLE "internal_validation" DROP COLUMN "document_id";--> statement-breakpoint
ALTER TABLE "internal_validation" DROP COLUMN "assigned_to";--> statement-breakpoint
ALTER TABLE "phase_reminder" DROP COLUMN "reminder_id";--> statement-breakpoint
ALTER TABLE "phase_reminder" DROP COLUMN "frequency";--> statement-breakpoint
ALTER TABLE "phase_reminder" DROP COLUMN "custom_days";--> statement-breakpoint
ALTER TABLE "phase_reminder" DROP COLUMN "is_active";--> statement-breakpoint
ALTER TABLE "phase_reminder" ADD CONSTRAINT "phase_reminder_phase_id_key" UNIQUE("phase_id");--> statement-breakpoint
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_event_type_check" CHECK ((event_type)::text = ANY (ARRAY[('meeting'::character varying)::text, ('phase'::character varying)::text, ('task'::character varying)::text, ('other'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "external_collaboration" ADD CONSTRAINT "reminder_day_check" CHECK ((reminder_day)::text = ANY (ARRAY[('none'::character varying)::text, ('mon'::character varying)::text, ('tue'::character varying)::text, ('wed'::character varying)::text, ('thu'::character varying)::text, ('fri'::character varying)::text, ('sat'::character varying)::text, ('sun'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "external_collaboration" ADD CONSTRAINT "reminder_type_check" CHECK ((reminder_type)::text = ANY (ARRAY[('none'::character varying)::text, ('daily'::character varying)::text, ('weekly'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "internal_validation" ADD CONSTRAINT "internal_validation_validator_role_check" CHECK ((validator_role)::text = ANY (ARRAY[('admin'::character varying)::text, ('director'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "phase_reminder" ADD CONSTRAINT "reminder_day_check" CHECK ((reminder_day)::text = ANY (ARRAY[('none'::character varying)::text, ('mon'::character varying)::text, ('tue'::character varying)::text, ('wed'::character varying)::text, ('thu'::character varying)::text, ('fri'::character varying)::text, ('sat'::character varying)::text, ('sun'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "phase_reminder" ADD CONSTRAINT "reminder_type_check" CHECK ((reminder_type)::text = ANY (ARRAY[('none'::character varying)::text, ('daily'::character varying)::text, ('weekly'::character varying)::text]));