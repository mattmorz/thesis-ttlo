import {
  pgTable,
  index,
  foreignKey,
  uuid,
  varchar,
  text,
  timestamp,
  check,
  date,
  unique,
  integer,
  boolean,
  jsonb,
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
  "industrial_design",
  "trade_secret",
  "not_sure",
  "other",
]);
export const formSourceType = pgEnum("form_source_type", [
  "client_profile",
  "ip_disclosure",
  "substantial_use",
  "deed_of_assignment",
  "other_document",
]);
export const formSubmissionStatus = pgEnum("form_submission_status", [
  "draft",
  "submitted",
  "processed",
  "pending_review",
  "failed",
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
    }).onDelete("cascade"),
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
    check(
      "ck_phase_status",
      sql`(status)::text = ANY (ARRAY[('pending'::character varying)::text, ('active'::character varying)::text, ('completed'::character varying)::text, ('blocked'::character varying)::text])`
    ),
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
    }).onDelete("cascade"),
    unique("archives_application_id_unique").on(table.applicationId),
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

export const clientProfile = pgTable(
  "client_profile",
  {
    clientId: uuid("client_id").defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id"),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    middleName: varchar("middle_name", { length: 100 }),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    contactNumber: varchar("contact_number", { length: 20 }),
    email: varchar({ length: 255 }).notNull(),
    mailingAddress: text("mailing_address"),
    companyName: varchar("company_name", { length: 255 }),
    companyEmail: varchar("company_email", { length: 255 }),
    occupation: varchar({ length: 255 }),
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
    degree: varchar({ length: 255 }),
    profession: varchar({ length: 255 }),
    publishedResearch: jsonb("published_research").default({ value: "no" }),
    developedMaterials: jsonb("developed_materials").default({ value: "no" }),
    ipExperience: jsonb("ip_experience"),
    status: varchar({ length: 20 }).default("draft"),
    gender: jsonb(),
    citizenship: jsonb(),
    highestDegree: jsonb("highest_degree"),
    familiarWithIpRights: jsonb("familiar_with_ip_rights"),
    ipApplicationId: uuid("ip_application_id"),
    hasCompany: boolean("has_company").default(true),
    collegeName: varchar("college_name", { length: 255 }),
    departmentName: varchar("department_name", { length: 255 }),
  },
  (table) => [
    index("idx_client_profile_application").using(
      "btree",
      table.ipApplicationId.asc().nullsLast().op("uuid_ops")
    ),
    index("idx_client_profile_email").using(
      "btree",
      table.email.asc().nullsLast().op("text_ops")
    ),
    index("idx_client_profile_user").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops")
    ),
    foreignKey({
      columns: [table.ipApplicationId],
      foreignColumns: [ipApplication.id],
      name: "client_profile_ip_application_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [userAccount.id],
      name: "client_profile_user_id_fkey",
    }).onDelete("cascade"),
    unique("unique_client_profile_per_application").on(
      table.userId,
      table.ipApplicationId
    ),
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

export const calendarEvent = pgTable(
  "calendar_event",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    title: varchar({ length: 255 }).notNull(),
    description: text(),
    startDate: timestamp("start_date", { mode: "string" }).notNull(),
    endDate: timestamp("end_date", { mode: "string" }).notNull(),
    eventType: varchar("event_type", { length: 50 }),
    status: varchar({ length: 50 }).default("scheduled"),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    updatedAt: timestamp("updated_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    projectId: uuid("project_id"),
    otherEventType: text("other_event_type"),
    isAllDay: boolean("is_all_day").default(false),
  },
  (table) => [
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [ipApplication.id],
      name: "calendar_event_application_id_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [userAccount.id],
      name: "calendar_event_created_by_fkey",
    }),
    check(
      "calendar_event_event_type_check",
      sql`(event_type)::text = ANY (ARRAY[('meeting'::character varying)::text, ('phase'::character varying)::text, ('task'::character varying)::text, ('other'::character varying)::text])`
    ),
    check(
      "calendar_event_status_check",
      sql`(status)::text = ANY (ARRAY[('scheduled'::character varying)::text, ('in-progress'::character varying)::text, ('completed'::character varying)::text, ('cancelled'::character varying)::text])`
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
  email: varchar({ length: 255 }),
  mailingAddress: text("mailing_address"),
  companyName: varchar("company_name", { length: 255 }),
  companyEmail: varchar("company_email", { length: 255 }),
  occupation: varchar({ length: 255 }),
  createdAt: timestamp("created_at", { mode: "string" }),
  updatedAt: timestamp("updated_at", { mode: "string" }),
  age: integer(),
  companyStreet: text("company_street"),
  companyBarangay: text("company_barangay"),
  companyCityMunicipality: text("company_city_municipality"),
  companyProvince: text("company_province"),
  degree: varchar({ length: 255 }),
  profession: varchar({ length: 255 }),
  publishedResearch: varchar("published_research", { length: 20 }),
  developedMaterials: varchar("developed_materials", { length: 20 }),
  ipExperience: jsonb("ip_experience"),
  status: varchar({ length: 20 }),
  gender: jsonb(),
  citizenship: jsonb(),
  highestDegree: jsonb("highest_degree"),
  familiarWithIpRights: jsonb("familiar_with_ip_rights"),
});

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
      sql`(status)::text = ANY (ARRAY[('pending'::character varying)::text, ('in-progress'::character varying)::text, ('resolved'::character varying)::text])`
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
    index("idx_deed_of_assignment_application").using(
      "btree",
      table.applicationId.asc().nullsLast().op("uuid_ops")
    ),
    index("idx_deed_of_assignment_status").using(
      "btree",
      table.status.asc().nullsLast().op("text_ops")
    ),
    index("idx_deed_of_assignment_user").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops")
    ),
    foreignKey({
      columns: [table.applicationId],
      foreignColumns: [ipApplication.id],
      name: "deed_of_assignment_application_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [userAccount.id],
      name: "deed_of_assignment_user_id_fkey",
    }).onDelete("cascade"),
    check(
      "deed_of_assignment_status_check",
      sql`(status)::text = ANY (ARRAY[('draft'::character varying)::text, ('submitted'::character varying)::text, ('approved'::character varying)::text, ('rejected'::character varying)::text, ('pending_revision'::character varying)::text])`
    ),
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
      sql`(signer_type)::text = ANY (ARRAY[('author'::character varying)::text, ('applicant'::character varying)::text, ('representative'::character varying)::text, ('staff'::character varying)::text])`
    ),
  ]
);

