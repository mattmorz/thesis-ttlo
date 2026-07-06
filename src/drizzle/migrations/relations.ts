import { relations } from "drizzle-orm/relations";
import { userAccount, clientProfile, ipApplication, activityLog, applicationPhase, ipDisclosure, patentSearchReport, patentUtilityModelApplication, copyrightBasicApplication, disclosureConfirmation, ipDisclosureApplicant, ipDisclosureAttachment, ipDisclosureInventor, ipDisclosureReview, patentMatrixSample, tradeSecretApplication, trademarkApplication, session, digitalSignature, calendarEvent, documentManagement, externalCollaboration, internalValidation, phaseReminder, phaseReview, phaseTask, phaseReviewAttachment, taskAssignment, archives, ipDetails, authenticator, comment, contactMessage, account, deedOfAssignment, documents, documentsValidation, ipApplicationNotification, formSubmissionRegistry, formDataMapping, ipContributors, otherDocuments, substantialUse, trackingCode, trackingOtp, notification, eventParticipant } from "./schema";

export const clientProfileRelations = relations(clientProfile, ({one}) => ({
	userAccount: one(userAccount, {
		fields: [clientProfile.userId],
		references: [userAccount.id]
	}),
}));

export const userAccountRelations = relations(userAccount, ({many}) => ({
	clientProfiles: many(clientProfile),
	activityLogs: many(activityLog),
	ipDisclosures: many(ipDisclosure),
	ipDisclosureReviews: many(ipDisclosureReview),
	sessions: many(session),
	digitalSignatures: many(digitalSignature),
	calendarEvents: many(calendarEvent),
	documentManagements_uploadedBy: many(documentManagement, {
		relationName: "documentManagement_uploadedBy_userAccount_id"
	}),
	documentManagements_verifiedBy: many(documentManagement, {
		relationName: "documentManagement_verifiedBy_userAccount_id"
	}),
	internalValidations: many(internalValidation),
	phaseReviews: many(phaseReview),
	phaseTasks: many(phaseTask),
	taskAssignments: many(taskAssignment),
	archives: many(archives),
	authenticators: many(authenticator),
	comments: many(comment),
	contactMessages: many(contactMessage),
	accounts: many(account),
	deedOfAssignments: many(deedOfAssignment),
	documents: many(documents),
	documentsValidations: many(documentsValidation),
	ipApplicationNotifications: many(ipApplicationNotification),
	formSubmissionRegistries: many(formSubmissionRegistry),
	ipApplications: many(ipApplication),
	otherDocuments: many(otherDocuments),
	substantialUses: many(substantialUse),
	trackingCodes: many(trackingCode),
	notifications: many(notification),
	eventParticipants: many(eventParticipant),
}));

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
	calendarEvents: many(calendarEvent),
	documentManagements: many(documentManagement),
	archives: many(archives),
	ipDetails: many(ipDetails),
	deedOfAssignments: many(deedOfAssignment),
	documents: many(documents),
	ipApplicationNotifications: many(ipApplicationNotification),
	formSubmissionRegistries: many(formSubmissionRegistry),
	userAccount: one(userAccount, {
		fields: [ipApplication.userId],
		references: [userAccount.id]
	}),
	ipContributors: many(ipContributors),
	otherDocuments: many(otherDocuments),
	substantialUses: many(substantialUse),
	trackingCodes: many(trackingCode),
}));

