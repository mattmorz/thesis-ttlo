ALTER TABLE "other_documents" ALTER COLUMN "form_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "other_documents" ADD COLUMN "title" varchar(255);