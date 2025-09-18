import { relations } from "drizzle-orm/relations";
import { ipApplication, activityLog, applicationPhase, userAccount, archives, authenticator, clientProfile, calendarEvent, comment, contactMessage, account, copyrightBasicApplication, copyrightTransactionPart2, ipDisclosure, deedOfAssignment, copyrightTransactionPart1, digitalSignature, documents, documentsValidation, externalCollaboration, formSubmissionRegistry, disclosureConfirmation, documentManagement, formDataMapping, ipContributors, ipDetails, ipDisclosureApplicant, internalValidation, ipApplicationNotification, ipDisclosureAttachment, otherDocuments, patentMatrixSample, patentUtilityModelApplication, ipDisclosureReview, notification, patentSearchReport, phaseReview, phaseReviewAttachment, phaseTask, session, substantialUse, tradeSecretApplication, trademarkApplication, phaseReminder, ipDisclosureInventor, internalValidationAssignee, phaseTaskAssignee, ipApplicationEnrollment, eventParticipant } from "./schema";

export const activityLogRelations = relations(activityLog, ({one}) => ({
	ipApplication: one(ipApplication, {
		fields: [activityLog.applicationId],
		references: [ipApplication.id]
	}),
	applicationPhase: one(applicationPhase, {
		fields: [activityLog.phaseId],
		references: [applicationPhase.phaseId]
	}),
	userAccount: one(userAccount, {
		fields: [activityLog.userId],
		references: [userAccount.id]
	}),
}));

export const ipApplicationRelations = relations(ipApplication, ({one, many}) => ({
	activityLogs: many(activityLog),
	applicationPhases: many(applicationPhase),
	archives: many(archives),
	clientProfiles: many(clientProfile),
	calendarEvents: many(calendarEvent),
	deedOfAssignments: many(deedOfAssignment),
	documents: many(documents),
	formSubmissionRegistries: many(formSubmissionRegistry),
	documentManagements: many(documentManagement),
	ipContributors: many(ipContributors),
	ipDetails: many(ipDetails),
	ipDisclosures: many(ipDisclosure),
	userAccount: one(userAccount, {
		fields: [ipApplication.userId],
		references: [userAccount.id]
	}),
	ipApplicationNotifications: many(ipApplicationNotification),
	otherDocuments: many(otherDocuments),
	substantialUses: many(substantialUse),
	ipApplicationEnrollments: many(ipApplicationEnrollment),
}));

export const applicationPhaseRelations = relations(applicationPhase, ({one, many}) => ({
	activityLogs: many(activityLog),
	ipApplication: one(ipApplication, {
		fields: [applicationPhase.applicationId],
		references: [ipApplication.id]
	}),
	externalCollaborations: many(externalCollaboration),
	documentManagements: many(documentManagement),
	internalValidations: many(internalValidation),
	phaseReviews: many(phaseReview),
	phaseTasks: many(phaseTask),
	phaseReminders: many(phaseReminder),
}));

export const userAccountRelations = relations(userAccount, ({many}) => ({
	activityLogs: many(activityLog),
	archives: many(archives),
	authenticators: many(authenticator),
	clientProfiles: many(clientProfile),
	calendarEvents: many(calendarEvent),
	comments: many(comment),
	contactMessages: many(contactMessage),
	accounts: many(account),
	deedOfAssignments: many(deedOfAssignment),
	digitalSignatures: many(digitalSignature),
	documents: many(documents),
	documentsValidations: many(documentsValidation),
	formSubmissionRegistries: many(formSubmissionRegistry),
	documentManagements_uploadedBy: many(documentManagement, {
		relationName: "documentManagement_uploadedBy_userAccount_id"
	}),
	documentManagements_verifiedBy: many(documentManagement, {
		relationName: "documentManagement_verifiedBy_userAccount_id"
	}),
	ipDisclosures: many(ipDisclosure),
	ipApplications: many(ipApplication),
	ipApplicationNotifications: many(ipApplicationNotification),
	otherDocuments: many(otherDocuments),
	ipDisclosureReviews: many(ipDisclosureReview),
	notifications: many(notification),
	phaseReviews: many(phaseReview),
	sessions: many(session),
	substantialUses: many(substantialUse),
	internalValidationAssignees: many(internalValidationAssignee),
	phaseTaskAssignees: many(phaseTaskAssignee),
	ipApplicationEnrollments: many(ipApplicationEnrollment),
	eventParticipants: many(eventParticipant),
}));

