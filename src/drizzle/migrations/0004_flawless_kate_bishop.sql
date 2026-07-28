CREATE TABLE IF NOT EXISTS "copyright_transaction_part1" (
	"transaction_part1_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"disclosure_id" uuid NOT NULL,
	"copyright_id" uuid NOT NULL,
	"transaction_data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
ALTER TABLE "copyright_transaction_part1" ADD CONSTRAINT "copyright_transaction_part1_copyright_id_fkey" FOREIGN KEY ("copyright_id") REFERENCES "public"."copyright_application"("copyright_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copyright_transaction_part1" ADD CONSTRAINT "copyright_transaction_part1_disclosure_id_fkey" FOREIGN KEY ("disclosure_id") REFERENCES "public"."ip_disclosure"("disclosure_id") ON DELETE cascade ON UPDATE no action;