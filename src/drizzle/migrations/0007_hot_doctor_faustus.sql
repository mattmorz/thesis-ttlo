ALTER TABLE "copyright_transaction_part1" DROP CONSTRAINT "copyright_transaction_part1_copyright_id_fkey";
--> statement-breakpoint
ALTER TABLE "copyright_transaction_part1" DROP CONSTRAINT IF EXISTS "copyright_transaction_part1_copyright_id_fkey";--> statement-breakpoint
ALTER TABLE "copyright_transaction_part1" ADD CONSTRAINT "copyright_transaction_part1_copyright_id_fkey" FOREIGN KEY ("copyright_id") REFERENCES "public"."copyright_application"("copyright_id") ON DELETE cascade ON UPDATE no action;