-- DatabaseInitial3.7(Modified Disclosure).sql
-- Enhanced schema for IP Disclosure forms with support for different IP types

-- Create updated timestamp function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create ENUM types if they don't exist
DO $$
BEGIN
    -- Check if ENUMs already exist before creating them
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'ttlo_staff', 'client');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_type') THEN
        CREATE TYPE application_type AS ENUM ('patent', 'copyright', 'trademark', 'utility_model', 'trade_secret', 'industrial_design', 'other');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status') THEN
        CREATE TYPE application_status AS ENUM ('draft', 'pending', 'in_progress', 'approved', 'rejected', 'completed', 'archived');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_type') THEN
        CREATE TYPE activity_type AS ENUM ('update', 'comment', 'status_change');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ip_disclosure_status') THEN
        CREATE TYPE ip_disclosure_status AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'needs_revision');
    END IF;
END
$$;

-- IP Disclosure Form - Main table
CREATE TABLE IF NOT EXISTS "ip_disclosure" (
    "disclosure_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "client_id" UUID NOT NULL,
    "status" ip_disclosure_status NOT NULL DEFAULT 'draft',
    "submission_date" TIMESTAMP,
    "last_updated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "is_rightful_owner" BOOLEAN DEFAULT FALSE,
    "authorized_representative" VARCHAR(255),
    "email" VARCHAR(255) NOT NULL,
    "selected_ip_types" JSONB NOT NULL DEFAULT '{
        "copyright": false,
        "patent": false,
        "utilityModel": false,
        "industrialDesign": false,
        "trademark": false,
        "tradeSecret": false,
        "other": false,
        "notSure": false
    }',
    "other_ip_type" VARCHAR(255),
    FOREIGN KEY ("client_id") REFERENCES "user_account"("id") ON DELETE CASCADE
);

-- Applicants Information
CREATE TABLE IF NOT EXISTS "ip_disclosure_applicant" (
    "applicant_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "disclosure_id" UUID NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "middle_initial" VARCHAR(10),
    "last_name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("disclosure_id") REFERENCES "ip_disclosure"("disclosure_id") ON DELETE CASCADE
);

-- Inventors Information
CREATE TABLE IF NOT EXISTS "ip_disclosure_inventor" (
    "inventor_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "disclosure_id" UUID NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "middle_initial" VARCHAR(10),
    "last_name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("disclosure_id") REFERENCES "ip_disclosure"("disclosure_id") ON DELETE CASCADE
);

-- Trademark Application
CREATE TABLE IF NOT EXISTS "trademark_application" (
    "trademark_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "disclosure_id" UUID NOT NULL,
    "trademark_name" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "translation" TEXT,
    "nice_classifications" TEXT[] NOT NULL,
    "business_type" JSONB NOT NULL DEFAULT '{"company": false, "soleProprietor": false}',
    "legal_name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("disclosure_id") REFERENCES "ip_disclosure"("disclosure_id") ON DELETE CASCADE
);

-- Trade Secret Application
CREATE TABLE IF NOT EXISTS "trade_secret_application" (
    "trade_secret_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "disclosure_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "confidentiality_measures" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("disclosure_id") REFERENCES "ip_disclosure"("disclosure_id") ON DELETE CASCADE
);

-- Copyright Application
CREATE TABLE IF NOT EXISTS "copyright_application" (
    "copyright_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "disclosure_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "creation_date" DATE,
    "publication_status" VARCHAR(50),
    "publication_date" DATE,
    "publication_country" VARCHAR(100),
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("disclosure_id") REFERENCES "ip_disclosure"("disclosure_id") ON DELETE CASCADE
);

-- Copyright Transaction Form Part 1
CREATE TABLE IF NOT EXISTS "copyright_transaction_part1" (
    "transaction_part1_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "disclosure_id" UUID NOT NULL,
    "copyright_id" UUID NOT NULL,
    "transaction_data" JSONB NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("disclosure_id") REFERENCES "ip_disclosure"("disclosure_id") ON DELETE CASCADE,
    FOREIGN KEY ("copyright_id") REFERENCES "copyright_application"("copyright_id") ON DELETE CASCADE
);

