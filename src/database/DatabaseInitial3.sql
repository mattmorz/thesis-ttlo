--==============================================================
-- Drop existing objects
--==============================================================
DO $$ 
BEGIN
    -- Drop existing enums if they exist
    DROP TYPE IF EXISTS user_role CASCADE;
    DROP TYPE IF EXISTS application_type CASCADE;
    DROP TYPE IF EXISTS application_status CASCADE;
    DROP TYPE IF EXISTS activity_type CASCADE;

    -- Drop tables if they exist (in reverse order of dependencies)
    DROP TABLE IF EXISTS "event_participant" CASCADE;
    DROP TABLE IF EXISTS "auth_session" CASCADE;
    DROP TABLE IF EXISTS "verification_token" CASCADE;
    DROP TABLE IF EXISTS "session" CASCADE;
    DROP TABLE IF EXISTS "account" CASCADE;
    DROP TABLE IF EXISTS "phase_review_attachment" CASCADE;
    DROP TABLE IF EXISTS "phase_review" CASCADE;
    DROP TABLE IF EXISTS "task_assignment" CASCADE;
    DROP TABLE IF EXISTS "phase_task" CASCADE;
    DROP TABLE IF EXISTS "phase_reminder" CASCADE;
    DROP TABLE IF EXISTS "application_phase" CASCADE;
    DROP TABLE IF EXISTS "activity_log" CASCADE;
    DROP TABLE IF EXISTS "documents" CASCADE;
    DROP TABLE IF EXISTS "document_management" CASCADE;
    DROP TABLE IF EXISTS "digital_signature" CASCADE;
    DROP TABLE IF EXISTS "contact_message" CASCADE;
    DROP TABLE IF EXISTS "notification" CASCADE;
    DROP TABLE IF EXISTS "comment" CASCADE;
    DROP TABLE IF EXISTS "ip_contributors" CASCADE;
    DROP TABLE IF EXISTS "ip_details" CASCADE;
    DROP TABLE IF EXISTS "ip_application" CASCADE;
    DROP TABLE IF EXISTS "matrix_feature" CASCADE;
    DROP TABLE IF EXISTS "matrix_prior_art" CASCADE;
    DROP TABLE IF EXISTS "patent_matrix" CASCADE;
    DROP TABLE IF EXISTS "patent_basic_application" CASCADE;
    DROP TABLE IF EXISTS "copyright_author_creator" CASCADE;
    DROP TABLE IF EXISTS "copyright_applicant" CASCADE;
    DROP TABLE IF EXISTS "copyright_work_creation" CASCADE;
    DROP TABLE IF EXISTS "copyright_transaction_part2" CASCADE;
    DROP TABLE IF EXISTS "copyright_basic_application" CASCADE;
    DROP TABLE IF EXISTS "ip_disclosure" CASCADE;
    DROP TABLE IF EXISTS "client_profile" CASCADE;
    DROP TABLE IF EXISTS "user" CASCADE;
END $$;

--==============================================================
-- Create Extensions
--==============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

--==============================================================
-- Create Custom Types
--==============================================================
CREATE TYPE user_role AS ENUM ('admin', 'ttlo_staff', 'client');
CREATE TYPE application_type AS ENUM ('patent', 'copyright', 'trademark', 'utility_model');
CREATE TYPE application_status AS ENUM ('draft', 'pending', 'in_progress', 'approved', 'rejected', 'completed', 'archived', 'on-hold');
CREATE TYPE activity_type AS ENUM ('update', 'comment', 'status_change');

--==============================================================
-- Create Functions
--==============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--==============================================================
-- Core Tables
--==============================================================
-- Create base user table
CREATE TABLE "user" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "name" VARCHAR(255),
    "role" user_role DEFAULT 'client',
    "is_active" BOOLEAN DEFAULT true,
    "email_verified" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create client profile table
