ALTER TABLE "client_profile" DROP CONSTRAINT IF EXISTS "unique_user_application_profile";--> statement-breakpoint
ALTER TABLE "client_profile" DROP CONSTRAINT IF EXISTS "client_profile_application_id_fkey";
--> statement-breakpoint
ALTER TABLE "client_profile" ADD CONSTRAINT "client_profile_ip_application_id_fkey" FOREIGN KEY ("ip_application_id") REFERENCES "public"."ip_application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_profile" ADD CONSTRAINT "unique_client_profile_per_application" UNIQUE("user_id","ip_application_id");