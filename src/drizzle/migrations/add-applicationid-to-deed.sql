-- Add applicationId column to deed_of_assignment table
ALTER TABLE "deed_of_assignment" 
ADD COLUMN IF NOT EXISTS "application_id" UUID;

-- Create index for the new column
CREATE INDEX IF NOT EXISTS "idx_deed_of_assignment_application" 
ON "deed_of_assignment" ("application_id");

-- Add foreign key constraint
ALTER TABLE "deed_of_assignment" 
ADD CONSTRAINT "deed_of_assignment_application_id_fkey" 
FOREIGN KEY ("application_id") 
REFERENCES "ip_application"("id") 
ON DELETE CASCADE;

-- You can run this to associate existing records with applications if needed
-- UPDATE "deed_of_assignment" SET "application_id" = (
--   SELECT "id" FROM "ip_application" 
--   WHERE "ip_application"."userId" = "deed_of_assignment"."userId" 
--   LIMIT 1
-- ) 
-- WHERE "application_id" IS NULL; 