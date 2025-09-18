import { RouterOutputs } from "@/trpc/client";
import {
  DOCUMENT_TYPE,
  PHASE_PRIORITY,
  PHASE_STATUS,
} from "../hooks/useFilter";

export type ClientProject = RouterOutputs["clientProjectDashboard"]["get"];
export type ApplicationPhase =
  NonNullable<ClientProject>["applicationPhases"][number];
export type PhaseTask = ApplicationPhase["phaseTasks"][number];

export type PhaseStatus = (typeof PHASE_STATUS)[number];
export type PhasePriority = (typeof PHASE_PRIORITY)[number];
export type DocumentType = (typeof DOCUMENT_TYPE)[number];

export type InternalValidationsOutput =
  RouterOutputs["clientProjectDashboard"]["getInternalValidations"][number];

export type ExternalCollaborationOutput =
  RouterOutputs["clientProjectDashboard"]["getExternalCollaborations"][number];
