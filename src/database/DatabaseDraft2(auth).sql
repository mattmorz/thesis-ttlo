-- =============================================
-- Authentication & User Management
-- =============================================
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
--> statement-breakpoint
CREATE TABLE "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"email" text,
	"emailVerified" timestamp,
	"image" text,
    "role" VARCHAR(50) CHECK (role IN ('admin', 'ttlo_staff', 'client')) DEFAULT 'client' NOT NULL,
    "is_active" BOOLEAN DEFAULT true,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authenticator" ADD CONSTRAINT "authenticator_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;

-- =============================================
-- Client Profile Management
-- =============================================
CREATE TABLE "client_profile" (
  "client_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID REFERENCES "user"("id") ON DELETE CASCADE,
  -- Personal Information
  "first_name" VARCHAR(100) NOT NULL,
  "middle_name" VARCHAR(100),
  "last_name" VARCHAR(100) NOT NULL,
  "gender" VARCHAR(20) CHECK (gender IN ('male', 'female', 'other')),
  "birth_date" DATE,
  "citizenship" VARCHAR(100) NOT NULL,
  "contact_number" VARCHAR(20),
  "email" VARCHAR(255) NOT NULL,
  "mailing_address" TEXT,
  
  -- Company Information
  "company_name" VARCHAR(255),
  "company_address" TEXT,
  "company_email" VARCHAR(255),
  "occupation" VARCHAR(255),
  
  -- IP Background Information
  "has_research_output" BOOLEAN DEFAULT false,
  "research_output_status" VARCHAR(20) CHECK (research_output_status IN ('yes', 'submitted', null)),
  "has_inst_materials" BOOLEAN DEFAULT false,
  "inst_materials_status" VARCHAR(20) CHECK (inst_materials_status IN ('yes', 'ongoing', null)),
  "is_familiar_ra8293" BOOLEAN DEFAULT false,
  "has_ip_experience" BOOLEAN DEFAULT false,
  
  -- Metadata
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
-- Basic Copyright Application (First Tab)
CREATE TABLE "copyright_basic_application" (
  "copyright_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "disclosure_id" UUID REFERENCES "ip_disclosure"("disclosure_id") ON DELETE CASCADE,
  -- From copyright-application.tsx
  "work_title" VARCHAR(255) NOT NULL,
  "work_description" TEXT NOT NULL,
  "creation_date" DATE NOT NULL,
  "status" VARCHAR(50) DEFAULT 'draft',
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Document Management System
-- =============================================
CREATE TABLE "document_management" (
  "document_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "entity_id" UUID NOT NULL, -- References any entity (copyright_id, patent_id, etc.)
  "entity_type" VARCHAR(50) NOT NULL, -- Type of entity (copyright, patent, etc.)
  "document_type" VARCHAR(100) NOT NULL,
  "document_title" VARCHAR(255) NOT NULL,
  "file_name" VARCHAR(255) NOT NULL,
  "file_path" TEXT NOT NULL,
  "file_size" INTEGER NOT NULL,
  "mime_type" VARCHAR(100) NOT NULL,
  "status" VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  "uploaded_by" UUID REFERENCES "user"("id"),
  "upload_date" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "verified_by" UUID REFERENCES "user"("id"),
  "verification_date" TIMESTAMP,
  "remarks" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Digital Signature System
-- =============================================
CREATE TABLE "digital_signature" (
  "signature_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "entity_id" UUID NOT NULL, -- References the document/form being signed
  "entity_type" VARCHAR(50) NOT NULL, -- Type of entity (copyright, patent, etc.)
  "signer_id" UUID REFERENCES "user"("id"),
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
-- Patent Application Management
-- =============================================
-- Basic Patent Application (from patentum-application.tsx)
CREATE TABLE "patent_basic_application" (
  "patent_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "disclosure_id" UUID REFERENCES "ip_disclosure"("disclosure_id") ON DELETE CASCADE,
  -- Technology Classification
  "technology_type" JSONB NOT NULL, -- {product, process, material, software}
  "technology_field" JSONB NOT NULL, -- {chemical, mechanical}
  -- Basic Information
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
  -- References
  "own_publications" TEXT,
  "patent_type" VARCHAR(20) CHECK (patent_type IN ('patent', 'utility_model')),
  "status" VARCHAR(50) DEFAULT 'draft',
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Matrix Analysis (from matrix-form.tsx)
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
  "analysis_data" JSONB -- Stores comparison data for each prior art
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
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "event_participant" (
  "event_id" UUID REFERENCES "calendar_event"("event_id") ON DELETE CASCADE,
  "user_id" UUID REFERENCES "user"("id") ON DELETE CASCADE,
  "status" VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  PRIMARY KEY ("event_id", "user_id")
);

-- =============================================
-- Project Application Management
-- =============================================
CREATE TABLE "project_application" (
  "project_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "client_id" UUID REFERENCES "client_profile"("client_id"),
  
  -- Core Project Information
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "project_type" VARCHAR(50) CHECK (project_type IN ('patent', 'copyright', 'trademark', 'industrial-design')),
  
  -- Form References
  "ip_disclosure_id" UUID REFERENCES "ip_disclosure"("disclosure_id"),
  "substantial_use_id" UUID,  -- Will reference substantial_use table
  "deed_assignment_id" UUID,  -- Will reference deed_assignment table
  
  -- Research Details
  "research_field" VARCHAR(100),
  "funding_source" VARCHAR(255),
  "funding_type" VARCHAR(50) CHECK (funding_type IN ('government', 'private', 'university', 'self', 'other')),
  "grant_number" VARCHAR(100),
  
  -- Inventor/Author Information
  "primary_inventor" UUID REFERENCES "user"("id"),
  "co_inventors" UUID[] DEFAULT ARRAY[]::UUID[],
  "department" VARCHAR(100),
  "faculty" VARCHAR(100),
  
  -- Administrative Fields
  "assigned_to" UUID REFERENCES "user"("id"),
  "status" VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'under_review', 'approved', 'rejected', 'completed', 'archived')),
  "priority" VARCHAR(20) CHECK (priority IN ('high', 'medium', 'low')),
  
  -- Timeline
  "submission_date" DATE,
  "approval_date" DATE,
  "target_completion_date" DATE,
  
  -- Metadata
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project Research Details
CREATE TABLE "project_research_detail" (
  "detail_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" UUID REFERENCES "project_application"("project_id") ON DELETE CASCADE,
  "research_objectives" TEXT,
  "methodology" TEXT,
  "key_findings" TEXT,
  "potential_applications" TEXT,
  "technical_fields" TEXT[],
  "keywords" TEXT[],
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project Review History
CREATE TABLE "project_review" (
  "review_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" UUID REFERENCES "project_application"("project_id") ON DELETE CASCADE,
  "reviewer_id" UUID REFERENCES "user"("id"),
  "review_type" VARCHAR(50) CHECK (review_type IN ('technical', 'legal', 'commercial', 'final')),
  "status" VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  "comments" TEXT,
  "recommendation" VARCHAR(50),
  "review_date" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project Phase (modified to link with project_application)
CREATE TABLE "project_phase" (
  "phase_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" UUID REFERENCES "project_application"("project_id") ON DELETE CASCADE,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "order_index" INTEGER NOT NULL,
  "status" VARCHAR(50) DEFAULT 'pending',
  "start_date" DATE,
  "end_date" DATE,
  "progress" INTEGER DEFAULT 0,
  "requirements" JSONB,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Archive Management
-- =============================================
CREATE TABLE "archive" (
  "archive_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" UUID REFERENCES "project_application"("project_id"),
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "archive_date" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "archived_by" UUID REFERENCES "user"("id"),
  "status" VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Inventory Management
-- =============================================
CREATE TABLE "inventory_item" (
  "item_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "category" VARCHAR(50) CHECK (category IN ('chemical', 'mechanical', 'project')),
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "quantity" INTEGER NOT NULL DEFAULT 0,
  "unit" VARCHAR(50),
  "status" VARCHAR(50) DEFAULT 'active',
  "location" VARCHAR(255),
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "inventory_transaction" (
  "transaction_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "item_id" UUID REFERENCES "inventory_item"("item_id") ON DELETE CASCADE,
  "transaction_type" VARCHAR(50) CHECK (transaction_type IN ('in', 'out')),
  "quantity" INTEGER NOT NULL,
  "transaction_date" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "performed_by" UUID REFERENCES "user"("id"),
  "remarks" TEXT
);

-- =============================================
-- Notification System
-- =============================================
CREATE TABLE "notification" (
  "notification_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID REFERENCES "user"("id") ON DELETE CASCADE,
  "title" VARCHAR(255) NOT NULL,
  "message" TEXT NOT NULL,
  "type" VARCHAR(50) CHECK (type IN ('info', 'warning', 'success', 'error')),
  "status" VARCHAR(20) DEFAULT 'unread' CHECK (status IN ('read', 'unread')),
  "link" TEXT,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "read_at" TIMESTAMP
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
  "assigned_to" UUID REFERENCES "user"("id"),
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Activity Logging
-- =============================================
CREATE TABLE "activity_log" (
  "log_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID REFERENCES "user"("id"),
  "entity_type" VARCHAR(50) NOT NULL, -- Type of entity (project, form, etc.)
  "entity_id" UUID NOT NULL,
  "action" VARCHAR(50) NOT NULL,
  "description" TEXT,
  "metadata" JSONB,
  "ip_address" VARCHAR(45),
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Comments & Discussion
-- =============================================
CREATE TABLE "comment" (
  "comment_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "entity_type" VARCHAR(50) NOT NULL, -- Type of entity (project, form, etc.)
  "entity_id" UUID NOT NULL,
  "user_id" UUID REFERENCES "user"("id") ON DELETE CASCADE,
  "content" TEXT NOT NULL,
  "parent_id" UUID REFERENCES "comment"("comment_id") ON DELETE CASCADE,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Project Task Management
-- =============================================
CREATE TABLE "task" (
  "task_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" UUID REFERENCES "project_application"("project_id") ON DELETE CASCADE,
  "phase_id" UUID REFERENCES "project_phase"("phase_id") ON DELETE CASCADE,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "assigned_to" UUID REFERENCES "user"("id"),
  "due_date" TIMESTAMP,
  "priority" VARCHAR(20) CHECK (priority IN ('high', 'medium', 'low')),
  "status" VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'blocked')),
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Project Collaboration
-- =============================================
CREATE TABLE "project_member" (
  "project_id" UUID REFERENCES "project_application"("project_id") ON DELETE CASCADE,
  "user_id" UUID REFERENCES "user"("id") ON DELETE CASCADE,
  "role" VARCHAR(50) CHECK (role IN ('owner', 'manager', 'member', 'viewer')),
  "joined_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("project_id", "user_id")
);

-- =============================================
-- Triggers
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create update triggers for all relevant tables
CREATE TRIGGER update_client_profile_timestamp
  BEFORE UPDATE ON "client_profile"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ip_disclosure_timestamp
  BEFORE UPDATE ON "ip_disclosure"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_copyright_basic_application_timestamp
  BEFORE UPDATE ON "copyright_basic_application"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_copyright_work_creation_timestamp
  BEFORE UPDATE ON "copyright_work_creation"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_copyright_author_creator_timestamp
  BEFORE UPDATE ON "copyright_author_creator"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_copyright_applicant_timestamp
  BEFORE UPDATE ON "copyright_applicant"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patent_basic_application_timestamp
  BEFORE UPDATE ON "patent_basic_application"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patent_matrix_timestamp
  BEFORE UPDATE ON "patent_matrix"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matrix_feature_timestamp
  BEFORE UPDATE ON "matrix_feature"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matrix_prior_art_timestamp
  BEFORE UPDATE ON "matrix_prior_art"
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

CREATE TRIGGER update_calendar_event_timestamp
  BEFORE UPDATE ON "calendar_event"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_application_timestamp
  BEFORE UPDATE ON "project_application"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_research_detail_timestamp
  BEFORE UPDATE ON "project_research_detail"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_review_timestamp
  BEFORE UPDATE ON "project_review"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_phase_timestamp
  BEFORE UPDATE ON "project_phase"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_archive_timestamp
  BEFORE UPDATE ON "archive"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_item_timestamp
  BEFORE UPDATE ON "inventory_item"
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

CREATE TRIGGER update_task_timestamp
  BEFORE UPDATE ON "task"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Remove redundant tables
DROP TABLE IF EXISTS "file_storage";
DROP TABLE IF EXISTS "signature";
DROP TABLE IF EXISTS "copyright_submitted_documents";
DROP TABLE IF EXISTS "copyright_document_requirements";
DROP TABLE IF EXISTS "copyright_signature"; 
