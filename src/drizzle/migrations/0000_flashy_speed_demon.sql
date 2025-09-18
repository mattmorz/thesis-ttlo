CREATE TYPE "public"."activity_type" AS ENUM('update', 'comment', 'status_change');--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('draft', 'pending', 'in_progress', 'approved', 'rejected', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."application_type" AS ENUM('patent', 'copyright', 'trademark', 'utility_model');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'ttlo_staff', 'client');--> statement-breakpoint
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
CREATE TABLE "activity_log" (
	"log_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"phase_id" uuid,
	"user_id" uuid NOT NULL,
	"activity_type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "activity_type_check" CHECK ((activity_type)::text = ANY ((ARRAY['update'::character varying, 'comment'::character varying, 'status_change'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "application_phase" (
	"phase_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status" varchar(50) DEFAULT 'pending',
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"progress" integer DEFAULT 0,
	"order_index" integer NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "phase_progress_check" CHECK ((progress >= 0) AND (progress <= 100)),
	CONSTRAINT "phase_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'active'::character varying, 'completed'::character varying, 'blocked'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "archive" (
	"archive_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" text,
	"archive_date" timestamp DEFAULT CURRENT_TIMESTAMP,
	"archived_by" uuid,
	"status" varchar(50) DEFAULT 'active',
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "archive_status_check" CHECK ((status)::text = ANY (ARRAY[('active'::character varying)::text, ('inactive'::character varying)::text]))
);
--> statement-breakpoint
CREATE TABLE "auth_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "authenticator" (
	"credentialId" text NOT NULL,
	"userId" uuid NOT NULL,
	"providerAccountId" text NOT NULL,
	"credentialPublicKey" text NOT NULL,
	"counter" integer NOT NULL,
	"credentialDeviceType" text NOT NULL,
	"credentialBackedUp" boolean NOT NULL,
	"transports" text,
	CONSTRAINT "authenticator_credentialID_unique" UNIQUE("credentialId")
);
--> statement-breakpoint
CREATE TABLE "calendar_event" (
	"event_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"event_type" varchar(50),
	"status" varchar(50) DEFAULT 'scheduled',
	"priority" varchar(20),
	"created_by" uuid,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"application_id" uuid,
	"phase_id" uuid,
	CONSTRAINT "calendar_event_event_type_check" CHECK ((event_type)::text = ANY ((ARRAY['meeting'::character varying, 'deadline'::character varying, 'review'::character varying, 'other'::character varying])::text[])),
	CONSTRAINT "calendar_event_priority_check" CHECK ((priority)::text = ANY ((ARRAY['high'::character varying, 'medium'::character varying, 'low'::character varying])::text[])),
	CONSTRAINT "calendar_event_status_check" CHECK ((status)::text = ANY ((ARRAY['scheduled'::character varying, 'in-progress'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "client_profile" (
	"client_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"first_name" varchar(100) NOT NULL,
	"middle_name" varchar(100),
	"last_name" varchar(100) NOT NULL,
	"gender" varchar(20) NOT NULL,
	"age" integer,
	"citizenship" varchar(100) NOT NULL,
	"contact_number" varchar(20) NOT NULL,
	"email" varchar(255) NOT NULL,
	"mailing_address" text NOT NULL,
	"company_name" varchar(255),
	"company_address" text,
	"company_email" varchar(255),
	"occupation" varchar(255),
	"highest_degree" varchar(50),
	"other_degree" varchar(255),
	"degree_program" varchar(255),
	"profession" varchar(255),
	"has_research_output" boolean DEFAULT false,
	"research_output_status" varchar(20),
	"has_inst_materials" boolean DEFAULT false,
	"inst_materials_status" varchar(20),
	"is_familiar_ra8293" boolean DEFAULT false,
	"has_ip_experience" boolean DEFAULT false,
	"ip_experience_types" jsonb,
	"client_signature" text,
	"staff_signature" text,
	"signed_at" timestamp,
	"verified_at" timestamp,
	"verified_by" uuid,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "client_profile_gender_check" CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
	CONSTRAINT "client_profile_research_output_status_check" CHECK (research_output_status IN ('submitted', NULL)),
	CONSTRAINT "client_profile_inst_materials_status_check" CHECK (inst_materials_status IN ('ongoing', NULL)),
	CONSTRAINT "client_profile_highest_degree_check" CHECK (highest_degree IN ('bachelor', 'master', 'doctorate', 'other', NULL))
);
--> statement-breakpoint
CREATE TABLE "comment" (
	"comment_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"user_id" uuid,
	"content" text NOT NULL,
	"parent_id" uuid,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "contact_message" (
	"message_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"subject" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"status" varchar(50) DEFAULT 'pending',
	"assigned_to" uuid,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "contact_message_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'in-progress'::character varying, 'resolved'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "copyright_applicant" (
	"applicant_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_detail_id" uuid,
	"first_name" varchar(100) NOT NULL,
	"middle_name" varchar(100),
	"last_name" varchar(100) NOT NULL,
	"citizenship" varchar(100) NOT NULL,
	"address" text NOT NULL,
	"contact_number" varchar(20),
	"email" varchar(255) NOT NULL,
	"is_author" boolean DEFAULT false,
	"is_copyright_owner" boolean DEFAULT false,
	"is_authorized_representative" boolean DEFAULT false,
	"relationship_to_author" varchar(100),
	"tin_number" varchar(20),
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "copyright_author_creator" (
	"author_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_detail_id" uuid,
	"is_same_as_applicant" boolean DEFAULT false,
	"applicant_id" uuid,
	"first_name" varchar(100),
	"middle_name" varchar(100),
	"last_name" varchar(100),
	"pseudonym" varchar(100),
	"citizenship" varchar(100),
	"address" text,
	"contact_number" varchar(20),
	"email" varchar(255),
	"contribution_type" varchar(100),
	"is_deceased" boolean DEFAULT false,
	"date_of_death" date,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "author_details_check" CHECK (((is_same_as_applicant = true) AND (applicant_id IS NOT NULL)) OR ((is_same_as_applicant = false) AND (first_name IS NOT NULL) AND (last_name IS NOT NULL)))
);
--> statement-breakpoint
CREATE TABLE "copyright_basic_application" (
	"copyright_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"disclosure_id" uuid,
	"work_title" varchar(255) NOT NULL,
	"work_description" text NOT NULL,
	"creation_date" date NOT NULL,
	"status" varchar(50) DEFAULT 'draft',
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "copyright_transaction_part2" (
	"transaction_detail_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"copyright_id" uuid,
	"transaction_types" jsonb NOT NULL,
	"filing_method" varchar(50),
	"filing_type" varchar(50),
	"number_of_copies" integer DEFAULT 1,
	"ipso_region" varchar(100),
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "copyright_transaction_part2_filing_method_check" CHECK ((filing_method)::text = ANY ((ARRAY['electronic'::character varying, 'through_ipso'::character varying])::text[])),
	CONSTRAINT "copyright_transaction_part2_filing_type_check" CHECK ((filing_type)::text = ANY ((ARRAY['single'::character varying, 'bulk'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "copyright_work_creation" (
	"work_creation_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_detail_id" uuid,
	"title" varchar(255) NOT NULL,
	"date_of_creation" date NOT NULL,
	"place_of_creation" varchar(255) NOT NULL,
	"classification_of_work" char(1) NOT NULL,
	"is_local_submission" boolean DEFAULT true,
	"is_foreign_submission" boolean DEFAULT false,
	"is_registered" boolean DEFAULT false,
	"registered_with_ipophl" boolean DEFAULT false,
	"registered_with_nlp" boolean DEFAULT false,
	"is_published" boolean DEFAULT false,
	"publisher_info" text,
	"is_derivative_work" boolean DEFAULT false,
	"original_work_info" text,
	"is_indigenous_knowledge" boolean DEFAULT false,
	"indigenous_source_info" text,
	"is_government_funded" boolean DEFAULT false,
	"funding_agency" varchar(255),
	"is_regular_duty_work" boolean DEFAULT false,
	"employer_info" text,
	"is_claiming_entire_work" boolean DEFAULT true,
	"partial_rights_details" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "digital_signature" (
	"signature_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"signer_id" uuid,
	"signer_type" varchar(50) NOT NULL,
	"signature_image" text NOT NULL,
	"signature_date" timestamp DEFAULT CURRENT_TIMESTAMP,
	"ip_address" varchar(45),
	"is_valid" boolean DEFAULT true,
	"verification_token" varchar(255),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "digital_signature_signer_type_check" CHECK ((signer_type)::text = ANY ((ARRAY['author'::character varying, 'applicant'::character varying, 'representative'::character varying, 'staff'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "document_management" (
	"document_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"document_type" varchar(100) NOT NULL,
	"document_title" varchar(255) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_path" text NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"status" varchar(50) DEFAULT 'pending',
	"uploaded_by" uuid,
	"upload_date" timestamp DEFAULT CURRENT_TIMESTAMP,
	"verified_by" uuid,
	"verification_date" timestamp,
	"remarks" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"application_id" uuid,
	"phase_id" uuid,
	CONSTRAINT "document_management_entity_type_check" CHECK ((entity_type)::text = ANY ((ARRAY['application'::character varying, 'phase'::character varying, 'task'::character varying])::text[])),
	CONSTRAINT "document_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"document_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"phase_id" uuid,
	"title" varchar(255) NOT NULL,
	"file_path" text NOT NULL,
	"file_type" varchar(50) NOT NULL,
	"file_size" integer NOT NULL,
	"category" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'pending',
	"uploaded_by" uuid NOT NULL,
	"uploaded_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"verified_by" uuid,
	"verified_at" timestamp,
	"remarks" text,
	"requires_validation" boolean DEFAULT false,
	"validation_status" varchar(50),
	"validation_date" timestamp,
	"validated_by" uuid,
	"validation_remarks" text,
	CONSTRAINT "document_category_check" CHECK ((category)::text = ANY ((ARRAY['forms'::character varying, 'attachments'::character varying, 'requirements'::character varying])::text[])),
	CONSTRAINT "document_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'verified'::character varying, 'rejected'::character varying])::text[])),
	CONSTRAINT "document_validation_status_check" CHECK ((validation_status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'needs_revision'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "event_participant" (
	"event_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" varchar(50) DEFAULT 'pending',
	CONSTRAINT "event_participant_pkey" PRIMARY KEY("event_id","user_id"),
	CONSTRAINT "event_participant_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'declined'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "external_collaboration" (
	"collaboration_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phase_id" uuid,
	"office" varchar(255) NOT NULL,
	"contact_person" varchar(255) NOT NULL,
	"task" text NOT NULL,
	"status" varchar(20) DEFAULT 'pending',
	"due_date" date NOT NULL,
	"response_required" boolean DEFAULT false,
	"remarks" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "external_collaboration_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'in_progress'::character varying, 'completed'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "internal_validation" (
	"validation_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phase_id" uuid,
	"document_id" uuid,
	"validator_role" varchar(50),
	"assigned_to" uuid,
	"status" varchar(20) DEFAULT 'pending',
	"due_date" date NOT NULL,
	"remarks" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "internal_validation_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])),
	CONSTRAINT "internal_validation_validator_role_check" CHECK ((validator_role)::text = ANY ((ARRAY['superadmin'::character varying, 'director'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "inventory_item" (
	"item_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" varchar(50),
	"name" varchar(255) NOT NULL,
	"description" text,
	"quantity" integer DEFAULT 0 NOT NULL,
	"unit" varchar(50),
	"status" varchar(50) DEFAULT 'active',
	"location" varchar(255),
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "inventory_item_category_check" CHECK ((category)::text = ANY (ARRAY[('chemical'::character varying)::text, ('mechanical'::character varying)::text, ('project'::character varying)::text]))
);
--> statement-breakpoint
CREATE TABLE "inventory_transaction" (
	"transaction_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid,
	"transaction_type" varchar(50),
	"quantity" integer NOT NULL,
	"transaction_date" timestamp DEFAULT CURRENT_TIMESTAMP,
	"performed_by" uuid,
	"remarks" text,
	CONSTRAINT "inventory_transaction_transaction_type_check" CHECK ((transaction_type)::text = ANY (ARRAY[('in'::character varying)::text, ('out'::character varying)::text]))
);
--> statement-breakpoint
CREATE TABLE "ip_application" (
	"application_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"ip_type" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'draft',
	"start_date" date,
	"end_date" date,
	"submission_date" date,
	"application_date" date,
	"application_number" varchar(100),
	"registration_number" varchar(100),
	"grant_date" date,
	"expiry_date" date,
	"progress" integer DEFAULT 0,
	"substantial_use_id" uuid,
	"deed_assignment_id" uuid,
	"research_field" varchar(255),
	"funding_source" varchar(255),
	"funding_type" varchar(100),
	"grant_number" varchar(100),
	"department" varchar(255),
	"faculty" varchar(255),
	"research_classification" varchar(100),
	"development_status" varchar(100),
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"archived_at" timestamp,
	"archived_reason" text,
	"inventors" text[],
	"technical_field" text[],
	"keywords" text[],
	"commercialization_status" varchar(50) DEFAULT 'not_licensed',
	CONSTRAINT "commercialization_status_check" CHECK ((commercialization_status)::text = ANY ((ARRAY['not_licensed'::character varying, 'licensed'::character varying, 'in_negotiation'::character varying, 'technology_transfer'::character varying, 'internal_use'::character varying])::text[])),
	CONSTRAINT "ip_type_check" CHECK ((ip_type)::text = ANY ((ARRAY['patent'::character varying, 'copyright'::character varying, 'trademark'::character varying, 'utility_model'::character varying])::text[])),
	CONSTRAINT "progress_check" CHECK ((progress >= 0) AND (progress <= 100)),
	CONSTRAINT "status_check" CHECK ((status)::text = ANY ((ARRAY['draft'::character varying, 'pending'::character varying, 'in_progress'::character varying, 'approved'::character varying, 'rejected'::character varying, 'completed'::character varying, 'archived'::character varying, 'on-hold'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "ip_contributors" (
	"contributor_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid,
	"first_name" varchar(100) NOT NULL,
	"middle_name" varchar(100),
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255),
	"role" varchar(50),
	"is_primary" boolean DEFAULT false,
	CONSTRAINT "ip_contributors_role_check" CHECK ((role)::text = ANY ((ARRAY['inventor'::character varying, 'author'::character varying, 'applicant'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "ip_details" (
	"detail_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid,
	"filing_date" date,
	"registration_number" varchar(100),
	"grant_date" date,
	"expiry_date" date,
	"jurisdiction" varchar(100),
	"commercialization_status" varchar(50),
	"metadata" jsonb,
	CONSTRAINT "ip_details_commercialization_status_check" CHECK ((commercialization_status)::text = ANY ((ARRAY['not_licensed'::character varying, 'licensed'::character varying, 'in_negotiation'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "ip_disclosure" (
	"disclosure_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid,
	"is_rightful_owner" boolean DEFAULT false,
	"ip_types" jsonb,
	"status" varchar(50) DEFAULT 'draft',
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "matrix_feature" (
	"feature_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"matrix_id" uuid,
	"feature_description" text NOT NULL,
	"analysis_data" jsonb
);
--> statement-breakpoint
CREATE TABLE "matrix_prior_art" (
	"prior_art_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"matrix_id" uuid,
	"title" varchar(255) NOT NULL,
	"reference_number" varchar(100),
	"publication_date" date,
	"relevance_description" text
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"notification_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"type" varchar(50),
	"status" varchar(20) DEFAULT 'unread',
	"link" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"read_at" timestamp,
	CONSTRAINT "notification_status_check" CHECK ((status)::text = ANY ((ARRAY['read'::character varying, 'unread'::character varying])::text[])),
	CONSTRAINT "notification_type_check" CHECK ((type)::text = ANY ((ARRAY['info'::character varying, 'warning'::character varying, 'success'::character varying, 'error'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "patent_basic_application" (
	"patent_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"disclosure_id" uuid,
	"technology_type" jsonb NOT NULL,
	"technology_field" jsonb NOT NULL,
	"invention_title" varchar(255) NOT NULL,
	"technical_problem" text NOT NULL,
	"technical_solution" text NOT NULL,
	"technical_field" text NOT NULL,
	"background_art" text NOT NULL,
	"invention_summary" text NOT NULL,
	"advantages" text NOT NULL,
	"industrial_applicability" text NOT NULL,
	"drawing_description" text,
	"best_mode" text,
	"own_publications" text,
	"patent_type" varchar(20),
	"status" varchar(50) DEFAULT 'draft',
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "patent_basic_application_patent_type_check" CHECK ((patent_type)::text = ANY ((ARRAY['patent'::character varying, 'utility_model'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "patent_matrix" (
	"matrix_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patent_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "phase_reminder" (
	"reminder_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phase_id" uuid,
	"frequency" varchar(20),
	"custom_days" integer,
	"reminder_time" time,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "phase_reminder_frequency_check" CHECK ((frequency)::text = ANY ((ARRAY['daily'::character varying, 'weekly'::character varying, 'custom'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "phase_review" (
	"review_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phase_id" uuid NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"comment" text NOT NULL,
	"status" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"rating" integer,
	"review_date" timestamp DEFAULT CURRENT_TIMESTAMP,
	"attachments" text[],
	CONSTRAINT "phase_review_rating_check" CHECK ((rating >= 1) AND (rating <= 5)),
	CONSTRAINT "review_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'needs_revision'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "phase_review_attachment" (
	"attachment_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid,
	"file_path" text NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_type" varchar(50) NOT NULL,
	"file_size" integer NOT NULL,
	"uploaded_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "phase_task" (
	"task_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phase_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"priority" varchar(20) NOT NULL,
	"weight" integer NOT NULL,
	"due_date" date,
	"completed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"assignee_id" uuid,
	"start_date" date,
	"status" varchar(50) DEFAULT 'pending',
	CONSTRAINT "task_priority_check" CHECK ((priority)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying])::text[])),
	CONSTRAINT "task_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'blocked'::character varying])::text[])),
	CONSTRAINT "task_weight_check" CHECK ((weight >= 0) AND (weight <= 100))
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_assignment" (
	"assignment_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"staff_id" uuid NOT NULL,
	"assigned_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"status" varchar(50) DEFAULT 'pending',
	CONSTRAINT "task_assignment_task_id_staff_id_key" UNIQUE("task_id","staff_id"),
	CONSTRAINT "task_assignment_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'completed'::character varying, 'rejected'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"email" text,
	"emailVerified" timestamp,
	"image" text,
	"role" varchar(50) DEFAULT 'client' NOT NULL,
	"is_active" boolean DEFAULT true,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_role_check" CHECK ((role)::text = ANY ((ARRAY['admin'::character varying, 'ttlo_staff'::character varying, 'client'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "user_account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"role" "user_role" DEFAULT 'client',
	"is_active" boolean DEFAULT true,
	"email_verified_at" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "user_account_email_key" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "fk_activity_application" FOREIGN KEY ("application_id") REFERENCES "public"."ip_application"("application_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "fk_activity_phase" FOREIGN KEY ("phase_id") REFERENCES "public"."application_phase"("phase_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "fk_activity_user" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_phase" ADD CONSTRAINT "application_phase_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."ip_application"("application_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_session" ADD CONSTRAINT "fk_session_user" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authenticator" ADD CONSTRAINT "authenticator_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."ip_application"("application_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "public"."application_phase"("phase_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_profile" ADD CONSTRAINT "client_profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_profile" ADD CONSTRAINT "client_profile_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."comment"("comment_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_message" ADD CONSTRAINT "contact_message_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copyright_applicant" ADD CONSTRAINT "copyright_applicant_transaction_detail_id_fkey" FOREIGN KEY ("transaction_detail_id") REFERENCES "public"."copyright_transaction_part2"("transaction_detail_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copyright_author_creator" ADD CONSTRAINT "copyright_author_creator_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "public"."copyright_applicant"("applicant_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copyright_author_creator" ADD CONSTRAINT "copyright_author_creator_transaction_detail_id_fkey" FOREIGN KEY ("transaction_detail_id") REFERENCES "public"."copyright_transaction_part2"("transaction_detail_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copyright_basic_application" ADD CONSTRAINT "copyright_basic_application_disclosure_id_fkey" FOREIGN KEY ("disclosure_id") REFERENCES "public"."ip_disclosure"("disclosure_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" ADD CONSTRAINT "copyright_transaction_part2_copyright_id_fkey" FOREIGN KEY ("copyright_id") REFERENCES "public"."copyright_basic_application"("copyright_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copyright_work_creation" ADD CONSTRAINT "copyright_work_creation_transaction_detail_id_fkey" FOREIGN KEY ("transaction_detail_id") REFERENCES "public"."copyright_transaction_part2"("transaction_detail_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "digital_signature" ADD CONSTRAINT "digital_signature_signer_id_fkey" FOREIGN KEY ("signer_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_management" ADD CONSTRAINT "document_management_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."ip_application"("application_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_management" ADD CONSTRAINT "document_management_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "public"."application_phase"("phase_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_management" ADD CONSTRAINT "document_management_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_management" ADD CONSTRAINT "document_management_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."ip_application"("application_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "public"."application_phase"("phase_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_participant" ADD CONSTRAINT "event_participant_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."calendar_event"("event_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_participant" ADD CONSTRAINT "event_participant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_collaboration" ADD CONSTRAINT "external_collaboration_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "public"."application_phase"("phase_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_validation" ADD CONSTRAINT "internal_validation_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_validation" ADD CONSTRAINT "internal_validation_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("document_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_validation" ADD CONSTRAINT "internal_validation_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "public"."application_phase"("phase_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ip_application" ADD CONSTRAINT "ip_application_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."client_profile"("client_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ip_application" ADD CONSTRAINT "ip_application_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ip_contributors" ADD CONSTRAINT "ip_contributors_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."ip_application"("application_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ip_details" ADD CONSTRAINT "ip_details_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."ip_application"("application_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ip_disclosure" ADD CONSTRAINT "ip_disclosure_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."client_profile"("client_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matrix_feature" ADD CONSTRAINT "matrix_feature_matrix_id_fkey" FOREIGN KEY ("matrix_id") REFERENCES "public"."patent_matrix"("matrix_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matrix_prior_art" ADD CONSTRAINT "matrix_prior_art_matrix_id_fkey" FOREIGN KEY ("matrix_id") REFERENCES "public"."patent_matrix"("matrix_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patent_basic_application" ADD CONSTRAINT "patent_basic_application_disclosure_id_fkey" FOREIGN KEY ("disclosure_id") REFERENCES "public"."ip_disclosure"("disclosure_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patent_matrix" ADD CONSTRAINT "patent_matrix_patent_id_fkey" FOREIGN KEY ("patent_id") REFERENCES "public"."patent_basic_application"("patent_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_reminder" ADD CONSTRAINT "phase_reminder_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "public"."application_phase"("phase_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_review" ADD CONSTRAINT "phase_review_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "public"."application_phase"("phase_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_review" ADD CONSTRAINT "phase_review_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_review_attachment" ADD CONSTRAINT "phase_review_attachment_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "public"."phase_review"("review_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_task" ADD CONSTRAINT "phase_task_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_task" ADD CONSTRAINT "phase_task_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "public"."application_phase"("phase_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_assignment" ADD CONSTRAINT "task_assignment_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_assignment" ADD CONSTRAINT "task_assignment_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."phase_task"("task_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_activity_log_application" ON "activity_log" USING btree ("application_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_activity_log_phase" ON "activity_log" USING btree ("phase_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_activity_log_user" ON "activity_log" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "ix_activity_log_application" ON "activity_log" USING btree ("application_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "ix_activity_log_phase" ON "activity_log" USING btree ("phase_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "ix_activity_log_user" ON "activity_log" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_phase_application_id" ON "application_phase" USING btree ("application_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_phase_status" ON "application_phase" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_documents_validation" ON "documents" USING btree ("validation_status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_ip_application_type" ON "ip_application" USING btree ("ip_type" text_ops);--> statement-breakpoint
CREATE INDEX "ix_ip_application_status" ON "ip_application" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "ix_ip_application_type" ON "ip_application" USING btree ("ip_type" text_ops);--> statement-breakpoint
CREATE INDEX "ix_ip_application_user" ON "ip_application" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_phase_review_date" ON "phase_review" USING btree ("review_date" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_phase_review_phase_id" ON "phase_review" USING btree ("phase_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_phase_review_reviewer" ON "phase_review" USING btree ("reviewer_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_phase_review_status" ON "phase_review" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_task_phase_id" ON "phase_task" USING btree ("phase_id" uuid_ops);