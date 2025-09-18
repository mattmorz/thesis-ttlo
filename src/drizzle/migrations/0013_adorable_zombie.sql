ALTER TABLE "task_assignment" DROP CONSTRAINT "task_assignment_task_id_staff_id_key";--> statement-breakpoint
ALTER TABLE "application_phase" DROP CONSTRAINT "ck_phase_progress";--> statement-breakpoint
ALTER TABLE "task_assignment" DROP CONSTRAINT "task_assignment_staff_id_fkey";
--> statement-breakpoint
ALTER TABLE "task_assignment" ADD COLUMN "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "task_assignment" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "task_assignment" ADD CONSTRAINT "task_assignment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_phase" DROP COLUMN "progress";--> statement-breakpoint
ALTER TABLE "application_phase" DROP COLUMN "order_index";--> statement-breakpoint
ALTER TABLE "phase_task" DROP COLUMN "completed";--> statement-breakpoint
ALTER TABLE "task_assignment" DROP COLUMN "assignment_id";--> statement-breakpoint
ALTER TABLE "task_assignment" DROP COLUMN "staff_id";--> statement-breakpoint
ALTER TABLE "archives" ADD CONSTRAINT "archives_application_id_unique" UNIQUE("application_id");--> statement-breakpoint
ALTER TABLE "task_assignment" ADD CONSTRAINT "task_assignment_task_id_user_id_key" UNIQUE("task_id","user_id");