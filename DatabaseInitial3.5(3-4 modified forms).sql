-- First, drop all potentially conflicting objects at the start
DO $$ 
BEGIN
    -- Drop tables if they exist
    DROP TABLE IF EXISTS "application_activity" CASCADE;
    DROP TABLE IF EXISTS "activity_log" CASCADE;
    DROP TABLE IF EXISTS "document_management" CASCADE;
    DROP TABLE IF EXISTS "client_profile" CASCADE;
    DROP TABLE IF EXISTS "substantial_use" CASCADE;
    DROP TABLE IF EXISTS "deed_of_assignment" CASCADE;
    DROP TABLE IF EXISTS "royalty_agreement" CASCADE;
    DROP TABLE IF EXISTS "signatory_section" CASCADE;
    
    -- Drop indexes if they exist
    DROP INDEX IF EXISTS idx_activity_application_id;
    DROP INDEX IF EXISTS idx_tasks_assigned_to;
    DROP INDEX IF EXISTS idx_tasks_due_date;
    DROP INDEX IF EXISTS idx_documents_application;
    DROP INDEX IF EXISTS idx_activity_log_application;
    DROP INDEX IF EXISTS idx_activity_log_phase;
END $$;

-- Function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--==============================================================
-- Custom Types
--==============================================================
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'ttlo_staff', 'client');
    CREATE TYPE application_type AS ENUM ('patent', 'copyright', 'trademark', 'utility_model');
    CREATE TYPE application_status AS ENUM ('draft', 'pending', 'in_progress', 'approved', 'rejected', 'completed', 'archived');
    CREATE TYPE activity_type AS ENUM ('update', 'comment', 'status_change');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- Authentication & User Management
-- =============================================

CREATE TABLE "user_account" (
	"id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" VARCHAR(255),
	"email" VARCHAR(255) UNIQUE NOT NULL,
	"role" "user_role" DEFAULT 'client',
    "is_active" BOOLEAN DEFAULT true,
	"image" TEXT,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"emailVerified" TIMESTAMP
);

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

CREATE TABLE "authenticator" (
    "credentialID" text NOT NULL,
    "userId" uuid NOT NULL,
    "providerAccountId" text NOT NULL,
    "credentialPublicKey" text NOT NULL,
    "counter" integer NOT NULL,
    "credentialDeviceType" text NOT NULL,
    "credentialBackedUp" boolean NOT NULL,
    "transports" text,
    CONSTRAINT "authenticator_credentialID_unique" UNIQUE("credentialID")
);

CREATE TABLE "session" (
    "sessionToken" text PRIMARY KEY NOT NULL,
    "userId" uuid NOT NULL,
    "expires" timestamp NOT NULL
);

CREATE TABLE "verificationToken" (
    "identifier" text NOT NULL,
    "token" text NOT NULL,
    "expires" timestamp NOT NULL
);

-- Add foreign key constraints for auth tables
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" 
    FOREIGN KEY ("userId") REFERENCES user_account("id")  ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "authenticator" ADD CONSTRAINT "authenticator_userId_user_id_fk" 
    FOREIGN KEY ("userId") REFERENCES user_account("id")  ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" 
    FOREIGN KEY ("userId") REFERENCES user_account("id")  ON DELETE CASCADE ON UPDATE NO ACTION;

