ALTER TABLE "application_phase" DROP CONSTRAINT IF EXISTS "ck_phase_status";--> statement-breakpoint
ALTER TABLE "calendar_event" DROP CONSTRAINT IF EXISTS "calendar_event_event_type_check";--> statement-breakpoint
ALTER TABLE "calendar_event" DROP CONSTRAINT IF EXISTS "calendar_event_priority_check";--> statement-breakpoint
ALTER TABLE "calendar_event" DROP CONSTRAINT IF EXISTS "calendar_event_status_check";--> statement-breakpoint
ALTER TABLE "contact_message" DROP CONSTRAINT IF EXISTS "contact_message_status_check";--> statement-breakpoint
ALTER TABLE "deed_of_assignment" DROP CONSTRAINT IF EXISTS "deed_of_assignment_status_check";--> statement-breakpoint
ALTER TABLE "digital_signature" DROP CONSTRAINT IF EXISTS "digital_signature_signer_type_check";--> statement-breakpoint
ALTER TABLE "document_management" DROP CONSTRAINT IF EXISTS "document_management_entity_type_check";--> statement-breakpoint
ALTER TABLE "document_management" DROP CONSTRAINT IF EXISTS "document_status_check";--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "document_category_check";--> statement-breakpoint
ALTER TABLE "event_participant" DROP CONSTRAINT IF EXISTS "event_participant_status_check";--> statement-breakpoint
ALTER TABLE "external_collaboration" DROP CONSTRAINT IF EXISTS "external_collaboration_status_check";--> statement-breakpoint
ALTER TABLE "internal_validation" DROP CONSTRAINT IF EXISTS "internal_validation_status_check";--> statement-breakpoint
ALTER TABLE "internal_validation" DROP CONSTRAINT IF EXISTS "internal_validation_validator_role_check";--> statement-breakpoint
ALTER TABLE "ip_application" DROP CONSTRAINT IF EXISTS "ck_commercialization";--> statement-breakpoint
ALTER TABLE "ip_contributors" DROP CONSTRAINT IF EXISTS "ip_contributors_role_check";--> statement-breakpoint
ALTER TABLE "ip_details" DROP CONSTRAINT IF EXISTS "ip_details_commercialization_status_check";--> statement-breakpoint
ALTER TABLE "ip_disclosure_review" DROP CONSTRAINT IF EXISTS "ip_disclosure_review_status_check";--> statement-breakpoint
ALTER TABLE "notification" DROP CONSTRAINT IF EXISTS "notification_status_check";--> statement-breakpoint
ALTER TABLE "notification" DROP CONSTRAINT IF EXISTS "notification_type_check";--> statement-breakpoint
ALTER TABLE "patent_utility_model_application" DROP CONSTRAINT IF EXISTS "patent_utility_model_application_type_check";--> statement-breakpoint
ALTER TABLE "phase_reminder" DROP CONSTRAINT IF EXISTS "phase_reminder_frequency_check";--> statement-breakpoint
ALTER TABLE "phase_review" DROP CONSTRAINT IF EXISTS "review_status_check";--> statement-breakpoint
ALTER TABLE "phase_task" DROP CONSTRAINT IF EXISTS "task_priority_check";--> statement-breakpoint
ALTER TABLE "phase_task" DROP CONSTRAINT IF EXISTS "task_status_check";--> statement-breakpoint
ALTER TABLE "substantial_use" DROP CONSTRAINT IF EXISTS "substantial_use_status_check";--> statement-breakpoint
ALTER TABLE "task_assignment" DROP CONSTRAINT IF EXISTS "task_assignment_status_check";--> statement-breakpoint
ALTER TABLE "ip_disclosure" ADD COLUMN "application_id" uuid;--> statement-breakpoint
ALTER TABLE "ip_disclosure" ADD CONSTRAINT "ip_disclosure_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."ip_application"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ip_disclosure_application" ON "ip_disclosure" USING btree ("application_id" uuid_ops);--> statement-breakpoint
ALTER TABLE "application_phase" ADD CONSTRAINT "ck_phase_status" CHECK ((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('active'::character varying)::text, ('completed'::character varying)::text, ('blocked'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_event_type_check" CHECK ((event_type)::text = ANY (ARRAY[('meeting'::character varying)::text, ('deadline'::character varying)::text, ('review'::character varying)::text, ('other'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_priority_check" CHECK ((priority)::text = ANY (ARRAY[('high'::character varying)::text, ('medium'::character varying)::text, ('low'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_status_check" CHECK ((status)::text = ANY (ARRAY[('scheduled'::character varying)::text, ('in-progress'::character varying)::text, ('completed'::character varying)::text, ('cancelled'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "contact_message" ADD CONSTRAINT "contact_message_status_check" CHECK ((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('in-progress'::character varying)::text, ('resolved'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "deed_of_assignment" ADD CONSTRAINT "deed_of_assignment_status_check" CHECK ((status)::text = ANY (ARRAY[('draft'::character varying)::text, ('submitted'::character varying)::text, ('approved'::character varying)::text, ('rejected'::character varying)::text, ('pending_revision'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "digital_signature" ADD CONSTRAINT "digital_signature_signer_type_check" CHECK ((signer_type)::text = ANY (ARRAY[('author'::character varying)::text, ('applicant'::character varying)::text, ('representative'::character varying)::text, ('staff'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "document_management" ADD CONSTRAINT "document_management_entity_type_check" CHECK ((entity_type)::text = ANY (ARRAY[('application'::character varying)::text, ('phase'::character varying)::text, ('task'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "document_management" ADD CONSTRAINT "document_status_check" CHECK ((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('approved'::character varying)::text, ('rejected'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "document_category_check" CHECK ((category)::text = ANY (ARRAY[('forms'::character varying)::text, ('attachments'::character varying)::text, ('requirements'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "event_participant" ADD CONSTRAINT "event_participant_status_check" CHECK ((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('accepted'::character varying)::text, ('declined'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "external_collaboration" ADD CONSTRAINT "external_collaboration_status_check" CHECK ((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('in_progress'::character varying)::text, ('completed'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "internal_validation" ADD CONSTRAINT "internal_validation_status_check" CHECK ((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('approved'::character varying)::text, ('rejected'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "internal_validation" ADD CONSTRAINT "internal_validation_validator_role_check" CHECK ((validator_role)::text = ANY (ARRAY[('superadmin'::character varying)::text, ('director'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "ip_application" ADD CONSTRAINT "ck_commercialization" CHECK ((commercialization_status)::text = ANY (ARRAY[('not_licensed'::character varying)::text, ('licensed'::character varying)::text, ('in_negotiation'::character varying)::text, ('technology_transfer'::character varying)::text, ('internal_use'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "ip_contributors" ADD CONSTRAINT "ip_contributors_role_check" CHECK ((role)::text = ANY (ARRAY[('inventor'::character varying)::text, ('author'::character varying)::text, ('applicant'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "ip_details" ADD CONSTRAINT "ip_details_commercialization_status_check" CHECK ((commercialization_status)::text = ANY (ARRAY[('not_licensed'::character varying)::text, ('licensed'::character varying)::text, ('in_negotiation'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "ip_disclosure_review" ADD CONSTRAINT "ip_disclosure_review_status_check" CHECK ((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('approved'::character varying)::text, ('rejected'::character varying)::text, ('needs_revision'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_status_check" CHECK ((status)::text = ANY (ARRAY[('read'::character varying)::text, ('unread'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_type_check" CHECK ((type)::text = ANY (ARRAY[('info'::character varying)::text, ('warning'::character varying)::text, ('success'::character varying)::text, ('error'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "patent_utility_model_application" ADD CONSTRAINT "patent_utility_model_application_type_check" CHECK ((type)::text = ANY (ARRAY[('patent'::character varying)::text, ('utility_model'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "phase_reminder" ADD CONSTRAINT "phase_reminder_frequency_check" CHECK ((frequency)::text = ANY (ARRAY[('daily'::character varying)::text, ('weekly'::character varying)::text, ('custom'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "phase_review" ADD CONSTRAINT "review_status_check" CHECK ((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('approved'::character varying)::text, ('rejected'::character varying)::text, ('needs_revision'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "phase_task" ADD CONSTRAINT "task_priority_check" CHECK ((priority)::text = ANY (ARRAY[('low'::character varying)::text, ('medium'::character varying)::text, ('high'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "phase_task" ADD CONSTRAINT "task_status_check" CHECK ((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('in_progress'::character varying)::text, ('completed'::character varying)::text, ('blocked'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "substantial_use" ADD CONSTRAINT "substantial_use_status_check" CHECK ((status)::text = ANY (ARRAY[('draft'::character varying)::text, ('submitted'::character varying)::text, ('approved'::character varying)::text, ('rejected'::character varying)::text]));--> statement-breakpoint
ALTER TABLE "task_assignment" ADD CONSTRAINT "task_assignment_status_check" CHECK ((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('accepted'::character varying)::text, ('completed'::character varying)::text, ('rejected'::character varying)::text]));