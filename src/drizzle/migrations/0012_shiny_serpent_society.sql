DO $$ BEGIN CREATE TYPE "public"."activity_type" AS ENUM('update', 'comment', 'status_change'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."application_status" AS ENUM('draft', 'pending', 'in_progress', 'approved', 'rejected', 'completed', 'archived'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."application_type" AS ENUM('patent', 'copyright', 'trademark', 'utility_model'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."ip_disclosure_status" AS ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected', 'needs_revision'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."user_role" AS ENUM('admin', 'ttlo_staff', 'client'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "account" (
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
CREATE TABLE IF NOT EXISTS "activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"phase_id" uuid,
	"user_id" uuid NOT NULL,
	"activity_type" "activity_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "application_phase" (
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
	CONSTRAINT "ck_phase_progress" CHECK ((progress >= 0) AND (progress <= 100)),
	CONSTRAINT "ck_phase_status" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'active'::character varying, 'completed'::character varying, 'blocked'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "archives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"archive_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"archive_reason" text,
	"archived_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "authenticator" (
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
CREATE TABLE IF NOT EXISTS "calendar_event" (
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
CREATE TABLE IF NOT EXISTS "client_profile" (
	"client_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"first_name" varchar(100) NOT NULL,
	"middle_name" varchar(100),
	"last_name" varchar(100) NOT NULL,
	"contact_number" varchar(20),
	"email" varchar(255) NOT NULL,
	"mailing_address" text,
	"company_name" varchar(255),
	"company_email" varchar(255),
	"occupation" varchar(255),
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"age" integer,
	"company_street" text,
	"company_barangay" text,
	"company_city_municipality" text,
	"company_province" text,
	"degree" varchar(255),
	"profession" varchar(255),
	"published_research" jsonb DEFAULT '{"value":"no"}'::jsonb,
	"developed_materials" jsonb DEFAULT '{"value":"no"}'::jsonb,
	"ip_experience" jsonb,
	"status" varchar(20) DEFAULT 'draft',
	"gender" jsonb,
	"citizenship" jsonb,
	"highest_degree" jsonb,
	"familiar_with_ip_rights" jsonb,
	CONSTRAINT "check_citizenship_jsonb" CHECK ((citizenship ->> 'value'::text) = ANY (ARRAY['filipino'::text, 'other'::text])),
	CONSTRAINT "check_gender_jsonb" CHECK ((gender ->> 'value'::text) = ANY (ARRAY['male'::text, 'female'::text, 'prefer_not_to_say'::text])),
	CONSTRAINT "check_highest_degree_jsonb" CHECK ((highest_degree ->> 'value'::text) = ANY (ARRAY['bachelor'::text, 'master'::text, 'doctorate'::text, 'other'::text])),
	CONSTRAINT "client_profile_age_check" CHECK (age > 0)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "client_profile_backup" (
	"client_id" uuid,
	"user_id" uuid,
	"first_name" varchar(100),
	"middle_name" varchar(100),
	"last_name" varchar(100),
	"contact_number" varchar(20),
	"email" varchar(255),
	"mailing_address" text,
	"company_name" varchar(255),
	"company_email" varchar(255),
	"occupation" varchar(255),
	"created_at" timestamp,
	"updated_at" timestamp,
	"age" integer,
	"company_street" text,
	"company_barangay" text,
	"company_city_municipality" text,
	"company_province" text,
	"degree" varchar(255),
	"profession" varchar(255),
	"published_research" varchar(20),
	"developed_materials" varchar(20),
	"ip_experience" jsonb,
	"status" varchar(20),
	"gender" jsonb,
	"citizenship" jsonb,
	"highest_degree" jsonb,
	"familiar_with_ip_rights" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "comment" (
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
CREATE TABLE IF NOT EXISTS "contact_message" (
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
CREATE TABLE IF NOT EXISTS "copyright_basic_application" (
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
CREATE TABLE IF NOT EXISTS "copyright_transaction_part1" (
	"transaction_part1_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"disclosure_id" uuid NOT NULL,
	"copyright_id" uuid NOT NULL,
	"transaction_data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "copyright_transaction_part2" (
	"transaction_part2_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"disclosure_id" uuid NOT NULL,
	"copyright_id" uuid NOT NULL,
	"transaction_details" jsonb DEFAULT '{"ipsoRegion":"","applicantType":{"heir":false,"agent":false,"licensee":false,"newOwner":false,"copyrightClaimant":false},"bulkFilingQty":"","transactionType":{"recordation":false,"resaleRights":false,"anonymousWork":false,"certifiedCopy":false,"reconstitution":false,"correctionEntry":false},"otherCertifications":"","numberOfCertificates":""}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"is_copyright_registration" boolean DEFAULT false,
	"filing_method" varchar(50),
	"filing_type" varchar(50),
	"applicant_info" jsonb DEFAULT '{"personalInfo":{"sex":null,"address":"","surname":"","zipCode":"","firstName":"","middleName":"","civilStatus":null,"dateOfBirth":null,"nationality":"","emailAddress":"","mobileNumber":"","provinceState":"","municipalityCity":"","countryOfResidence":""},"applicantType":{"heir":false,"agent":false,"licensee":false,"newOwner":false,"authorCreator":false,"copyrightClaimant":false}}'::jsonb NOT NULL,
	"author_info" jsonb DEFAULT '{"personalInfo":{"sex":null,"address":"","surname":"","zipCode":"","firstName":"","middleName":"","civilStatus":null,"dateOfBirth":null,"nationality":"","emailAddress":"","mobileNumber":"","provinceState":"","municipalityCity":"","countryOfResidence":""},"isSameAsApplicant":false}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "deed_of_assignment" (
	"deed_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"research_title" varchar(255),
	"creators" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"creator_address" text,
	"assignee_name" varchar(255) DEFAULT 'CARAGA STATE UNIVERSITY',
	"assignee_representative" varchar(255) DEFAULT 'ROLYN C. DAGUIL, Ph.D.',
	"day" varchar(10),
	"month" varchar(20),
	"year" varchar(10),
	"assignee_id" varchar(50) DEFAULT 'M98 – 009',
	"assignee_date" varchar(50),
	"assignee_place" varchar(100) DEFAULT 'Butuan City',
	"notarized_document_path" varchar(255),
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"status" varchar(20) DEFAULT 'draft',
	"metadata" jsonb,
	"assignor_id" varchar(50),
	"assignor_date" varchar(50),
	"assignor_place" varchar(100) DEFAULT 'Butuan City',
	CONSTRAINT "deed_of_assignment_status_check" CHECK ((status)::text = ANY ((ARRAY['draft'::character varying, 'submitted'::character varying, 'approved'::character varying, 'rejected'::character varying, 'pending_revision'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "digital_signature" (
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
CREATE TABLE IF NOT EXISTS "disclosure_confirmation" (
	"confirmation_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"disclosure_id" uuid NOT NULL,
	"written_disclosures" jsonb DEFAULT '{"past":false,"planned":false,"notApplicable":false}'::jsonb NOT NULL,
	"oral_disclosures" jsonb DEFAULT '{"past":false,"planned":false,"notApplicable":false}'::jsonb NOT NULL,
	"future_work" text,
	"confirmation_declaration" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "document_management" (
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
CREATE TABLE IF NOT EXISTS "documents" (
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
CREATE TABLE IF NOT EXISTS "event_participant" (
	"event_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" varchar(50) DEFAULT 'pending',
	CONSTRAINT "event_participant_pkey" PRIMARY KEY("event_id","user_id"),
	CONSTRAINT "event_participant_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'declined'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "external_collaboration" (
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
CREATE TABLE IF NOT EXISTS "internal_validation" (
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
CREATE TABLE IF NOT EXISTS "ip_application" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"ip_type" "application_type" NOT NULL,
	"status" "application_status" DEFAULT 'draft',
	"progress" integer DEFAULT 0,
	"inventors" text[],
	"technical_field" text[],
	"keywords" text[],
	"research_field" varchar(255),
	"department" varchar(255),
	"faculty" varchar(255),
	"funding_source" varchar(255),
	"funding_type" varchar(100),
	"grant_number" varchar(100),
	"commercialization_status" varchar(50) DEFAULT 'not_licensed',
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "ck_commercialization" CHECK ((commercialization_status)::text = ANY ((ARRAY['not_licensed'::character varying, 'licensed'::character varying, 'in_negotiation'::character varying, 'technology_transfer'::character varying, 'internal_use'::character varying])::text[])),
	CONSTRAINT "ck_progress" CHECK ((progress >= 0) AND (progress <= 100))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ip_contributors" (
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
CREATE TABLE IF NOT EXISTS "ip_details" (
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
CREATE TABLE IF NOT EXISTS "ip_disclosure" (
	"disclosure_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid,
	"is_rightful_owner" boolean DEFAULT false,
	"selected_ip_types" jsonb,
	"status" varchar(50) DEFAULT 'draft',
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"email" varchar(255),
	"authorized_representative" varchar(255),
	"other_ip_type" varchar(255)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ip_disclosure_applicant" (
	"applicant_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"disclosure_id" uuid NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"middle_initial" varchar(10),
	"last_name" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ip_disclosure_attachment" (
	"attachment_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"disclosure_id" uuid NOT NULL,
	"ip_type" "application_type" NOT NULL,
	"file_path" text NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_type" varchar(50) NOT NULL,
	"file_size" integer NOT NULL,
	"description" text,
	"uploaded_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ip_disclosure_inventor" (
	"inventor_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"disclosure_id" uuid NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"middle_initial" varchar(10),
	"last_name" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ip_disclosure_review" (
	"review_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"disclosure_id" uuid NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"status" varchar(50) NOT NULL,
	"comments" text,
	"review_date" timestamp DEFAULT CURRENT_TIMESTAMP,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "ip_disclosure_review_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'needs_revision'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification" (
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
CREATE TABLE IF NOT EXISTS "patent_matrix_sample" (
	"matrix_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"disclosure_id" uuid NOT NULL,
	"patent_id" uuid NOT NULL,
	"invention_title" text NOT NULL,
	"prior_arts" jsonb NOT NULL,
	"features" jsonb NOT NULL,
	"matrix_data" jsonb NOT NULL,
	"analysis_summary" text NOT NULL,
	"conclusion" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "patent_search_report" (
	"search_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"disclosure_id" uuid NOT NULL,
	"patent_id" uuid NOT NULL,
	"search_strings" jsonb NOT NULL,
	"relevant_documents" jsonb NOT NULL,
	"search_databases" text[] NOT NULL,
	"search_date" date NOT NULL,
	"search_summary" text NOT NULL,
	"certification" jsonb DEFAULT '{"submittedTo":{"name":"","position":"Director, TILO Manager, ITSO"},"certifierName":"","certifierPosition":"Director, TILO Manager, ITSO"}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "patent_utility_model_application" (
	"patent_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"disclosure_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"technology_type" jsonb DEFAULT '{"process":false,"product":false,"material":false,"software":false}'::jsonb NOT NULL,
	"technology_field" jsonb DEFAULT '{"other":false,"chemical":false,"computer":false,"electrical":false,"mechanical":false,"biotechnology":false,"pharmaceutical":false}'::jsonb NOT NULL,
	"problem" text NOT NULL,
	"solution" text NOT NULL,
	"comparison" text NOT NULL,
	"novelty" text NOT NULL,
	"variations" text,
	"usage" text NOT NULL,
	"references" text,
	"own_publications" text,
	"files" jsonb,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "patent_utility_model_application_type_check" CHECK ((type)::text = ANY ((ARRAY['patent'::character varying, 'utility_model'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "phase_reminder" (
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
CREATE TABLE IF NOT EXISTS "phase_review" (
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
CREATE TABLE IF NOT EXISTS "phase_review_attachment" (
	"attachment_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid,
	"file_path" text NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_type" varchar(50) NOT NULL,
	"file_size" integer NOT NULL,
	"uploaded_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "phase_task" (
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
CREATE TABLE IF NOT EXISTS "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "substantial_use" (
	"substantial_use_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"research_title" varchar(255) NOT NULL,
	"applicants" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"laboratory_facilities" jsonb NOT NULL,
	"funding_resources" jsonb NOT NULL,
	"remarks" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"status" varchar(20) DEFAULT 'draft',
	CONSTRAINT "substantial_use_status_check" CHECK ((status)::text = ANY ((ARRAY['draft'::character varying, 'submitted'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "task_assignment" (
	"assignment_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"staff_id" uuid NOT NULL,
	"assigned_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"status" varchar(50) DEFAULT 'pending',
	CONSTRAINT "task_assignment_task_id_staff_id_key" UNIQUE("task_id","staff_id"),
	CONSTRAINT "task_assignment_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'completed'::character varying, 'rejected'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trade_secret_application" (
	"trade_secret_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"disclosure_id" uuid NOT NULL,
	"description" text NOT NULL,
	"confidentiality_measures" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trademark_application" (
	"trademark_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"disclosure_id" uuid NOT NULL,
	"trademark_name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"translation" text,
	"nice_classifications" text[] NOT NULL,
	"business_type" jsonb DEFAULT '{"company":false,"soleProprietor":false}'::jsonb NOT NULL,
	"legal_name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"role" "user_role" DEFAULT 'client',
	"is_active" boolean DEFAULT true,
	"image" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"emailVerified" timestamp,
	CONSTRAINT "user_account_email_key" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" DROP CONSTRAINT IF EXISTS "account_userId_user_id_fk";--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" DROP CONSTRAINT IF EXISTS "fk_activity_log_application";--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "fk_activity_log_application" FOREIGN KEY ("application_id") REFERENCES "public"."ip_application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" DROP CONSTRAINT IF EXISTS "fk_activity_log_phase";--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "fk_activity_log_phase" FOREIGN KEY ("phase_id") REFERENCES "public"."application_phase"("phase_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" DROP CONSTRAINT IF EXISTS "fk_activity_log_user";--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "fk_activity_log_user" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_phase" DROP CONSTRAINT IF EXISTS "fk_phase_application";--> statement-breakpoint
ALTER TABLE "application_phase" ADD CONSTRAINT "fk_phase_application" FOREIGN KEY ("application_id") REFERENCES "public"."ip_application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "archives" DROP CONSTRAINT IF EXISTS "fk_archive_application";--> statement-breakpoint
ALTER TABLE "archives" ADD CONSTRAINT "fk_archive_application" FOREIGN KEY ("application_id") REFERENCES "public"."ip_application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "archives" DROP CONSTRAINT IF EXISTS "fk_archive_user";--> statement-breakpoint
ALTER TABLE "archives" ADD CONSTRAINT "fk_archive_user" FOREIGN KEY ("archived_by") REFERENCES "public"."user_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authenticator" DROP CONSTRAINT IF EXISTS "authenticator_userId_user_id_fk";--> statement-breakpoint
ALTER TABLE "authenticator" ADD CONSTRAINT "authenticator_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_event" DROP CONSTRAINT IF EXISTS "calendar_event_application_id_fkey";--> statement-breakpoint
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."ip_application"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_event" DROP CONSTRAINT IF EXISTS "calendar_event_created_by_fkey";--> statement-breakpoint
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_event" DROP CONSTRAINT IF EXISTS "calendar_event_phase_id_fkey";--> statement-breakpoint
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "public"."application_phase"("phase_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_profile" DROP CONSTRAINT IF EXISTS "client_profile_user_id_fkey";--> statement-breakpoint
ALTER TABLE "client_profile" ADD CONSTRAINT "client_profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment" DROP CONSTRAINT IF EXISTS "comment_parent_id_fkey";--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."comment"("comment_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment" DROP CONSTRAINT IF EXISTS "comment_user_id_fkey";--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_message" DROP CONSTRAINT IF EXISTS "contact_message_assigned_to_fkey";--> statement-breakpoint
ALTER TABLE "contact_message" ADD CONSTRAINT "contact_message_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copyright_basic_application" DROP CONSTRAINT IF EXISTS "copyright_basic_application_disclosure_id_fkey";--> statement-breakpoint
ALTER TABLE "copyright_basic_application" ADD CONSTRAINT "copyright_basic_application_disclosure_id_fkey" FOREIGN KEY ("disclosure_id") REFERENCES "public"."ip_disclosure"("disclosure_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copyright_transaction_part1" DROP CONSTRAINT IF EXISTS "copyright_transaction_part1_copyright_id_fkey";--> statement-breakpoint
ALTER TABLE "copyright_transaction_part1" ADD CONSTRAINT "copyright_transaction_part1_copyright_id_fkey" FOREIGN KEY ("copyright_id") REFERENCES "public"."copyright_basic_application"("copyright_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copyright_transaction_part1" DROP CONSTRAINT IF EXISTS "copyright_transaction_part1_disclosure_id_fkey";--> statement-breakpoint
ALTER TABLE "copyright_transaction_part1" ADD CONSTRAINT "copyright_transaction_part1_disclosure_id_fkey" FOREIGN KEY ("disclosure_id") REFERENCES "public"."ip_disclosure"("disclosure_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" DROP CONSTRAINT IF EXISTS "copyright_transaction_part2_copyright_id_fkey";--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" ADD CONSTRAINT "copyright_transaction_part2_copyright_id_fkey" FOREIGN KEY ("copyright_id") REFERENCES "public"."copyright_basic_application"("copyright_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" DROP CONSTRAINT IF EXISTS "copyright_transaction_part2_disclosure_id_fkey";--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" ADD CONSTRAINT "copyright_transaction_part2_disclosure_id_fkey" FOREIGN KEY ("disclosure_id") REFERENCES "public"."ip_disclosure"("disclosure_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deed_of_assignment" DROP CONSTRAINT IF EXISTS "deed_of_assignment_user_id_fkey";--> statement-breakpoint
ALTER TABLE "deed_of_assignment" ADD CONSTRAINT "deed_of_assignment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "digital_signature" DROP CONSTRAINT IF EXISTS "digital_signature_signer_id_fkey";--> statement-breakpoint
ALTER TABLE "digital_signature" ADD CONSTRAINT "digital_signature_signer_id_fkey" FOREIGN KEY ("signer_id") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disclosure_confirmation" DROP CONSTRAINT IF EXISTS "disclosure_confirmation_disclosure_id_fkey";--> statement-breakpoint
ALTER TABLE "disclosure_confirmation" ADD CONSTRAINT "disclosure_confirmation_disclosure_id_fkey" FOREIGN KEY ("disclosure_id") REFERENCES "public"."ip_disclosure"("disclosure_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_management" DROP CONSTRAINT IF EXISTS "document_management_application_id_fkey";--> statement-breakpoint
ALTER TABLE "document_management" ADD CONSTRAINT "document_management_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."ip_application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_management" DROP CONSTRAINT IF EXISTS "document_management_phase_id_fkey";--> statement-breakpoint
ALTER TABLE "document_management" ADD CONSTRAINT "document_management_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "public"."application_phase"("phase_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_management" DROP CONSTRAINT IF EXISTS "document_management_uploaded_by_fkey";--> statement-breakpoint
ALTER TABLE "document_management" ADD CONSTRAINT "document_management_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_management" DROP CONSTRAINT IF EXISTS "document_management_verified_by_fkey";--> statement-breakpoint
ALTER TABLE "document_management" ADD CONSTRAINT "document_management_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "documents_application_id_fkey";--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."ip_application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "documents_phase_id_fkey";--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "public"."application_phase"("phase_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "documents_uploaded_by_fkey";--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "documents_validated_by_fkey";--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "documents_verified_by_fkey";--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "public"."user_account"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_participant" DROP CONSTRAINT IF EXISTS "event_participant_event_id_fkey";--> statement-breakpoint
ALTER TABLE "event_participant" ADD CONSTRAINT "event_participant_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."calendar_event"("event_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_participant" DROP CONSTRAINT IF EXISTS "event_participant_user_id_fkey";--> statement-breakpoint
ALTER TABLE "event_participant" ADD CONSTRAINT "event_participant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_collaboration" DROP CONSTRAINT IF EXISTS "external_collaboration_phase_id_fkey";--> statement-breakpoint
ALTER TABLE "external_collaboration" ADD CONSTRAINT "external_collaboration_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "public"."application_phase"("phase_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_validation" DROP CONSTRAINT IF EXISTS "internal_validation_assigned_to_fkey";--> statement-breakpoint
ALTER TABLE "internal_validation" ADD CONSTRAINT "internal_validation_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_validation" DROP CONSTRAINT IF EXISTS "internal_validation_document_id_fkey";--> statement-breakpoint
ALTER TABLE "internal_validation" ADD CONSTRAINT "internal_validation_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("document_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_validation" DROP CONSTRAINT IF EXISTS "internal_validation_phase_id_fkey";--> statement-breakpoint
ALTER TABLE "internal_validation" ADD CONSTRAINT "internal_validation_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "public"."application_phase"("phase_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ip_application" DROP CONSTRAINT IF EXISTS "fk_application_user";--> statement-breakpoint
ALTER TABLE "ip_application" ADD CONSTRAINT "fk_application_user" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ip_contributors" DROP CONSTRAINT IF EXISTS "ip_contributors_application_id_fkey";--> statement-breakpoint
ALTER TABLE "ip_contributors" ADD CONSTRAINT "ip_contributors_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."ip_application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ip_details" DROP CONSTRAINT IF EXISTS "ip_details_application_id_fkey";--> statement-breakpoint
ALTER TABLE "ip_details" ADD CONSTRAINT "ip_details_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."ip_application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ip_disclosure" DROP CONSTRAINT IF EXISTS "ip_disclosure_client_id_fkey";--> statement-breakpoint
ALTER TABLE "ip_disclosure" ADD CONSTRAINT "ip_disclosure_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ip_disclosure_applicant" DROP CONSTRAINT IF EXISTS "ip_disclosure_applicant_disclosure_id_fkey";--> statement-breakpoint
ALTER TABLE "ip_disclosure_applicant" ADD CONSTRAINT "ip_disclosure_applicant_disclosure_id_fkey" FOREIGN KEY ("disclosure_id") REFERENCES "public"."ip_disclosure"("disclosure_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ip_disclosure_attachment" DROP CONSTRAINT IF EXISTS "ip_disclosure_attachment_disclosure_id_fkey";--> statement-breakpoint
ALTER TABLE "ip_disclosure_attachment" ADD CONSTRAINT "ip_disclosure_attachment_disclosure_id_fkey" FOREIGN KEY ("disclosure_id") REFERENCES "public"."ip_disclosure"("disclosure_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ip_disclosure_inventor" DROP CONSTRAINT IF EXISTS "ip_disclosure_inventor_disclosure_id_fkey";--> statement-breakpoint
ALTER TABLE "ip_disclosure_inventor" ADD CONSTRAINT "ip_disclosure_inventor_disclosure_id_fkey" FOREIGN KEY ("disclosure_id") REFERENCES "public"."ip_disclosure"("disclosure_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ip_disclosure_review" DROP CONSTRAINT IF EXISTS "ip_disclosure_review_disclosure_id_fkey";--> statement-breakpoint
ALTER TABLE "ip_disclosure_review" ADD CONSTRAINT "ip_disclosure_review_disclosure_id_fkey" FOREIGN KEY ("disclosure_id") REFERENCES "public"."ip_disclosure"("disclosure_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ip_disclosure_review" DROP CONSTRAINT IF EXISTS "ip_disclosure_review_reviewer_id_fkey";--> statement-breakpoint
ALTER TABLE "ip_disclosure_review" ADD CONSTRAINT "ip_disclosure_review_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."user_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" DROP CONSTRAINT IF EXISTS "notification_user_id_fkey";--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patent_matrix_sample" DROP CONSTRAINT IF EXISTS "patent_matrix_sample_disclosure_id_fkey";--> statement-breakpoint
ALTER TABLE "patent_matrix_sample" ADD CONSTRAINT "patent_matrix_sample_disclosure_id_fkey" FOREIGN KEY ("disclosure_id") REFERENCES "public"."ip_disclosure"("disclosure_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patent_matrix_sample" DROP CONSTRAINT IF EXISTS "patent_matrix_sample_patent_id_fkey";--> statement-breakpoint
ALTER TABLE "patent_matrix_sample" ADD CONSTRAINT "patent_matrix_sample_patent_id_fkey" FOREIGN KEY ("patent_id") REFERENCES "public"."patent_utility_model_application"("patent_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patent_search_report" DROP CONSTRAINT IF EXISTS "patent_search_report_disclosure_id_fkey";--> statement-breakpoint
ALTER TABLE "patent_search_report" ADD CONSTRAINT "patent_search_report_disclosure_id_fkey" FOREIGN KEY ("disclosure_id") REFERENCES "public"."ip_disclosure"("disclosure_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patent_search_report" DROP CONSTRAINT IF EXISTS "patent_search_report_patent_id_fkey";--> statement-breakpoint
ALTER TABLE "patent_search_report" ADD CONSTRAINT "patent_search_report_patent_id_fkey" FOREIGN KEY ("patent_id") REFERENCES "public"."patent_utility_model_application"("patent_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patent_utility_model_application" DROP CONSTRAINT IF EXISTS "patent_utility_model_application_disclosure_id_fkey";--> statement-breakpoint
ALTER TABLE "patent_utility_model_application" ADD CONSTRAINT "patent_utility_model_application_disclosure_id_fkey" FOREIGN KEY ("disclosure_id") REFERENCES "public"."ip_disclosure"("disclosure_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_reminder" DROP CONSTRAINT IF EXISTS "phase_reminder_phase_id_fkey";--> statement-breakpoint
ALTER TABLE "phase_reminder" ADD CONSTRAINT "phase_reminder_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "public"."application_phase"("phase_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_review" DROP CONSTRAINT IF EXISTS "phase_review_phase_id_fkey";--> statement-breakpoint
ALTER TABLE "phase_review" ADD CONSTRAINT "phase_review_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "public"."application_phase"("phase_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_review" DROP CONSTRAINT IF EXISTS "phase_review_reviewer_id_fkey";--> statement-breakpoint
ALTER TABLE "phase_review" ADD CONSTRAINT "phase_review_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."user_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_review_attachment" DROP CONSTRAINT IF EXISTS "phase_review_attachment_review_id_fkey";--> statement-breakpoint
ALTER TABLE "phase_review_attachment" ADD CONSTRAINT "phase_review_attachment_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "public"."phase_review"("review_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_task" DROP CONSTRAINT IF EXISTS "phase_task_assignee_id_fkey";--> statement-breakpoint
ALTER TABLE "phase_task" ADD CONSTRAINT "phase_task_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_task" DROP CONSTRAINT IF EXISTS "phase_task_phase_id_fkey";--> statement-breakpoint
ALTER TABLE "phase_task" ADD CONSTRAINT "phase_task_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "public"."application_phase"("phase_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" DROP CONSTRAINT IF EXISTS "session_userId_user_id_fk";--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "substantial_use" DROP CONSTRAINT IF EXISTS "substantial_use_user_id_fkey";--> statement-breakpoint
ALTER TABLE "substantial_use" ADD CONSTRAINT "substantial_use_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_assignment" DROP CONSTRAINT IF EXISTS "task_assignment_staff_id_fkey";--> statement-breakpoint
ALTER TABLE "task_assignment" ADD CONSTRAINT "task_assignment_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_assignment" DROP CONSTRAINT IF EXISTS "task_assignment_task_id_fkey";--> statement-breakpoint
ALTER TABLE "task_assignment" ADD CONSTRAINT "task_assignment_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."phase_task"("task_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_secret_application" DROP CONSTRAINT IF EXISTS "trade_secret_application_disclosure_id_fkey";--> statement-breakpoint
ALTER TABLE "trade_secret_application" ADD CONSTRAINT "trade_secret_application_disclosure_id_fkey" FOREIGN KEY ("disclosure_id") REFERENCES "public"."ip_disclosure"("disclosure_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trademark_application" DROP CONSTRAINT IF EXISTS "trademark_application_disclosure_id_fkey";--> statement-breakpoint
ALTER TABLE "trademark_application" ADD CONSTRAINT "trademark_application_disclosure_id_fkey" FOREIGN KEY ("disclosure_id") REFERENCES "public"."ip_disclosure"("disclosure_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_activity_log_application" ON "activity_log" USING btree ("application_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_activity_log_phase" ON "activity_log" USING btree ("phase_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_activity_log_user" ON "activity_log" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ix_activity_log_application" ON "activity_log" USING btree ("application_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ix_activity_log_phase" ON "activity_log" USING btree ("phase_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ix_activity_log_user" ON "activity_log" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_phase_application_id" ON "application_phase" USING btree ("application_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_phase_status" ON "application_phase" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_client_profile_email" ON "client_profile" USING btree ("email" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_client_profile_user" ON "client_profile" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_deed_of_assignment_status" ON "deed_of_assignment" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_deed_of_assignment_user" ON "deed_of_assignment" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_documents_validation" ON "documents" USING btree ("validation_status" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ip_application_type" ON "ip_application" USING btree ("ip_type" enum_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ix_ip_application_status" ON "ip_application" USING btree ("status" enum_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ix_ip_application_type" ON "ip_application" USING btree ("ip_type" enum_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ix_ip_application_user" ON "ip_application" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ip_disclosure_client" ON "ip_disclosure" USING btree ("client_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ip_disclosure_status" ON "ip_disclosure" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_patent_matrix_sample_disclosure_id" ON "patent_matrix_sample" USING btree ("disclosure_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_patent_matrix_sample_patent_id" ON "patent_matrix_sample" USING btree ("patent_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_phase_review_date" ON "phase_review" USING btree ("review_date" timestamp_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_phase_review_phase_id" ON "phase_review" USING btree ("phase_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_phase_review_reviewer" ON "phase_review" USING btree ("reviewer_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_phase_review_status" ON "phase_review" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_task_phase_id" ON "phase_task" USING btree ("phase_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_substantial_use_status" ON "substantial_use" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_substantial_use_user" ON "substantial_use" USING btree ("user_id" uuid_ops);