-- Copyright Transaction Form Part 2
CREATE TABLE IF NOT EXISTS "copyright_transaction_part2" (
    "transaction_part2_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "disclosure_id" UUID NOT NULL,
    "copyright_id" UUID NOT NULL,
    "transaction_data" JSONB NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("disclosure_id") REFERENCES "ip_disclosure"("disclosure_id") ON DELETE CASCADE,
    FOREIGN KEY ("copyright_id") REFERENCES "copyright_application"("copyright_id") ON DELETE CASCADE
);

-- Patent/Utility Model Application - Main table
CREATE TABLE IF NOT EXISTS "patent_utility_model_application" (
    "patent_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "disclosure_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "type" VARCHAR(50) NOT NULL CHECK (type IN ('patent', 'utility_model')),
    "technology_type" JSONB NOT NULL DEFAULT '{
        "product": false,
        "process": false,
        "material": false,
        "software": false
    }',
    "technology_field" JSONB NOT NULL DEFAULT '{
        "chemical": false,
        "mechanical": false,
        "electrical": false,
        "computer": false,
        "pharmaceutical": false,
        "biotechnology": false,
        "other": false
    }',
    "problem" TEXT NOT NULL,
    "solution" TEXT NOT NULL,
    "comparison" TEXT NOT NULL,
    "novelty" TEXT NOT NULL,
    "variations" TEXT,
    "usage" TEXT NOT NULL,
    "references" TEXT,
    "own_publications" TEXT,
    "files" JSONB,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("disclosure_id") REFERENCES "ip_disclosure"("disclosure_id") ON DELETE CASCADE
);

-- Patent/Utility Model Inventors
CREATE TABLE IF NOT EXISTS "patent_inventors" (
    "inventor_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "patent_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "contribution" TEXT NOT NULL,
    "affiliation" VARCHAR(255),
    "email" VARCHAR(255),
    "address" TEXT,
    "is_primary_inventor" BOOLEAN DEFAULT FALSE,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("patent_id") REFERENCES "patent_utility_model_application"("patent_id") ON DELETE CASCADE
);

-- Patent Search Report
CREATE TABLE IF NOT EXISTS "patent_search_report" (
    "search_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "disclosure_id" UUID NOT NULL,
    "patent_id" UUID NOT NULL,
    "search_strings" JSONB NOT NULL,
    "relevant_documents" JSONB NOT NULL,
    "search_databases" TEXT[] NOT NULL,
    "search_date" DATE NOT NULL,
    "search_summary" TEXT NOT NULL,
    "certification" JSONB NOT NULL DEFAULT '{
        "certifierName": "",
        "certifierPosition": "Director, TILO Manager, ITSO",
        "submittedTo": {
            "name": "",
            "position": "Director, TILO Manager, ITSO"
        }
    }',
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("disclosure_id") REFERENCES "ip_disclosure"("disclosure_id") ON DELETE CASCADE,
    FOREIGN KEY ("patent_id") REFERENCES "patent_utility_model_application"("patent_id") ON DELETE CASCADE
);

-- Patent Search Documents
CREATE TABLE IF NOT EXISTS "patent_search_documents" (
    "document_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "search_id" UUID NOT NULL,
    "document_number" VARCHAR(100),
    "document_title" VARCHAR(255) NOT NULL,
    "publication_date" DATE,
    "applicant_name" VARCHAR(255),
    "relevance_rating" INTEGER CHECK (relevance_rating BETWEEN 1 AND 5),
    "relevance_notes" TEXT,
    "document_url" TEXT,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("search_id") REFERENCES "patent_search_report"("search_id") ON DELETE CASCADE
);

