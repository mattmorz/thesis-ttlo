ALTER TABLE "activity_log" DROP CONSTRAINT IF EXISTS "fk_activity_log_user";
--> statement-breakpoint
ALTER TABLE "archives" DROP CONSTRAINT IF EXISTS "fk_archive_user";
--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "documents_uploaded_by_fkey";
--> statement-breakpoint
ALTER TABLE "documents_validation" DROP CONSTRAINT IF EXISTS "documents_validated_by_fkey";
--> statement-breakpoint
ALTER TABLE "ip_application" DROP CONSTRAINT IF EXISTS "fk_application_user";
--> statement-breakpoint
ALTER TABLE "ip_disclosure_review" DROP CONSTRAINT IF EXISTS "ip_disclosure_review_reviewer_id_fkey";
--> statement-breakpoint
ALTER TABLE "phase_review" DROP CONSTRAINT IF EXISTS "phase_review_reviewer_id_fkey";
--> statement-breakpoint
ALTER TABLE "activity_log" DROP CONSTRAINT IF EXISTS "fk_activity_log_user";--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "fk_activity_log_user" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "archives" DROP CONSTRAINT IF EXISTS "fk_archive_user";--> statement-breakpoint
ALTER TABLE "archives" ADD CONSTRAINT "fk_archive_user" FOREIGN KEY ("archived_by") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "documents_uploaded_by_fkey";--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents_validation" DROP CONSTRAINT IF EXISTS "documents_validated_by_fkey";--> statement-breakpoint
ALTER TABLE "documents_validation" ADD CONSTRAINT "documents_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ip_application" DROP CONSTRAINT IF EXISTS "fk_application_user";--> statement-breakpoint
ALTER TABLE "ip_application" ADD CONSTRAINT "fk_application_user" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ip_disclosure_review" DROP CONSTRAINT IF EXISTS "ip_disclosure_review_reviewer_id_fkey";--> statement-breakpoint
ALTER TABLE "ip_disclosure_review" ADD CONSTRAINT "ip_disclosure_review_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_review" DROP CONSTRAINT IF EXISTS "phase_review_reviewer_id_fkey";--> statement-breakpoint
ALTER TABLE "phase_review" ADD CONSTRAINT "phase_review_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;