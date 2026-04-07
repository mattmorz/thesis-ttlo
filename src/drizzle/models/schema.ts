import {
  pgTable,
  index,
  foreignKey,
  check,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  jsonb,
  date,
  boolean,
  unique,
  char,
  time,
  primaryKey,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const activityType = pgEnum("activity_type", [
  "update",
  "comment",
  "status_change",
]);
export const applicationStatus = pgEnum("application_status", [
  "draft",
  "pending",
  "in_progress",
  "approved",
  "rejected",
  "completed",
  "archived",
]);
export const applicationType = pgEnum("application_type", [
  "patent",
  "copyright",
  "trademark",
  "utility_model",
]);
export const ipDisclosureStatus = pgEnum("ip_disclosure_status", [
  "draft",
  "submitted",
  "under_review",
  "approved",
  "rejected",
  "needs_revision",
]);
export const userRole = pgEnum("user_role", ["admin", "ttlo_staff", "client"]);

export const clientProfile = pgTable(
  "client_profile",
  {
    clientId: uuid("client_id").defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id"),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    middleName: varchar("middle_name", { length: 100 }),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    contactNumber: varchar("contact_number", { length: 20 }),
    email: varchar("email", { length: 255 }).notNull(),
    mailingAddress: text("mailing_address"),
    companyName: varchar("company_name", { length: 255 }),
    companyEmail: varchar("company_email", { length: 255 }),
    occupation: varchar("occupation", { length: 255 }),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    updatedAt: timestamp("updated_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    age: integer(),
    companyStreet: text("company_street"),
    companyBarangay: text("company_barangay"),
    companyCityMunicipality: text("company_city_municipality"),
    companyProvince: text("company_province"),
    degree: varchar("degree", { length: 255 }),
    profession: varchar("profession", { length: 255 }),
    publishedResearch: jsonb("published_research").default({ value: "no" }),
    developedMaterials: jsonb("developed_materials").default({ value: "no" }),
    ipExperience: jsonb("ip_experience"),
    status: varchar("status", { length: 20 }).default("draft"),
    gender: jsonb(),
    citizenship: jsonb(),
    highestDegree: jsonb("highest_degree"),
    familiarWithIpRights: jsonb("familiar_with_ip_rights"),
  },
  (table) => [
    index("idx_client_profile_email").using(
      "btree",
      table.email.asc().nullsLast().op("text_ops")
    ),
    index("idx_client_profile_user").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops")
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [userAccount.id],
      name: "client_profile_user_id_fkey",
    }).onDelete("cascade"),
    check(
      "check_citizenship_jsonb",
      sql`(citizenship ->> 'value'::text) = ANY (ARRAY['filipino'::text, 'other'::text])`
    ),
    check(
      "check_gender_jsonb",
      sql`(gender ->> 'value'::text) = ANY (ARRAY['male'::text, 'female'::text, 'prefer_not_to_say'::text])`
    ),
    check(
      "check_highest_degree_jsonb",
      sql`(highest_degree ->> 'value'::text) = ANY (ARRAY['bachelor'::text, 'master'::text, 'doctorate'::text, 'other'::text])`
    ),
    check("client_profile_age_check", sql`age > 0`),
  ]
);

export const substantialUse = pgTable(
  "substantial_use",
  {
    substantialUseId: uuid("substantial_use_id")
      .defaultRandom()
      .primaryKey()
      .notNull(),
    userId: uuid("user_id"),
    researchTitle: varchar("research_title", { length: 255 }).notNull(),
    applicants: jsonb().default([]).notNull(),
    laboratoryFacilities: jsonb("laboratory_facilities").notNull(),
    fundingResources: jsonb("funding_resources").notNull(),
    remarks: text(),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    updatedAt: timestamp("updated_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    status: varchar("status", { length: 20 }).default("draft"),
    applicationId: uuid("application_id"),
    sourceId: uuid("source_id"), // Add sourceId field for form_submission_registry integration
  },
  (table) => [
    index("idx_substantial_use_status").using(
      "btree",
      table.status.asc().nullsLast().op("text_ops")
    ),
    index("idx_substantial_use_user").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops")
    ),
    index("idx_substantial_use_application").using(
      "btree",
      table.applicationId.asc().nullsLast().op("uuid_ops")
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [userAccount.id],
      name: "substantial_use_user_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.applicationId],
      foreignColumns: [ipApplication.id],
      name: "substantial_use_application_id_fkey",
    }).onDelete("set null"),
    check(
      "substantial_use_status_check",
      sql`(status)::text = ANY ((ARRAY['draft'::character varying, 'submitted'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])`
    ),
  ]
);

export const clientProfileBackup = pgTable("client_profile_backup", {
  clientId: uuid("client_id"),
  userId: uuid("user_id"),
  firstName: varchar("first_name", { length: 100 }),
  middleName: varchar("middle_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  contactNumber: varchar("contact_number", { length: 20 }),
  email: varchar("email", { length: 255 }),
  mailingAddress: text("mailing_address"),
  companyName: varchar("company_name", { length: 255 }),
  companyEmail: varchar("company_email", { length: 255 }),
  occupation: varchar("occupation", { length: 255 }),
  createdAt: timestamp("created_at", { mode: "string" }),
  updatedAt: timestamp("updated_at", { mode: "string" }),
  age: integer(),
  companyStreet: text("company_street"),
  companyBarangay: text("company_barangay"),
  companyCityMunicipality: text("company_city_municipality"),
  companyProvince: text("company_province"),
  degree: varchar("degree", { length: 255 }),
  profession: varchar("profession", { length: 255 }),
  publishedResearch: varchar("published_research", { length: 20 }),
  developedMaterials: varchar("developed_materials", { length: 20 }),
  ipExperience: jsonb("ip_experience"),
  status: varchar("status", { length: 20 }),
  gender: jsonb(),
  citizenship: jsonb(),
  highestDegree: jsonb("highest_degree"),
  familiarWithIpRights: jsonb("familiar_with_ip_rights"),
});

export const deedOfAssignment = pgTable(
  "deed_of_assignment",
  {
    deedId: uuid("deed_id").defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id"),
    applicationId: uuid("application_id"),
    researchTitle: varchar("research_title", { length: 255 }),
    creators: jsonb().default([]).notNull(),
    creatorAddress: text("creator_address"),
    assigneeName: varchar("assignee_name", { length: 255 }).default(
      "CARAGA STATE UNIVERSITY"
    ),
    assigneeRepresentative: varchar("assignee_representative", {
      length: 255,
    }).default("ROLYN C. DAGUIL, Ph.D."),
    day: varchar({ length: 10 }),
    month: varchar({ length: 20 }),
    year: varchar({ length: 10 }),
    assigneeId: varchar("assignee_id", { length: 50 }).default("M98 – 009"),
    assigneeDate: varchar("assignee_date", { length: 50 }),
    assigneePlace: varchar("assignee_place", { length: 100 }).default(
      "Butuan City"
    ),
    notarizedDocumentPath: varchar("notarized_document_path", { length: 255 }),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    updatedAt: timestamp("updated_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    status: varchar({ length: 20 }).default("draft"),
    metadata: jsonb(),
    assignorId: varchar("assignor_id", { length: 50 }),
    assignorDate: varchar("assignor_date", { length: 50 }),
    assignorPlace: varchar("assignor_place", { length: 100 }).default(
      "Butuan City"
    ),
  },
  (table) => [
    index("idx_deed_of_assignment_status").using(
      "btree",
      table.status.asc().nullsLast().op("text_ops")
    ),
    index("idx_deed_of_assignment_user").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops")
    ),
    index("idx_deed_of_assignment_application").using(
      "btree",
      table.applicationId.asc().nullsLast().op("uuid_ops")
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [userAccount.id],
      name: "deed_of_assignment_user_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.applicationId],
      foreignColumns: [ipApplication.id],
      name: "deed_of_assignment_application_id_fkey",
    }).onDelete("cascade"),
    check(
      "deed_of_assignment_status_check",
      sql`(status)::text = ANY ((ARRAY['draft'::character varying, 'submitted'::character varying, 'approved'::character varying, 'rejected'::character varying, 'pending_revision'::character varying])::text[])`
    ),
  ]
);

