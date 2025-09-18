-- Update copyright_transaction_part2 table to use the new structure
-- First, add new columns if they don't exist
ALTER TABLE "copyright_transaction_part2" ADD COLUMN IF NOT EXISTS "transaction_part2_id" uuid DEFAULT gen_random_uuid();
ALTER TABLE "copyright_transaction_part2" ADD COLUMN IF NOT EXISTS "disclosure_id" uuid;
ALTER TABLE "copyright_transaction_part2" ADD COLUMN IF NOT EXISTS "transaction_data" jsonb DEFAULT '{}'::jsonb;

-- Migrate data from old columns to the new jsonb column
UPDATE "copyright_transaction_part2"
SET "transaction_data" = jsonb_build_object(
  'transactionTypes', "transaction_types",
  'filingMethod', "filing_method",
  'filingType', "filing_type",
  'numberOfCopies', "number_of_copies",
  'ipsoRegion', "ipso_region"
)
WHERE "transaction_data" IS NULL OR "transaction_data" = '{}'::jsonb;

-- Set disclosure_id from related tables if possible
UPDATE "copyright_transaction_part2" c
SET "disclosure_id" = ca."disclosure_id"
FROM "copyright_basic_application" ca
WHERE c."copyright_id" = ca."copyright_id" AND c."disclosure_id" IS NULL;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS "idx_copyright_transaction_part2_disclosure" ON "copyright_transaction_part2" ("disclosure_id");
CREATE INDEX IF NOT EXISTS "idx_copyright_transaction_part2_copyright" ON "copyright_transaction_part2" ("copyright_id");
CREATE INDEX IF NOT EXISTS "idx_copyright_transaction_part2_transaction_part2_id" ON "copyright_transaction_part2" ("transaction_part2_id");

-- Update the primary key to use transaction_part2_id
-- First, check if transaction_detail_id is the primary key
DO $$
DECLARE
  primary_key_column text;
  has_primary_key boolean;
BEGIN
  -- Check if the table has a primary key
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'copyright_transaction_part2'::regclass 
    AND contype = 'p'
  ) INTO has_primary_key;
  
  IF has_primary_key THEN
    -- Get the name of the primary key column
    SELECT a.attname INTO primary_key_column
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE i.indrelid = 'copyright_transaction_part2'::regclass
    AND i.indisprimary;
    
    -- If transaction_detail_id is the primary key, we need to modify it
    IF primary_key_column = 'transaction_detail_id' THEN
      -- Drop the primary key constraint
      ALTER TABLE "copyright_transaction_part2" DROP CONSTRAINT "copyright_transaction_part2_pkey";
      
      -- Add a new primary key on transaction_part2_id
      ALTER TABLE "copyright_transaction_part2" ADD PRIMARY KEY ("transaction_part2_id");
    END IF;
  ELSE
    -- If there's no primary key, add one on transaction_part2_id
    ALTER TABLE "copyright_transaction_part2" ADD PRIMARY KEY ("transaction_part2_id");
  END IF;
END $$;

-- Add foreign key constraint for disclosure_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'copyright_transaction_part2_disclosure_id_fkey'
  ) THEN
    ALTER TABLE "copyright_transaction_part2" 
    ADD CONSTRAINT "copyright_transaction_part2_disclosure_id_fkey" 
    FOREIGN KEY ("disclosure_id") 
    REFERENCES "ip_disclosure"("disclosure_id") 
    ON DELETE CASCADE;
  END IF;
END $$;

-- Update related tables to use transaction_part2_id instead of transaction_detail_id
-- First, update the foreign key constraints in copyright_work_creation
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'copyright_work_creation_transaction_detail_id_fkey'
  ) THEN
    ALTER TABLE "copyright_work_creation" 
    DROP CONSTRAINT "copyright_work_creation_transaction_detail_id_fkey";

    ALTER TABLE "copyright_work_creation"
    ADD CONSTRAINT "copyright_work_creation_transaction_part2_id_fkey"
    FOREIGN KEY ("transaction_detail_id")
    REFERENCES "copyright_transaction_part2"("transaction_part2_id")
    ON DELETE CASCADE;
  END IF;
END $$;

-- Update the foreign key constraints in copyright_applicant
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'copyright_applicant_transaction_detail_id_fkey'
  ) THEN
    ALTER TABLE "copyright_applicant"
    DROP CONSTRAINT "copyright_applicant_transaction_detail_id_fkey";

    ALTER TABLE "copyright_applicant"
    ADD CONSTRAINT "copyright_applicant_transaction_part2_id_fkey"
    FOREIGN KEY ("transaction_detail_id")
    REFERENCES "copyright_transaction_part2"("transaction_part2_id")
    ON DELETE CASCADE;
  END IF;
END $$;

-- Update the foreign key constraints in copyright_author_creator
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'copyright_author_creator_transaction_detail_id_fkey'
  ) THEN
    ALTER TABLE "copyright_author_creator"
    DROP CONSTRAINT "copyright_author_creator_transaction_detail_id_fkey";

    ALTER TABLE "copyright_author_creator"
    ADD CONSTRAINT "copyright_author_creator_transaction_part2_id_fkey"
    FOREIGN KEY ("transaction_detail_id")
    REFERENCES "copyright_transaction_part2"("transaction_part2_id")
    ON DELETE CASCADE;
  END IF;
END $$; 