-- Matrix Sample for Patent/Utility Model
CREATE TABLE IF NOT EXISTS "patent_matrix_sample" (
    "matrix_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "disclosure_id" UUID NOT NULL,
    "patent_id" UUID NOT NULL,
    "invention_title" TEXT NOT NULL,
    "prior_arts" JSONB NOT NULL,
    "features" JSONB NOT NULL,
    "matrix_data" JSONB NOT NULL,
    "analysis_summary" TEXT NOT NULL,
    "conclusion" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("disclosure_id") REFERENCES "ip_disclosure"("disclosure_id") ON DELETE CASCADE,
    FOREIGN KEY ("patent_id") REFERENCES "patent_utility_model_application"("patent_id") ON DELETE CASCADE
);

-- Matrix Prior Art Documents
CREATE TABLE IF NOT EXISTS "matrix_prior_art" (
    "prior_art_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "matrix_id" UUID NOT NULL,
    "document_number" VARCHAR(100),
    "document_title" VARCHAR(255) NOT NULL,
    "publication_date" DATE,
    "applicant_name" VARCHAR(255),
    "document_url" TEXT,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("matrix_id") REFERENCES "patent_matrix_sample"("matrix_id") ON DELETE CASCADE
);

-- Matrix Features
CREATE TABLE IF NOT EXISTS "matrix_features" (
    "feature_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "matrix_id" UUID NOT NULL,
    "feature_description" TEXT NOT NULL,
    "is_essential" BOOLEAN DEFAULT FALSE,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("matrix_id") REFERENCES "patent_matrix_sample"("matrix_id") ON DELETE CASCADE
);

-- Disclosure Confirmation
CREATE TABLE IF NOT EXISTS "disclosure_confirmation" (
    "confirmation_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "disclosure_id" UUID NOT NULL,
    "written_disclosures" JSONB NOT NULL DEFAULT '{"past": false, "planned": false, "notApplicable": false}',
    "oral_disclosures" JSONB NOT NULL DEFAULT '{"past": false, "planned": false, "notApplicable": false}',
    "future_work" TEXT,
    "confirmation_declaration" BOOLEAN NOT NULL DEFAULT FALSE,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("disclosure_id") REFERENCES "ip_disclosure"("disclosure_id") ON DELETE CASCADE
);

-- IP Disclosure Attachments
CREATE TABLE IF NOT EXISTS "ip_disclosure_attachment" (
    "attachment_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "disclosure_id" UUID NOT NULL,
    "ip_type" application_type NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_type" VARCHAR(50) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "description" TEXT,
    "uploaded_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("disclosure_id") REFERENCES "ip_disclosure"("disclosure_id") ON DELETE CASCADE
);

-- IP Disclosure Review
CREATE TABLE IF NOT EXISTS "ip_disclosure_review" (
    "review_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "disclosure_id" UUID NOT NULL,
    "reviewer_id" UUID NOT NULL,
    "status" VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'needs_revision')),
    "comments" TEXT,
    "review_date" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("disclosure_id") REFERENCES "ip_disclosure"("disclosure_id") ON DELETE CASCADE,
    FOREIGN KEY ("reviewer_id") REFERENCES "user_account"("id") ON DELETE RESTRICT
);

-- Create triggers for updated_at timestamps
DO $$
DECLARE
    tables TEXT[] := ARRAY[
        'ip_disclosure',
        'ip_disclosure_applicant',
        'ip_disclosure_inventor',
        'trademark_application',
        'trade_secret_application',
        'copyright_application',
        'copyright_transaction_part1',
        'copyright_transaction_part2',
        'patent_utility_model_application',
        'patent_inventors',
        'patent_search_report',
        'patent_search_documents',
        'patent_matrix_sample',
        'matrix_prior_art',
        'matrix_features',
        'disclosure_confirmation',
        'ip_disclosure_review',
        'ip_disclosure_attachment'
    ];
    t TEXT;
BEGIN
    FOREACH t IN ARRAY tables
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%s_timestamp ON %I;
            CREATE TRIGGER update_%s_timestamp
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        ', t, t, t, t);
    END LOOP;