export const ipDisclosureApplicant = pgTable(
  "ip_disclosure_applicant",
  {
    applicantId: uuid("applicant_id").defaultRandom().primaryKey().notNull(),
    disclosureId: uuid("disclosure_id").notNull(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    middleInitial: varchar("middle_initial", { length: 10 }),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    updatedAt: timestamp("updated_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
  },
  (table) => [
    foreignKey({
      columns: [table.disclosureId],
      foreignColumns: [ipDisclosure.disclosureId],
      name: "ip_disclosure_applicant_disclosure_id_fkey",
    }).onDelete("cascade"),
  ]
);

export const tradeSecretApplication = pgTable(
  "trade_secret_application",
  {
    tradeSecretId: uuid("trade_secret_id")
      .defaultRandom()
      .primaryKey()
      .notNull(),
    disclosureId: uuid("disclosure_id").notNull(),
    description: text().notNull(),
    confidentialityMeasures: text("confidentiality_measures").notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    updatedAt: timestamp("updated_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
  },
  (table) => [
    foreignKey({
      columns: [table.disclosureId],
      foreignColumns: [ipDisclosure.disclosureId],
      name: "trade_secret_application_disclosure_id_fkey",
    }).onDelete("cascade"),
  ]
);

export const ipDisclosureInventor = pgTable(
  "ip_disclosure_inventor",
  {
    inventorId: uuid("inventor_id").defaultRandom().primaryKey().notNull(),
    disclosureId: uuid("disclosure_id").notNull(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    middleInitial: varchar("middle_initial", { length: 10 }),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    updatedAt: timestamp("updated_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
  },
  (table) => [
    foreignKey({
      columns: [table.disclosureId],
      foreignColumns: [ipDisclosure.disclosureId],
      name: "ip_disclosure_inventor_disclosure_id_fkey",
    }).onDelete("cascade"),
  ]
);

export const trademarkApplication = pgTable(
  "trademark_application",
  {
    trademarkId: uuid("trademark_id").defaultRandom().primaryKey().notNull(),
    disclosureId: uuid("disclosure_id").notNull(),
    trademarkName: varchar("trademark_name", { length: 255 }).notNull(),
    description: text().notNull(),
    translation: text(),
    niceClassifications: text("nice_classifications").array().notNull(),
    businessType: jsonb("business_type")
      .default({ company: false, soleProprietor: false })
      .notNull(),
    legalName: varchar("legal_name", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    updatedAt: timestamp("updated_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
  },
  (table) => [
    foreignKey({
      columns: [table.disclosureId],
      foreignColumns: [ipDisclosure.disclosureId],
      name: "trademark_application_disclosure_id_fkey",
    }).onDelete("cascade"),
  ]
);

export const copyrightApplication = pgTable(
  "copyright_application",
  {
    copyrightId: uuid("copyright_id").defaultRandom().primaryKey().notNull(),
    disclosureId: uuid("disclosure_id").notNull(),
    title: varchar({ length: 255 }).notNull(),
    category: varchar({ length: 100 }).notNull(),
    creationDate: date("creation_date"),
    publicationStatus: varchar("publication_status", { length: 50 }),
    publicationDate: date("publication_date"),
    publicationCountry: varchar("publication_country", { length: 100 }),
    description: text().notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    updatedAt: timestamp("updated_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
  },
  (table) => [
    foreignKey({
      columns: [table.disclosureId],
      foreignColumns: [ipDisclosure.disclosureId],
      name: "copyright_application_disclosure_id_fkey",
    }).onDelete("cascade"),
  ]
);

export const patentUtilityModelApplication = pgTable(
  "patent_utility_model_application",
  {
    patentId: uuid("patent_id").defaultRandom().primaryKey().notNull(),
    disclosureId: uuid("disclosure_id").notNull(),
    title: varchar({ length: 255 }).notNull(),
    type: varchar({ length: 50 }).notNull(),
    technologyType: jsonb("technology_type")
      .default({
        process: false,
        product: false,
        material: false,
        software: false,
      })
      .notNull(),
    technologyField: jsonb("technology_field")
      .default({
        other: false,
        chemical: false,
        computer: false,
        electrical: false,
        mechanical: false,
        biotechnology: false,
        pharmaceutical: false,
      })
      .notNull(),
    problem: text().notNull(),
    solution: text().notNull(),
    comparison: text().notNull(),
    novelty: text().notNull(),
    variations: text(),
    usage: text().notNull(),
    literature_references: text("literature_references"),
    ownPublications: text("own_publications"),
    files: jsonb(),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    updatedAt: timestamp("updated_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
  },
  (table) => [
    foreignKey({
      columns: [table.disclosureId],
      foreignColumns: [ipDisclosure.disclosureId],
      name: "patent_utility_model_application_disclosure_id_fkey",
    }).onDelete("cascade"),
    check(
      "patent_utility_model_application_type_check",
      sql`(type)::text = ANY ((ARRAY['patent'::character varying, 'utility_model'::character varying])::text[])`
    ),
  ]
);

export const patentInventors = pgTable(
  "patent_inventors",
  {
    inventorId: uuid("inventor_id").defaultRandom().primaryKey().notNull(),
    patentId: uuid("patent_id").notNull(),
    name: varchar({ length: 255 }).notNull(),
    contribution: text().notNull(),
    affiliation: varchar({ length: 255 }),
    email: varchar({ length: 255 }),
    address: text(),
    isPrimaryInventor: boolean("is_primary_inventor").default(false),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    updatedAt: timestamp("updated_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
  },
  (table) => [
    foreignKey({
      columns: [table.patentId],
      foreignColumns: [patentUtilityModelApplication.patentId],
      name: "patent_inventors_patent_id_fkey",
    }).onDelete("cascade"),
  ]
);

export const patentSearchReport = pgTable(
  "patent_search_report",
  {
    searchId: uuid("search_id").defaultRandom().primaryKey().notNull(),
    disclosureId: uuid("disclosure_id").notNull(),
    patentId: uuid("patent_id").notNull(),
    searchStrings: jsonb("search_strings").notNull(),
    relevantDocuments: jsonb("relevant_documents").notNull(),
    searchDatabases: text("search_databases").array().notNull(),
    searchDate: date("search_date").notNull(),
    searchSummary: text("search_summary").notNull(),
    certification: jsonb()
      .default({
        submittedTo: { name: "", position: "Director, TILO Manager, ITSO" },
        certifierName: "",
        certifierPosition: "Director, TILO Manager, ITSO",
      })
      .notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    updatedAt: timestamp("updated_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
  },
  (table) => [
    foreignKey({
      columns: [table.disclosureId],
      foreignColumns: [ipDisclosure.disclosureId],
      name: "patent_search_report_disclosure_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.patentId],
      foreignColumns: [patentUtilityModelApplication.patentId],
      name: "patent_search_report_patent_id_fkey",
    }).onDelete("cascade"),
  ]
);

export const patentSearchDocuments = pgTable(
  "patent_search_documents",
  {
    documentId: uuid("document_id").defaultRandom().primaryKey().notNull(),
    searchId: uuid("search_id").notNull(),
    documentNumber: varchar("document_number", { length: 100 }),
    documentTitle: varchar("document_title", { length: 255 }).notNull(),
    publicationDate: date("publication_date"),
    applicantName: varchar("applicant_name", { length: 255 }),
    relevanceRating: integer("relevance_rating"),
    relevanceNotes: text("relevance_notes"),
    documentUrl: text("document_url"),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    updatedAt: timestamp("updated_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
  },
  (table) => [
    foreignKey({
      columns: [table.searchId],
      foreignColumns: [patentSearchReport.searchId],
      name: "patent_search_documents_search_id_fkey",
    }).onDelete("cascade"),
    check(
      "patent_search_documents_relevance_rating_check",
      sql`(relevance_rating >= 1) AND (relevance_rating <= 5)`
    ),
  ]
);

export const patentMatrixSample = pgTable(
  "patent_matrix_sample",
  {
    matrixId: uuid("matrix_id").defaultRandom().primaryKey().notNull(),
    disclosureId: uuid("disclosure_id").notNull(),
    patentId: uuid("patent_id").notNull(),
    inventionTitle: text("invention_title").notNull(),
    priorArts: jsonb("prior_arts").notNull(),
    features: jsonb().notNull(),
    matrixData: jsonb("matrix_data").notNull(),
    analysisSummary: text("analysis_summary").notNull(),
    conclusion: text().notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    updatedAt: timestamp("updated_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
  },
  (table) => [
    index("idx_patent_matrix_sample_disclosure_id").using(
      "btree",
      table.disclosureId.asc().nullsLast().op("uuid_ops")
    ),
    index("idx_patent_matrix_sample_patent_id").using(
      "btree",
      table.patentId.asc().nullsLast().op("uuid_ops")
    ),
    foreignKey({
      columns: [table.disclosureId],
      foreignColumns: [ipDisclosure.disclosureId],
      name: "patent_matrix_sample_disclosure_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.patentId],
      foreignColumns: [patentUtilityModelApplication.patentId],
      name: "patent_matrix_sample_patent_id_fkey",
    }).onDelete("cascade"),
  ]
);

export const matrixFeatures = pgTable(
  "matrix_features",
  {
    featureId: uuid("feature_id").defaultRandom().primaryKey().notNull(),
    matrixId: uuid("matrix_id").notNull(),
    featureDescription: text("feature_description").notNull(),
    isEssential: boolean("is_essential").default(false),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    updatedAt: timestamp("updated_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
  },
  (table) => [
    foreignKey({
      columns: [table.matrixId],
      foreignColumns: [patentMatrixSample.matrixId],
      name: "matrix_features_matrix_id_fkey",
    }).onDelete("cascade"),
  ]
);

export const disclosureConfirmation = pgTable(
  "disclosure_confirmation",
  {
    confirmationId: uuid("confirmation_id")
      .defaultRandom()
      .primaryKey()
      .notNull(),
    disclosureId: uuid("disclosure_id").notNull(),
    writtenDisclosures: jsonb("written_disclosures")
      .default({ past: false, planned: false, notApplicable: false })
      .notNull(),
    oralDisclosures: jsonb("oral_disclosures")
      .default({ past: false, planned: false, notApplicable: false })
      .notNull(),
    futureWork: text("future_work"),
    confirmationDeclaration: boolean("confirmation_declaration")
      .default(false)
      .notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    updatedAt: timestamp("updated_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
  },
  (table) => [
    foreignKey({
      columns: [table.disclosureId],
      foreignColumns: [ipDisclosure.disclosureId],
      name: "disclosure_confirmation_disclosure_id_fkey",
    }).onDelete("cascade"),
  ]
);

export const ipDisclosureAttachment = pgTable(
  "ip_disclosure_attachment",
  {
    attachmentId: uuid("attachment_id").defaultRandom().primaryKey().notNull(),
    disclosureId: uuid("disclosure_id").notNull(),
    ipType: applicationType("ip_type").notNull(),
    filePath: text("file_path").notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    fileType: varchar("file_type", { length: 50 }).notNull(),
    fileSize: integer("file_size").notNull(),
    description: text(),
    uploadedAt: timestamp("uploaded_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
  },
  (table) => [
    foreignKey({
      columns: [table.disclosureId],
      foreignColumns: [ipDisclosure.disclosureId],
      name: "ip_disclosure_attachment_disclosure_id_fkey",
    }).onDelete("cascade"),
  ]
);

export const ipDisclosureReview = pgTable(
  "ip_disclosure_review",
  {
    reviewId: uuid("review_id").defaultRandom().primaryKey().notNull(),
    disclosureId: uuid("disclosure_id").notNull(),
    reviewerId: uuid("reviewer_id").notNull(),
    status: varchar({ length: 50 }).notNull(),
    comments: text(),
    reviewDate: timestamp("review_date", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    updatedAt: timestamp("updated_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
  },
  (table) => [
    foreignKey({
      columns: [table.disclosureId],
      foreignColumns: [ipDisclosure.disclosureId],
      name: "ip_disclosure_review_disclosure_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.reviewerId],
      foreignColumns: [userAccount.id],
      name: "ip_disclosure_review_reviewer_id_fkey",
    }).onDelete("restrict"),
    check(
      "ip_disclosure_review_status_check",
      sql`(status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'needs_revision'::character varying])::text[])`
    ),
  ]
);

export const ipDisclosure = pgTable(
  "ip_disclosure",
  {
    disclosureId: uuid("disclosure_id").defaultRandom().primaryKey().notNull(),
    clientId: uuid("client_id"),
    isRightfulOwner: boolean("is_rightful_owner").default(false),
    selectedIpTypes: jsonb("selected_ip_types"),
    status: varchar({ length: 50 }).default("draft"),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    updatedAt: timestamp("updated_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    email: varchar({ length: 255 }),
    authorizedRepresentative: varchar("authorized_representative", {
      length: 255,
    }),
    otherIpType: varchar("other_ip_type", { length: 255 }),
  },
  (table) => [
    index("idx_ip_disclosure_client").using(
      "btree",
      table.clientId.asc().nullsLast().op("uuid_ops")
    ),
    index("idx_ip_disclosure_status").using(
      "btree",
      table.status.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.clientId],
      foreignColumns: [userAccount.id],
      name: "ip_disclosure_client_id_fkey",
    }).onDelete("cascade"),
  ]
);

export const verificationToken = pgTable("verificationToken", {
  identifier: text().notNull(),
  token: text().notNull(),
  expires: timestamp({ mode: "string" }).notNull(),
});

export const userAccount = pgTable(
  "user_account",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: varchar({ length: 255 }),
    email: varchar({ length: 255 }).notNull(),
    role: userRole().default("client"),
    isActive: boolean("is_active").default(true),
    image: text(),
    googleAccessToken: text("google_access_token"),
    googleRefreshToken: text("google_refresh_token"),
    googleTokenExpiresAt: timestamp("google_token_expires_at", {
      mode: "string",
    }),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    updatedAt: timestamp("updated_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    emailVerified: timestamp({ mode: "string" }),
  },
  (table) => [
    unique("user_account_email_key").on(table.email),
  ]
);

export const trackingCode = pgTable(
  "tracking_code",
  {
    trackingId: uuid("tracking_id").defaultRandom().primaryKey().notNull(),
    ipApplicationId: uuid("ip_application_id").notNull(),
    userId: uuid("user_id").notNull(),
    code: varchar({ length: 20 }).notNull(),
    codeHash: varchar("code_hash", { length: 128 }).notNull(),
    email: varchar({ length: 255 }).notNull(),
    phoneNumber: varchar("phone_number", { length: 30 }),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    revokedAt: timestamp("revoked_at", { mode: "string" }),
    lastUsedAt: timestamp("last_used_at", { mode: "string" }),
  },
  (table) => [
    unique("tracking_code_value_key").on(table.code),
    unique("tracking_code_hash_key").on(table.codeHash),
    index("idx_tracking_code_application").using(
      "btree",
      table.ipApplicationId.asc().nullsLast().op("uuid_ops")
    ),
    index("idx_tracking_code_user").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops")
    ),
    foreignKey({
      columns: [table.ipApplicationId],
      foreignColumns: [ipApplication.id],
      name: "tracking_code_application_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [userAccount.id],
      name: "tracking_code_user_id_fkey",
    }).onDelete("cascade"),
  ]
);

export const trackingOtp = pgTable(
  "tracking_otp",
  {
    otpId: uuid("otp_id").defaultRandom().primaryKey().notNull(),
    trackingId: uuid("tracking_id").notNull(),
    channel: varchar({ length: 10 }).notNull(),
    identifier: varchar({ length: 255 }).notNull(),
    otpHash: varchar("otp_hash", { length: 128 }).notNull(),
    attempts: integer().default(0),
    expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
    lastSentAt: timestamp("last_sent_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
  },
  (table) => [
    index("idx_tracking_otp_tracking").using(
      "btree",
      table.trackingId.asc().nullsLast().op("uuid_ops")
    ),
    index("idx_tracking_otp_identifier").using(
      "btree",
      table.identifier.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.trackingId],
      foreignColumns: [trackingCode.trackingId],
      name: "tracking_otp_tracking_id_fkey",
    }).onDelete("cascade"),
    check(
      "tracking_otp_channel_check",
      sql`(channel)::text = ANY (ARRAY[('email'::character varying)::text, ('sms'::character varying)::text])`
    ),
  ]
);

export const account = pgTable(
  "account",
  {
    userId: uuid().notNull(),
    type: text().notNull(),
    provider: text().notNull(),
    providerAccountId: text().notNull(),
    refreshToken: text("refresh_token"),
    accessToken: text("access_token"),
    expiresAt: integer("expires_at"),
    tokenType: text("token_type"),
    scope: text(),
    idToken: text("id_token"),
    sessionState: text("session_state"),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [userAccount.id],
      name: "account_userId_user_id_fk",
    }).onDelete("cascade"),
  ]
);

export const authenticator = pgTable(
  "authenticator",
  {
    credentialId: text().notNull(),
    userId: uuid().notNull(),
    providerAccountId: text().notNull(),
    credentialPublicKey: text().notNull(),
    counter: integer().notNull(),
    credentialDeviceType: text().notNull(),
    credentialBackedUp: boolean().notNull(),
    transports: text(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [userAccount.id],
      name: "authenticator_userId_user_id_fk",
    }).onDelete("cascade"),
    unique("authenticator_credentialID_unique").on(table.credentialId),
  ]
);

export const session = pgTable(
  "session",
  {
    sessionToken: text().primaryKey().notNull(),
    userId: uuid().notNull(),
    expires: timestamp({ mode: "string" }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [userAccount.id],
      name: "session_userId_user_id_fk",
    }).onDelete("cascade"),
  ]
);

export const copyrightBasicApplication = pgTable(
  "copyright_basic_application",
  {
    copyrightId: uuid("copyright_id").defaultRandom().primaryKey().notNull(),
    disclosureId: uuid("disclosure_id"),
    workTitle: varchar("work_title", { length: 255 }).notNull(),
    workDescription: text("work_description").notNull(),
    creationDate: date("creation_date").notNull(),
    status: varchar({ length: 50 }).default("draft"),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    updatedAt: timestamp("updated_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
  },
  (table) => [
    foreignKey({
      columns: [table.disclosureId],
      foreignColumns: [ipDisclosure.disclosureId],
      name: "copyright_basic_application_disclosure_id_fkey",
    }).onDelete("cascade"),
  ]
);

export const patentBasicApplication = pgTable(
  "patent_basic_application",
  {
    patentId: uuid("patent_id").defaultRandom().primaryKey().notNull(),
    disclosureId: uuid("disclosure_id"),
    technologyType: jsonb("technology_type").notNull(),
    technologyField: jsonb("technology_field").notNull(),
    inventionTitle: varchar("invention_title", { length: 255 }).notNull(),
    technicalProblem: text("technical_problem").notNull(),
    technicalSolution: text("technical_solution").notNull(),
    technicalField: text("technical_field").notNull(),
    backgroundArt: text("background_art").notNull(),
    inventionSummary: text("invention_summary").notNull(),
    advantages: text().notNull(),
    industrialApplicability: text("industrial_applicability").notNull(),
    drawingDescription: text("drawing_description"),
    bestMode: text("best_mode"),
    ownPublications: text("own_publications"),
    patentType: varchar("patent_type", { length: 20 }),
    status: varchar({ length: 50 }).default("draft"),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    updatedAt: timestamp("updated_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
  },
  (table) => [
    foreignKey({
      columns: [table.disclosureId],
      foreignColumns: [ipDisclosure.disclosureId],
      name: "patent_basic_application_disclosure_id_fkey",
    }).onDelete("cascade"),
    check(
      "patent_basic_application_patent_type_check",
      sql`(patent_type)::text = ANY ((ARRAY['patent'::character varying, 'utility_model'::character varying])::text[])`
    ),
  ]
);

export const patentMatrix = pgTable(
  "patent_matrix",
  {
    matrixId: uuid("matrix_id").defaultRandom().primaryKey().notNull(),
    patentId: uuid("patent_id"),
    title: varchar({ length: 255 }).notNull(),
    description: text().notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    updatedAt: timestamp("updated_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
  },
  (table) => [
    foreignKey({
      columns: [table.patentId],
      foreignColumns: [patentBasicApplication.patentId],
      name: "patent_matrix_patent_id_fkey",
    }).onDelete("cascade"),
  ]
);

export const matrixFeature = pgTable(
  "matrix_feature",
  {
    featureId: uuid("feature_id").defaultRandom().primaryKey().notNull(),
    matrixId: uuid("matrix_id"),
    featureDescription: text("feature_description").notNull(),
    analysisData: jsonb("analysis_data"),
  },
  (table) => [
    foreignKey({
      columns: [table.matrixId],
      foreignColumns: [patentMatrix.matrixId],
      name: "matrix_feature_matrix_id_fkey",
    }).onDelete("cascade"),
  ]
);

export const matrixPriorArt = pgTable(
  "matrix_prior_art",
  {
    priorArtId: uuid("prior_art_id").defaultRandom().primaryKey().notNull(),
    matrixId: uuid("matrix_id"),
    title: varchar({ length: 255 }).notNull(),
    referenceNumber: varchar("reference_number", { length: 100 }),
    publicationDate: date("publication_date"),
    relevanceDescription: text("relevance_description"),
  },
  (table) => [
    foreignKey({
      columns: [table.matrixId],
      foreignColumns: [patentMatrix.matrixId],
      name: "matrix_prior_art_matrix_id_fkey",
    }).onDelete("cascade"),
  ]
);

export const ipApplication = pgTable(
  "ip_application",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id").notNull(),
    title: varchar({ length: 255 }).notNull(),
    description: text(),
    ipType: applicationType("ip_type").notNull(),
    status: applicationStatus().default("draft"),
    progress: integer().default(0),
    inventors: text().array(),
    technicalField: text("technical_field").array(),
    keywords: text().array(),
    researchField: varchar("research_field", { length: 255 }),
    department: varchar({ length: 255 }),
    faculty: varchar({ length: 255 }),
    fundingSource: varchar("funding_source", { length: 255 }),
    fundingType: varchar("funding_type", { length: 100 }),
    grantNumber: varchar("grant_number", { length: 100 }),
    commercializationStatus: varchar("commercialization_status", {
      length: 50,
    }).default("not_licensed"),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    updatedAt: timestamp("updated_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
  },
  (table) => [
    index("idx_ip_application_type").using(
      "btree",
      table.ipType.asc().nullsLast().op("enum_ops")
    ),
    index("ix_ip_application_status").using(
      "btree",
      table.status.asc().nullsLast().op("enum_ops")
    ),
    index("ix_ip_application_type").using(
      "btree",
      table.ipType.asc().nullsLast().op("enum_ops")
    ),
    index("ix_ip_application_user").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops")
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [userAccount.id],
      name: "fk_application_user",
    }).onDelete("restrict"),
    check(
      "ck_commercialization",
      sql`(commercialization_status)::text = ANY ((ARRAY['not_licensed'::character varying, 'licensed'::character varying, 'in_negotiation'::character varying, 'technology_transfer'::character varying, 'internal_use'::character varying])::text[])`
    ),
    check("ck_progress", sql`(progress >= 0) AND (progress <= 100)`),
  ]
);

export const archives = pgTable(
  "archives",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    applicationId: uuid("application_id").notNull(),
    archiveAt: timestamp("archive_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    archiveReason: text("archive_reason"),
    archivedBy: uuid("archived_by").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.applicationId],
      foreignColumns: [ipApplication.id],
      name: "fk_archive_application",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.archivedBy],
      foreignColumns: [userAccount.id],
      name: "fk_archive_user",
    }).onDelete("restrict"),
  ]
);

export const applicationPhase = pgTable(
  "application_phase",
  {
    phaseId: uuid("phase_id").defaultRandom().primaryKey().notNull(),
    applicationId: uuid("application_id").notNull(),
    title: varchar({ length: 255 }).notNull(),
    description: text(),
    status: varchar({ length: 50 }).default("pending"),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    progress: integer().default(0),
    orderIndex: integer("order_index").notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    updatedAt: timestamp("updated_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
  },
  (table) => [
    index("idx_phase_application_id").using(
      "btree",
      table.applicationId.asc().nullsLast().op("uuid_ops")
    ),
    index("idx_phase_status").using(
      "btree",
      table.status.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.applicationId],
      foreignColumns: [ipApplication.id],
      name: "fk_phase_application",
    }).onDelete("cascade"),
    check("ck_phase_progress", sql`(progress >= 0) AND (progress <= 100)`),
    check(
      "ck_phase_status",
      sql`(status)::text = ANY ((ARRAY['pending'::character varying, 'active'::character varying, 'completed'::character varying, 'blocked'::character varying])::text[])`
    ),
  ]
);

export const phaseTask = pgTable(
  "phase_task",
  {
    taskId: uuid("task_id").defaultRandom().primaryKey().notNull(),
    phaseId: uuid("phase_id").notNull(),
    title: varchar({ length: 255 }).notNull(),
    description: text(),
    priority: varchar({ length: 20 }).notNull(),
    weight: integer().notNull(),
    dueDate: date("due_date"),
    completed: boolean().default(false),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    updatedAt: timestamp("updated_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    assigneeId: uuid("assignee_id"),
    startDate: date("start_date"),
    status: varchar({ length: 50 }).default("pending"),
  },
  (table) => [
    index("idx_task_phase_id").using(
      "btree",
      table.phaseId.asc().nullsLast().op("uuid_ops")
    ),
    foreignKey({
      columns: [table.assigneeId],
      foreignColumns: [userAccount.id],
      name: "phase_task_assignee_id_fkey",
    }),
    foreignKey({
      columns: [table.phaseId],
      foreignColumns: [applicationPhase.phaseId],
      name: "phase_task_phase_id_fkey",
    }).onDelete("cascade"),
    check(
      "task_priority_check",
      sql`(priority)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying])::text[])`
    ),
    check(
      "task_status_check",
      sql`(status)::text = ANY ((ARRAY['pending'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'blocked'::character varying])::text[])`
    ),
    check("task_weight_check", sql`(weight >= 0) AND (weight <= 100)`),
  ]
);

export const taskAssignment = pgTable(
  "task_assignment",
  {
    assignmentId: uuid("assignment_id").defaultRandom().primaryKey().notNull(),
    taskId: uuid("task_id").notNull(),
    staffId: uuid("staff_id").notNull(),
    assignedAt: timestamp("assigned_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    status: varchar({ length: 50 }).default("pending"),
  },
  (table) => [
    foreignKey({
      columns: [table.staffId],
      foreignColumns: [userAccount.id],
      name: "task_assignment_staff_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.taskId],
      foreignColumns: [phaseTask.taskId],
      name: "task_assignment_task_id_fkey",
    }).onDelete("cascade"),
    unique("task_assignment_task_id_staff_id_key").on(
      table.taskId,
      table.staffId
    ),
    check(
      "task_assignment_status_check",
      sql`(status)::text = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'completed'::character varying, 'rejected'::character varying])::text[])`
    ),
  ]
);

export const phaseReminder = pgTable(
  "phase_reminder",
  {
    reminderId: uuid("reminder_id").defaultRandom().primaryKey().notNull(),
    phaseId: uuid("phase_id"),
    frequency: varchar({ length: 20 }),
    customDays: integer("custom_days"),
    reminderTime: time("reminder_time"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    updatedAt: timestamp("updated_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
  },
  (table) => [
    foreignKey({
      columns: [table.phaseId],
      foreignColumns: [applicationPhase.phaseId],
      name: "phase_reminder_phase_id_fkey",
    }).onDelete("cascade"),
    check(
      "phase_reminder_frequency_check",
      sql`(frequency)::text = ANY ((ARRAY['daily'::character varying, 'weekly'::character varying, 'custom'::character varying])::text[])`
    ),
  ]
);

export const documents = pgTable(
  "documents",
  {
    documentId: uuid("document_id").defaultRandom().primaryKey().notNull(),
    applicationId: uuid("application_id").notNull(),
    phaseId: uuid("phase_id"),
    title: varchar({ length: 255 }).notNull(),
    filePath: text("file_path").notNull(),
    fileType: varchar("file_type", { length: 50 }).notNull(),
    fileSize: integer("file_size").notNull(),
    category: varchar({ length: 50 }).notNull(),
    status: varchar({ length: 50 }).default("pending"),
    uploadedBy: uuid("uploaded_by").notNull(),
    uploadedAt: timestamp("uploaded_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    verifiedBy: uuid("verified_by"),
    verifiedAt: timestamp("verified_at", { mode: "string" }),
    remarks: text(),
    requiresValidation: boolean("requires_validation").default(false),
    validationStatus: varchar("validation_status", { length: 50 }),
    validationDate: timestamp("validation_date", { mode: "string" }),
    validatedBy: uuid("validated_by"),
    validationRemarks: text("validation_remarks"),
  },
  (table) => [
    index("idx_documents_validation").using(
      "btree",
      table.validationStatus.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.applicationId],
      foreignColumns: [ipApplication.id],
      name: "documents_application_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.phaseId],
      foreignColumns: [applicationPhase.phaseId],
      name: "documents_phase_id_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.uploadedBy],
      foreignColumns: [userAccount.id],
      name: "documents_uploaded_by_fkey",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.validatedBy],
      foreignColumns: [userAccount.id],
      name: "documents_validated_by_fkey",
    }),
    foreignKey({
      columns: [table.verifiedBy],
      foreignColumns: [userAccount.id],
      name: "documents_verified_by_fkey",
    }).onDelete("set null"),
    check(
      "document_category_check",
      sql`(category)::text = ANY ((ARRAY['forms'::character varying, 'attachments'::character varying, 'requirements'::character varying])::text[])`
    ),
    check(
      "document_status_check",
      sql`(status)::text = ANY ((ARRAY['pending'::character varying, 'verified'::character varying, 'rejected'::character varying])::text[])`
    ),
    check(
      "document_validation_status_check",
      sql`(validation_status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'needs_revision'::character varying])::text[])`
    ),
  ]
);

export const internalValidation = pgTable(
  "internal_validation",
  {
    validationId: uuid("validation_id").defaultRandom().primaryKey().notNull(),
    phaseId: uuid("phase_id"),
    documentId: uuid("document_id"),
    validatorRole: varchar("validator_role", { length: 50 }),
    assignedTo: uuid("assigned_to"),
    status: varchar({ length: 20 }).default("pending"),
    dueDate: date("due_date").notNull(),
    remarks: text(),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    updatedAt: timestamp("updated_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
  },
  (table) => [
    foreignKey({
      columns: [table.assignedTo],
      foreignColumns: [userAccount.id],
      name: "internal_validation_assigned_to_fkey",
    }),
    foreignKey({
      columns: [table.documentId],
      foreignColumns: [documents.documentId],
      name: "internal_validation_document_id_fkey",
    }),
    foreignKey({
      columns: [table.phaseId],
      foreignColumns: [applicationPhase.phaseId],
      name: "internal_validation_phase_id_fkey",
    }).onDelete("cascade"),
    check(
      "internal_validation_status_check",
      sql`(status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])`
    ),
    check(
      "internal_validation_validator_role_check",
      sql`(validator_role)::text = ANY ((ARRAY['superadmin'::character varying, 'director'::character varying])::text[])`
    ),
  ]
);

export const externalCollaboration = pgTable(
  "external_collaboration",
  {
    collaborationId: uuid("collaboration_id")
      .defaultRandom()
      .primaryKey()
      .notNull(),
    phaseId: uuid("phase_id"),
    office: varchar({ length: 255 }).notNull(),
    contactPerson: varchar("contact_person", { length: 255 }).notNull(),
    task: text().notNull(),
    status: varchar({ length: 20 }).default("pending"),
    dueDate: date("due_date").notNull(),
    responseRequired: boolean("response_required").default(false),
    remarks: text(),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    updatedAt: timestamp("updated_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
  },
  (table) => [
    foreignKey({
      columns: [table.phaseId],
      foreignColumns: [applicationPhase.phaseId],
      name: "external_collaboration_phase_id_fkey",
    }).onDelete("cascade"),
    check(
      "external_collaboration_status_check",
      sql`(status)::text = ANY ((ARRAY['pending'::character varying, 'in_progress'::character varying, 'completed'::character varying])::text[])`
    ),
  ]
);

export const activityLog = pgTable(
  "activity_log",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    applicationId: uuid("application_id").notNull(),
    phaseId: uuid("phase_id"),
    userId: uuid("user_id").notNull(),
    activityType: activityType("activity_type").notNull(),
    title: varchar({ length: 255 }).notNull(),
    description: text(),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
  },
  (table) => [
    index("idx_activity_log_application").using(
      "btree",
      table.applicationId.asc().nullsLast().op("uuid_ops")
    ),
    index("idx_activity_log_phase").using(
      "btree",
      table.phaseId.asc().nullsLast().op("uuid_ops")
    ),
    index("idx_activity_log_user").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops")
    ),
    index("ix_activity_log_application").using(
      "btree",
      table.applicationId.asc().nullsLast().op("uuid_ops")
    ),
    index("ix_activity_log_phase").using(
      "btree",
      table.phaseId.asc().nullsLast().op("uuid_ops")
    ),
    index("ix_activity_log_user").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops")
    ),
    foreignKey({
      columns: [table.applicationId],
      foreignColumns: [ipApplication.id],
      name: "fk_activity_log_application",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.phaseId],
      foreignColumns: [applicationPhase.phaseId],
      name: "fk_activity_log_phase",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [userAccount.id],
      name: "fk_activity_log_user",
    }).onDelete("restrict"),
  ]
);

export const calendarEvent = pgTable(
  "calendar_event",
  {
    eventId: uuid("event_id").defaultRandom().primaryKey().notNull(),
    title: varchar({ length: 255 }).notNull(),
    description: text(),
    startDate: timestamp("start_date", { mode: "string" }).notNull(),
    endDate: timestamp("end_date", { mode: "string" }).notNull(),
    eventType: varchar("event_type", { length: 50 }),
    status: varchar({ length: 50 }).default("scheduled"),
    priority: varchar({ length: 20 }),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    updatedAt: timestamp("updated_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    applicationId: uuid("application_id"),
    phaseId: uuid("phase_id"),
  },
  (table) => [
    foreignKey({
      columns: [table.applicationId],
      foreignColumns: [ipApplication.id],
      name: "calendar_event_application_id_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [userAccount.id],
      name: "calendar_event_created_by_fkey",
    }),
    foreignKey({
      columns: [table.phaseId],
      foreignColumns: [applicationPhase.phaseId],
      name: "calendar_event_phase_id_fkey",
    }).onDelete("set null"),
    check(
      "calendar_event_event_type_check",
      sql`(event_type)::text = ANY ((ARRAY['meeting'::character varying, 'deadline'::character varying, 'review'::character varying, 'other'::character varying])::text[])`
    ),
    check(
      "calendar_event_priority_check",
      sql`(priority)::text = ANY ((ARRAY['high'::character varying, 'medium'::character varying, 'low'::character varying])::text[])`
    ),
    check(
      "calendar_event_status_check",
      sql`(status)::text = ANY ((ARRAY['scheduled'::character varying, 'in-progress'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[])`
    ),
  ]
);

export const documentManagement = pgTable(
  "document_management",
  {
    documentId: uuid("document_id").defaultRandom().primaryKey().notNull(),
    entityId: uuid("entity_id").notNull(),
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    documentType: varchar("document_type", { length: 100 }).notNull(),
    documentTitle: varchar("document_title", { length: 255 }).notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    filePath: text("file_path").notNull(),
    fileSize: integer("file_size").notNull(),
    mimeType: varchar("mime_type", { length: 100 }).notNull(),
    status: varchar({ length: 50 }).default("pending"),
    uploadedBy: uuid("uploaded_by"),
    uploadDate: timestamp("upload_date", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    verifiedBy: uuid("verified_by"),
    verificationDate: timestamp("verification_date", { mode: "string" }),
    remarks: text(),
    metadata: jsonb(),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    updatedAt: timestamp("updated_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    applicationId: uuid("application_id"),
    phaseId: uuid("phase_id"),
  },
  (table) => [
    foreignKey({
      columns: [table.applicationId],
      foreignColumns: [ipApplication.id],
      name: "document_management_application_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.phaseId],
      foreignColumns: [applicationPhase.phaseId],
      name: "document_management_phase_id_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.uploadedBy],
      foreignColumns: [userAccount.id],
      name: "document_management_uploaded_by_fkey",
    }),
    foreignKey({
      columns: [table.verifiedBy],
      foreignColumns: [userAccount.id],
      name: "document_management_verified_by_fkey",
    }),
    check(
      "document_management_entity_type_check",
      sql`(entity_type)::text = ANY ((ARRAY['application'::character varying, 'phase'::character varying, 'task'::character varying])::text[])`
    ),
    check(
      "document_status_check",
      sql`(status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])`
    ),
  ]
);

export const digitalSignature = pgTable(
  "digital_signature",
  {
    signatureId: uuid("signature_id").defaultRandom().primaryKey().notNull(),
    entityId: uuid("entity_id").notNull(),
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    signerId: uuid("signer_id"),
    signerType: varchar("signer_type", { length: 50 }).notNull(),
    signatureImage: text("signature_image").notNull(),
    signatureDate: timestamp("signature_date", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    ipAddress: varchar("ip_address", { length: 45 }),
    isValid: boolean("is_valid").default(true),
    verificationToken: varchar("verification_token", { length: 255 }),
    metadata: jsonb(),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    updatedAt: timestamp("updated_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
  },
  (table) => [
    foreignKey({
      columns: [table.signerId],
      foreignColumns: [userAccount.id],
      name: "digital_signature_signer_id_fkey",
    }),
    check(
      "digital_signature_signer_type_check",
      sql`(signer_type)::text = ANY ((ARRAY['author'::character varying, 'applicant'::character varying, 'representative'::character varying, 'staff'::character varying])::text[])`
    ),
  ]
);

export const contactMessage = pgTable(
  "contact_message",
  {
    messageId: uuid("message_id").defaultRandom().primaryKey().notNull(),
    name: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 255 }).notNull(),
    subject: varchar({ length: 255 }).notNull(),
    message: text().notNull(),
    status: varchar({ length: 50 }).default("pending"),
    assignedTo: uuid("assigned_to"),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    updatedAt: timestamp("updated_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
  },
  (table) => [
    foreignKey({
      columns: [table.assignedTo],
      foreignColumns: [userAccount.id],
      name: "contact_message_assigned_to_fkey",
    }),
    check(
      "contact_message_status_check",
      sql`(status)::text = ANY ((ARRAY['pending'::character varying, 'in-progress'::character varying, 'resolved'::character varying])::text[])`
    ),
  ]
);

export const comment = pgTable(
  "comment",
  {
    commentId: uuid("comment_id").defaultRandom().primaryKey().notNull(),
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    entityId: uuid("entity_id").notNull(),
    userId: uuid("user_id"),
    content: text().notNull(),
    parentId: uuid("parent_id"),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    updatedAt: timestamp("updated_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
  },
  (table) => [
    foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.commentId],
      name: "comment_parent_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [userAccount.id],
      name: "comment_user_id_fkey",
    }).onDelete("cascade"),
  ]
);

export const notification = pgTable(
  "notification",
  {
    notificationId: uuid("notification_id")
      .defaultRandom()
      .primaryKey()
      .notNull(),
    userId: uuid("user_id"),
    title: varchar({ length: 255 }).notNull(),
    message: text().notNull(),
    type: varchar({ length: 50 }),
    status: varchar({ length: 20 }).default("unread"),
    link: text(),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    readAt: timestamp("read_at", { mode: "string" }),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [userAccount.id],
      name: "notification_user_id_fkey",
    }).onDelete("cascade"),
    check(
      "notification_status_check",
      sql`(status)::text = ANY ((ARRAY['read'::character varying, 'unread'::character varying])::text[])`
    ),
    check(
      "notification_type_check",
      sql`(type)::text = ANY ((ARRAY['info'::character varying, 'warning'::character varying, 'success'::character varying, 'error'::character varying])::text[])`
    ),
  ]
);

export const ipContributors = pgTable(
  "ip_contributors",
  {
    contributorId: uuid("contributor_id")
      .defaultRandom()
      .primaryKey()
      .notNull(),
    applicationId: uuid("application_id"),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    middleName: varchar("middle_name", { length: 100 }),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    email: varchar({ length: 255 }),
    role: varchar({ length: 50 }),
    isPrimary: boolean("is_primary").default(false),
  },
  (table) => [
    foreignKey({
      columns: [table.applicationId],
      foreignColumns: [ipApplication.id],
      name: "ip_contributors_application_id_fkey",
    }).onDelete("cascade"),
    check(
      "ip_contributors_role_check",
      sql`(role)::text = ANY ((ARRAY['inventor'::character varying, 'author'::character varying, 'applicant'::character varying])::text[])`
    ),
  ]
);

export const ipDetails = pgTable(
  "ip_details",
  {
    detailId: uuid("detail_id").defaultRandom().primaryKey().notNull(),
    applicationId: uuid("application_id"),
    filingDate: date("filing_date"),
    registrationNumber: varchar("registration_number", { length: 100 }),
    grantDate: date("grant_date"),
    expiryDate: date("expiry_date"),
    jurisdiction: varchar({ length: 100 }),
    commercializationStatus: varchar("commercialization_status", {
      length: 50,
    }),
    metadata: jsonb(),
  },
  (table) => [
    foreignKey({
      columns: [table.applicationId],
      foreignColumns: [ipApplication.id],
      name: "ip_details_application_id_fkey",
    }).onDelete("cascade"),
    check(
      "ip_details_commercialization_status_check",
      sql`(commercialization_status)::text = ANY ((ARRAY['not_licensed'::character varying, 'licensed'::character varying, 'in_negotiation'::character varying])::text[])`
    ),
  ]
);

export const phaseReview = pgTable(
  "phase_review",
  {
    reviewId: uuid("review_id").defaultRandom().primaryKey().notNull(),
    phaseId: uuid("phase_id").notNull(),
    reviewerId: uuid("reviewer_id").notNull(),
    comment: text().notNull(),
    status: varchar({ length: 50 }).notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    updatedAt: timestamp("updated_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    rating: integer(),
    reviewDate: timestamp("review_date", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    attachments: text().array(),
  },
  (table) => [
    index("idx_phase_review_date").using(
      "btree",
      table.reviewDate.asc().nullsLast().op("timestamp_ops")
    ),
    index("idx_phase_review_phase_id").using(
      "btree",
      table.phaseId.asc().nullsLast().op("uuid_ops")
    ),
    index("idx_phase_review_reviewer").using(
      "btree",
      table.reviewerId.asc().nullsLast().op("uuid_ops")
    ),
    index("idx_phase_review_status").using(
      "btree",
      table.status.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.phaseId],
      foreignColumns: [applicationPhase.phaseId],
      name: "phase_review_phase_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.reviewerId],
      foreignColumns: [userAccount.id],
      name: "phase_review_reviewer_id_fkey",
    }).onDelete("restrict"),
    check("phase_review_rating_check", sql`(rating >= 1) AND (rating <= 5)`),
    check(
      "review_status_check",
      sql`(status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'needs_revision'::character varying])::text[])`
    ),
  ]
);

export const phaseReviewAttachment = pgTable(
  "phase_review_attachment",
  {
    attachmentId: uuid("attachment_id").defaultRandom().primaryKey().notNull(),
    reviewId: uuid("review_id"),
    filePath: text("file_path").notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    fileType: varchar("file_type", { length: 50 }).notNull(),
    fileSize: integer("file_size").notNull(),
    uploadedAt: timestamp("uploaded_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
  },
  (table) => [
    foreignKey({
      columns: [table.reviewId],
      foreignColumns: [phaseReview.reviewId],
      name: "phase_review_attachment_review_id_fkey",
    }).onDelete("cascade"),
  ]
);

export const eventParticipant = pgTable(
  "event_participant",
  {
    eventId: uuid("event_id").notNull(),
    userId: uuid("user_id").notNull(),
    status: varchar({ length: 50 }).default("pending"),
  },
  (table) => [
    foreignKey({
      columns: [table.eventId],
      foreignColumns: [calendarEvent.eventId],
      name: "event_participant_event_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [userAccount.id],
      name: "event_participant_user_id_fkey",
    }).onDelete("cascade"),
    primaryKey({
      columns: [table.eventId, table.userId],
      name: "event_participant_pkey",
    }),
    check(
      "event_participant_status_check",
      sql`(status)::text = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'declined'::character varying])::text[])`
    ),
  ]
);