export const archivesRelations = relations(archives, ({one}) => ({
	ipApplication: one(ipApplication, {
		fields: [archives.applicationId],
		references: [ipApplication.id]
	}),
	userAccount: one(userAccount, {
		fields: [archives.archivedBy],
		references: [userAccount.id]
	}),
}));

export const authenticatorRelations = relations(authenticator, ({one}) => ({
	userAccount: one(userAccount, {
		fields: [authenticator.userId],
		references: [userAccount.id]
	}),
}));

export const clientProfileRelations = relations(clientProfile, ({one}) => ({
	ipApplication: one(ipApplication, {
		fields: [clientProfile.ipApplicationId],
		references: [ipApplication.id]
	}),
	userAccount: one(userAccount, {
		fields: [clientProfile.userId],
		references: [userAccount.id]
	}),
}));

export const calendarEventRelations = relations(calendarEvent, ({one, many}) => ({
	ipApplication: one(ipApplication, {
		fields: [calendarEvent.projectId],
		references: [ipApplication.id]
	}),
	userAccount: one(userAccount, {
		fields: [calendarEvent.createdBy],
		references: [userAccount.id]
	}),
	eventParticipants: many(eventParticipant),
}));

export const commentRelations = relations(comment, ({one, many}) => ({
	comment: one(comment, {
		fields: [comment.parentId],
		references: [comment.commentId],
		relationName: "comment_parentId_comment_commentId"
	}),
	comments: many(comment, {
		relationName: "comment_parentId_comment_commentId"
	}),
	userAccount: one(userAccount, {
		fields: [comment.userId],
		references: [userAccount.id]
	}),
}));

export const contactMessageRelations = relations(contactMessage, ({one}) => ({
	userAccount: one(userAccount, {
		fields: [contactMessage.assignedTo],
		references: [userAccount.id]
	}),
}));

export const accountRelations = relations(account, ({one}) => ({
	userAccount: one(userAccount, {
		fields: [account.userId],
		references: [userAccount.id]
	}),
}));

export const copyrightTransactionPart2Relations = relations(copyrightTransactionPart2, ({one}) => ({
	copyrightBasicApplication: one(copyrightBasicApplication, {
		fields: [copyrightTransactionPart2.copyrightId],
		references: [copyrightBasicApplication.copyrightId]
	}),
	ipDisclosure: one(ipDisclosure, {
		fields: [copyrightTransactionPart2.disclosureId],
		references: [ipDisclosure.disclosureId]
	}),
}));

export const copyrightBasicApplicationRelations = relations(copyrightBasicApplication, ({one, many}) => ({
	copyrightTransactionPart2s: many(copyrightTransactionPart2),
	ipDisclosure: one(ipDisclosure, {
		fields: [copyrightBasicApplication.disclosureId],
		references: [ipDisclosure.disclosureId]
	}),
	copyrightTransactionPart1s: many(copyrightTransactionPart1),
}));

export const ipDisclosureRelations = relations(ipDisclosure, ({one, many}) => ({
	copyrightTransactionPart2s: many(copyrightTransactionPart2),
	copyrightBasicApplications: many(copyrightBasicApplication),
	copyrightTransactionPart1s: many(copyrightTransactionPart1),
	disclosureConfirmations: many(disclosureConfirmation),
	ipDisclosureApplicants: many(ipDisclosureApplicant),
	ipApplication: one(ipApplication, {
		fields: [ipDisclosure.applicationId],
		references: [ipApplication.id]
	}),
	userAccount: one(userAccount, {
		fields: [ipDisclosure.clientId],
		references: [userAccount.id]
	}),
	ipDisclosureAttachments: many(ipDisclosureAttachment),
	patentMatrixSamples: many(patentMatrixSample),
	ipDisclosureReviews: many(ipDisclosureReview),
	patentSearchReports: many(patentSearchReport),
	tradeSecretApplications: many(tradeSecretApplication),
	trademarkApplications: many(trademarkApplication),
	patentUtilityModelApplications: many(patentUtilityModelApplication),
	ipDisclosureInventors: many(ipDisclosureInventor),
}));

