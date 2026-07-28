CREATE TABLE IF NOT EXISTS "ip_application_enrollment" (
	"enrollment_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
ALTER TABLE "task_assignment" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "task_assignment" CASCADE;--> statement-breakpoint
ALTER TABLE "phase_task" DROP CONSTRAINT IF EXISTS "phase_task_assignee_id_fkey";
--> statement-breakpoint
ALTER TABLE "ip_application_enrollment" ADD CONSTRAINT "ip_application_enrollment_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."ip_application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ip_application_enrollment" ADD CONSTRAINT "ip_application_enrollment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_task" DROP COLUMN "assignee_id";