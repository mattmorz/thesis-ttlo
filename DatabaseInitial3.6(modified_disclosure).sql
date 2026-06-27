-- DatabaseInitial3.6(modified_disclosure).sql
-- This file contains modifications to the database schema to support the IP disclosure form

-- First, drop all potentially conflicting objects at the start
DO $$ 
BEGIN
    -- Drop tables if they exist
    DROP TABLE IF EXISTS "copyright_author_creator" CASCADE;
    DROP TABLE IF EXISTS "copyright_applicant" CASCADE;
    DROP TABLE IF EXISTS "copyright_work_creation" CASCADE;
    DROP TABLE IF EXISTS "trademark_application" CASCADE;
    DROP TABLE IF EXISTS "trade_secret_application" CASCADE;
    DROP TABLE IF EXISTS "patent_search_report" CASCADE;
    DROP TABLE IF EXISTS "disclosure_confirmation" CASCADE;
END $$;

-- =============================================
-- IP Disclosure Forms Management - Enhanced
-- =============================================
CREATE TABLE IF NOT EXISTS "ip_disclosure" (
    "disclosure_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID REFERENCES "user_account"("id") ON DELETE CASCADE,
    "client_id" UUID REFERENCES "client_profile"("client_id") ON DELETE CASCADE,
    
    -- Applicants Information Section
    "email" VARCHAR(255) NOT NULL,
    "applicants" JSONB NOT NULL DEFAULT '[]', -- Array of {firstName, middleInitial, lastName}
    "inventors" JSONB NOT NULL DEFAULT '[]',  -- Array of {firstName, middleInitial, lastName}
    "ip_types" JSONB NOT NULL DEFAULT '{"copyright": false, "patent": false, "utilityModel": false, "industrialDesign": false, "trademark": false, "tradeSecret": false, "notSure": false}',
    "other_ip_type" VARCHAR(255),
    "is_rightful_owner" BOOLEAN DEFAULT false,
    "authorized_representative" VARCHAR(255),
    
    -- Metadata
    "status" VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected')),
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT "valid_email" CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- =============================================
-- Copyright Application Management - Enhanced
-- =============================================
CREATE TABLE IF NOT EXISTS "copyright_basic_application" (
    "copyright_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "disclosure_id" UUID REFERENCES "ip_disclosure"("disclosure_id") ON DELETE CASCADE,
    "work_title" VARCHAR(255) NOT NULL,
    "work_description" TEXT NOT NULL,
    "creation_date" DATE NOT NULL,
    "status" VARCHAR(50) DEFAULT 'draft',
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Copyright Applicant Information
CREATE TABLE IF NOT EXISTS "copyright_applicant" (
    "applicant_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "copyright_id" UUID REFERENCES "copyright_basic_application"("copyright_id") ON DELETE CASCADE,
    "same_as_applicant" BOOLEAN DEFAULT false,
    "applicant_data" JSONB NOT NULL DEFAULT '{}', -- Stores all applicant information fields
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Copyright Author/Creator Information
CREATE TABLE IF NOT EXISTS "copyright_author_creator" (
    "author_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "copyright_id" UUID REFERENCES "copyright_basic_application"("copyright_id") ON DELETE CASCADE,
    "same_as_applicant" BOOLEAN DEFAULT false,
    "authors" JSONB NOT NULL DEFAULT '[]', -- Array of author information
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Copyright Work Creation Information
CREATE TABLE IF NOT EXISTS "copyright_work_creation" (
    "work_creation_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "copyright_id" UUID REFERENCES "copyright_basic_application"("copyright_id") ON DELETE CASCADE,
    "work_creation_data" JSONB NOT NULL DEFAULT '{}', -- Stores all work creation fields
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Patent Application Management - Enhanced
-- =============================================
CREATE TABLE IF NOT EXISTS "patent_basic_application" (
    "patent_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "disclosure_id" UUID REFERENCES "ip_disclosure"("disclosure_id") ON DELETE CASCADE,
    "technology_type" JSONB NOT NULL DEFAULT '{"product": false, "process": false, "material": false, "software": false}',
    "technology_field" JSONB NOT NULL DEFAULT '{"chemical": false, "mechanical": false}',
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

-- Patent Search Report
CREATE TABLE IF NOT EXISTS "patent_search_report" (
    "search_report_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "patent_id" UUID REFERENCES "patent_basic_application"("patent_id") ON DELETE CASCADE,
    "search_strings" JSONB NOT NULL DEFAULT '[]', -- Array of search strings
    "search_databases" JSONB NOT NULL DEFAULT '{}', -- Selected databases
    "search_results" JSONB NOT NULL DEFAULT '[]', -- Array of search results
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Trademark Application Management
-- =============================================
CREATE TABLE IF NOT EXISTS "trademark_application" (
    "trademark_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "disclosure_id" UUID REFERENCES "ip_disclosure"("disclosure_id") ON DELETE CASCADE,
    "trademark_name" VARCHAR(255) NOT NULL,
    "trademark_description" TEXT NOT NULL,
    "translation" TEXT,
    "nice_classifications" JSONB NOT NULL DEFAULT '[]', -- Array of classification strings
    "business_type" JSONB NOT NULL DEFAULT '{"company": false, "soleProprietor": false}',
    "legal_name" VARCHAR(255),
    "status" VARCHAR(50) DEFAULT 'draft',
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Trade Secret Application Management
-- =============================================
CREATE TABLE IF NOT EXISTS "trade_secret_application" (
    "trade_secret_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "disclosure_id" UUID REFERENCES "ip_disclosure"("disclosure_id") ON DELETE CASCADE,
    "description" TEXT,
    "confidentiality_measures" TEXT,
    "status" VARCHAR(50) DEFAULT 'draft',
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Disclosure Confirmation Management
-- =============================================
CREATE TABLE IF NOT EXISTS "disclosure_confirmation" (
    "confirmation_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "disclosure_id" UUID REFERENCES "ip_disclosure"("disclosure_id") ON DELETE CASCADE,
    "written_disclosures" JSONB NOT NULL DEFAULT '{"past": false, "planned": false, "notApplicable": false}',
    "oral_disclosures" JSONB NOT NULL DEFAULT '{"past": false, "planned": false, "notApplicable": false}',
    "future_work" TEXT,
    "confirmation_declaration" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Create Indexes
-- =============================================
CREATE INDEX IF NOT EXISTS idx_ip_disclosure_user ON ip_disclosure(user_id);
CREATE INDEX IF NOT EXISTS idx_ip_disclosure_client ON ip_disclosure(client_id);
CREATE INDEX IF NOT EXISTS idx_ip_disclosure_status ON ip_disclosure(status);

CREATE INDEX IF NOT EXISTS idx_copyright_basic_disclosure ON copyright_basic_application(disclosure_id);
CREATE INDEX IF NOT EXISTS idx_copyright_applicant_copyright ON copyright_applicant(copyright_id);
CREATE INDEX IF NOT EXISTS idx_copyright_author_copyright ON copyright_author_creator(copyright_id);
CREATE INDEX IF NOT EXISTS idx_copyright_work_creation_copyright ON copyright_work_creation(copyright_id);

CREATE INDEX IF NOT EXISTS idx_patent_basic_disclosure ON patent_basic_application(disclosure_id);
CREATE INDEX IF NOT EXISTS idx_patent_search_report_patent ON patent_search_report(patent_id);

CREATE INDEX IF NOT EXISTS idx_trademark_disclosure ON trademark_application(disclosure_id);
CREATE INDEX IF NOT EXISTS idx_trade_secret_disclosure ON trade_secret_application(disclosure_id);
CREATE INDEX IF NOT EXISTS idx_disclosure_confirmation_disclosure ON disclosure_confirmation(disclosure_id);

-- =============================================
-- Create Triggers
-- =============================================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create update triggers for all tables
CREATE TRIGGER update_ip_disclosure_timestamp
    BEFORE UPDATE ON ip_disclosure
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_copyright_basic_timestamp
    BEFORE UPDATE ON copyright_basic_application
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_copyright_applicant_timestamp
    BEFORE UPDATE ON copyright_applicant
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_copyright_author_timestamp
    BEFORE UPDATE ON copyright_author_creator
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_copyright_work_creation_timestamp
    BEFORE UPDATE ON copyright_work_creation
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_patent_basic_timestamp
    BEFORE UPDATE ON patent_basic_application
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_patent_search_report_timestamp
    BEFORE UPDATE ON patent_search_report
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_trademark_timestamp
    BEFORE UPDATE ON trademark_application
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_trade_secret_timestamp
    BEFORE UPDATE ON trade_secret_application
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_disclosure_confirmation_timestamp
    BEFORE UPDATE ON disclosure_confirmation
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp(); 