export const deedOfAssignmentRelations = relations(deedOfAssignment, ({one}) => ({
	ipApplication: one(ipApplication, {
		fields: [deedOfAssignment.applicationId],
		references: [ipApplication.id]
	}),
	userAccount: one(userAccount, {
		fields: [deedOfAssignment.userId],
		references: [userAccount.id]
	}),
}));

export const copyrightTransactionPart1Relations = relations(copyrightTransactionPart1, ({one}) => ({
	copyrightBasicApplication: one(copyrightBasicApplication, {
		fields: [copyrightTransactionPart1.copyrightId],
		references: [copyrightBasicApplication.copyrightId]
	}),
	ipDisclosure: one(ipDisclosure, {
		fields: [copyrightTransactionPart1.disclosureId],
		references: [ipDisclosure.disclosureId]
	}),
}));

export const digitalSignatureRelations = relations(digitalSignature, ({one}) => ({
	userAccount: one(userAccount, {
		fields: [digitalSignature.signerId],
		references: [userAccount.id]
	}),
}));

export const documentsRelations = relations(documents, ({one, many}) => ({
	ipApplication: one(ipApplication, {
		fields: [documents.applicationId],
		references: [ipApplication.id]
	}),
	userAccount: one(userAccount, {
		fields: [documents.uploadedBy],
		references: [userAccount.id]
	}),
	documentsValidations: many(documentsValidation),
}));

export const documentsValidationRelations = relations(documentsValidation, ({one}) => ({
	document: one(documents, {
		fields: [documentsValidation.documentId],
		references: [documents.id]
	}),
	userAccount: one(userAccount, {
		fields: [documentsValidation.validatedBy],
		references: [userAccount.id]
	}),
}));

export const externalCollaborationRelations = relations(externalCollaboration, ({one}) => ({
	applicationPhase: one(applicationPhase, {
		fields: [externalCollaboration.phaseId],
		references: [applicationPhase.phaseId]
	}),
}));

export const formSubmissionRegistryRelations = relations(formSubmissionRegistry, ({one, many}) => ({
	ipApplication: one(ipApplication, {
		fields: [formSubmissionRegistry.ipApplicationId],
		references: [ipApplication.id]
	}),
	userAccount: one(userAccount, {
		fields: [formSubmissionRegistry.userId],
		references: [userAccount.id]
	}),
	formDataMappings: many(formDataMapping),
	ipApplicationNotifications: many(ipApplicationNotification),
}));

export const disclosureConfirmationRelations = relations(disclosureConfirmation, ({one}) => ({
	ipDisclosure: one(ipDisclosure, {
		fields: [disclosureConfirmation.disclosureId],
		references: [ipDisclosure.disclosureId]
	}),
}));

export const documentManagementRelations = relations(documentManagement, ({one}) => ({
	ipApplication: one(ipApplication, {
		fields: [documentManagement.applicationId],
		references: [ipApplication.id]
	}),
	applicationPhase: one(applicationPhase, {
		fields: [documentManagement.phaseId],
		references: [applicationPhase.phaseId]
	}),
	userAccount_uploadedBy: one(userAccount, {
		fields: [documentManagement.uploadedBy],
		references: [userAccount.id],
		relationName: "documentManagement_uploadedBy_userAccount_id"
	}),
	userAccount_verifiedBy: one(userAccount, {
		fields: [documentManagement.verifiedBy],
		references: [userAccount.id],
		relationName: "documentManagement_verifiedBy_userAccount_id"
	}),
}));

export const formDataMappingRelations = relations(formDataMapping, ({one}) => ({
	formSubmissionRegistry: one(formSubmissionRegistry, {
		fields: [formDataMapping.registryId],
		references: [formSubmissionRegistry.registryId]
	}),
}));