export const applicationPhaseRelations = relations(applicationPhase, ({one, many}) => ({
	activityLogs: many(activityLog),
	ipApplication: one(ipApplication, {
		fields: [applicationPhase.applicationId],
		references: [ipApplication.id]
	}),
	calendarEvents: many(calendarEvent),
	documentManagements: many(documentManagement),
	externalCollaborations: many(externalCollaboration),
	internalValidations: many(internalValidation),
	phaseReminders: many(phaseReminder),
	phaseReviews: many(phaseReview),
	phaseTasks: many(phaseTask),
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

export const ipDisclosureRelations = relations(ipDisclosure, ({one, many}) => ({
	patentSearchReports: many(patentSearchReport),
	userAccount: one(userAccount, {
		fields: [ipDisclosure.clientId],
		references: [userAccount.id]
	}),
	copyrightBasicApplications: many(copyrightBasicApplication),
	disclosureConfirmations: many(disclosureConfirmation),
	ipDisclosureApplicants: many(ipDisclosureApplicant),
	ipDisclosureAttachments: many(ipDisclosureAttachment),
	ipDisclosureInventors: many(ipDisclosureInventor),
	ipDisclosureReviews: many(ipDisclosureReview),
	patentMatrixSamples: many(patentMatrixSample),
	patentUtilityModelApplications: many(patentUtilityModelApplication),
	tradeSecretApplications: many(tradeSecretApplication),
	trademarkApplications: many(trademarkApplication),
}));

export const patentUtilityModelApplicationRelations = relations(patentUtilityModelApplication, ({one, many}) => ({
	patentSearchReports: many(patentSearchReport),
	patentMatrixSamples: many(patentMatrixSample),
	ipDisclosure: one(ipDisclosure, {
		fields: [patentUtilityModelApplication.disclosureId],
		references: [ipDisclosure.disclosureId]
	}),
}));

export const copyrightBasicApplicationRelations = relations(copyrightBasicApplication, ({one}) => ({
	ipDisclosure: one(ipDisclosure, {
		fields: [copyrightBasicApplication.disclosureId],
		references: [ipDisclosure.disclosureId]
	}),
}));

export const disclosureConfirmationRelations = relations(disclosureConfirmation, ({one}) => ({
	ipDisclosure: one(ipDisclosure, {
		fields: [disclosureConfirmation.disclosureId],
		references: [ipDisclosure.disclosureId]
	}),
}));

export const ipDisclosureApplicantRelations = relations(ipDisclosureApplicant, ({one}) => ({
	ipDisclosure: one(ipDisclosure, {
		fields: [ipDisclosureApplicant.disclosureId],
		references: [ipDisclosure.disclosureId]
	}),
}));

export const ipDisclosureAttachmentRelations = relations(ipDisclosureAttachment, ({one}) => ({
	ipDisclosure: one(ipDisclosure, {
		fields: [ipDisclosureAttachment.disclosureId],
		references: [ipDisclosure.disclosureId]
	}),
}));

export const ipDisclosureInventorRelations = relations(ipDisclosureInventor, ({one}) => ({
	ipDisclosure: one(ipDisclosure, {
		fields: [ipDisclosureInventor.disclosureId],
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

export const sessionRelations = relations(session, ({one}) => ({
	userAccount: one(userAccount, {
		fields: [session.userId],
		references: [userAccount.id]
	}),
}));

export const digitalSignatureRelations = relations(digitalSignature, ({one}) => ({
	userAccount: one(userAccount, {
		fields: [digitalSignature.signerId],
		references: [userAccount.id]
	}),
}));

export const calendarEventRelations = relations(calendarEvent, ({one, many}) => ({
	ipApplication: one(ipApplication, {
		fields: [calendarEvent.applicationId],
		references: [ipApplication.id]
	}),
	userAccount: one(userAccount, {
		fields: [calendarEvent.createdBy],
		references: [userAccount.id]
	}),
	applicationPhase: one(applicationPhase, {
		fields: [calendarEvent.phaseId],
		references: [applicationPhase.phaseId]
	}),
	eventParticipants: many(eventParticipant),
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

export const externalCollaborationRelations = relations(externalCollaboration, ({one}) => ({
	applicationPhase: one(applicationPhase, {
		fields: [externalCollaboration.phaseId],
		references: [applicationPhase.phaseId]
	}),
}));

export const internalValidationRelations = relations(internalValidation, ({one}) => ({
	userAccount: one(userAccount, {
		fields: [internalValidation.assignedTo],
		references: [userAccount.id]
	}),
	applicationPhase: one(applicationPhase, {
		fields: [internalValidation.phaseId],
		references: [applicationPhase.phaseId]
	}),
}));

export const phaseReminderRelations = relations(phaseReminder, ({one}) => ({
	applicationPhase: one(applicationPhase, {
		fields: [phaseReminder.phaseId],
		references: [applicationPhase.phaseId]
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

export const phaseTaskRelations = relations(phaseTask, ({one, many}) => ({
	userAccount: one(userAccount, {
		fields: [phaseTask.assigneeId],
		references: [userAccount.id]
	}),
	applicationPhase: one(applicationPhase, {
		fields: [phaseTask.phaseId],
		references: [applicationPhase.phaseId]
	}),
	taskAssignments: many(taskAssignment),
}));

export const phaseReviewAttachmentRelations = relations(phaseReviewAttachment, ({one}) => ({
	phaseReview: one(phaseReview, {
		fields: [phaseReviewAttachment.reviewId],
		references: [phaseReview.reviewId]
	}),
}));

export const taskAssignmentRelations = relations(taskAssignment, ({one}) => ({
	phaseTask: one(phaseTask, {
		fields: [taskAssignment.taskId],
		references: [phaseTask.taskId]
	}),
	userAccount: one(userAccount, {
		fields: [taskAssignment.userId],
		references: [userAccount.id]
	}),
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

export const ipDetailsRelations = relations(ipDetails, ({one}) => ({
	ipApplication: one(ipApplication, {
		fields: [ipDetails.applicationId],
		references: [ipApplication.id]
	}),
}));

export const authenticatorRelations = relations(authenticator, ({one}) => ({
	userAccount: one(userAccount, {
		fields: [authenticator.userId],
		references: [userAccount.id]
	}),
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

export const formSubmissionRegistryRelations = relations(formSubmissionRegistry, ({one, many}) => ({
	ipApplicationNotifications: many(ipApplicationNotification),
	ipApplication: one(ipApplication, {
		fields: [formSubmissionRegistry.ipApplicationId],
		references: [ipApplication.id]
	}),
	userAccount: one(userAccount, {
		fields: [formSubmissionRegistry.userId],
		references: [userAccount.id]
	}),
	formDataMappings: many(formDataMapping),
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

export const otherDocumentsRelations = relations(otherDocuments, ({one}) => ({
	userAccount: one(userAccount, {
		fields: [otherDocuments.userId],
		references: [userAccount.id]
	}),
	ipApplication: one(ipApplication, {
		fields: [otherDocuments.ipApplicationId],
		references: [ipApplication.id]
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

export const trackingCodeRelations = relations(trackingCode, ({one, many}) => ({
	ipApplication: one(ipApplication, {
		fields: [trackingCode.ipApplicationId],
		references: [ipApplication.id]
	}),
	userAccount: one(userAccount, {
		fields: [trackingCode.userId],
		references: [userAccount.id]
	}),
	trackingOtps: many(trackingOtp),
}));

export const trackingOtpRelations = relations(trackingOtp, ({one}) => ({
	trackingCode: one(trackingCode, {
		fields: [trackingOtp.trackingId],
		references: [trackingCode.trackingId]
	}),
}));

export const notificationRelations = relations(notification, ({one}) => ({
	userAccount: one(userAccount, {
		fields: [notification.userId],
		references: [userAccount.id]
	}),
}));

export const eventParticipantRelations = relations(eventParticipant, ({one}) => ({
	calendarEvent: one(calendarEvent, {
		fields: [eventParticipant.eventId],
		references: [calendarEvent.eventId]
	}),
	userAccount: one(userAccount, {
		fields: [eventParticipant.userId],
		references: [userAccount.id]
	}),
}));