END
$$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ip_disclosure_client ON ip_disclosure(client_id);
CREATE INDEX IF NOT EXISTS idx_ip_disclosure_status ON ip_disclosure(status);
CREATE INDEX IF NOT EXISTS idx_ip_disclosure_applicant ON ip_disclosure_applicant(disclosure_id);
CREATE INDEX IF NOT EXISTS idx_ip_disclosure_inventor ON ip_disclosure_inventor(disclosure_id);
CREATE INDEX IF NOT EXISTS idx_trademark_application ON trademark_application(disclosure_id);
CREATE INDEX IF NOT EXISTS idx_trade_secret_application ON trade_secret_application(disclosure_id);
CREATE INDEX IF NOT EXISTS idx_copyright_application ON copyright_application(disclosure_id);
CREATE INDEX IF NOT EXISTS idx_patent_application ON patent_utility_model_application(disclosure_id);
CREATE INDEX IF NOT EXISTS idx_patent_application_type ON patent_utility_model_application(type);
CREATE INDEX IF NOT EXISTS idx_patent_inventors ON patent_inventors(patent_id);
CREATE INDEX IF NOT EXISTS idx_patent_search_report ON patent_search_report(patent_id);
CREATE INDEX IF NOT EXISTS idx_patent_search_documents ON patent_search_documents(search_id);
CREATE INDEX IF NOT EXISTS idx_patent_matrix_sample ON patent_matrix_sample(patent_id);
CREATE INDEX IF NOT EXISTS idx_matrix_prior_art ON matrix_prior_art(matrix_id);
CREATE INDEX IF NOT EXISTS idx_matrix_features ON matrix_features(matrix_id);
CREATE INDEX IF NOT EXISTS idx_disclosure_confirmation ON disclosure_confirmation(disclosure_id);
CREATE INDEX IF NOT EXISTS idx_ip_disclosure_review ON ip_disclosure_review(disclosure_id);
CREATE INDEX IF NOT EXISTS idx_ip_disclosure_review_reviewer ON ip_disclosure_review(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_ip_disclosure_attachment ON ip_disclosure_attachment(disclosure_id);

-- Comments explaining the schema
COMMENT ON TABLE ip_disclosure IS 'Main table for IP disclosure forms that captures common information across all IP types';
COMMENT ON TABLE ip_disclosure_applicant IS 'Stores information about applicants for IP disclosures';
COMMENT ON TABLE ip_disclosure_inventor IS 'Stores information about inventors/authors/creators for IP disclosures';
COMMENT ON TABLE trademark_application IS 'Stores trademark-specific information for IP disclosures';
COMMENT ON TABLE trade_secret_application IS 'Stores trade secret-specific information for IP disclosures';
COMMENT ON TABLE copyright_application IS 'Stores copyright-specific information for IP disclosures';
COMMENT ON TABLE copyright_transaction_part1 IS 'Stores copyright transaction part 1 information including co-authors';
COMMENT ON TABLE copyright_transaction_part2 IS 'Stores copyright transaction part 2 information including applicant details and work creation';
COMMENT ON TABLE patent_utility_model_application IS 'Stores patent and utility model-specific information for IP disclosures';
COMMENT ON TABLE patent_inventors IS 'Stores information about inventors for patent and utility model applications';
COMMENT ON TABLE patent_search_report IS 'Stores patent search report information including search strings and relevant documents';
COMMENT ON TABLE patent_search_documents IS 'Stores detailed information about documents found during patent search';
COMMENT ON TABLE patent_matrix_sample IS 'Stores matrix sample information for comparing invention features with prior art';
COMMENT ON TABLE matrix_prior_art IS 'Stores information about prior art documents used in the matrix sample';
COMMENT ON TABLE matrix_features IS 'Stores information about features of the invention used in the matrix sample';
COMMENT ON TABLE disclosure_confirmation IS 'Stores confirmation information for IP disclosures including declarations';
COMMENT ON TABLE ip_disclosure_review IS 'Stores review information for IP disclosures by TTLO staff';
COMMENT ON TABLE ip_disclosure_attachment IS 'Stores file attachments related to IP disclosures'; 