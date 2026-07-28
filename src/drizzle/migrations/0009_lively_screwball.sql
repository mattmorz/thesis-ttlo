ALTER TABLE "copyright_transaction_part2" DROP CONSTRAINT "check_submission_type";--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" DROP CONSTRAINT "check_transaction_type";--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" ALTER COLUMN "transaction_data" SET DEFAULT '{"transactionType":{"anonymousWork":false,"correctionEntry":false,"resaleRights":false,"certifiedCopy":false,"recordation":false,"reconstitution":false},"applicantType":{"agent":false,"copyrightClaimant":false,"licensee":false,"heir":false,"newOwner":false},"otherCertifications":"","numberOfCertificates":"","ipsoRegion":"","bulkFilingQty":""}'::jsonb;--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" ADD COLUMN "is_copyright_registration" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" ADD COLUMN "filing_method" varchar(50);--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" ADD COLUMN "filing_type" varchar(50);--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" DROP CONSTRAINT IF EXISTS "check_filing_method";--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" ADD CONSTRAINT "check_filing_method" CHECK (filing_method IN ('electronicFiling', 'throughIPSO'));--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" DROP CONSTRAINT IF EXISTS "check_filing_type";--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" ADD CONSTRAINT "check_filing_type" CHECK (filing_type IN ('singleFiling', 'bulkFiling'));--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" DROP CONSTRAINT IF EXISTS "check_transaction_type";--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" ADD CONSTRAINT "check_transaction_type" CHECK ((transaction_data->'transactionType')::jsonb ?| array['anonymousWork', 'correctionEntry', 'resaleRights', 'certifiedCopy', 'recordation', 'reconstitution']);