-- =============================================
-- Client Profile Management (Updated)
-- =============================================
CREATE TABLE "client_profile" (
    "client_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID REFERENCES "user_account"("id") ON DELETE CASCADE,
    
    -- Personal Information
    "first_name" VARCHAR(100) NOT NULL,
    "middle_name" VARCHAR(100),
    "last_name" VARCHAR(100) NOT NULL,
    "gender" JSONB DEFAULT '{"value": "male"}'::jsonb,
    "age" INTEGER,
    "citizenship" JSONB DEFAULT '{"value": "filipino", "otherValue": null}'::jsonb,
    
    -- Contact Information
    "email" VARCHAR(255) NOT NULL,
    "contact_number" VARCHAR(20),
    "mailing_address" TEXT,
    
    -- Company Information
    "company_name" VARCHAR(255),
    "company_street" TEXT,
    "company_barangay" TEXT,
    "company_city_municipality" TEXT,
    "company_province" TEXT,
    "company_email" VARCHAR(255),
    "occupation" VARCHAR(255),
    
    -- Educational Background
    "highest_degree" JSONB DEFAULT '{"value": "bachelor", "otherValue": null}'::jsonb,
    "degree" VARCHAR(255),
    "profession" VARCHAR(255),
    
    -- Background IP
    "published_research" JSONB DEFAULT '{"value": "no"}'::jsonb,
    "developed_materials" JSONB DEFAULT '{"value": "no"}'::jsonb,
    "familiar_with_ip_rights" JSONB DEFAULT '{"value": "no"}'::jsonb,
    "ip_experience" JSONB DEFAULT '{"hasExperience": "no", "types": {"patent": false, "copyright": false, "trademark": false, "industrialDesign": false, "utilityModel": false, "other": false}, "otherSpecify": ""}'::jsonb,
    
    -- Status and Metadata
    "status" VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for client_profile
CREATE INDEX idx_client_profile_user ON client_profile(user_id);
CREATE INDEX idx_client_profile_email ON client_profile(email);

-- Create trigger for updating timestamp
CREATE TRIGGER update_client_profile_timestamp
    BEFORE UPDATE ON client_profile
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Substantial Use Form Management (Updated)
-- =============================================
CREATE TABLE "substantial_use" (
    "substantial_use_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID REFERENCES "user_account"("id") ON DELETE CASCADE,
    
    -- Research Information
    "research_title" VARCHAR(255) NOT NULL,
    
    -- Applicants Information (includes signature date)
    "applicants" JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Laboratory Facilities
    "laboratory_facilities" JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Funding Resources
    "funding_resources" JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Additional Information
    "remarks" TEXT,
    
    -- Metadata
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected'))
);

-- Create indexes for substantial_use
CREATE INDEX idx_substantial_use_user ON substantial_use(user_id);
CREATE INDEX idx_substantial_use_status ON substantial_use(status);

-- Create trigger for updating timestamp
CREATE TRIGGER update_substantial_use_timestamp
    BEFORE UPDATE ON substantial_use
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Deed of Assignment Management (Updated)
-- =============================================
CREATE TABLE "deed_of_assignment" (
    "deed_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID REFERENCES "user_account"("id") ON DELETE CASCADE,
    
    -- Deed Details
    "research_title" VARCHAR(255) NOT NULL,
    "creators" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "creator_address" TEXT,
    "assignee_name" VARCHAR(255) DEFAULT 'CARAGA STATE UNIVERSITY',
    "assignee_representative" VARCHAR(255) DEFAULT 'ROLYN C. DAGUIL, Ph.D.',
    
    -- Signatory Section
    "day" VARCHAR(10),
    "month" VARCHAR(20),
    "year" VARCHAR(10),
    "assignee_id" VARCHAR(50) DEFAULT 'M98 – 009',
    "assignee_date" VARCHAR(50),
    "assignee_place" VARCHAR(100) DEFAULT 'Butuan City',
    "assignor_id" VARCHAR(50),
    "assignor_date" VARCHAR(50),
    "assignor_place" VARCHAR(100) DEFAULT 'Butuan City',
    "notarized_document_path" VARCHAR(255),
    
    -- Metadata
    "metadata" JSONB DEFAULT '{}'::jsonb,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'pending_revision'))
);

-- Create indexes for deed_of_assignment
CREATE INDEX idx_deed_of_assignment_user ON deed_of_assignment(user_id);
CREATE INDEX idx_deed_of_assignment_status ON deed_of_assignment(status);

