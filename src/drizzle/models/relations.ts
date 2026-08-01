import { relations } from "drizzle-orm/relations";
import {
  userAccount,
  account,
  authenticator,
  session,
  clientProfile,
  ipDisclosure,
  copyrightBasicApplication,
  ipApplication,
  archives,
  applicationPhase,
  phaseTask,
  taskAssignment,
  phaseReminder,
  documents,
  internalValidation,
  externalCollaboration,
  activityLog,
  calendarEvent,
  documentManagement,
  digitalSignature,
  contactMessage,
  comment,
  notification,
  ipContributors,
  ipDetails,
  phaseReview,
  phaseReviewAttachment,
  eventParticipant,
  deedOfAssignment,
  substantialUse,
} from "./schema";

// Account Relations
export const accountRelations = relations(account, ({ one }) => ({
  userAccount: one(userAccount, {
    fields: [account.userId],
    references: [userAccount.id],
  }),
}));

// User Account Relations
export const userAccountRelations = relations(userAccount, ({ many }) => ({
  accounts: many(account),
  authenticators: many(authenticator),
  sessions: many(session),
  clientProfiles: many(clientProfile),
  ipApplications: many(ipApplication),
  archives: many(archives),
  phaseTasks: many(phaseTask),
  taskAssignments: many(taskAssignment),
  documents_uploadedBy: many(documents, {
    relationName: "documents_uploadedBy_userAccount_id",
  }),
  documents_validatedBy: many(documents, {
    relationName: "documents_validatedBy_userAccount_id",
  }),
  documents_verifiedBy: many(documents, {
    relationName: "documents_verifiedBy_userAccount_id",
  }),
  internalValidations: many(internalValidation),
  activityLogs: many(activityLog),
  calendarEvents: many(calendarEvent),
  documentManagements_uploadedBy: many(documentManagement, {
    relationName: "documentManagement_uploadedBy_userAccount_id",
  }),
  documentManagements_verifiedBy: many(documentManagement, {
    relationName: "documentManagement_verifiedBy_userAccount_id",
  }),
  digitalSignatures: many(digitalSignature),
  contactMessages: many(contactMessage),
  comments: many(comment),
  notifications: many(notification),
  phaseReviews: many(phaseReview),
  eventParticipants: many(eventParticipant),
  deedOfAssignments: many(deedOfAssignment),
}));

// Authenticator Relations
export const authenticatorRelations = relations(authenticator, ({ one }) => ({
  userAccount: one(userAccount, {
    fields: [authenticator.userId],
    references: [userAccount.id],
  }),
}));

// Session Relations
export const sessionRelations = relations(session, ({ one }) => ({
  userAccount: one(userAccount, {
    fields: [session.userId],
    references: [userAccount.id],
  }),
}));

// Client Profile Relations
export const clientProfileRelations = relations(
  clientProfile,
  ({ one, many }) => ({
    userAccount: one(userAccount, {
      fields: [clientProfile.userId],
      references: [userAccount.id],
    }),
    ipDisclosures: many(ipDisclosure),
  })
);

// IP Disclosure Relations
export const ipDisclosureRelations = relations(
  ipDisclosure,
  ({ one, many }) => ({
    clientProfile: one(clientProfile, {
      fields: [ipDisclosure.clientId],
      references: [clientProfile.clientId],
    }),
    copyrightBasicApplications: many(copyrightBasicApplication),
  })
);

// Copyright Basic Application Relations
export const copyrightBasicApplicationRelations = relations(
  copyrightBasicApplication,
  ({ one, many }) => ({
    ipDisclosure: one(ipDisclosure, {
      fields: [copyrightBasicApplication.disclosureId],
      references: [ipDisclosure.disclosureId],
    }),
  })
);

// IP Application Relations
export const ipApplicationRelations = relations(
  ipApplication,
  ({ one, many }) => ({
    user: one(userAccount, {
      fields: [ipApplication.userId],
      references: [userAccount.id],
    }),
    deedOfAssignments: many(deedOfAssignment),
    archives: many(archives),
    applicationPhases: many(applicationPhase),
    documents: many(documents),
    activityLogs: many(activityLog),
    calendarEvents: many(calendarEvent),
    documentManagements: many(documentManagement),
    ipContributors: many(ipContributors),
    ipDetails: many(ipDetails),
    substantialUses: many(substantialUse),
  })
);

