CREATE TABLE "copyright_applicant" (
	"applicant_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_detail_id" uuid,
	"first_name" varchar(100) NOT NULL,
	"middle_name" varchar(100),
	"last_name" varchar(100) NOT NULL,
	"citizenship" varchar(100) NOT NULL,
	"address" text NOT NULL,
	"contact_number" varchar(20),
	"email" varchar(255) NOT NULL,
	"is_author" boolean DEFAULT false,
	"is_copyright_owner" boolean DEFAULT false,
	"is_authorized_representative" boolean DEFAULT false,
	"relationship_to_author" varchar(100),
	"tin_number" varchar(20),
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
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
CREATE TABLE "copyright_author_creator" (
	"author_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_detail_id" uuid,
	"is_same_as_applicant" boolean DEFAULT false,
	"applicant_id" uuid,
	"first_name" varchar(100),
	"middle_name" varchar(100),
	"last_name" varchar(100),
	"pseudonym" varchar(100),
	"citizenship" varchar(100),
	"address" text,
	"contact_number" varchar(20),
	"email" varchar(255),
	"contribution_type" varchar(100),
	"is_deceased" boolean DEFAULT false,
	"date_of_death" date,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "author_details_check" CHECK (((is_same_as_applicant = true) AND (applicant_id IS NOT NULL)) OR ((is_same_as_applicant = false) AND (first_name IS NOT NULL) AND (last_name IS NOT NULL)))
);
--> statement-breakpoint
CREATE TABLE "copyright_work_creation" (
	"work_creation_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_detail_id" uuid,
	"title" varchar(255) NOT NULL,
	"date_of_creation" date NOT NULL,
	"place_of_creation" varchar(255) NOT NULL,
	"classification_of_work" char(1) NOT NULL,
	"is_local_submission" boolean DEFAULT true,
	"is_foreign_submission" boolean DEFAULT false,
	"is_registered" boolean DEFAULT false,
	"registered_with_ipophl" boolean DEFAULT false,
	"registered_with_nlp" boolean DEFAULT false,
	"is_published" boolean DEFAULT false,
	"publisher_info" text,
	"is_derivative_work" boolean DEFAULT false,
	"original_work_info" text,
	"is_indigenous_knowledge" boolean DEFAULT false,
	"indigenous_source_info" text,
	"is_government_funded" boolean DEFAULT false,
	"funding_agency" varchar(255),
	"is_regular_duty_work" boolean DEFAULT false,
	"employer_info" text,
	"is_claiming_entire_work" boolean DEFAULT true,
	"partial_rights_details" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "matrix_feature" (
	"feature_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"matrix_id" uuid,
	"feature_description" text NOT NULL,
	"analysis_data" jsonb
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
CREATE TABLE "matrix_prior_art" (
	"prior_art_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"matrix_id" uuid,
	"title" varchar(255) NOT NULL,
	"reference_number" varchar(100),
	"publication_date" date,
	"relevance_description" text
);
--> statement-breakpoint
CREATE TABLE "patent_basic_application" (
	"patent_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"disclosure_id" uuid,
	"technology_type" jsonb NOT NULL,
	"technology_field" jsonb NOT NULL,
	"invention_title" varchar(255) NOT NULL,
	"technical_problem" text NOT NULL,
	"technical_solution" text NOT NULL,
	"technical_field" text NOT NULL,
	"background_art" text NOT NULL,
	"invention_summary" text NOT NULL,
	"advantages" text NOT NULL,
	"industrial_applicability" text NOT NULL,
	"drawing_description" text,
	"best_mode" text,
	"own_publications" text,
	"patent_type" varchar(20),
	"status" varchar(50) DEFAULT 'draft',
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "patent_basic_application_patent_type_check" CHECK ((patent_type)::text = ANY ((ARRAY['patent'::character varying, 'utility_model'::character varying])::text[]))
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
CREATE TABLE "patent_matrix" (
	"matrix_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patent_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
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
CREATE TABLE "task_assignment" (
	"assignment_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"staff_id" uuid NOT NULL,
	"assigned_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"status" varchar(50) DEFAULT 'pending',
	CONSTRAINT "task_assignment_task_id_staff_id_key" UNIQUE("task_id","staff_id"),
	CONSTRAINT "task_assignment_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'completed'::character varying, 'rejected'::character varying])::text[]))
);
--> statement-breakpoint
ALTER TABLE "documents_validation" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "form_data_mapping" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "form_submission_registry" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "internal_validation_assignee" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ip_application_enrollment" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ip_application_notification" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "other_documents" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "phase_task_assignee" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "documents_validation" CASCADE;--> statement-breakpoint
DROP TABLE "form_data_mapping" CASCADE;--> statement-breakpoint
DROP TABLE "form_submission_registry" CASCADE;--> statement-breakpoint
DROP TABLE "internal_validation_assignee" CASCADE;--> statement-breakpoint
DROP TABLE "ip_application_enrollment" CASCADE;--> statement-breakpoint
DROP TABLE "ip_application_notification" CASCADE;--> statement-breakpoint
DROP TABLE "other_documents" CASCADE;--> statement-breakpoint
DROP TABLE "phase_task_assignee" CASCADE;--> statement-breakpoint
ALTER TABLE "archives" DROP CONSTRAINT "archives_application_id_unique";--> statement-breakpoint
ALTER TABLE "client_profile" DROP CONSTRAINT "unique_client_profile_per_application";--> statement-breakpoint
ALTER TABLE "phase_reminder" DROP CONSTRAINT "phase_reminder_phase_id_key";--> statement-breakpoint
ALTER TABLE "application_phase" DROP CONSTRAINT "ck_phase_status";--> statement-breakpoint
ALTER TABLE "calendar_event" DROP CONSTRAINT "calendar_event_event_type_check";--> statement-breakpoint
ALTER TABLE "calendar_event" DROP CONSTRAINT "calendar_event_status_check";--> statement-breakpoint
ALTER TABLE "contact_message" DROP CONSTRAINT "contact_message_status_check";--> statement-breakpoint
ALTER TABLE "deed_of_assignment" DROP CONSTRAINT "deed_of_assignment_status_check";--> statement-breakpoint
ALTER TABLE "digital_signature" DROP CONSTRAINT "digital_signature_signer_type_check";--> statement-breakpoint
ALTER TABLE "document_management" DROP CONSTRAINT "document_management_entity_type_check";--> statement-breakpoint
ALTER TABLE "document_management" DROP CONSTRAINT "document_status_check";--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT "document_type_check";--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT "document_category_check";--> statement-breakpoint
ALTER TABLE "event_participant" DROP CONSTRAINT "event_participant_status_check";--> statement-breakpoint
ALTER TABLE "external_collaboration" DROP CONSTRAINT "reminder_day_check";--> statement-breakpoint
ALTER TABLE "external_collaboration" DROP CONSTRAINT "reminder_type_check";--> statement-breakpoint
ALTER TABLE "external_collaboration" DROP CONSTRAINT "external_collaboration_status_check";--> statement-breakpoint
ALTER TABLE "internal_validation" DROP CONSTRAINT "internal_validation_status_check";--> statement-breakpoint
ALTER TABLE "internal_validation" DROP CONSTRAINT "internal_validation_validator_role_check";--> statement-breakpoint
ALTER TABLE "ip_application" DROP CONSTRAINT "ck_commercialization";--> statement-breakpoint
ALTER TABLE "ip_contributors" DROP CONSTRAINT "ip_contributors_role_check";--> statement-breakpoint
ALTER TABLE "ip_details" DROP CONSTRAINT "ip_details_commercialization_status_check";--> statement-breakpoint
ALTER TABLE "ip_disclosure_review" DROP CONSTRAINT "ip_disclosure_review_status_check";--> statement-breakpoint
ALTER TABLE "notification" DROP CONSTRAINT "notification_status_check";--> statement-breakpoint
ALTER TABLE "notification" DROP CONSTRAINT "notification_type_check";--> statement-breakpoint
ALTER TABLE "patent_utility_model_application" DROP CONSTRAINT "patent_utility_model_application_type_check";--> statement-breakpoint
ALTER TABLE "phase_reminder" DROP CONSTRAINT "reminder_day_check";--> statement-breakpoint
ALTER TABLE "phase_reminder" DROP CONSTRAINT "reminder_type_check";--> statement-breakpoint
ALTER TABLE "phase_review" DROP CONSTRAINT "review_status_check";--> statement-breakpoint
ALTER TABLE "phase_task" DROP CONSTRAINT "task_priority_check";--> statement-breakpoint
ALTER TABLE "phase_task" DROP CONSTRAINT "task_status_check";--> statement-breakpoint
ALTER TABLE "substantial_use" DROP CONSTRAINT "substantial_use_status_check";--> statement-breakpoint
ALTER TABLE "activity_log" DROP CONSTRAINT "fk_activity_log_user";
--> statement-breakpoint
ALTER TABLE "archives" DROP CONSTRAINT "fk_archive_user";
--> statement-breakpoint
ALTER TABLE "calendar_event" DROP CONSTRAINT "calendar_event_application_id_fkey";
--> statement-breakpoint
ALTER TABLE "client_profile" DROP CONSTRAINT "client_profile_ip_application_id_fkey";
--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT "documents_project_id_fkey";
--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT "documents_uploaded_by_fkey";
--> statement-breakpoint
ALTER TABLE "event_participant" DROP CONSTRAINT "event_participant_event_id_fkey";
--> statement-breakpoint
ALTER TABLE "ip_application" DROP CONSTRAINT "fk_application_user";
--> statement-breakpoint
ALTER TABLE "ip_disclosure" DROP CONSTRAINT "ip_disclosure_application_id_fkey";
--> statement-breakpoint
ALTER TABLE "ip_disclosure_review" DROP CONSTRAINT "ip_disclosure_review_reviewer_id_fkey";
--> statement-breakpoint
ALTER TABLE "phase_review" DROP CONSTRAINT "phase_review_reviewer_id_fkey";
--> statement-breakpoint
DROP INDEX "idx_client_profile_application";--> statement-breakpoint
DROP INDEX "idx_ip_disclosure_application";--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" ALTER COLUMN "transaction_details" SET DEFAULT '{"ipsoRegion":"","bulkFilingQty":"","submissionType":{"filingMethod":{"throughIPSO":false,"electronicFiling":false},"filingType":{"singleFiling":false,"bulkFiling":false}},"transactionType":{"recordation":false,"resaleRights":false,"anonymousWork":false,"certifiedCopy":false,"reconstitution":false,"correctionEntry":false,"copyrightRegistration":true},"otherCertifications":"","numberOfCertificates":""}'::jsonb;--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" ALTER COLUMN "applicant_info" SET DEFAULT '{"personalInfo":{"surname":"","firstName":"","middleName":"","companyName":"","dateOfBirth":null,"civilStatus":null,"sex":null,"nationality":"","countryOfResidence":"","address":"","municipalityCity":"","provinceState":"","zipCode":"","mobileNumber":"","emailAddress":""},"entityType":"","applicantType":{"authorCreator":false,"agent":false,"copyrightClaimant":false,"licensee":false,"heir":false,"newOwner":false}}'::jsonb;--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" ALTER COLUMN "author_info" SET DEFAULT '{"isSameAsApplicant":false,"sameAsApplicant":false,"personalInfo":{"surname":"","firstName":"","middleName":"","dateOfBirth":null,"civilStatus":null,"sex":null,"nationality":"","countryOfResidence":"","address":"","municipalityCity":"","provinceState":"","zipCode":"","mobileNumber":"","emailAddress":""},"authors":[]}'::jsonb;--> statement-breakpoint
ALTER TABLE "phase_reminder" ALTER COLUMN "reminder_time" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "application_phase" ADD COLUMN "progress" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "application_phase" ADD COLUMN "order_index" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "calendar_event" DROP CONSTRAINT IF EXISTS "calendar_event_pkey";--> statement-breakpoint
ALTER TABLE "calendar_event" ADD COLUMN IF NOT EXISTS "event_id" uuid;--> statement-breakpoint
UPDATE "calendar_event" SET "event_id" = gen_random_uuid() WHERE "event_id" IS NULL;--> statement-breakpoint
ALTER TABLE "calendar_event" ALTER COLUMN "event_id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "calendar_event" ALTER COLUMN "event_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_pkey" PRIMARY KEY ("event_id");--> statement-breakpoint
ALTER TABLE "calendar_event" ADD COLUMN "priority" varchar(20);--> statement-breakpoint
ALTER TABLE "calendar_event" ADD COLUMN "application_id" uuid;--> statement-breakpoint
ALTER TABLE "calendar_event" ADD COLUMN "phase_id" uuid;--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" ADD COLUMN "work_creation_form" jsonb DEFAULT '{"title":"","dateOfCreation":"","placeOfCreation":"","classificationOfWork":"","submissionType":{"isLocal":true,"isForeign":false},"registrationStatus":{"isRegistered":false,"registrationOffice":{"withIPOPHL":false,"withNLP":false}},"publicationStatus":{"isPublished":"NO","publisherInfo":""},"derivativeWork":{"isDerivative":"NO","originalWorkInfo":""},"indigenousKnowledge":{"isIndigenous":"NO","sourceInfo":""},"governmentFunded":{"isFunded":"NO","fundingAgency":""},"regularDuties":{"isRegularDuty":"NO","employer":""},"rightsClaim":{"isClaimingEntireWork":"YES","partialRights":""}}'::jsonb;--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" ADD COLUMN "documents_submitted" jsonb DEFAULT '{"electronicCopy":false,"governmentId":false,"deedOfAssignment":false,"marriageCertificate":false,"specialPowerOfAttorney":false,"boardResolution":false,"secretaryCertificate":false,"ipophlCertificate":false,"others":{"checked":false,"value":""},"files":{}}'::jsonb;--> statement-breakpoint
ALTER TABLE "copyright_transaction_part2" ADD COLUMN "signature" jsonb DEFAULT '{"agree":false,"signatureType":"upload","signatureData":"","firstName":"","middleInitial":"","lastName":"","signatureFile":[]}'::jsonb;--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "documents_pkey";--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "document_id" uuid;--> statement-breakpoint
UPDATE "documents" SET "document_id" = gen_random_uuid() WHERE "document_id" IS NULL;--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "document_id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "document_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_pkey" PRIMARY KEY ("document_id");--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "phase_id" uuid;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "file_path" text NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "status" varchar(50) DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "uploaded_at" timestamp DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "verified_by" uuid;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "verified_at" timestamp;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "remarks" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "validation_status" varchar(50);--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "validation_date" timestamp;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "validated_by" uuid;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "validation_remarks" text;--> statement-breakpoint
ALTER TABLE "external_collaboration" ADD COLUMN "office" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "internal_validation" ADD COLUMN "document_id" uuid;--> statement-breakpoint
ALTER TABLE "internal_validation" ADD COLUMN "assigned_to" uuid;--> statement-breakpoint
ALTER TABLE "phase_reminder" DROP CONSTRAINT IF EXISTS "phase_reminder_pkey";--> statement-breakpoint
ALTER TABLE "phase_reminder" ADD COLUMN IF NOT EXISTS "reminder_id" uuid;--> statement-breakpoint
UPDATE "phase_reminder" SET "reminder_id" = gen_random_uuid() WHERE "reminder_id" IS NULL;--> statement-breakpoint
ALTER TABLE "phase_reminder" ALTER COLUMN "reminder_id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "phase_reminder" ALTER COLUMN "reminder_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "phase_reminder" ADD CONSTRAINT "phase_reminder_pkey" PRIMARY KEY ("reminder_id");--> statement-breakpoint
ALTER TABLE "phase_reminder" ADD COLUMN "frequency" varchar(20);--> statement-breakpoint
ALTER TABLE "phase_reminder" ADD COLUMN "custom_days" integer;--> statement-breakpoint
ALTER TABLE "phase_reminder" ADD COLUMN "is_active" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "phase_task" ADD COLUMN "completed" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "phase_task" ADD COLUMN "assignee_id" uuid;--> statement-breakpoint
ALTER TABLE "substantial_use" ADD COLUMN "source_id" uuid;--> statement-breakpoint
ALTER TABLE "copyright_applicant" ADD CONSTRAINT "copyright_applicant_transaction_detail_id_fkey" FOREIGN KEY ("transaction_detail_id") REFERENCES "public"."copyright_transaction_part2"("transaction_part2_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copyright_application" ADD CONSTRAINT "copyright_application_disclosure_id_fkey" FOREIGN KEY ("disclosure_id") REFERENCES "public"."ip_disclosure"("disclosure_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copyright_author_creator" ADD CONSTRAINT "copyright_author_creator_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "public"."copyright_applicant"("applicant_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copyright_author_creator" ADD CONSTRAINT "copyright_author_creator_transaction_detail_id_fkey" FOREIGN KEY ("transaction_detail_id") REFERENCES "public"."copyright_transaction_part2"("transaction_part2_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copyright_work_creation" ADD CONSTRAINT "copyright_work_creation_transaction_detail_id_fkey" FOREIGN KEY ("transaction_detail_id") REFERENCES "public"."copyright_transaction_part2"("transaction_part2_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matrix_feature" ADD CONSTRAINT "matrix_feature_matrix_id_fkey" FOREIGN KEY ("matrix_id") REFERENCES "public"."patent_matrix"("matrix_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matrix_features" ADD CONSTRAINT "matrix_features_matrix_id_fkey" FOREIGN KEY ("matrix_id") REFERENCES "public"."patent_matrix_sample"("matrix_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matrix_prior_art" ADD CONSTRAINT "matrix_prior_art_matrix_id_fkey" FOREIGN KEY ("matrix_id") REFERENCES "public"."patent_matrix"("matrix_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patent_basic_application" ADD CONSTRAINT "patent_basic_application_disclosure_id_fkey" FOREIGN KEY ("disclosure_id") REFERENCES "public"."ip_disclosure"("disclosure_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patent_inventors" ADD CONSTRAINT "patent_inventors_patent_id_fkey" FOREIGN KEY ("patent_id") REFERENCES "public"."patent_utility_model_application"("patent_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patent_matrix" ADD CONSTRAINT "patent_matrix_patent_id_fkey" FOREIGN KEY ("patent_id") REFERENCES "public"."patent_basic_application"("patent_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patent_search_documents" ADD CONSTRAINT "patent_search_documents_search_id_fkey" FOREIGN KEY ("search_id") REFERENCES "public"."patent_search_report"("search_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_assignment" ADD CONSTRAINT "task_assignment_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_assignment" ADD CONSTRAINT "task_assignment_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."phase_task"("task_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "fk_activity_log_user" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "archives" ADD CONSTRAINT "fk_archive_user" FOREIGN KEY ("archived_by") REFERENCES "public"."user_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "public"."application_phase"("phase_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."ip_application"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."ip_application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "public"."application_phase"("phase_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "public"."user_account"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_participant" ADD CONSTRAINT "event_participant_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."calendar_event"("event_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_validation" ADD CONSTRAINT "internal_validation_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_validation" ADD CONSTRAINT "internal_validation_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("document_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ip_application" ADD CONSTRAINT "fk_application_user" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ip_disclosure_review" ADD CONSTRAINT "ip_disclosure_review_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."user_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_review" ADD CONSTRAINT "phase_review_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."user_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_task" ADD CONSTRAINT "phase_task_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_copyright_transaction_part2_new_copyright" ON "copyright_transaction_part2" USING btree ("copyright_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_copyright_transaction_part2_new_disclosure" ON "copyright_transaction_part2" USING btree ("disclosure_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_documents_validation" ON "documents" USING btree ("validation_status" text_ops);--> statement-breakpoint
ALTER TABLE "calendar_event" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "calendar_event" DROP COLUMN "project_id";--> statement-breakpoint
ALTER TABLE "calendar_event" DROP COLUMN "other_event_type";--> statement-breakpoint
ALTER TABLE "calendar_event" DROP COLUMN "is_all_day";--> statement-breakpoint
ALTER TABLE "client_profile" DROP COLUMN "ip_application_id";--> statement-breakpoint
ALTER TABLE "client_profile" DROP COLUMN "has_company";--> statement-breakpoint
ALTER TABLE "client_profile" DROP COLUMN "college_name";--> statement-breakpoint
ALTER TABLE "client_profile" DROP COLUMN "department_name";--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "file_name";--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "external_collaboration" DROP COLUMN "office_name";--> statement-breakpoint
ALTER TABLE "external_collaboration" DROP COLUMN "reminder_type";--> statement-breakpoint
ALTER TABLE "external_collaboration" DROP COLUMN "reminder_day";--> statement-breakpoint
ALTER TABLE "external_collaboration" DROP COLUMN "reminder_time";--> statement-breakpoint
ALTER TABLE "external_collaboration" DROP COLUMN "file_name";--> statement-breakpoint
ALTER TABLE "external_collaboration" DROP COLUMN "file_type";--> statement-breakpoint
ALTER TABLE "external_collaboration" DROP COLUMN "file_size";--> statement-breakpoint
ALTER TABLE "internal_validation" DROP COLUMN "file_name";--> statement-breakpoint
ALTER TABLE "internal_validation" DROP COLUMN "file_type";--> statement-breakpoint
ALTER TABLE "internal_validation" DROP COLUMN "file_size";--> statement-breakpoint
ALTER TABLE "internal_validation" DROP COLUMN "title";--> statement-breakpoint
ALTER TABLE "ip_disclosure" DROP COLUMN "application_id";--> statement-breakpoint
ALTER TABLE "phase_reminder" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "phase_reminder" DROP COLUMN "reminder_type";--> statement-breakpoint
ALTER TABLE "phase_reminder" DROP COLUMN "reminder_day";--> statement-breakpoint
ALTER TABLE "application_phase" ADD CONSTRAINT "ck_phase_progress" CHECK ((progress >= 0) AND (progress <= 100));--> statement-breakpoint
ALTER TABLE "application_phase" ADD CONSTRAINT "ck_phase_status" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'active'::character varying, 'completed'::character varying, 'blocked'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_priority_check" CHECK ((priority)::text = ANY ((ARRAY['high'::character varying, 'medium'::character varying, 'low'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_event_type_check" CHECK ((event_type)::text = ANY ((ARRAY['meeting'::character varying, 'deadline'::character varying, 'review'::character varying, 'other'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_status_check" CHECK ((status)::text = ANY ((ARRAY['scheduled'::character varying, 'in-progress'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "contact_message" ADD CONSTRAINT "contact_message_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'in-progress'::character varying, 'resolved'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "deed_of_assignment" ADD CONSTRAINT "deed_of_assignment_status_check" CHECK ((status)::text = ANY ((ARRAY['draft'::character varying, 'submitted'::character varying, 'approved'::character varying, 'rejected'::character varying, 'pending_revision'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "digital_signature" ADD CONSTRAINT "digital_signature_signer_type_check" CHECK ((signer_type)::text = ANY ((ARRAY['author'::character varying, 'applicant'::character varying, 'representative'::character varying, 'staff'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "document_management" ADD CONSTRAINT "document_management_entity_type_check" CHECK ((entity_type)::text = ANY ((ARRAY['application'::character varying, 'phase'::character varying, 'task'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "document_management" ADD CONSTRAINT "document_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "document_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'verified'::character varying, 'rejected'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "document_validation_status_check" CHECK ((validation_status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'needs_revision'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "document_category_check" CHECK ((category)::text = ANY ((ARRAY['forms'::character varying, 'attachments'::character varying, 'requirements'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "event_participant" ADD CONSTRAINT "event_participant_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'declined'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "external_collaboration" ADD CONSTRAINT "external_collaboration_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'in_progress'::character varying, 'completed'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "internal_validation" ADD CONSTRAINT "internal_validation_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "internal_validation" ADD CONSTRAINT "internal_validation_validator_role_check" CHECK ((validator_role)::text = ANY ((ARRAY['superadmin'::character varying, 'director'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "ip_application" ADD CONSTRAINT "ck_commercialization" CHECK ((commercialization_status)::text = ANY ((ARRAY['not_licensed'::character varying, 'licensed'::character varying, 'in_negotiation'::character varying, 'technology_transfer'::character varying, 'internal_use'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "ip_contributors" ADD CONSTRAINT "ip_contributors_role_check" CHECK ((role)::text = ANY ((ARRAY['inventor'::character varying, 'author'::character varying, 'applicant'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "ip_details" ADD CONSTRAINT "ip_details_commercialization_status_check" CHECK ((commercialization_status)::text = ANY ((ARRAY['not_licensed'::character varying, 'licensed'::character varying, 'in_negotiation'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "ip_disclosure_review" ADD CONSTRAINT "ip_disclosure_review_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'needs_revision'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_status_check" CHECK ((status)::text = ANY ((ARRAY['read'::character varying, 'unread'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_type_check" CHECK ((type)::text = ANY ((ARRAY['info'::character varying, 'warning'::character varying, 'success'::character varying, 'error'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "patent_utility_model_application" ADD CONSTRAINT "patent_utility_model_application_type_check" CHECK ((type)::text = ANY ((ARRAY['patent'::character varying, 'utility_model'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "phase_reminder" ADD CONSTRAINT "phase_reminder_frequency_check" CHECK ((frequency)::text = ANY ((ARRAY['daily'::character varying, 'weekly'::character varying, 'custom'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "phase_review" ADD CONSTRAINT "review_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'needs_revision'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "phase_task" ADD CONSTRAINT "task_priority_check" CHECK ((priority)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "phase_task" ADD CONSTRAINT "task_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'blocked'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "substantial_use" ADD CONSTRAINT "substantial_use_status_check" CHECK ((status)::text = ANY ((ARRAY['draft'::character varying, 'submitted'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[]));--> statement-breakpoint
ALTER TABLE "public"."ip_application" ALTER COLUMN "ip_type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "public"."ip_disclosure_attachment" ALTER COLUMN "ip_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."application_type";--> statement-breakpoint
CREATE TYPE "public"."application_type" AS ENUM('patent', 'copyright', 'trademark', 'utility_model');--> statement-breakpoint
ALTER TABLE "public"."ip_application" ALTER COLUMN "ip_type" SET DATA TYPE "public"."application_type" USING "ip_type"::"public"."application_type";--> statement-breakpoint
ALTER TABLE "public"."ip_disclosure_attachment" ALTER COLUMN "ip_type" SET DATA TYPE "public"."application_type" USING "ip_type"::"public"."application_type";--> statement-breakpoint
DROP TYPE "public"."form_source_type";--> statement-breakpoint
DROP TYPE "public"."form_submission_status";