export const documents = pgTable(
  "documents",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    applicationId: uuid("application_id").notNull(),
    title: varchar({ length: 255 }).notNull(),
    fileName: text("file_name").notNull(),
    fileType: varchar("file_type", { length: 50 }).notNull(),
    fileSize: integer("file_size").notNull(),
    category: varchar({ length: 50 }).notNull(),
    uploadedBy: uuid("uploaded_by").notNull(),
    requiresValidation: boolean("requires_validation").default(false),
    description: text(),
    type: varchar({ length: 50 }).notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    updatedAt: timestamp("updated_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
  },
  (table) => [
    foreignKey({
      columns: [table.applicationId],
      foreignColumns: [ipApplication.id],
      name: "documents_project_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.uploadedBy],
      foreignColumns: [userAccount.id],
      name: "documents_uploaded_by_fkey",
    }).onDelete("cascade"),
    check(
      "document_category_check",
      sql`(category)::text = ANY (ARRAY[('forms'::character varying)::text, ('attachments'::character varying)::text, ('requirements'::character varying)::text])`
    ),
    check(
      "document_type_check",
      sql`(type)::text = ANY (ARRAY[('application'::character varying)::text, ('contract'::character varying)::text, ('report'::character varying)::text, ('form'::character varying)::text])`
    ),
  ]
);