-- Add comments for clarity
COMMENT ON TABLE "deed_of_assignment" IS 'Stores deed of assignment information for intellectual property';
COMMENT ON COLUMN "deed_of_assignment"."creators" IS 'Stores multiple creators/inventors with firstName, middleInitial, lastName. Used in both deed details and signatory section.';
COMMENT ON COLUMN "deed_of_assignment"."metadata" IS 'Stores additional metadata like comments, feedback, and revision history.';

-- Create trigger for updating timestamp
CREATE TRIGGER update_deed_of_assignment_timestamp
    BEFORE UPDATE ON deed_of_assignment
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- IP Application Management
-- =============================================
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
    CONSTRAINT fk_application_user 
        FOREIGN KEY (user_id) REFERENCES user_account("id") 
        ON DELETE RESTRICT,
    CONSTRAINT ck_progress 
        CHECK (progress BETWEEN 0 AND 100),
    CONSTRAINT ck_commercialization 
        CHECK (commercialization_status IN ('not_licensed', 'licensed', 'in_negotiation', 'technology_transfer', 'internal_use'))
);

CREATE TABLE IF NOT EXISTS archives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL,
    archive_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    archive_reason TEXT,
    archived_by UUID NOT NULL,
    CONSTRAINT fk_archive_application
        FOREIGN KEY (application_id)
        REFERENCES ip_application(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_archive_user
        FOREIGN KEY (archived_by)
        REFERENCES user_account("id")
        ON DELETE RESTRICT
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
    "assignee_id" UUID REFERENCES user_account("id") ,
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
    FOREIGN KEY ("staff_id") REFERENCES user_account("id")  ON DELETE CASCADE,
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
    "validated_by" UUID REFERENCES user_account("id") ,
    "validation_remarks" TEXT,
    CONSTRAINT "document_category_check" CHECK (category IN ('forms', 'attachments', 'requirements')),
    CONSTRAINT "document_status_check" CHECK (status IN ('pending', 'verified', 'rejected')),
    CONSTRAINT "document_validation_status_check" 
        CHECK (validation_status IN ('pending', 'approved', 'rejected', 'needs_revision')),
    FOREIGN KEY ("application_id") REFERENCES "ip_application"(id) ON DELETE CASCADE,
    FOREIGN KEY ("phase_id") REFERENCES "application_phase"("phase_id") ON DELETE SET NULL,
    FOREIGN KEY ("uploaded_by") REFERENCES user_account("id")  ON DELETE RESTRICT,
    FOREIGN KEY ("verified_by") REFERENCES user_account("id")  ON DELETE SET NULL
);

-- Internal Validation
CREATE TABLE "internal_validation" (
    "validation_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "phase_id" UUID REFERENCES "application_phase"("phase_id") ON DELETE CASCADE,
    "document_id" UUID REFERENCES "documents"("document_id"),
    "validator_role" VARCHAR(50) CHECK (validator_role IN ('superadmin', 'director')),
    "assigned_to" UUID REFERENCES user_account("id") ,
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

--==============================================================
-- Activity Logging
--==============================================================
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
        FOREIGN KEY (user_id) REFERENCES user_account("id") 
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
    "created_by" UUID REFERENCES user_account("id") ,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "application_id" UUID REFERENCES "ip_application"(id) ON DELETE SET NULL,
    "phase_id" UUID REFERENCES "application_phase"("phase_id") ON DELETE SET NULL
);

CREATE TABLE "event_participant" (
    "event_id" UUID REFERENCES "calendar_event"("event_id") ON DELETE CASCADE,
    "user_id" UUID REFERENCES user_account("id")  ON DELETE CASCADE,
    "status" VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    PRIMARY KEY ("event_id", "user_id")
);

