ALTER TABLE "client_profile" ADD COLUMN "has_company" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "client_profile" ADD COLUMN "college_name" varchar(255);--> statement-breakpoint
ALTER TABLE "client_profile" ADD COLUMN "department_name" varchar(255);