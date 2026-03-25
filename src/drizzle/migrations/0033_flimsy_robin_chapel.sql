CREATE TABLE "tracking_code" (
	"tracking_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ip_application_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"code_hash" varchar(128) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone_number" varchar(30),
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"revoked_at" timestamp,
	"last_used_at" timestamp,
	CONSTRAINT "tracking_code_value_key" UNIQUE("code"),
	CONSTRAINT "tracking_code_hash_key" UNIQUE("code_hash")
);
--> statement-breakpoint
CREATE TABLE "tracking_otp" (
	"otp_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tracking_id" uuid NOT NULL,
	"channel" varchar(10) NOT NULL,
	"identifier" varchar(255) NOT NULL,
	"otp_hash" varchar(128) NOT NULL,
	"attempts" integer DEFAULT 0,
	"expires_at" timestamp NOT NULL,
	"last_sent_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "tracking_otp_channel_check" CHECK ((channel)::text = ANY (ARRAY[('email'::character varying)::text, ('sms'::character varying)::text]))
);
--> statement-breakpoint
ALTER TABLE "user_account" ADD COLUMN "phone_number" varchar(30);--> statement-breakpoint
ALTER TABLE "tracking_code" ADD CONSTRAINT "tracking_code_application_id_fkey" FOREIGN KEY ("ip_application_id") REFERENCES "public"."ip_application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_code" ADD CONSTRAINT "tracking_code_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_otp" ADD CONSTRAINT "tracking_otp_tracking_id_fkey" FOREIGN KEY ("tracking_id") REFERENCES "public"."tracking_code"("tracking_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_tracking_code_application" ON "tracking_code" USING btree ("ip_application_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_tracking_code_user" ON "tracking_code" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_tracking_otp_tracking" ON "tracking_otp" USING btree ("tracking_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_tracking_otp_identifier" ON "tracking_otp" USING btree ("identifier" text_ops);--> statement-breakpoint
ALTER TABLE "user_account" ADD CONSTRAINT "user_account_phone_key" UNIQUE("phone_number");