-- =============================================
-- Document Management System
-- =============================================
CREATE TABLE "document_management" (
    "document_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "entity_id" UUID NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL CHECK (entity_type IN ('application', 'phase', 'task')),
    "document_type" VARCHAR(100) NOT NULL,
    "document_title" VARCHAR(255) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "status" VARCHAR(50) DEFAULT 'pending',
    "uploaded_by" UUID REFERENCES user_account("id") ,
    "upload_date" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "verified_by" UUID REFERENCES user_account("id") ,
    "verification_date" TIMESTAMP,
    "remarks" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "application_id" UUID REFERENCES "ip_application"(id) ON DELETE CASCADE,
    "phase_id" UUID REFERENCES "application_phase"("phase_id") ON DELETE SET NULL,
    CONSTRAINT "document_status_check" CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- =============================================
-- Digital Signature System
-- =============================================
CREATE TABLE "digital_signature" (
    "signature_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "entity_id" UUID NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "signer_id" UUID REFERENCES user_account("id") ,
    "signer_type" VARCHAR(50) NOT NULL CHECK (signer_type IN ('author', 'applicant', 'representative', 'staff')),
    "signature_image" TEXT NOT NULL,
    "signature_date" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "ip_address" VARCHAR(45),
    "is_valid" BOOLEAN DEFAULT true,
    "verification_token" VARCHAR(255),
    "metadata" JSONB,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    "status" VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'resolved')),
    "assigned_to" UUID REFERENCES user_account("id") ,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Comments & Discussion
-- =============================================
CREATE TABLE "comment" (
    "comment_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "user_id" UUID REFERENCES user_account("id")  ON DELETE CASCADE,
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
    "user_id" UUID REFERENCES user_account("id")  ON DELETE CASCADE,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "type" VARCHAR(50) CHECK (type IN ('info', 'warning', 'success', 'error')),
    "status" VARCHAR(20) DEFAULT 'unread' CHECK (status IN ('read', 'unread')),
    "link" TEXT,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP
);

-- =============================================
-- IP Portfolio Management
-- =============================================
CREATE TABLE "ip_contributors" (
    "contributor_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "application_id" UUID REFERENCES "ip_application"(id) ON DELETE CASCADE,
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
    "application_id" UUID REFERENCES "ip_application"(id) ON DELETE CASCADE,
    "filing_date" DATE,
    "registration_number" VARCHAR(100),
    "grant_date" DATE,
    "expiry_date" DATE,
    "jurisdiction" VARCHAR(100),
    "commercialization_status" VARCHAR(50) CHECK (commercialization_status IN ('not_licensed', 'licensed', 'in_negotiation')),
    "metadata" JSONB
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
    FOREIGN KEY ("reviewer_id") REFERENCES user_account("id")  ON DELETE RESTRICT
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

-- Create indexes after all tables
DO $$ 
BEGIN
    -- Create activity log indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_activity_log_application') THEN
        CREATE INDEX idx_activity_log_application ON activity_log(application_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_activity_log_phase') THEN
        CREATE INDEX idx_activity_log_phase ON activity_log(phase_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_activity_log_user') THEN
        CREATE INDEX idx_activity_log_user ON activity_log(user_id);
    END IF;
    
    -- Add other indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_phase_review_phase_id') THEN
        CREATE INDEX idx_phase_review_phase_id ON "phase_review"("phase_id");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_phase_review_reviewer') THEN
        CREATE INDEX idx_phase_review_reviewer ON "phase_review"("reviewer_id");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_phase_review_status') THEN
        CREATE INDEX idx_phase_review_status ON "phase_review"("status");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_phase_review_date') THEN
        CREATE INDEX idx_phase_review_date ON "phase_review"("review_date");
    END IF;
END $$;

-- Create triggers after all tables and indexes
DO $$ 
BEGIN
    -- Create activity log trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_activity_log_timestamp') THEN
        CREATE TRIGGER update_activity_log_timestamp
            BEFORE UPDATE ON activity_log
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

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