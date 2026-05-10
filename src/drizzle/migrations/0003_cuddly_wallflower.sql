CREATE TABLE "client_profile_backup" (
	"client_id" uuid,
	"user_id" uuid,
	"first_name" varchar(100),
	"middle_name" varchar(100),
	"last_name" varchar(100),
	"contact_number" varchar(20),
	"email" varchar(255),
	"mailing_address" text,
	"company_name" varchar(255),
	"company_email" varchar(255),
	"occupation" varchar(255),
	"created_at" timestamp,
	"updated_at" timestamp,
	"age" integer,
	"company_street" text,
	"company_barangay" text,
	"company_city_municipality" text,
	"company_province" text,
	"degree" varchar(255),
	"profession" varchar(255),
	"published_research" varchar(20),
	"developed_materials" varchar(20),
	"ip_experience" jsonb,
	"status" varchar(20),
	"gender" jsonb,
	"citizenship" jsonb,
	"highest_degree" jsonb,
	"familiar_with_ip_rights" jsonb
);
--> statement-breakpoint
CREATE TABLE "comment" (
	"comment_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"user_id" uuid,
	"content" text NOT NULL,
	"parent_id" uuid,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "contact_message" (
	"message_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"subject" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"status" varchar(50) DEFAULT 'pending',
	"assigned_to" uuid,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "contact_message_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'in-progress'::character varying, 'resolved'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "deed_of_assignment" (
	"deed_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"research_title" varchar(255),
	"creators" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"creator_address" text,
	"assignee_name" varchar(255) DEFAULT 'CARAGA STATE UNIVERSITY',
	"assignee_representative" varchar(255) DEFAULT 'ROLYN C. DAGUIL, Ph.D.',
	"day" varchar(10),
	"month" varchar(20),
	"year" varchar(10),
	"assignee_id" varchar(50) DEFAULT 'M98 – 009',
	"assignee_date" varchar(50),
	"assignee_place" varchar(100) DEFAULT 'Butuan City',
	"notarized_document_path" varchar(255),
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"status" varchar(20) DEFAULT 'draft',
	"metadata" jsonb,
	"assignor_id" varchar(50),
	"assignor_date" varchar(50),
	"assignor_place" varchar(100) DEFAULT 'Butuan City',
	CONSTRAINT "deed_of_assignment_status_check" CHECK ((status)::text = ANY ((ARRAY['draft'::character varying, 'submitted'::character varying, 'approved'::character varying, 'rejected'::character varying, 'pending_revision'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "event_participant" (
	"event_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" varchar(50) DEFAULT 'pending',
	CONSTRAINT "event_participant_pkey" PRIMARY KEY("event_id","user_id"),
	CONSTRAINT "event_participant_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'declined'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "ip_contributors" (
	"contributor_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid,
	"first_name" varchar(100) NOT NULL,
	"middle_name" varchar(100),
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255),
	"role" varchar(50),
	"is_primary" boolean DEFAULT false,
	CONSTRAINT "ip_contributors_role_check" CHECK ((role)::text = ANY ((ARRAY['inventor'::character varying, 'author'::character varying, 'applicant'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "ip_details" (
	"detail_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid,
	"filing_date" date,
	"registration_number" varchar(100),
	"grant_date" date,
	"expiry_date" date,
	"jurisdiction" varchar(100),
	"commercialization_status" varchar(50),
	"metadata" jsonb,
	CONSTRAINT "ip_details_commercialization_status_check" CHECK ((commercialization_status)::text = ANY ((ARRAY['not_licensed'::character varying, 'licensed'::character varying, 'in_negotiation'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "ip_disclosure_attachment" (
	"attachment_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"disclosure_id" uuid NOT NULL,
	"ip_type" "application_type" NOT NULL,
	"file_path" text NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_type" varchar(50) NOT NULL,
	"file_size" integer NOT NULL,
	"description" text,
	"uploaded_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "ip_disclosure_review" (
	"review_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"disclosure_id" uuid NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"status" varchar(50) NOT NULL,
	"comments" text,
	"review_date" timestamp DEFAULT CURRENT_TIMESTAMP,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "ip_disclosure_review_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'needs_revision'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "matrix_features" (
	"feature_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"matrix_id" uuid NOT NULL,
	"feature_description" text NOT NULL,
	"is_essential" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"notification_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"type" varchar(50),
	"status" varchar(20) DEFAULT 'unread',
	"link" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"read_at" timestamp,
	CONSTRAINT "notification_status_check" CHECK ((status)::text = ANY ((ARRAY['read'::character varying, 'unread'::character varying])::text[])),
	CONSTRAINT "notification_type_check" CHECK ((type)::text = ANY ((ARRAY['info'::character varying, 'warning'::character varying, 'success'::character varying, 'error'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "patent_inventors" (
	"inventor_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patent_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"contribution" text NOT NULL,
	"affiliation" varchar(255),
	"email" varchar(255),
	"address" text,
	"is_primary_inventor" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "patent_matrix_sample" (
	"matrix_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"disclosure_id" uuid NOT NULL,
	"patent_id" uuid NOT NULL,
	"invention_title" text NOT NULL,
	"prior_arts" jsonb NOT NULL,
	"features" jsonb NOT NULL,
	"matrix_data" jsonb NOT NULL,
	"analysis_summary" text NOT NULL,
	"conclusion" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "patent_search_documents" (
	"document_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"search_id" uuid NOT NULL,
	"document_number" varchar(100),
	"document_title" varchar(255) NOT NULL,
	"publication_date" date,
	"applicant_name" varchar(255),
	"relevance_rating" integer,
	"relevance_notes" text,
	"document_url" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "patent_search_documents_relevance_rating_check" CHECK ((relevance_rating >= 1) AND (relevance_rating <= 5))
);
--> statement-breakpoint
CREATE TABLE "patent_search_report" (
	"search_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"disclosure_id" uuid NOT NULL,
	"patent_id" uuid NOT NULL,
	"search_strings" jsonb NOT NULL,
	"relevant_documents" jsonb NOT NULL,
	"search_databases" text[] NOT NULL,
	"search_date" date NOT NULL,
	"search_summary" text NOT NULL,
	"certification" jsonb DEFAULT '{"submittedTo":{"name":"","position":"Director, TILO Manager, ITSO"},"certifierName":"","certifierPosition":"Director, TILO Manager, ITSO"}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "patent_utility_model_application" (
	"patent_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"disclosure_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"technology_type" jsonb DEFAULT '{"process":false,"product":false,"material":false,"software":false}'::jsonb NOT NULL,
	"technology_field" jsonb DEFAULT '{"other":false,"chemical":false,"computer":false,"electrical":false,"mechanical":false,"biotechnology":false,"pharmaceutical":false}'::jsonb NOT NULL,
	"problem" text NOT NULL,
	"solution" text NOT NULL,
	"comparison" text NOT NULL,
	"novelty" text NOT NULL,
	"variations" text,
	"usage" text NOT NULL,
	"references" text,
	"own_publications" text,
	"files" jsonb,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "patent_utility_model_application_type_check" CHECK ((type)::text = ANY ((ARRAY['patent'::character varying, 'utility_model'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "phase_review" (
	"review_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phase_id" uuid NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"comment" text NOT NULL,
	"status" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"rating" integer,
	"review_date" timestamp DEFAULT CURRENT_TIMESTAMP,
	"attachments" text[],
	CONSTRAINT "phase_review_rating_check" CHECK ((rating >= 1) AND (rating <= 5)),
	CONSTRAINT "review_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'needs_revision'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "phase_review_attachment" (
	"attachment_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid,
	"file_path" text NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_type" varchar(50) NOT NULL,
	"file_size" integer NOT NULL,
	"uploaded_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "substantial_use" (
	"substantial_use_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"research_title" varchar(255) NOT NULL,
	"applicants" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"laboratory_facilities" jsonb NOT NULL,
	"funding_resources" jsonb NOT NULL,
	"remarks" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"status" varchar(20) DEFAULT 'draft',
	CONSTRAINT "substantial_use_status_check" CHECK ((status)::text = ANY ((ARRAY['draft'::character varying, 'submitted'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "trade_secret_application" (
	"trade_secret_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"disclosure_id" uuid NOT NULL,
	"description" text NOT NULL,
	"confidentiality_measures" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "trademark_application" (
	"trademark_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"disclosure_id" uuid NOT NULL,
	"trademark_name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"translation" text,
	"nice_classifications" text[] NOT NULL,
	"business_type" jsonb DEFAULT '{"company":false,"soleProprietor":false}'::jsonb NOT NULL,
	"legal_name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
ALTER TABLE "copyright_transaction_part1" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "copyright_transaction_part1" CASCADE;--> statement-breakpoint
ALTER TABLE "client_profile" DROP CONSTRAINT "client_profile_gender_check";--> statement-breakpoint
ALTER TABLE "client_profile" DROP CONSTRAINT "client_profile_highest_degree_check";--> statement-breakpoint
ALTER TABLE "client_profile" DROP CONSTRAINT "client_profile_published_research_check";--> statement-breakpoint
ALTER TABLE "client_profile" DROP CONSTRAINT "client_profile_developed_materials_check";--> statement-breakpoint
ALTER TABLE "account" DROP CONSTRAINT "account_userId_user_account_id_fk";
--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" DROP CONSTRAINT "copyright_transaction_part2_disclosure_id_fkey";
--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" DROP CONSTRAINT "copyright_transaction_part2_copyright_id_fkey";
--> statement-breakpoint
DROP INDEX "idx_copyright_application";--> statement-breakpoint
DROP INDEX "idx_copyright_transaction_part2_disclosure";--> statement-breakpoint
DROP INDEX "idx_copyright_transaction_part2_copyright";--> statement-breakpoint
DROP INDEX "idx_disclosure_confirmation";--> statement-breakpoint
DROP INDEX "idx_ip_disclosure_applicant";--> statement-breakpoint
DROP INDEX "idx_ip_disclosure_inventor";--> statement-breakpoint
DROP INDEX "idx_ip_disclosure_client";--> statement-breakpoint
DROP INDEX "idx_ip_disclosure_status";--> statement-breakpoint
ALTER TABLE "account" DROP CONSTRAINT "account_provider_providerAccountId_pk";--> statement-breakpoint
ALTER TABLE "client_profile" ALTER COLUMN "gender" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "client_profile" ALTER COLUMN "citizenship" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "client_profile" ALTER COLUMN "highest_degree" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "client_profile" ALTER COLUMN "familiar_with_ip_rights" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "client_profile" ALTER COLUMN "ip_experience" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" ALTER COLUMN "transaction_data" SET DEFAULT '{"transactionType":{"anonymousWork":false,"correctionEntry":false,"resaleRights":false,"certifiedCopy":false,"recordation":false,"reconstitution":false},"submissionType":{"filingMethod":{"electronicFiling":false,"throughIPSO":false},"filingType":{"singleFiling":false,"bulkFiling":false}},"applicantType":{"agent":false,"copyrightClaimant":false,"licensee":false,"heir":false,"newOwner":false}}'::jsonb;--> statement-breakpoint
ALTER TABLE "disclosure_confirmation" ALTER COLUMN "written_disclosures" SET DEFAULT '{"past":false,"planned":false,"notApplicable":false}'::jsonb;--> statement-breakpoint
ALTER TABLE "disclosure_confirmation" ALTER COLUMN "oral_disclosures" SET DEFAULT '{"past":false,"planned":false,"notApplicable":false}'::jsonb;--> statement-breakpoint
ALTER TABLE "ip_disclosure" ALTER COLUMN "client_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "ip_disclosure" ALTER COLUMN "status" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "ip_disclosure" ALTER COLUMN "status" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "ip_disclosure" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "ip_disclosure" ALTER COLUMN "selected_ip_types" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "ip_disclosure" ALTER COLUMN "selected_ip_types" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "copyright_applicant" ADD COLUMN "transaction_detail_id" uuid;--> statement-breakpoint
ALTER TABLE "copyright_author_creator" ADD COLUMN "transaction_detail_id" uuid;--> statement-breakpoint
ALTER TABLE "copyright_work_creation" ADD COLUMN "transaction_detail_id" uuid;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."comment"("comment_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_message" ADD CONSTRAINT "contact_message_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deed_of_assignment" ADD CONSTRAINT "deed_of_assignment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_participant" ADD CONSTRAINT "event_participant_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."calendar_event"("event_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_participant" ADD CONSTRAINT "event_participant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ip_contributors" ADD CONSTRAINT "ip_contributors_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."ip_application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ip_details" ADD CONSTRAINT "ip_details_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."ip_application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ip_disclosure_attachment" ADD CONSTRAINT "ip_disclosure_attachment_disclosure_id_fkey" FOREIGN KEY ("disclosure_id") REFERENCES "public"."ip_disclosure"("disclosure_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ip_disclosure_review" ADD CONSTRAINT "ip_disclosure_review_disclosure_id_fkey" FOREIGN KEY ("disclosure_id") REFERENCES "public"."ip_disclosure"("disclosure_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ip_disclosure_review" ADD CONSTRAINT "ip_disclosure_review_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."user_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matrix_features" ADD CONSTRAINT "matrix_features_matrix_id_fkey" FOREIGN KEY ("matrix_id") REFERENCES "public"."patent_matrix_sample"("matrix_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patent_inventors" ADD CONSTRAINT "patent_inventors_patent_id_fkey" FOREIGN KEY ("patent_id") REFERENCES "public"."patent_utility_model_application"("patent_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patent_matrix_sample" ADD CONSTRAINT "patent_matrix_sample_disclosure_id_fkey" FOREIGN KEY ("disclosure_id") REFERENCES "public"."ip_disclosure"("disclosure_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patent_matrix_sample" ADD CONSTRAINT "patent_matrix_sample_patent_id_fkey" FOREIGN KEY ("patent_id") REFERENCES "public"."patent_utility_model_application"("patent_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patent_search_documents" ADD CONSTRAINT "patent_search_documents_search_id_fkey" FOREIGN KEY ("search_id") REFERENCES "public"."patent_search_report"("search_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patent_search_report" ADD CONSTRAINT "patent_search_report_disclosure_id_fkey" FOREIGN KEY ("disclosure_id") REFERENCES "public"."ip_disclosure"("disclosure_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patent_search_report" ADD CONSTRAINT "patent_search_report_patent_id_fkey" FOREIGN KEY ("patent_id") REFERENCES "public"."patent_utility_model_application"("patent_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patent_utility_model_application" ADD CONSTRAINT "patent_utility_model_application_disclosure_id_fkey" FOREIGN KEY ("disclosure_id") REFERENCES "public"."ip_disclosure"("disclosure_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_review" ADD CONSTRAINT "phase_review_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "public"."application_phase"("phase_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_review" ADD CONSTRAINT "phase_review_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."user_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_review_attachment" ADD CONSTRAINT "phase_review_attachment_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "public"."phase_review"("review_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "substantial_use" ADD CONSTRAINT "substantial_use_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_secret_application" ADD CONSTRAINT "trade_secret_application_disclosure_id_fkey" FOREIGN KEY ("disclosure_id") REFERENCES "public"."ip_disclosure"("disclosure_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trademark_application" ADD CONSTRAINT "trademark_application_disclosure_id_fkey" FOREIGN KEY ("disclosure_id") REFERENCES "public"."ip_disclosure"("disclosure_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_deed_of_assignment_status" ON "deed_of_assignment" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_deed_of_assignment_user" ON "deed_of_assignment" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_patent_matrix_sample_disclosure_id" ON "patent_matrix_sample" USING btree ("disclosure_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_patent_matrix_sample_patent_id" ON "patent_matrix_sample" USING btree ("patent_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_phase_review_date" ON "phase_review" USING btree ("review_date" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_phase_review_phase_id" ON "phase_review" USING btree ("phase_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_phase_review_reviewer" ON "phase_review" USING btree ("reviewer_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_phase_review_status" ON "phase_review" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_substantial_use_status" ON "substantial_use" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_substantial_use_user" ON "substantial_use" USING btree ("user_id" uuid_ops);--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copyright_applicant" ADD CONSTRAINT "copyright_applicant_transaction_detail_id_fkey" FOREIGN KEY ("transaction_detail_id") REFERENCES "public"."copyright_transaction_part2"("transaction_part2_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copyright_author_creator" ADD CONSTRAINT "copyright_author_creator_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "public"."copyright_applicant"("applicant_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copyright_author_creator" ADD CONSTRAINT "copyright_author_creator_transaction_detail_id_fkey" FOREIGN KEY ("transaction_detail_id") REFERENCES "public"."copyright_transaction_part2"("transaction_part2_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" ADD CONSTRAINT "copyright_transaction_part2_new_copyright_id_fkey" FOREIGN KEY ("copyright_id") REFERENCES "public"."copyright_basic_application"("copyright_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" ADD CONSTRAINT "copyright_transaction_part2_new_disclosure_id_fkey" FOREIGN KEY ("disclosure_id") REFERENCES "public"."ip_disclosure"("disclosure_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copyright_work_creation" ADD CONSTRAINT "copyright_work_creation_transaction_detail_id_fkey" FOREIGN KEY ("transaction_detail_id") REFERENCES "public"."copyright_transaction_part2"("transaction_part2_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_client_profile_email" ON "client_profile" USING btree ("email" text_ops);--> statement-breakpoint
CREATE INDEX "idx_client_profile_user" ON "client_profile" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_copyright_transaction_part2_new_copyright" ON "copyright_transaction_part2" USING btree ("copyright_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_copyright_transaction_part2_new_disclosure" ON "copyright_transaction_part2" USING btree ("disclosure_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_ip_disclosure_client" ON "ip_disclosure" USING btree ("client_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_ip_disclosure_status" ON "ip_disclosure" USING btree ("status" text_ops);--> statement-breakpoint
ALTER TABLE "ip_disclosure" DROP COLUMN "submission_date";--> statement-breakpoint
ALTER TABLE "ip_disclosure" DROP COLUMN "last_updated";--> statement-breakpoint
ALTER TABLE "client_profile" ADD CONSTRAINT "check_citizenship_jsonb" CHECK ((citizenship ->> 'value'::text) = ANY (ARRAY['filipino'::text, 'other'::text]));--> statement-breakpoint
ALTER TABLE "client_profile" ADD CONSTRAINT "check_gender_jsonb" CHECK ((gender ->> 'value'::text) = ANY (ARRAY['male'::text, 'female'::text, 'prefer_not_to_say'::text]));--> statement-breakpoint
ALTER TABLE "client_profile" ADD CONSTRAINT "check_highest_degree_jsonb" CHECK ((highest_degree ->> 'value'::text) = ANY (ARRAY['bachelor'::text, 'master'::text, 'doctorate'::text, 'other'::text]));--> statement-breakpoint
ALTER TABLE "client_profile" ADD CONSTRAINT "client_profile_age_check" CHECK (age > 0);--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" ADD CONSTRAINT "check_transaction_type" CHECK ((transaction_data->'transactionType')::jsonb ?| array['anonymousWork', 'correctionEntry', 'resaleRights', 'certifiedCopy', 'recordation', 'reconstitution']);--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" ADD CONSTRAINT "check_submission_type" CHECK ((transaction_data->'submissionType')::jsonb ?| array['filingMethod', 'filingType']);--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" ADD CONSTRAINT "check_applicant_type" CHECK ((transaction_data->'applicantType')::jsonb ?| array['agent', 'copyrightClaimant', 'licensee', 'heir', 'newOwner']);--> statement-breakpoint
ALTER TABLE "public"."activity_log" ALTER COLUMN "activity_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE IF EXISTS "public"."activity_type";--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_type') THEN
		CREATE TYPE "public"."activity_type" AS ENUM('update', 'comment', 'status_change');
	END IF;
END $$;--> statement-breakpoint
ALTER TABLE "public"."activity_log" ALTER COLUMN "activity_type" SET DATA TYPE "public"."activity_type" USING "activity_type"::"public"."activity_type";
