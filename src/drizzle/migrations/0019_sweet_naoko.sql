ALTER TABLE "application_phase" DROP CONSTRAINT "ck_phase_status";--> statement-breakpoint
ALTER TABLE "calendar_event" DROP CONSTRAINT "calendar_event_event_type_check";--> statement-breakpoint
ALTER TABLE "calendar_event" DROP CONSTRAINT "calendar_event_priority_check";--> statement-breakpoint
ALTER TABLE "calendar_event" DROP CONSTRAINT "calendar_event_status_check";--> statement-breakpoint
ALTER TABLE "contact_message" DROP CONSTRAINT "contact_message_status_check";--> statement-breakpoint
ALTER TABLE "deed_of_assignment" DROP CONSTRAINT "deed_of_assignment_status_check";--> statement-breakpoint
ALTER TABLE "digital_signature" DROP CONSTRAINT "digital_signature_signer_type_check";--> statement-breakpoint
ALTER TABLE "document_management" DROP CONSTRAINT "document_management_entity_type_check";--> statement-breakpoint
ALTER TABLE "document_management" DROP CONSTRAINT "document_status_check";--> statement-breakpoint
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
ALTER TABLE "task_assignment" DROP CONSTRAINT "task_assignment_status_check";--> statement-breakpoint
ALTER TABLE "substantial_use" ADD COLUMN "application_id" uuid;--> statement-breakpoint
ALTER TABLE "substantial_use" ADD CONSTRAINT "substantial_use_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."ip_application"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_substantial_use_application" ON "substantial_use" USING btree ("application_id" uuid_ops);--> statement-breakpoint
ALTER TABLE "application_phase" ADD CONSTRAINT "ck_phase_status" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'active'::character varying, 'completed'::character varying, 'blocked'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_event_type_check" CHECK ((event_type)::text = ANY ((ARRAY['meeting'::character varying, 'deadline'::character varying, 'review'::character varying, 'other'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_priority_check" CHECK ((priority)::text = ANY ((ARRAY['high'::character varying, 'medium'::character varying, 'low'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_status_check" CHECK ((status)::text = ANY ((ARRAY['scheduled'::character varying, 'in-progress'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "contact_message" ADD CONSTRAINT "contact_message_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'in-progress'::character varying, 'resolved'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "deed_of_assignment" ADD CONSTRAINT "deed_of_assignment_status_check" CHECK ((status)::text = ANY ((ARRAY['draft'::character varying, 'submitted'::character varying, 'approved'::character varying, 'rejected'::character varying, 'pending_revision'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "digital_signature" ADD CONSTRAINT "digital_signature_signer_type_check" CHECK ((signer_type)::text = ANY ((ARRAY['author'::character varying, 'applicant'::character varying, 'representative'::character varying, 'staff'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "document_management" ADD CONSTRAINT "document_management_entity_type_check" CHECK ((entity_type)::text = ANY ((ARRAY['application'::character varying, 'phase'::character varying, 'task'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "document_management" ADD CONSTRAINT "document_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "document_category_check" CHECK ((category)::text = ANY ((ARRAY['forms'::character varying, 'attachments'::character varying, 'requirements'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "event_participant" ADD CONSTRAINT "event_participant_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'declined'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "external_collaboration" ADD CONSTRAINT "external_collaboration_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'in_progress'::character varying, 'completed'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "internal_validation" ADD CONSTRAINT "internal_validation_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "internal_validation" ADD CONSTRAINT "internal_validation_validator_role_check" CHECK ((validator_role)::text = ANY ((ARRAY['superadmin'::character varying, 'director'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "ip_application" ADD CONSTRAINT "ck_commercialization" CHECK ((commercialization_status)::text = ANY ((ARRAY['not_licensed'::character varying, 'licensed'::character varying, 'in_negotiation'::character varying, 'technology_transfer'::character varying, 'internal_use'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "ip_contributors" ADD CONSTRAINT "ip_contributors_role_check" CHECK ((role)::text = ANY ((ARRAY['inventor'::character varying, 'author'::character varying, 'applicant'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "ip_details" ADD CONSTRAINT "ip_details_commercialization_status_check" CHECK ((commercialization_status)::text = ANY ((ARRAY['not_licensed'::character varying, 'licensed'::character varying, 'in_negotiation'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "ip_disclosure_review" ADD CONSTRAINT "ip_disclosure_review_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'needs_revision'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_status_check" CHECK ((status)::text = ANY ((ARRAY['read'::character varying, 'unread'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_type_check" CHECK ((type)::text = ANY ((ARRAY['info'::character varying, 'warning'::character varying, 'success'::character varying, 'error'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "patent_utility_model_application" ADD CONSTRAINT "patent_utility_model_application_type_check" CHECK ((type)::text = ANY ((ARRAY['patent'::character varying, 'utility_model'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "phase_reminder" ADD CONSTRAINT "phase_reminder_frequency_check" CHECK ((frequency)::text = ANY ((ARRAY['daily'::character varying, 'weekly'::character varying, 'custom'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "phase_review" ADD CONSTRAINT "review_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'needs_revision'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "phase_task" ADD CONSTRAINT "task_priority_check" CHECK ((priority)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "phase_task" ADD CONSTRAINT "task_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'blocked'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "substantial_use" ADD CONSTRAINT "substantial_use_status_check" CHECK ((status)::text = ANY ((ARRAY['draft'::character varying, 'submitted'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "task_assignment" ADD CONSTRAINT "task_assignment_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'completed'::character varying, 'rejected'::character varying])::text[]));