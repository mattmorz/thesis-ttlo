ALTER TABLE "client_profile" ADD COLUMN "ip_application_id" uuid;--> statement-breakpoint
ALTER TABLE "client_profile" ADD CONSTRAINT "client_profile_application_id_fkey" FOREIGN KEY ("ip_application_id") REFERENCES "public"."ip_application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_client_profile_application" ON "client_profile" USING btree ("ip_application_id" uuid_ops);--> statement-breakpoint
ALTER TABLE "client_profile" ADD CONSTRAINT "unique_user_application_profile" UNIQUE("user_id","ip_application_id");