export const ipContributorsRelations = relations(ipContributors, ({one}) => ({
	ipApplication: one(ipApplication, {
		fields: [ipContributors.applicationId],
		references: [ipApplication.id]
	}),
}));

export const ipDetailsRelations = relations(ipDetails, ({one}) => ({
	ipApplication: one(ipApplication, {
		fields: [ipDetails.applicationId],
		references: [ipApplication.id]
	}),
}));

export const ipDisclosureApplicantRelations = relations(ipDisclosureApplicant, ({one}) => ({
	ipDisclosure: one(ipDisclosure, {
		fields: [ipDisclosureApplicant.disclosureId],
		references: [ipDisclosure.disclosureId]
	}),
}));

export const internalValidationRelations = relations(internalValidation, ({one, many}) => ({
	applicationPhase: one(applicationPhase, {
		fields: [internalValidation.phaseId],
		references: [applicationPhase.phaseId]
	}),
	internalValidationAssignees: many(internalValidationAssignee),
}));

export const ipApplicationNotificationRelations = relations(ipApplicationNotification, ({one}) => ({
	userAccount: one(userAccount, {
		fields: [ipApplicationNotification.adminId],
		references: [userAccount.id]
	}),
	formSubmissionRegistry: one(formSubmissionRegistry, {
		fields: [ipApplicationNotification.formRegistryId],
		references: [formSubmissionRegistry.registryId]
	}),
	ipApplication: one(ipApplication, {
		fields: [ipApplicationNotification.ipApplicationId],
		references: [ipApplication.id]
	}),
}));

export const ipDisclosureAttachmentRelations = relations(ipDisclosureAttachment, ({one}) => ({
	ipDisclosure: one(ipDisclosure, {
		fields: [ipDisclosureAttachment.disclosureId],
		references: [ipDisclosure.disclosureId]
	}),
}));

export const otherDocumentsRelations = relations(otherDocuments, ({one}) => ({
	ipApplication: one(ipApplication, {
		fields: [otherDocuments.ipApplicationId],
		references: [ipApplication.id]
	}),
	userAccount: one(userAccount, {
		fields: [otherDocuments.userId],
		references: [userAccount.id]
	}),
}));

export const patentMatrixSampleRelations = relations(patentMatrixSample, ({one}) => ({
	ipDisclosure: one(ipDisclosure, {
		fields: [patentMatrixSample.disclosureId],
		references: [ipDisclosure.disclosureId]
	}),
	patentUtilityModelApplication: one(patentUtilityModelApplication, {
		fields: [patentMatrixSample.patentId],
		references: [patentUtilityModelApplication.patentId]
	}),
}));

export const patentUtilityModelApplicationRelations = relations(patentUtilityModelApplication, ({one, many}) => ({
	patentMatrixSamples: many(patentMatrixSample),
	patentSearchReports: many(patentSearchReport),
	ipDisclosure: one(ipDisclosure, {
		fields: [patentUtilityModelApplication.disclosureId],
		references: [ipDisclosure.disclosureId]
	}),
}));

export const ipDisclosureReviewRelations = relations(ipDisclosureReview, ({one}) => ({
	ipDisclosure: one(ipDisclosure, {
		fields: [ipDisclosureReview.disclosureId],
		references: [ipDisclosure.disclosureId]
	}),
	userAccount: one(userAccount, {
		fields: [ipDisclosureReview.reviewerId],
		references: [userAccount.id]
	}),
}));

export const notificationRelations = relations(notification, ({one}) => ({
	userAccount: one(userAccount, {
		fields: [notification.userId],
		references: [userAccount.id]
	}),
}));

export const patentSearchReportRelations = relations(patentSearchReport, ({one}) => ({
	ipDisclosure: one(ipDisclosure, {
		fields: [patentSearchReport.disclosureId],
		references: [ipDisclosure.disclosureId]
	}),
	patentUtilityModelApplication: one(patentUtilityModelApplication, {
		fields: [patentSearchReport.patentId],
		references: [patentUtilityModelApplication.patentId]
	}),
}));

