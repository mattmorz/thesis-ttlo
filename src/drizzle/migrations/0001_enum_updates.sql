-- First, update the tables to use varchar temporarily
ALTER TABLE "ip_application" 
    ALTER COLUMN "status" TYPE varchar(50) USING status::varchar(50),
    ALTER COLUMN "ip_type" TYPE varchar(50) USING ip_type::varchar(50);

ALTER TABLE "activity_log"
    ALTER COLUMN "activity_type" TYPE varchar(50) USING activity_type::varchar(50);

-- Drop the existing enum types if they exist
DROP TYPE IF EXISTS "application_status" CASCADE;
DROP TYPE IF EXISTS "application_type" CASCADE;
DROP TYPE IF EXISTS "activity_type" CASCADE;

-- Recreate the enum types
CREATE TYPE "application_status" AS ENUM (
    'draft', 'pending', 'in_progress', 'approved', 
    'rejected', 'completed', 'archived', 'on-hold'
);

CREATE TYPE "application_type" AS ENUM (
    'patent', 'copyright', 'trademark', 'utility_model'
);

CREATE TYPE "activity_type" AS ENUM (
    'update', 'comment', 'status_change'
);

-- Update the columns to use the new enum types
ALTER TABLE "ip_application" 
    ALTER COLUMN "status" TYPE application_status USING status::application_status,
    ALTER COLUMN "ip_type" TYPE application_type USING ip_type::application_type;

ALTER TABLE "activity_log"
    ALTER COLUMN "activity_type" TYPE activity_type USING activity_type::activity_type;

-- Add constraints back
ALTER TABLE "ip_application" 
    ADD CONSTRAINT "ip_type_check" 
    CHECK (ip_type IN ('patent', 'copyright', 'trademark', 'utility_model'));

ALTER TABLE "ip_application" 
    ADD CONSTRAINT "status_check" 
    CHECK (status IN ('draft', 'pending', 'in_progress', 'approved', 'rejected', 'completed', 'archived', 'on-hold'));

-- Recreate indexes
CREATE INDEX IF NOT EXISTS "idx_ip_application_status" ON "ip_application"("status");
CREATE INDEX IF NOT EXISTS "idx_ip_application_type" ON "ip_application"("ip_type"); 