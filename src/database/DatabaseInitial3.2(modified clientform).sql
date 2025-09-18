-- Drop existing tables if they exist
DROP TABLE IF EXISTS "client_profile" CASCADE;

-- Create the client_profile table with updated structure
CREATE TABLE "client_profile" (
    "client_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID REFERENCES "user_account"("id") ON DELETE CASCADE,
    
    -- Personal Information
    "first_name" VARCHAR(100) NOT NULL,
    "middle_name" VARCHAR(100),
    "last_name" VARCHAR(100) NOT NULL,
    "gender" VARCHAR(20) CHECK (gender IN ('male', 'female', 'prefer_not_to_say')),
    "age" INTEGER CHECK (age > 0),
    "citizenship" VARCHAR(100) NOT NULL,
    "other_citizenship" VARCHAR(100),
    
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
    "highest_degree" VARCHAR(50) CHECK (highest_degree IN ('bachelor', 'master', 'doctorate', 'other')),
    "other_degree" VARCHAR(100),
    "degree" VARCHAR(255),
    "profession" VARCHAR(255),
    
    -- Background IP
    "published_research" VARCHAR(20) CHECK (published_research IN ('yes', 'no', 'submitted')),
    "developed_materials" VARCHAR(20) CHECK (developed_materials IN ('yes', 'no', 'ongoing')),
    "familiar_with_ip_rights" BOOLEAN DEFAULT false,
    "ip_experience" JSONB, -- Stores IP experience details including types and other specifications
    
    -- Metadata
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for user lookup
CREATE INDEX idx_client_profile_user ON client_profile(user_id);

-- Create trigger for updating timestamp
CREATE TRIGGER update_client_profile_timestamp
    BEFORE UPDATE ON client_profile
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 