export const phaseReviewRelations = relations(phaseReview, ({one, many}) => ({
	applicationPhase: one(applicationPhase, {
		fields: [phaseReview.phaseId],
		references: [applicationPhase.phaseId]
	}),
	userAccount: one(userAccount, {
		fields: [phaseReview.reviewerId],
		references: [userAccount.id]
	}),
	phaseReviewAttachments: many(phaseReviewAttachment),
}));

export const phaseReviewAttachmentRelations = relations(phaseReviewAttachment, ({one}) => ({
	phaseReview: one(phaseReview, {
		fields: [phaseReviewAttachment.reviewId],
		references: [phaseReview.reviewId]
	}),
}));

export const phaseTaskRelations = relations(phaseTask, ({one, many}) => ({
	applicationPhase: one(applicationPhase, {
		fields: [phaseTask.phaseId],
		references: [applicationPhase.phaseId]
	}),
	phaseTaskAssignees: many(phaseTaskAssignee),
}));

export const sessionRelations = relations(session, ({one}) => ({
	userAccount: one(userAccount, {
		fields: [session.userId],
		references: [userAccount.id]
	}),
}));

export const substantialUseRelations = relations(substantialUse, ({one}) => ({
	ipApplication: one(ipApplication, {
		fields: [substantialUse.applicationId],
		references: [ipApplication.id]
	}),
	userAccount: one(userAccount, {
		fields: [substantialUse.userId],
		references: [userAccount.id]
	}),
}));

export const tradeSecretApplicationRelations = relations(tradeSecretApplication, ({one}) => ({
	ipDisclosure: one(ipDisclosure, {
		fields: [tradeSecretApplication.disclosureId],
		references: [ipDisclosure.disclosureId]
	}),
}));

export const trademarkApplicationRelations = relations(trademarkApplication, ({one}) => ({
	ipDisclosure: one(ipDisclosure, {
		fields: [trademarkApplication.disclosureId],
		references: [ipDisclosure.disclosureId]
	}),
}));

export const phaseReminderRelations = relations(phaseReminder, ({one}) => ({
	applicationPhase: one(applicationPhase, {
		fields: [phaseReminder.phaseId],
		references: [applicationPhase.phaseId]
	}),
}));

export const ipDisclosureInventorRelations = relations(ipDisclosureInventor, ({one}) => ({
	ipDisclosure: one(ipDisclosure, {
		fields: [ipDisclosureInventor.disclosureId],
		references: [ipDisclosure.disclosureId]
	}),
}));

export const internalValidationAssigneeRelations = relations(internalValidationAssignee, ({one}) => ({
	internalValidation: one(internalValidation, {
		fields: [internalValidationAssignee.internalValidationId],
		references: [internalValidation.validationId]
	}),
	userAccount: one(userAccount, {
		fields: [internalValidationAssignee.userId],
		references: [userAccount.id]
	}),
}));

export const phaseTaskAssigneeRelations = relations(phaseTaskAssignee, ({one}) => ({
	phaseTask: one(phaseTask, {
		fields: [phaseTaskAssignee.taskId],
		references: [phaseTask.taskId]
	}),
	userAccount: one(userAccount, {
		fields: [phaseTaskAssignee.userId],
		references: [userAccount.id]
	}),
}));

export const ipApplicationEnrollmentRelations = relations(ipApplicationEnrollment, ({one}) => ({
	ipApplication: one(ipApplication, {
		fields: [ipApplicationEnrollment.applicationId],
		references: [ipApplication.id]
	}),
	userAccount: one(userAccount, {
		fields: [ipApplicationEnrollment.userId],
		references: [userAccount.id]
	}),
}));

export const eventParticipantRelations = relations(eventParticipant, ({one}) => ({
	calendarEvent: one(calendarEvent, {
		fields: [eventParticipant.eventId],
		references: [calendarEvent.id]
	}),
	userAccount: one(userAccount, {
		fields: [eventParticipant.userId],
		references: [userAccount.id]
	}),
}));