export const documentsValidation = pgTable(
  "documents_validation",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    documentId: uuid("document_id").notNull(),
    validationStatus: varchar("validation_status", { length: 50 })
      .default("pending")
      .notNull(),
    validatedBy: uuid("validated_by"),
    validatedAt: timestamp("validated_at", { mode: "string" }),
    validationRemarks: text("validation_remarks"),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    updatedAt: timestamp("updated_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    fileName: text("file_name"),
    fileType: varchar("file_type", { length: 50 }),
    fileSize: integer("file_size"),
  },
  (table) => [
    index("idx_documents_validation").using(
      "btree",
      table.validationStatus.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.documentId],
      foreignColumns: [documents.id],
      name: "documents_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.validatedBy],
      foreignColumns: [userAccount.id],
      name: "documents_validated_by_fkey",
    }).onDelete("cascade"),
    unique("documents_validation_document_id_unique").on(table.documentId),
    check(
      "validation_status_check",
      sql`(validation_status)::text = ANY (ARRAY[('pending'::character varying)::text, ('approved'::character varying)::text, ('rejected'::character varying)::text, ('needs_revision'::character varying)::text])`
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
    officeName: varchar("office_name", { length: 255 }).notNull(),
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
    reminderType: varchar("reminder_type", { length: 20 }).default("none"),
    reminderDay: varchar("reminder_day", { length: 20 }).default("none"),
    reminderTime: time("reminder_time").default("12:00:00"),
    fileName: text("file_name"),
    fileType: text("file_type"),
    fileSize: integer("file_size"),
  },
  (table) => [
    foreignKey({
      columns: [table.phaseId],
      foreignColumns: [applicationPhase.phaseId],
      name: "external_collaboration_phase_id_fkey",
    }).onDelete("cascade"),
    check(
      "external_collaboration_status_check",
      sql`(status)::text = ANY (ARRAY[('pending'::character varying)::text, ('in_progress'::character varying)::text, ('completed'::character varying)::text])`
    ),
    check(
      "reminder_day_check",
      sql`(reminder_day)::text = ANY (ARRAY[('none'::character varying)::text, ('mon'::character varying)::text, ('tue'::character varying)::text, ('wed'::character varying)::text, ('thu'::character varying)::text, ('fri'::character varying)::text, ('sat'::character varying)::text, ('sun'::character varying)::text])`
    ),
    check(
      "reminder_type_check",
      sql`(reminder_type)::text = ANY (ARRAY[('none'::character varying)::text, ('daily'::character varying)::text, ('weekly'::character varying)::text])`
    ),
  ]
);

