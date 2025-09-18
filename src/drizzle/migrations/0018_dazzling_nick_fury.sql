ALTER TABLE "documents_validation" ALTER COLUMN "file_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "documents_validation" ALTER COLUMN "file_type" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "documents_validation" ALTER COLUMN "file_size" DROP NOT NULL;