// Archives Relations
export const archivesRelations = relations(archives, ({ one }) => ({
  ipApplication: one(ipApplication, {
    fields: [archives.applicationId],
    references: [ipApplication.id],
  }),
  userAccount: one(userAccount, {
    fields: [archives.archivedBy],
    references: [userAccount.id],
  }),
}));

// Application Phase Relations
export const applicationPhaseRelations = relations(
  applicationPhase,
  ({ one, many }) => ({
    ipApplication: one(ipApplication, {
      fields: [applicationPhase.applicationId],
      references: [ipApplication.id],
    }),
    phaseTasks: many(phaseTask),
    phaseReminders: many(phaseReminder),
    documents: many(documents),
    internalValidations: many(internalValidation),
    externalCollaborations: many(externalCollaboration),
    activityLogs: many(activityLog),
    calendarEvents: many(calendarEvent),
    documentManagements: many(documentManagement),
    phaseReviews: many(phaseReview),
  })
);

// Phase Task Relations
export const phaseTaskRelations = relations(phaseTask, ({ one, many }) => ({
  userAccount: one(userAccount, {
    fields: [phaseTask.assigneeId],
    references: [userAccount.id],
  }),
  applicationPhase: one(applicationPhase, {
    fields: [phaseTask.phaseId],
    references: [applicationPhase.phaseId],
  }),
  taskAssignments: many(taskAssignment),
}));

// Task Assignment Relations
export const taskAssignmentRelations = relations(taskAssignment, ({ one }) => ({
  userAccount: one(userAccount, {
    fields: [taskAssignment.staffId],
    references: [userAccount.id],
  }),
  phaseTask: one(phaseTask, {
    fields: [taskAssignment.taskId],
    references: [phaseTask.taskId],
  }),
}));

// Phase Reminder Relations
export const phaseReminderRelations = relations(phaseReminder, ({ one }) => ({
  applicationPhase: one(applicationPhase, {
    fields: [phaseReminder.phaseId],
    references: [applicationPhase.phaseId],
  }),
}));

// Documents Relations
export const documentsRelations = relations(documents, ({ one, many }) => ({
  ipApplication: one(ipApplication, {
    fields: [documents.applicationId],
    references: [ipApplication.id],
  }),
  applicationPhase: one(applicationPhase, {
    fields: [documents.phaseId],
    references: [applicationPhase.phaseId],
  }),
  userAccount_uploadedBy: one(userAccount, {
    fields: [documents.uploadedBy],
    references: [userAccount.id],
    relationName: "documents_uploadedBy_userAccount_id",
  }),
  userAccount_validatedBy: one(userAccount, {
    fields: [documents.validatedBy],
    references: [userAccount.id],
    relationName: "documents_validatedBy_userAccount_id",
  }),
  userAccount_verifiedBy: one(userAccount, {
    fields: [documents.verifiedBy],
    references: [userAccount.id],
    relationName: "documents_verifiedBy_userAccount_id",
  }),
  internalValidations: many(internalValidation),
}));

// Internal Validation Relations
export const internalValidationRelations = relations(
  internalValidation,
  ({ one }) => ({
    userAccount: one(userAccount, {
      fields: [internalValidation.assignedTo],
      references: [userAccount.id],
    }),
    document: one(documents, {
      fields: [internalValidation.documentId],
      references: [documents.documentId],
    }),
    applicationPhase: one(applicationPhase, {
      fields: [internalValidation.phaseId],
      references: [applicationPhase.phaseId],
    }),
  })
);

// External Collaboration Relations
export const externalCollaborationRelations = relations(
  externalCollaboration,
  ({ one }) => ({
    applicationPhase: one(applicationPhase, {
      fields: [externalCollaboration.phaseId],
      references: [applicationPhase.phaseId],
    }),
  })
);

// Activity Log Relations
export const activityLogRelations = relations(activityLog, ({ one }) => ({
  ipApplication: one(ipApplication, {
    fields: [activityLog.applicationId],
    references: [ipApplication.id],
  }),
  applicationPhase: one(applicationPhase, {
    fields: [activityLog.phaseId],
    references: [applicationPhase.phaseId],
  }),
  userAccount: one(userAccount, {
    fields: [activityLog.userId],
    references: [userAccount.id],
  }),
}));

// Calendar Event Relations
export const calendarEventRelations = relations(
  calendarEvent,
  ({ one, many }) => ({
    ipApplication: one(ipApplication, {
      fields: [calendarEvent.applicationId],
      references: [ipApplication.id],
    }),
    userAccount: one(userAccount, {
      fields: [calendarEvent.createdBy],
      references: [userAccount.id],
    }),
    applicationPhase: one(applicationPhase, {
      fields: [calendarEvent.phaseId],
      references: [applicationPhase.phaseId],
    }),
    eventParticipants: many(eventParticipant),
  })
);

