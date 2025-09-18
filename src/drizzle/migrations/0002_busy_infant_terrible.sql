CREATE TYPE "public"."ip_disclosure_status" AS ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected', 'needs_revision');--> statement-breakpoint
CREATE TABLE "copyright_application" (
	"copyright_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"disclosure_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"category" varchar(100) NOT NULL,
	"creation_date" date,
	"publication_status" varchar(50),
	"publication_date" date,
	"publication_country" varchar(100),
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "copyright_transaction_part1" (
	"transaction_part1_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"disclosure_id" uuid NOT NULL,
	"copyright_id" uuid NOT NULL,
	"transaction_data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "disclosure_confirmation" (
	"confirmation_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"disclosure_id" uuid NOT NULL,
	"written_disclosures" jsonb DEFAULT '{"past": false, "planned": false, "notApplicable": false}' NOT NULL,
	"oral_disclosures" jsonb DEFAULT '{"past": false, "planned": false, "notApplicable": false}' NOT NULL,
	"future_work" text,
	"confirmation_declaration" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "ip_disclosure_applicant" (
	"applicant_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"disclosure_id" uuid NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"middle_initial" varchar(10),
	"last_name" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "ip_disclosure_inventor" (
	"inventor_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"disclosure_id" uuid NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"middle_initial" varchar(10),
	"last_name" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
ALTER TABLE "comment" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "contact_message" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "event_participant" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ip_contributors" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ip_details" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "notification" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "phase_review" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "phase_review_attachment" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "comment" CASCADE;--> statement-breakpoint
DROP TABLE "contact_message" CASCADE;--> statement-breakpoint
DROP TABLE "event_participant" CASCADE;--> statement-breakpoint
DROP TABLE "ip_contributors" CASCADE;--> statement-breakpoint
DROP TABLE "ip_details" CASCADE;--> statement-breakpoint
DROP TABLE "notification" CASCADE;--> statement-breakpoint
DROP TABLE "phase_review" CASCADE;--> statement-breakpoint
DROP TABLE "phase_review_attachment" CASCADE;--> statement-breakpoint
ALTER TABLE "client_profile" DROP CONSTRAINT "client_profile_inst_materials_status_check";--> statement-breakpoint
ALTER TABLE "client_profile" DROP CONSTRAINT "client_profile_research_output_status_check";--> statement-breakpoint
ALTER TABLE "client_profile" DROP CONSTRAINT "client_profile_gender_check";--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" DROP CONSTRAINT "copyright_transaction_part2_filing_method_check";--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" DROP CONSTRAINT "copyright_transaction_part2_filing_type_check";--> statement-breakpoint
ALTER TABLE "copyright_applicant" DROP CONSTRAINT "copyright_applicant_transaction_detail_id_fkey";
--> statement-breakpoint
ALTER TABLE "copyright_author_creator" DROP CONSTRAINT "copyright_author_creator_applicant_id_fkey";
--> statement-breakpoint
ALTER TABLE "copyright_author_creator" DROP CONSTRAINT "copyright_author_creator_transaction_detail_id_fkey";
--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" DROP CONSTRAINT "copyright_transaction_part2_copyright_id_fkey";
--> statement-breakpoint
ALTER TABLE "copyright_work_creation" DROP CONSTRAINT "copyright_work_creation_transaction_detail_id_fkey";
--> statement-breakpoint
ALTER TABLE "ip_disclosure" DROP CONSTRAINT "ip_disclosure_client_id_fkey";
--> statement-breakpoint
ALTER TABLE "client_profile" ALTER COLUMN "gender" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "client_profile" ALTER COLUMN "gender" SET DEFAULT '{"value":"male"}'::jsonb;--> statement-breakpoint
ALTER TABLE "client_profile" ALTER COLUMN "citizenship" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "client_profile" ALTER COLUMN "citizenship" SET DEFAULT '{"value":"filipino","otherValue":null}'::jsonb;--> statement-breakpoint
ALTER TABLE "client_profile" ALTER COLUMN "citizenship" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" ALTER COLUMN "copyright_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "ip_disclosure" ALTER COLUMN "client_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "ip_disclosure" ALTER COLUMN "status" SET DATA TYPE ip_disclosure_status;--> statement-breakpoint
ALTER TABLE "ip_disclosure" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "client_profile" ADD COLUMN "company_street" text;--> statement-breakpoint
ALTER TABLE "client_profile" ADD COLUMN "company_barangay" text;--> statement-breakpoint
ALTER TABLE "client_profile" ADD COLUMN "company_city_municipality" text;--> statement-breakpoint
ALTER TABLE "client_profile" ADD COLUMN "company_province" text;--> statement-breakpoint
ALTER TABLE "client_profile" ADD COLUMN "highest_degree" jsonb DEFAULT '{"value":"bachelor","otherValue":null}'::jsonb;--> statement-breakpoint
ALTER TABLE "client_profile" ADD COLUMN "degree" varchar(255);--> statement-breakpoint
ALTER TABLE "client_profile" ADD COLUMN "profession" varchar(255);--> statement-breakpoint
ALTER TABLE "client_profile" ADD COLUMN "published_research" jsonb DEFAULT '{"value":"no"}'::jsonb;--> statement-breakpoint
ALTER TABLE "client_profile" ADD COLUMN "developed_materials" jsonb DEFAULT '{"value":"no"}'::jsonb;--> statement-breakpoint
ALTER TABLE "client_profile" ADD COLUMN "familiar_with_ip_rights" jsonb DEFAULT '{"value":"no"}'::jsonb;--> statement-breakpoint
ALTER TABLE "client_profile" ADD COLUMN "ip_experience" jsonb DEFAULT '{"hasExperience":"no","types":{"patent":false,"copyright":false,"trademark":false,"industrialDesign":false,"utilityModel":false,"other":false},"otherSpecify":""}'::jsonb;--> statement-breakpoint
ALTER TABLE "client_profile" ADD COLUMN "status" varchar(20) DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" ADD COLUMN "transaction_part2_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" ADD COLUMN "disclosure_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" ADD COLUMN "transaction_data" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "ip_disclosure" ADD COLUMN "submission_date" timestamp;--> statement-breakpoint
ALTER TABLE "ip_disclosure" ADD COLUMN "last_updated" timestamp DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "ip_disclosure" ADD COLUMN "authorized_representative" varchar(255);--> statement-breakpoint
ALTER TABLE "ip_disclosure" ADD COLUMN "email" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "ip_disclosure" ADD COLUMN "selected_ip_types" jsonb DEFAULT '{"copyright": false, "patent": false, "utilityModel": false, "industrialDesign": false, "trademark": false, "tradeSecret": false, "other": false, "notSure": false}' NOT NULL;--> statement-breakpoint
ALTER TABLE "ip_disclosure" ADD COLUMN "other_ip_type" varchar(255);--> statement-breakpoint
ALTER TABLE "copyright_application" ADD CONSTRAINT "copyright_application_disclosure_id_fkey" FOREIGN KEY ("disclosure_id") REFERENCES "public"."ip_disclosure"("disclosure_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copyright_transaction_part1" ADD CONSTRAINT "copyright_transaction_part1_disclosure_id_fkey" FOREIGN KEY ("disclosure_id") REFERENCES "public"."ip_disclosure"("disclosure_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copyright_transaction_part1" ADD CONSTRAINT "copyright_transaction_part1_copyright_id_fkey" FOREIGN KEY ("copyright_id") REFERENCES "public"."copyright_application"("copyright_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disclosure_confirmation" ADD CONSTRAINT "disclosure_confirmation_disclosure_id_fkey" FOREIGN KEY ("disclosure_id") REFERENCES "public"."ip_disclosure"("disclosure_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ip_disclosure_applicant" ADD CONSTRAINT "ip_disclosure_applicant_disclosure_id_fkey" FOREIGN KEY ("disclosure_id") REFERENCES "public"."ip_disclosure"("disclosure_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ip_disclosure_inventor" ADD CONSTRAINT "ip_disclosure_inventor_disclosure_id_fkey" FOREIGN KEY ("disclosure_id") REFERENCES "public"."ip_disclosure"("disclosure_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_copyright_application" ON "copyright_application" USING btree ("disclosure_id");--> statement-breakpoint
CREATE INDEX "idx_copyright_transaction_part1_disclosure" ON "copyright_transaction_part1" USING btree ("disclosure_id");--> statement-breakpoint
CREATE INDEX "idx_copyright_transaction_part1_copyright" ON "copyright_transaction_part1" USING btree ("copyright_id");--> statement-breakpoint
CREATE INDEX "idx_disclosure_confirmation" ON "disclosure_confirmation" USING btree ("disclosure_id");--> statement-breakpoint
CREATE INDEX "idx_ip_disclosure_applicant" ON "ip_disclosure_applicant" USING btree ("disclosure_id");--> statement-breakpoint
CREATE INDEX "idx_ip_disclosure_inventor" ON "ip_disclosure_inventor" USING btree ("disclosure_id");--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" ADD CONSTRAINT "copyright_transaction_part2_disclosure_id_fkey" FOREIGN KEY ("disclosure_id") REFERENCES "public"."ip_disclosure"("disclosure_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" ADD CONSTRAINT "copyright_transaction_part2_copyright_id_fkey" FOREIGN KEY ("copyright_id") REFERENCES "public"."copyright_application"("copyright_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ip_disclosure" ADD CONSTRAINT "ip_disclosure_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_copyright_transaction_part2_disclosure" ON "copyright_transaction_part2" USING btree ("disclosure_id");--> statement-breakpoint
CREATE INDEX "idx_copyright_transaction_part2_copyright" ON "copyright_transaction_part2" USING btree ("copyright_id");--> statement-breakpoint
CREATE INDEX "idx_ip_disclosure_client" ON "ip_disclosure" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_ip_disclosure_status" ON "ip_disclosure" USING btree ("status");--> statement-breakpoint
ALTER TABLE "client_profile" DROP COLUMN "company_address";--> statement-breakpoint
ALTER TABLE "client_profile" DROP COLUMN "has_research_output";--> statement-breakpoint
ALTER TABLE "client_profile" DROP COLUMN "research_output_status";--> statement-breakpoint
ALTER TABLE "client_profile" DROP COLUMN "has_inst_materials";--> statement-breakpoint
ALTER TABLE "client_profile" DROP COLUMN "inst_materials_status";--> statement-breakpoint
ALTER TABLE "client_profile" DROP COLUMN "is_familiar_ra8293";--> statement-breakpoint
ALTER TABLE "client_profile" DROP COLUMN "has_ip_experience";--> statement-breakpoint
ALTER TABLE "copyright_applicant" DROP COLUMN "transaction_detail_id";--> statement-breakpoint
ALTER TABLE "copyright_author_creator" DROP COLUMN "transaction_detail_id";--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" DROP COLUMN "transaction_detail_id";--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" DROP COLUMN "transaction_types";--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" DROP COLUMN "filing_method";--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" DROP COLUMN "filing_type";--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" DROP COLUMN "number_of_copies";--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" DROP COLUMN "ipso_region";--> statement-breakpoint
ALTER TABLE "copyright_work_creation" DROP COLUMN "transaction_detail_id";--> statement-breakpoint
ALTER TABLE "ip_disclosure" DROP COLUMN "ip_types";--> statement-breakpoint
ALTER TABLE "client_profile" ADD CONSTRAINT "client_profile_highest_degree_check" CHECK ((highest_degree)::text = ANY ((ARRAY['bachelor'::character varying, 'master'::character varying, 'doctorate'::character varying, 'other'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "client_profile" ADD CONSTRAINT "client_profile_published_research_check" CHECK ((published_research)::text = ANY ((ARRAY['yes'::character varying, 'no'::character varying, 'submitted'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "client_profile" ADD CONSTRAINT "client_profile_developed_materials_check" CHECK ((developed_materials)::text = ANY ((ARRAY['yes'::character varying, 'no'::character varying, 'ongoing'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "client_profile" ADD CONSTRAINT "client_profile_gender_check" CHECK ((gender)::text = ANY ((ARRAY['male'::character varying, 'female'::character varying, 'prefer_not_to_say'::character varying])::text[]));