CREATE TABLE "client_profile" (
    "client_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID REFERENCES "user"("id") ON DELETE CASCADE,
    
    -- Personal Information
    "first_name" VARCHAR(100) NOT NULL,
    "middle_name" VARCHAR(100),
    "last_name" VARCHAR(100) NOT NULL,
    "gender" VARCHAR(20) CHECK (gender IS NULL OR gender IN ('male', 'female', 'prefer_not_to_say')),
    "age" INTEGER CHECK ((age IS NULL) OR (age >= 0 AND age <= 150)),
    "citizenship" VARCHAR(100) NOT NULL,
    "other_citizenship" VARCHAR(100),
    "contact_number" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "mailing_address" TEXT NOT NULL,
    
    -- Company Information
    "company_name" VARCHAR(255),
    "company_address" JSONB,
    "company_email" VARCHAR(255),
    "occupation" VARCHAR(255),
    
    -- Educational Background
    "highest_degree" VARCHAR(50) CHECK (highest_degree IN ('bachelor', 'master', 'doctorate', 'other')),
    "other_degree" VARCHAR(255),
    "degree_program" VARCHAR(255) NOT NULL,
    "profession" VARCHAR(255) NOT NULL,
    
    -- IP Background
    "research_output" VARCHAR(20) DEFAULT 'no' CHECK (research_output IN ('no', 'yes', 'submitted')),
    "inst_materials" VARCHAR(20) DEFAULT 'no' CHECK (inst_materials IN ('no', 'yes', 'ongoing')),
    "is_familiar_ra8293" BOOLEAN DEFAULT false,
    "has_ip_experience" BOOLEAN DEFAULT false,
    "ip_experience_types" JSONB DEFAULT '{"types": [], "otherSpecify": null}'::jsonb,
    
    CONSTRAINT "valid_ip_experience_types" CHECK (
        CASE 
            WHEN has_ip_experience = false THEN 
                COALESCE(jsonb_array_length((ip_experience_types->>'types')::jsonb), 0) = 0
            ELSE 
                COALESCE(jsonb_array_length((ip_experience_types->>'types')::jsonb), 0) > 0
        END
    ),
    
    -- Signature and Verification
    "client_signature" TEXT,
    "staff_signature" TEXT,
    "signed_at" TIMESTAMP WITH TIME ZONE,
    "verified_at" TIMESTAMP WITH TIME ZONE,
    "verified_by" UUID REFERENCES "user"("id") ON DELETE SET NULL,
    
    -- Timestamps
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create auth session table
CREATE TABLE "auth_session" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

--==============================================================
-- Create Indexes
--==============================================================
CREATE INDEX idx_client_profile_user ON client_profile(user_id);
CREATE INDEX idx_client_profile_email ON client_profile(email);
CREATE INDEX idx_client_profile_verified_by ON client_profile(verified_by);

--==============================================================
-- Create Triggers
--==============================================================
CREATE TRIGGER update_user_timestamp
    BEFORE UPDATE ON "user"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_profile_timestamp
    BEFORE UPDATE ON "client_profile"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- IP Disclosure Forms Management
-- =============================================
CREATE TABLE "ip_disclosure" (
    "disclosure_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "client_id" UUID REFERENCES "client_profile"("client_id") ON DELETE CASCADE,
    "is_rightful_owner" BOOLEAN DEFAULT false,
    "ip_types" JSONB, -- Stores selected IP types (copyright, patent, etc.)
    "status" VARCHAR(50) DEFAULT 'draft',
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Copyright Application Management
-- =============================================
CREATE TABLE "copyright_basic_application" (
    "copyright_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "disclosure_id" UUID REFERENCES "ip_disclosure"("disclosure_id") ON DELETE CASCADE,
    "work_title" VARCHAR(255) NOT NULL,
    "work_description" TEXT NOT NULL,
    "creation_date" DATE NOT NULL,
    "status" VARCHAR(50) DEFAULT 'draft',
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Copyright Transaction Part 2 Management
-- =============================================
CREATE TABLE "copyright_transaction_part2" (
    "transaction_detail_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "copyright_id" UUID REFERENCES "copyright_basic_application"("copyright_id") ON DELETE CASCADE,
    "transaction_types" JSONB NOT NULL,
    "filing_method" VARCHAR(50) CHECK (filing_method IN ('electronic', 'through_ipso')),
    "filing_type" VARCHAR(50) CHECK (filing_type IN ('single', 'bulk')),
    "number_of_copies" INTEGER DEFAULT 1,
    "ipso_region" VARCHAR(100),
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "copyright_work_creation" (
    "work_creation_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "transaction_detail_id" UUID REFERENCES "copyright_transaction_part2"("transaction_detail_id") ON DELETE CASCADE,
    "title" VARCHAR(255) NOT NULL,
    "date_of_creation" DATE NOT NULL,
    "place_of_creation" VARCHAR(255) NOT NULL,
    "classification_of_work" CHAR(1) NOT NULL,
    "is_local_submission" BOOLEAN DEFAULT true,
    "is_foreign_submission" BOOLEAN DEFAULT false,
    "is_registered" BOOLEAN DEFAULT false,
    "registered_with_ipophl" BOOLEAN DEFAULT false,
    "registered_with_nlp" BOOLEAN DEFAULT false,
    "is_published" BOOLEAN DEFAULT false,
    "publisher_info" TEXT,
    "is_derivative_work" BOOLEAN DEFAULT false,
    "original_work_info" TEXT,
    "is_indigenous_knowledge" BOOLEAN DEFAULT false,
    "indigenous_source_info" TEXT,
    "is_government_funded" BOOLEAN DEFAULT false,
    "funding_agency" VARCHAR(255),
    "is_regular_duty_work" BOOLEAN DEFAULT false,
    "employer_info" TEXT,
    "is_claiming_entire_work" BOOLEAN DEFAULT true,
    "partial_rights_details" TEXT,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "copyright_applicant" (
    "applicant_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "transaction_detail_id" UUID REFERENCES "copyright_transaction_part2"("transaction_detail_id") ON DELETE CASCADE,
    "first_name" VARCHAR(100) NOT NULL,
    "middle_name" VARCHAR(100),
    "last_name" VARCHAR(100) NOT NULL,
    "citizenship" VARCHAR(100) NOT NULL,
    "address" TEXT NOT NULL,
    "contact_number" VARCHAR(20),
    "email" VARCHAR(255) NOT NULL,
    "is_author" BOOLEAN DEFAULT false,
    "is_copyright_owner" BOOLEAN DEFAULT false,
    "is_authorized_representative" BOOLEAN DEFAULT false,
    "relationship_to_author" VARCHAR(100),
    "tin_number" VARCHAR(20),
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "copyright_author_creator" (
    "author_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "transaction_detail_id" UUID REFERENCES "copyright_transaction_part2"("transaction_detail_id") ON DELETE CASCADE,
    "is_same_as_applicant" BOOLEAN DEFAULT false,
    "applicant_id" UUID REFERENCES "copyright_applicant"("applicant_id"),
    "first_name" VARCHAR(100),
    "middle_name" VARCHAR(100),
    "last_name" VARCHAR(100),
    "pseudonym" VARCHAR(100),
    "citizenship" VARCHAR(100),
    "address" TEXT,
    "contact_number" VARCHAR(20),
    "email" VARCHAR(255),
    "contribution_type" VARCHAR(100),
    "is_deceased" BOOLEAN DEFAULT false,
    "date_of_death" DATE,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "author_details_check" CHECK (
        (is_same_as_applicant = true AND applicant_id IS NOT NULL) OR
        (is_same_as_applicant = false AND first_name IS NOT NULL AND last_name IS NOT NULL)
    )
);

-- =============================================
-- Patent Application Management
-- =============================================
CREATE TABLE "patent_basic_application" (
    "patent_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "disclosure_id" UUID REFERENCES "ip_disclosure"("disclosure_id") ON DELETE CASCADE,
    "technology_type" JSONB NOT NULL,
    "technology_field" JSONB NOT NULL,
    "invention_title" VARCHAR(255) NOT NULL,
    "technical_problem" TEXT NOT NULL,
    "technical_solution" TEXT NOT NULL,
    "technical_field" TEXT NOT NULL,
    "background_art" TEXT NOT NULL,
    "invention_summary" TEXT NOT NULL,
    "advantages" TEXT NOT NULL,
    "industrial_applicability" TEXT NOT NULL,
    "drawing_description" TEXT,
    "best_mode" TEXT,
    "own_publications" TEXT,
    "patent_type" VARCHAR(20) CHECK (patent_type IN ('patent', 'utility_model')),
    "status" VARCHAR(50) DEFAULT 'draft',
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "patent_matrix" (
    "matrix_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "patent_id" UUID REFERENCES "patent_basic_application"("patent_id") ON DELETE CASCADE,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "matrix_feature" (
    "feature_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "matrix_id" UUID REFERENCES "patent_matrix"("matrix_id") ON DELETE CASCADE,
    "feature_description" TEXT NOT NULL,
    "analysis_data" JSONB
);

CREATE TABLE "matrix_prior_art" (
    "prior_art_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "matrix_id" UUID REFERENCES "patent_matrix"("matrix_id") ON DELETE CASCADE,
    "title" VARCHAR(255) NOT NULL,
    "reference_number" VARCHAR(100),
    "publication_date" DATE,
    "relevance_description" TEXT
);

-- =============================================
-- IP Application Management (Main Table)
-- =============================================
CREATE TABLE "ip_application" (
    "application_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "ip_type" application_type NOT NULL,
    "status" application_status DEFAULT 'draft',
    "start_date" DATE,
    "end_date" DATE,
    "submission_date" DATE,
    "application_date" DATE,
    "application_number" VARCHAR(100),
    "registration_number" VARCHAR(100),
    "grant_date" DATE,
    "expiry_date" DATE,
    "progress" INTEGER DEFAULT 0,
    "substantial_use_id" UUID,
    "deed_assignment_id" UUID,
    "research_field" VARCHAR(255),
    "funding_source" VARCHAR(255),
    "funding_type" VARCHAR(100),
    "grant_number" VARCHAR(100),
    "department" VARCHAR(255),
    "faculty" VARCHAR(255),
    "research_classification" VARCHAR(100),
    "development_status" VARCHAR(100),
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "archived_at" TIMESTAMP,
    "archived_reason" TEXT,
    "inventors" TEXT[],
    "technical_field" TEXT[],
    "keywords" TEXT[],
    "commercialization_status" VARCHAR(50) DEFAULT 'not_licensed',
    CONSTRAINT "ip_type_check" CHECK (ip_type IN ('patent', 'copyright', 'trademark', 'utility_model')),
    CONSTRAINT "status_check" CHECK (status IN ('draft', 'pending', 'in_progress', 'approved', 'rejected', 'completed', 'archived', 'on-hold')),
    CONSTRAINT "progress_check" CHECK (progress >= 0 AND progress <= 100),
    CONSTRAINT "commercialization_status_check" 
        CHECK (commercialization_status IN ('not_licensed', 'licensed', 'in_negotiation', 'technology_transfer', 'internal_use')),
    FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT,
    FOREIGN KEY ("client_id") REFERENCES "client_profile"("client_id") ON DELETE RESTRICT
);

-- Application Phases (formerly project_phase)
CREATE TABLE "application_phase" (
    "phase_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "application_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" VARCHAR(50) DEFAULT 'pending',
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "progress" INTEGER DEFAULT 0,
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "phase_status_check" CHECK (status IN ('pending', 'active', 'completed', 'blocked')),
    CONSTRAINT "phase_progress_check" CHECK (progress >= 0 AND progress <= 100),
    FOREIGN KEY ("application_id") REFERENCES "ip_application"("application_id") ON DELETE CASCADE
);

-- Phase Tasks (formerly phase_subtask)
CREATE TABLE "phase_task" (
    "task_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "phase_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "priority" VARCHAR(20) NOT NULL,
    "weight" INTEGER NOT NULL,
    "due_date" DATE,
    "completed" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "assignee_id" UUID REFERENCES "user"("id"),
    "start_date" DATE,
    "status" VARCHAR(50) DEFAULT 'pending',
    CONSTRAINT "task_priority_check" CHECK (priority IN ('low', 'medium', 'high')),
    CONSTRAINT "task_weight_check" CHECK (weight >= 0 AND weight <= 100),
    CONSTRAINT "task_status_check" 
        CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')),
    FOREIGN KEY ("phase_id") REFERENCES "application_phase"("phase_id") ON DELETE CASCADE
);

-- Staff Task Assignment
CREATE TABLE "task_assignment" (
    "assignment_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "task_id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "assigned_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(50) DEFAULT 'pending',
    CONSTRAINT "task_assignment_status_check" CHECK (status IN ('pending', 'accepted', 'completed', 'rejected')),
    FOREIGN KEY ("task_id") REFERENCES "phase_task"("task_id") ON DELETE CASCADE,
    FOREIGN KEY ("staff_id") REFERENCES "user"("id") ON DELETE CASCADE,
    UNIQUE ("task_id", "staff_id")
);

-- Phase Reminders
CREATE TABLE "phase_reminder" (
    "reminder_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "phase_id" UUID REFERENCES "application_phase"("phase_id") ON DELETE CASCADE,
    "frequency" VARCHAR(20) CHECK (frequency IN ('daily', 'weekly', 'custom')),
    "custom_days" INTEGER,
    "reminder_time" TIME,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents Management
CREATE TABLE "documents" (
    "document_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "application_id" UUID NOT NULL,
    "phase_id" UUID,
    "title" VARCHAR(255) NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_type" VARCHAR(50) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "status" VARCHAR(50) DEFAULT 'pending',
    "uploaded_by" UUID NOT NULL,
    "uploaded_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "verified_by" UUID,
    "verified_at" TIMESTAMP,
    "remarks" TEXT,
    "requires_validation" BOOLEAN DEFAULT false,
    "validation_status" VARCHAR(50),
    "validation_date" TIMESTAMP,
    "validated_by" UUID REFERENCES "user"("id"),
    "validation_remarks" TEXT,
    CONSTRAINT "document_category_check" CHECK (category IN ('forms', 'attachments', 'requirements')),
    CONSTRAINT "document_status_check" CHECK (status IN ('pending', 'verified', 'rejected')),
    CONSTRAINT "document_validation_status_check" 
        CHECK (validation_status IN ('pending', 'approved', 'rejected', 'needs_revision')),
    FOREIGN KEY ("application_id") REFERENCES "ip_application"("application_id") ON DELETE CASCADE,
    FOREIGN KEY ("phase_id") REFERENCES "application_phase"("phase_id") ON DELETE SET NULL,
    FOREIGN KEY ("uploaded_by") REFERENCES "user"("id") ON DELETE RESTRICT,
    FOREIGN KEY ("verified_by") REFERENCES "user"("id") ON DELETE SET NULL
);

-- Then create internal_validation table
CREATE TABLE "internal_validation" (
    "validation_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "phase_id" UUID REFERENCES "application_phase"("phase_id") ON DELETE CASCADE,
    "document_id" UUID REFERENCES "documents"("document_id"),
    "validator_role" VARCHAR(50) CHECK (validator_role IN ('superadmin', 'director')),
    "assigned_to" UUID REFERENCES "user"("id"),
    "status" VARCHAR(20) CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    "due_date" DATE NOT NULL,
    "remarks" TEXT,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- External Office Collaboration
CREATE TABLE "external_collaboration" (
    "collaboration_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "phase_id" UUID REFERENCES "application_phase"("phase_id") ON DELETE CASCADE,
    "office" VARCHAR(255) NOT NULL,
    "contact_person" VARCHAR(255) NOT NULL,
    "task" TEXT NOT NULL,
    "status" VARCHAR(20) CHECK (status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
    "due_date" DATE NOT NULL,
    "response_required" BOOLEAN DEFAULT false,
    "remarks" TEXT,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Consolidated activity logging
CREATE TABLE "activity_log" (
    "log_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "application_id" UUID NOT NULL,
    "phase_id" UUID,
    "user_id" UUID NOT NULL,
    "activity_type" activity_type NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "activity_type_check" 
        CHECK (activity_type IN ('update', 'comment', 'status_change')),
    CONSTRAINT "fk_activity_application"
        FOREIGN KEY ("application_id") 
        REFERENCES "ip_application"("application_id") 
        ON DELETE CASCADE,
    CONSTRAINT "fk_activity_phase"
        FOREIGN KEY ("phase_id") 
        REFERENCES "application_phase"("phase_id") 
        ON DELETE SET NULL,
    CONSTRAINT "fk_activity_user"
        FOREIGN KEY ("user_id") 
        REFERENCES "user"("id") 
        ON DELETE RESTRICT
);

-- =============================================
-- Calendar & Event Management
-- =============================================
CREATE TABLE "calendar_event" (
    "event_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "start_date" TIMESTAMP NOT NULL,
    "end_date" TIMESTAMP NOT NULL,
    "event_type" VARCHAR(50) CHECK (event_type IN ('meeting', 'deadline', 'review', 'other')),
    "status" VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in-progress', 'completed', 'cancelled')),
    "priority" VARCHAR(20) CHECK (priority IN ('high', 'medium', 'low')),
    "created_by" UUID REFERENCES "user"("id"),
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "application_id" UUID REFERENCES "ip_application"("application_id") ON DELETE SET NULL,
    "phase_id" UUID REFERENCES "application_phase"("phase_id") ON DELETE SET NULL
);

CREATE TABLE "event_participant" (
    "event_id" UUID REFERENCES "calendar_event"("event_id") ON DELETE CASCADE,
    "user_id" UUID REFERENCES "user"("id") ON DELETE CASCADE,
    "status" VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    PRIMARY KEY ("event_id", "user_id")
);

-- =============================================
-- Document Management System
-- =============================================
CREATE TABLE "document_management" (
    "document_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "entity_id" UUID NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "document_type" VARCHAR(100) NOT NULL,
    "document_title" VARCHAR(255) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "status" VARCHAR(50) DEFAULT 'pending',
    "uploaded_by" UUID REFERENCES "user"("id"),
    "upload_date" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "verified_by" UUID REFERENCES "user"("id"),
    "verification_date" TIMESTAMP,
    "remarks" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "application_id" UUID REFERENCES "ip_application"("application_id") ON DELETE CASCADE,
    "phase_id" UUID REFERENCES "application_phase"("phase_id") ON DELETE SET NULL,
    CONSTRAINT "document_management_entity_type_check" CHECK (entity_type IN ('application', 'phase', 'task')),
    CONSTRAINT "document_status_check" CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- =============================================
-- Digital Signature System
-- =============================================
CREATE TABLE "digital_signature" (
    "signature_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "entity_id" UUID NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "signer_id" UUID REFERENCES "user"("id"),
    "signer_type" VARCHAR(50) NOT NULL,
    "signature_image" TEXT NOT NULL,
    "signature_date" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "ip_address" VARCHAR(45),
    "is_valid" BOOLEAN DEFAULT true,
    "verification_token" VARCHAR(255),
    "metadata" JSONB,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "digital_signature_signer_type_check" CHECK (signer_type IN ('author', 'applicant', 'representative', 'staff'))
);

-- =============================================
-- Contact & Support
-- =============================================
CREATE TABLE "contact_message" (
    "message_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "status" VARCHAR(50) DEFAULT 'pending',
    "assigned_to" UUID REFERENCES "user"("id"),
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "contact_message_status_check" CHECK (status IN ('pending', 'in-progress', 'resolved'))
);

-- =============================================
-- Comments & Discussion
-- =============================================
CREATE TABLE "comment" (
    "comment_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "user_id" UUID REFERENCES "user"("id") ON DELETE CASCADE,
    "content" TEXT NOT NULL,
    "parent_id" UUID REFERENCES "comment"("comment_id") ON DELETE CASCADE,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Notification System
-- =============================================
CREATE TABLE "notification" (
    "notification_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID REFERENCES "user"("id") ON DELETE CASCADE,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "type" VARCHAR(50),
    "status" VARCHAR(20) DEFAULT 'unread',
    "link" TEXT,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP,
    CONSTRAINT "notification_type_check" CHECK (type IN ('info', 'warning', 'success', 'error')),
    CONSTRAINT "notification_status_check" CHECK (status IN ('read', 'unread'))
);

-- =============================================
-- IP Portfolio Management
-- =============================================
CREATE TABLE "ip_contributors" (
    "contributor_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "application_id" UUID REFERENCES "ip_application"("application_id") ON DELETE CASCADE,
    "first_name" VARCHAR(100) NOT NULL,
    "middle_name" VARCHAR(100),
    "last_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255),
    "role" VARCHAR(50) CHECK (role IN ('inventor', 'author', 'applicant')),
    "is_primary" BOOLEAN DEFAULT false
);

-- IP Details based on type
CREATE TABLE "ip_details" (
    "detail_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "application_id" UUID REFERENCES "ip_application"("application_id") ON DELETE CASCADE,
    "filing_date" DATE,
    "registration_number" VARCHAR(100),
    "grant_date" DATE,
    "expiry_date" DATE,
    "jurisdiction" VARCHAR(100),
    "commercialization_status" VARCHAR(50) CHECK (commercialization_status IN ('not_licensed', 'licensed', 'in_negotiation')),
    "metadata" JSONB -- Store type-specific details (e.g., nice_classifications for trademark)
);

-- Create table for phase reviews and comments
CREATE TABLE "phase_review" (
    "review_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "phase_id" UUID NOT NULL,
    "reviewer_id" UUID NOT NULL,
    "comment" TEXT NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "rating" INTEGER CHECK (rating >= 1 AND rating <= 5),
    "review_date" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "attachments" TEXT[],
    CONSTRAINT "review_status_check" CHECK (status IN ('pending', 'approved', 'rejected', 'needs_revision')),
    FOREIGN KEY ("phase_id") REFERENCES "application_phase"("phase_id") ON DELETE CASCADE,
    FOREIGN KEY ("reviewer_id") REFERENCES "user"("id") ON DELETE RESTRICT
);

-- Create table for phase review attachments
CREATE TABLE "phase_review_attachment" (
    "attachment_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "review_id" UUID REFERENCES "phase_review"("review_id") ON DELETE CASCADE,
    "file_path" TEXT NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_type" VARCHAR(50) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "uploaded_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_phase_review_phase_id ON "phase_review"("phase_id");
CREATE INDEX IF NOT EXISTS idx_phase_review_reviewer ON "phase_review"("reviewer_id");
CREATE INDEX IF NOT EXISTS idx_phase_review_status ON "phase_review"("status");

-- Add trigger for updated_at timestamp
CREATE TRIGGER update_phase_review_timestamp
    BEFORE UPDATE ON "phase_review"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add only new indexes that don't exist
CREATE INDEX IF NOT EXISTS idx_ip_application_type ON "ip_application"("ip_type");
CREATE INDEX IF NOT EXISTS idx_phase_application_id ON "application_phase"("application_id");
CREATE INDEX IF NOT EXISTS idx_phase_status ON "application_phase"("status");
CREATE INDEX IF NOT EXISTS idx_task_phase_id ON "phase_task"("phase_id");
CREATE INDEX IF NOT EXISTS idx_documents_validation ON "documents"("validation_status");
CREATE INDEX IF NOT EXISTS idx_phase_review_date ON "phase_review"("review_date");

--==============================================================
-- Extensions and Functions
--==============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Timestamp update function
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--==============================================================
-- Core Tables
--==============================================================
CREATE TABLE IF NOT EXISTS user_account (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    role user_role DEFAULT 'client',
    is_active BOOLEAN DEFAULT true,
    email_verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth_session (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_session_user 
        FOREIGN KEY (user_id) REFERENCES user_account(id) 
        ON DELETE CASCADE
);

--==============================================================
-- IP Application Management
--==============================================================
CREATE TABLE IF NOT EXISTS ip_application (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    ip_type application_type NOT NULL,
    status application_status DEFAULT 'draft',
    progress INTEGER DEFAULT 0,
    inventors TEXT[],
    technical_field TEXT[],
    keywords TEXT[],
    research_field VARCHAR(255),
    department VARCHAR(255),
    faculty VARCHAR(255),
    funding_source VARCHAR(255),
    funding_type VARCHAR(100),
    grant_number VARCHAR(100),
    commercialization_status VARCHAR(50) DEFAULT 'not_licensed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    archived_at TIMESTAMP,
    archived_reason TEXT,
    CONSTRAINT fk_application_user 
        FOREIGN KEY (user_id) REFERENCES user_account(id) 
        ON DELETE RESTRICT,
    CONSTRAINT ck_progress 
        CHECK (progress BETWEEN 0 AND 100),
    CONSTRAINT ck_commercialization 
        CHECK (commercialization_status IN ('not_licensed', 'licensed', 'in_negotiation', 'technology_transfer', 'internal_use'))
);

-- Create indexes for ip_application
CREATE INDEX ix_ip_application_user ON ip_application(user_id);
CREATE INDEX ix_ip_application_status ON ip_application(status);
CREATE INDEX ix_ip_application_type ON ip_application(ip_type);

--==============================================================
-- Application Phases
--==============================================================
CREATE TABLE IF NOT EXISTS application_phase (
    phase_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    progress INTEGER DEFAULT 0,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_phase_application 
        FOREIGN KEY (application_id) 
        REFERENCES ip_application(id) 
        ON DELETE CASCADE,
    CONSTRAINT ck_phase_status 
        CHECK (status IN ('pending', 'active', 'completed', 'blocked')),
    CONSTRAINT ck_phase_progress 
        CHECK (progress BETWEEN 0 AND 100)
);

--==============================================================
-- Activity Logging
--==============================================================
CREATE TABLE IF NOT EXISTS activity_log (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL,
    phase_id UUID,
    user_id UUID NOT NULL,
    activity_type activity_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_activity_log_application 
        FOREIGN KEY (application_id) REFERENCES ip_application(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_activity_log_phase 
        FOREIGN KEY (phase_id) REFERENCES application_phase(phase_id) 
        ON DELETE SET NULL,
    CONSTRAINT fk_activity_log_user 
        FOREIGN KEY (user_id) REFERENCES user_account(id) 
        ON DELETE RESTRICT
);

--==============================================================
-- Indexes
--==============================================================
-- Consolidated index creation section
CREATE INDEX IF NOT EXISTS idx_ip_application_user ON "ip_application"("user_id");
CREATE INDEX IF NOT EXISTS idx_ip_application_status ON "ip_application"("status");
CREATE INDEX IF NOT EXISTS idx_ip_application_type ON "ip_application"("ip_type");
CREATE INDEX IF NOT EXISTS idx_phase_application_id ON "application_phase"("application_id");
CREATE INDEX IF NOT EXISTS idx_phase_status ON "application_phase"("status");
CREATE INDEX IF NOT EXISTS idx_task_phase_id ON "phase_task"("phase_id");
CREATE INDEX IF NOT EXISTS idx_task_assignee ON "phase_task"("assignee_id");
CREATE INDEX IF NOT EXISTS idx_activity_log_application ON "activity_log"("application_id");
CREATE INDEX IF NOT EXISTS idx_activity_log_phase ON "activity_log"("phase_id");
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON "activity_log"("user_id");
CREATE INDEX IF NOT EXISTS idx_calendar_event_application ON "calendar_event"("application_id");
CREATE INDEX IF NOT EXISTS idx_calendar_event_phase ON "calendar_event"("phase_id");
CREATE INDEX IF NOT EXISTS idx_document_management_application ON "document_management"("application_id");
CREATE INDEX IF NOT EXISTS idx_document_management_phase ON "document_management"("phase_id");
CREATE INDEX IF NOT EXISTS idx_notification_user ON "notification"("user_id");
CREATE INDEX IF NOT EXISTS idx_documents_validation ON "documents"("validation_status");
CREATE INDEX IF NOT EXISTS idx_phase_review_date ON "phase_review"("review_date");

-- Create triggers for timestamp updates
CREATE TRIGGER update_ip_application_timestamp
    BEFORE UPDATE ON "ip_application"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_application_phase_timestamp
    BEFORE UPDATE ON "application_phase"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_phase_task_timestamp
    BEFORE UPDATE ON "phase_task"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_event_timestamp
    BEFORE UPDATE ON "calendar_event"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_management_timestamp
    BEFORE UPDATE ON "document_management"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_digital_signature_timestamp
    BEFORE UPDATE ON "digital_signature"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_message_timestamp
    BEFORE UPDATE ON "contact_message"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comment_timestamp
    BEFORE UPDATE ON "comment"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_timestamp
    BEFORE UPDATE ON "notification"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 