// Document Management Relations
export const documentManagementRelations = relations(
  documentManagement,
  ({ one }) => ({
    ipApplication: one(ipApplication, {
      fields: [documentManagement.applicationId],
      references: [ipApplication.id],
    }),
    applicationPhase: one(applicationPhase, {
      fields: [documentManagement.phaseId],
      references: [applicationPhase.phaseId],
    }),
    userAccount_uploadedBy: one(userAccount, {
      fields: [documentManagement.uploadedBy],
      references: [userAccount.id],
      relationName: "documentManagement_uploadedBy_userAccount_id",
    }),
    userAccount_verifiedBy: one(userAccount, {
      fields: [documentManagement.verifiedBy],
      references: [userAccount.id],
      relationName: "documentManagement_verifiedBy_userAccount_id",
    }),
  })
);

// Digital Signature Relations
export const digitalSignatureRelations = relations(
  digitalSignature,
  ({ one }) => ({
    userAccount: one(userAccount, {
      fields: [digitalSignature.signerId],
      references: [userAccount.id],
    }),
  })
);

// Contact Message Relations
export const contactMessageRelations = relations(contactMessage, ({ one }) => ({
  userAccount: one(userAccount, {
    fields: [contactMessage.assignedTo],
    references: [userAccount.id],
  }),
}));

// Comment Relations
export const commentRelations = relations(comment, ({ one, many }) => ({
  comment: one(comment, {
    fields: [comment.parentId],
    references: [comment.commentId],
    relationName: "comment_parentId_comment_commentId",
  }),
  comments: many(comment, {
    relationName: "comment_parentId_comment_commentId",
  }),
  userAccount: one(userAccount, {
    fields: [comment.userId],
    references: [userAccount.id],
  }),
}));

// Notification Relations
export const notificationRelations = relations(notification, ({ one }) => ({
  userAccount: one(userAccount, {
    fields: [notification.userId],
    references: [userAccount.id],
  }),
}));

// IP Contributors Relations
export const ipContributorsRelations = relations(ipContributors, ({ one }) => ({
  ipApplication: one(ipApplication, {
    fields: [ipContributors.applicationId],
    references: [ipApplication.id],
  }),
}));

// IP Details Relations
export const ipDetailsRelations = relations(ipDetails, ({ one }) => ({
  ipApplication: one(ipApplication, {
    fields: [ipDetails.applicationId],
    references: [ipApplication.id],
  }),
}));

// Phase Review Relations
export const phaseReviewRelations = relations(phaseReview, ({ one, many }) => ({
  applicationPhase: one(applicationPhase, {
    fields: [phaseReview.phaseId],
    references: [applicationPhase.phaseId],
  }),
  userAccount: one(userAccount, {
    fields: [phaseReview.reviewerId],
    references: [userAccount.id],
  }),
  phaseReviewAttachments: many(phaseReviewAttachment),
}));

// Phase Review Attachment Relations
export const phaseReviewAttachmentRelations = relations(
  phaseReviewAttachment,
  ({ one }) => ({
    phaseReview: one(phaseReview, {
      fields: [phaseReviewAttachment.reviewId],
      references: [phaseReview.reviewId],
    }),
  })
);

// Event Participant Relations
export const eventParticipantRelations = relations(
  eventParticipant,
  ({ one }) => ({
    calendarEvent: one(calendarEvent, {
      fields: [eventParticipant.eventId],
      references: [calendarEvent.eventId],
    }),
    userAccount: one(userAccount, {
      fields: [eventParticipant.userId],
      references: [userAccount.id],
    }),
  })
);

// Deed of Assignment Relations
export const deedOfAssignmentRelations = relations(
  deedOfAssignment,
  ({ one }) => ({
    user: one(userAccount, {
      fields: [deedOfAssignment.userId],
      references: [userAccount.id],
    }),
    ipApplication: one(ipApplication, {
      fields: [deedOfAssignment.applicationId],
      references: [ipApplication.id],
    }),
  })
);

// Substantial Use Relations
export const substantialUseRelations = relations(substantialUse, ({ one }) => ({
  userAccount: one(userAccount, {
    fields: [substantialUse.userId],
    references: [userAccount.id],
  }),
  ipApplication: one(ipApplication, {
    fields: [substantialUse.applicationId],
    references: [ipApplication.id],
  }),
}));
