-- Drop existing tables if they exist
DROP TABLE IF EXISTS "client_profile" CASCADE;
DROP TABLE IF EXISTS "substantial_use" CASCADE;

-- Create the client_profile table with updated structure
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

-- Create index for user lookup
CREATE INDEX idx_client_profile_user ON client_profile(user_id);
CREATE INDEX idx_client_profile_email ON client_profile(email);

-- Create trigger for updating timestamp
CREATE TRIGGER update_client_profile_timestamp
    BEFORE UPDATE ON client_profile
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create the substantial_use table with updated structure
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

-- Create indexes for substantial_use table
CREATE INDEX idx_substantial_use_user ON substantial_use(user_id);
CREATE INDEX idx_substantial_use_status ON substantial_use(status);

-- Create trigger for updating timestamp
CREATE TRIGGER update_substantial_use_timestamp
    BEFORE UPDATE ON substantial_use
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 