export const formSubmissionRegistry = pgTable(
  "form_submission_registry",
  {
    registryId: uuid("registry_id").defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id").notNull(),
    sourceType: formSourceType("source_type").notNull(),
    sourceId: uuid("source_id").notNull(),
    ipApplicationId: uuid("ip_application_id"),
    status: formSubmissionStatus().default("draft").notNull(),
    title: varchar({ length: 255 }),
    description: text(),
    inventorsCreators: jsonb("inventors_creators"),
    applicants: jsonb(),
    processingErrors: text("processing_errors"),
    attemptsCount: integer("attempts_count").default(0),
    submittedAt: timestamp("submitted_at", { mode: "string" }),
    processedAt: timestamp("processed_at", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    updatedAt: timestamp("updated_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
  },
  (table) => [
    index("idx_form_submission_registry_ip_app").using(
      "btree",
      table.ipApplicationId.asc().nullsLast().op("uuid_ops")
    ),
    index("idx_form_submission_registry_source_id").using(
      "btree",
      table.sourceId.asc().nullsLast().op("uuid_ops")
    ),
    index("idx_form_submission_registry_source_type").using(
      "btree",
      table.sourceType.asc().nullsLast().op("enum_ops")
    ),
    index("idx_form_submission_registry_status").using(
      "btree",
      table.status.asc().nullsLast().op("enum_ops")
    ),
    index("idx_form_submission_registry_user").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops")
    ),
    foreignKey({
      columns: [table.ipApplicationId],
      foreignColumns: [ipApplication.id],
      name: "fk_form_submission_registry_ip_application",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [userAccount.id],
      name: "fk_form_submission_registry_user",
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
      sql`(entity_type)::text = ANY (ARRAY[('application'::character varying)::text, ('phase'::character varying)::text, ('task'::character varying)::text])`
    ),
    check(
      "document_status_check",
      sql`(status)::text = ANY (ARRAY[('pending'::character varying)::text, ('approved'::character varying)::text, ('rejected'::character varying)::text])`
    ),
  ]
);

export const formDataMapping = pgTable(
  "form_data_mapping",
  {
    mappingId: uuid("mapping_id").defaultRandom().primaryKey().notNull(),
    registryId: uuid("registry_id").notNull(),
    fieldKey: varchar({ length: 100 }).notNull(),
    fieldValue: text(),
    fieldArrayValue: jsonb("field_array_value"),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
  },
  (table) => [
    index("idx_form_data_mapping_registry").using(
      "btree",
      table.registryId.asc().nullsLast().op("uuid_ops")
    ),
    foreignKey({
      columns: [table.registryId],
      foreignColumns: [formSubmissionRegistry.registryId],
      name: "fk_form_data_mapping_registry",
    }).onDelete("cascade"),
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
      sql`(role)::text = ANY (ARRAY[('inventor'::character varying)::text, ('author'::character varying)::text, ('applicant'::character varying)::text])`
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
      sql`(commercialization_status)::text = ANY (ARRAY[('not_licensed'::character varying)::text, ('licensed'::character varying)::text, ('in_negotiation'::character varying)::text])`
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

export const internalValidation = pgTable(
  "internal_validation",
  {
    validationId: uuid("validation_id").defaultRandom().primaryKey().notNull(),
    phaseId: uuid("phase_id"),
    validatorRole: varchar("validator_role", { length: 50 }),
    status: varchar({ length: 20 }).default("pending"),
    dueDate: date("due_date").notNull(),
    remarks: text(),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    updatedAt: timestamp("updated_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    fileName: text("file_name").notNull(),
    fileType: text("file_type").notNull(),
    fileSize: integer("file_size").notNull(),
    title: text(),
  },
  (table) => [
    foreignKey({
      columns: [table.phaseId],
      foreignColumns: [applicationPhase.phaseId],
      name: "internal_validation_phase_id_fkey",
    }).onDelete("cascade"),
    check(
      "internal_validation_status_check",
      sql`(status)::text = ANY (ARRAY[('pending'::character varying)::text, ('approved'::character varying)::text, ('rejected'::character varying)::text])`
    ),
    check(
      "internal_validation_validator_role_check",
      sql`(validator_role)::text = ANY (ARRAY[('admin'::character varying)::text, ('director'::character varying)::text])`
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
    applicationId: uuid("application_id"),
  },
  (table) => [
    index("idx_ip_disclosure_application").using(
      "btree",
      table.applicationId.asc().nullsLast().op("uuid_ops")
    ),
    index("idx_ip_disclosure_client").using(
      "btree",
      table.clientId.asc().nullsLast().op("uuid_ops")
    ),
    index("idx_ip_disclosure_status").using(
      "btree",
      table.status.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.applicationId],
      foreignColumns: [ipApplication.id],
      name: "ip_disclosure_application_id_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.clientId],
      foreignColumns: [userAccount.id],
      name: "ip_disclosure_client_id_fkey",
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
    }).onDelete("cascade"),
    check(
      "ck_commercialization",
      sql`(commercialization_status)::text = ANY (ARRAY[('not_licensed'::character varying)::text, ('licensed'::character varying)::text, ('in_negotiation'::character varying)::text, ('technology_transfer'::character varying)::text, ('internal_use'::character varying)::text])`
    ),
    check("ck_progress", sql`(progress >= 0) AND (progress <= 100)`),
  ]
);

export const ipApplicationNotification = pgTable(
  "ip_application_notification",
  {
    notificationId: uuid("notification_id")
      .defaultRandom()
      .primaryKey()
      .notNull(),
    ipApplicationId: uuid("ip_application_id").notNull(),
    formRegistryId: uuid("form_registry_id"),
    adminId: uuid("admin_id"),
    title: varchar({ length: 255 }).notNull(),
    message: text().notNull(),
    isRead: boolean("is_read").default(false),
    isPriority: boolean("is_priority").default(false),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    readAt: timestamp("read_at", { mode: "string" }),
  },
  (table) => [
    index("idx_ip_app_notification_admin").using(
      "btree",
      table.adminId.asc().nullsLast().op("uuid_ops")
    ),
    index("idx_ip_app_notification_app").using(
      "btree",
      table.ipApplicationId.asc().nullsLast().op("uuid_ops")
    ),
    index("idx_ip_app_notification_read").using(
      "btree",
      table.isRead.asc().nullsLast().op("bool_ops")
    ),
    index("idx_ip_app_notification_registry").using(
      "btree",
      table.formRegistryId.asc().nullsLast().op("uuid_ops")
    ),
    foreignKey({
      columns: [table.adminId],
      foreignColumns: [userAccount.id],
      name: "fk_ip_app_notification_admin",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.formRegistryId],
      foreignColumns: [formSubmissionRegistry.registryId],
      name: "fk_ip_app_notification_form_registry",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.ipApplicationId],
      foreignColumns: [ipApplication.id],
      name: "fk_ip_app_notification_ip_application",
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

export const otherDocuments = pgTable(
  "other_documents",
  {
    documentId: uuid("document_id").defaultRandom().primaryKey().notNull(),
    formId: uuid("form_id"),
    userId: uuid("user_id").notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    originalName: varchar("original_name", { length: 255 }).notNull(),
    filePath: text("file_path").notNull(),
    fileSize: integer("file_size").notNull(),
    mimeType: varchar("mime_type", { length: 100 }).notNull(),
    category: varchar({ length: 100 }),
    description: text(),
    uploadedAt: timestamp("uploaded_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    updatedAt: timestamp("updated_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    status: varchar({ length: 50 }).default("active"),
    metadata: jsonb(),
    ipApplicationId: uuid("ip_application_id").notNull(),
    title: varchar({ length: 255 }),
  },
  (table) => [
    index("idx_other_documents_application").using(
      "btree",
      table.ipApplicationId.asc().nullsLast().op("uuid_ops")
    ),
    index("idx_other_documents_form").using(
      "btree",
      table.formId.asc().nullsLast().op("uuid_ops")
    ),
    index("idx_other_documents_user").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops")
    ),
    foreignKey({
      columns: [table.ipApplicationId],
      foreignColumns: [ipApplication.id],
      name: "other_documents_ip_application_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [userAccount.id],
      name: "other_documents_user_id_fkey",
    }).onDelete("cascade"),
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
    }).onDelete("cascade"),
    check(
      "ip_disclosure_review_status_check",
      sql`(status)::text = ANY (ARRAY[('pending'::character varying)::text, ('approved'::character varying)::text, ('rejected'::character varying)::text, ('needs_revision'::character varying)::text])`
    ),
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
      sql`(status)::text = ANY (ARRAY[('read'::character varying)::text, ('unread'::character varying)::text])`
    ),
    check(
      "notification_type_check",
      sql`(type)::text = ANY (ARRAY[('info'::character varying)::text, ('warning'::character varying)::text, ('success'::character varying)::text, ('error'::character varying)::text])`
    ),
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
    }).onDelete("cascade"),
    check("phase_review_rating_check", sql`(rating >= 1) AND (rating <= 5)`),
    check(
      "review_status_check",
      sql`(status)::text = ANY (ARRAY[('pending'::character varying)::text, ('approved'::character varying)::text, ('rejected'::character varying)::text, ('needs_revision'::character varying)::text])`
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
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    updatedAt: timestamp("updated_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    startDate: date("start_date"),
    status: varchar({ length: 50 }).default("pending"),
  },
  (table) => [
    index("idx_task_phase_id").using(
      "btree",
      table.phaseId.asc().nullsLast().op("uuid_ops")
    ),
    foreignKey({
      columns: [table.phaseId],
      foreignColumns: [applicationPhase.phaseId],
      name: "phase_task_phase_id_fkey",
    }).onDelete("cascade"),
    check(
      "task_priority_check",
      sql`(priority)::text = ANY (ARRAY[('low'::character varying)::text, ('medium'::character varying)::text, ('high'::character varying)::text])`
    ),
    check(
      "task_status_check",
      sql`(status)::text = ANY (ARRAY[('pending'::character varying)::text, ('in_progress'::character varying)::text, ('completed'::character varying)::text, ('blocked'::character varying)::text])`
    ),
    check("task_weight_check", sql`(weight >= 0) AND (weight <= 100)`),
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

export const substantialUse = pgTable(
  "substantial_use",
  {
    substantialUseId: uuid("substantial_use_id")
      .defaultRandom()
      .primaryKey()
      .notNull(),
    userId: uuid("user_id"),
    applicationId: uuid("application_id"),
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
    status: varchar({ length: 20 }).default("draft"),
  },
  (table) => [
    index("idx_substantial_use_application").using(
      "btree",
      table.applicationId.asc().nullsLast().op("uuid_ops")
    ),
    index("idx_substantial_use_status").using(
      "btree",
      table.status.asc().nullsLast().op("text_ops")
    ),
    index("idx_substantial_use_user").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops")
    ),
    foreignKey({
      columns: [table.applicationId],
      foreignColumns: [ipApplication.id],
      name: "substantial_use_application_id_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [userAccount.id],
      name: "substantial_use_user_id_fkey",
    }).onDelete("cascade"),
    check(
      "substantial_use_status_check",
      sql`(status)::text = ANY (ARRAY[('draft'::character varying)::text, ('submitted'::character varying)::text, ('approved'::character varying)::text, ('rejected'::character varying)::text])`
    ),
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
    literatureReferences: text("literature_references"),
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
      sql`(type)::text = ANY (ARRAY[('patent'::character varying)::text, ('utility_model'::character varying)::text])`
    ),
  ]
);

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

export const phaseReminder = pgTable(
  "phase_reminder",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    phaseId: uuid("phase_id"),
    reminderType: varchar("reminder_type", { length: 20 }).default("none"),
    reminderDay: varchar("reminder_day", { length: 20 }).default("none"),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    updatedAt: timestamp("updated_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    reminderTime: time("reminder_time").default("12:00:00"),
  },
  (table) => [
    foreignKey({
      columns: [table.phaseId],
      foreignColumns: [applicationPhase.phaseId],
      name: "phase_reminder_phase_id_fkey",
    }).onDelete("cascade"),
    unique("phase_reminder_phase_id_key").on(table.phaseId),
    check(
      "reminder_day_check",
      sql`(reminder_day)::text = ANY (ARRAY[('none'::character varying)::text, ('mon'::character varying)::text, ('tue'::character varying)::text, ('wed'::character varying)::text, ('thu'::character varying)::text, ('fri'::character varying)::text, ('sat'::character varying)::text, ('sun'::character varying)::text])`
    ),
    check(
      "reminder_type_check",
      sql`(reminder_type)::text = ANY (ARRAY[('none'::character varying)::text, ('daily'::character varying)::text, ('weekly'::character varying)::text])`
    ),
  ]
);

export const verificationToken = pgTable("verificationToken", {
  identifier: text().notNull(),
  token: text().notNull(),
  expires: timestamp({ mode: "string" }).notNull(),
});

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

export const internalValidationAssignee = pgTable(
  "internal_validation_assignee",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    internalValidationId: uuid("internal_validation_id"),
    userId: uuid("user_id"),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
  },
  (table) => [
    foreignKey({
      columns: [table.internalValidationId],
      foreignColumns: [internalValidation.validationId],
      name: "fr_internal_validation_id",
    }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [userAccount.id],
      name: "fr_user_id",
    }),
  ]
);

export const phaseTaskAssignee = pgTable(
  "phase_task_assignee",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    taskId: uuid("task_id").notNull(),
    userId: uuid("user_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
  },
  (table) => [
    foreignKey({
      columns: [table.taskId],
      foreignColumns: [phaseTask.taskId],
      name: "fk_task_id",
    }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [userAccount.id],
      name: "fk_user_id",
    }),
  ]
);

export const ipApplicationEnrollment = pgTable(
  "ip_application_enrollment",
  {
    enrollmentId: uuid("enrollment_id").defaultRandom().primaryKey().notNull(),
    applicationId: uuid("application_id").notNull(),
    userId: uuid("user_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    role: varchar({ length: 50 }).default("manager").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.applicationId],
      foreignColumns: [ipApplication.id],
      name: "ip_application_enrollment_application_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [userAccount.id],
      name: "ip_application_enrollment_user_id_fkey",
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
      foreignColumns: [calendarEvent.id],
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
      sql`(status)::text = ANY (ARRAY[('pending'::character varying)::text, ('accepted'::character varying)::text, ('declined'::character varying)::text])`
    ),
  ]
);
