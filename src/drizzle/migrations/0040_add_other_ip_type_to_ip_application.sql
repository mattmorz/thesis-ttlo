ALTER TABLE "ip_application"
ADD COLUMN IF NOT EXISTS "other_ip_type" varchar(255);
