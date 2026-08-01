"use server";

import { db } from "@/drizzle";
import {
  disclosureConfirmation,
  ipDisclosure,
  ipDisclosureApplicant,
  ipDisclosureInventor,
} from "@/drizzle/schema";
import { and, eq, ilike, or, sql } from "drizzle-orm";

type FetchParams = {
  page: number;
  limit: number;
  sortBy: string;
  sortDirection: "asc" | "desc";
  status?: string;
  search?: string;
  ipType?: string;
};

const ipTypeFieldMap: Record<string, string> = {
  patent: "patent",
  copyright: "copyright",
  trademark: "trademark",
  tradesecret: "tradeSecret",
  "utility-model": "utilityModel",
  industrialDesign: "industrialDesign",
  other: "other",
  notSure: "notSure",
};

function mapApplicant(applicant: typeof ipDisclosureApplicant.$inferSelect) {
  return {
    applicant_id: applicant.applicantId,
    disclosure_id: applicant.disclosureId,
    first_name: applicant.firstName,
    middle_initial: applicant.middleInitial ?? "",
    last_name: applicant.lastName,
    created_at: String(applicant.createdAt ?? ""),
    updated_at: String(applicant.updatedAt ?? ""),
  };
}

function mapInventor(inventor: typeof ipDisclosureInventor.$inferSelect) {
  return {
    inventor_id: inventor.inventorId,
    disclosure_id: inventor.disclosureId,
    first_name: inventor.firstName,
    middle_initial: inventor.middleInitial ?? "",
    last_name: inventor.lastName,
    created_at: String(inventor.createdAt ?? ""),
    updated_at: String(inventor.updatedAt ?? ""),
  };
}

function mapConfirmation(
  confirmation: typeof disclosureConfirmation.$inferSelect
) {
  return {
    confirmation_id: confirmation.confirmationId,
    disclosure_id: confirmation.disclosureId,
    written_disclosures: confirmation.writtenDisclosures,
    oral_disclosures: confirmation.oralDisclosures,
    future_work: confirmation.futureWork ?? "",
    confirmation_declaration: confirmation.confirmationDeclaration,
    created_at: String(confirmation.createdAt ?? ""),
    updated_at: String(confirmation.updatedAt ?? ""),
  };
}

export async function fetchMainDisclosureInventory({
  page,
  limit,
  sortBy,
  sortDirection,
  status = "all",
  search = "",
  ipType = "all",
}: FetchParams) {
  try {
    const conditions = [];

    if (status !== "all") {
      conditions.push(eq(ipDisclosure.status, status));
    }

    if (search) {
      conditions.push(
        or(
          ilike(ipDisclosure.email, `%${search}%`),
          ilike(ipDisclosure.disclosureId, `%${search}%`),
          ilike(ipDisclosure.authorizedRepresentative ?? "", `%${search}%`)
        )
      );
    }

    if (ipType !== "all") {
      const field = ipTypeFieldMap[ipType];
      if (field) {
        conditions.push(
          sql`${ipDisclosure.selectedIpTypes}::jsonb->>${field} = 'true'`
        );
      }
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    const disclosures = await db.query.ipDisclosure.findMany({
      where: whereClause,
      with: {
        disclosureConfirmations: true,
      },
    });

    const enriched = await Promise.all(
      disclosures.map(async (disclosure) => {
        const applicants = await db
          .select()
          .from(ipDisclosureApplicant)
          .where(
            eq(ipDisclosureApplicant.disclosureId, disclosure.disclosureId)
          );

        const inventors = await db
          .select()
          .from(ipDisclosureInventor)
          .where(
            eq(ipDisclosureInventor.disclosureId, disclosure.disclosureId)
          );

        const confirmation = disclosure.disclosureConfirmations?.[0];

        return {
          disclosure_id: disclosure.disclosureId,
          client_id: disclosure.clientId ?? "",
          is_rightful_owner: disclosure.isRightfulOwner ?? false,
          selected_ip_types: (disclosure.selectedIpTypes ?? {}) as Record<
            string,
            boolean
          >,
          status: disclosure.status ?? "draft",
          created_at: String(disclosure.createdAt ?? ""),
          updated_at: String(disclosure.updatedAt ?? ""),
          email: disclosure.email ?? "",
          authorized_representative: disclosure.authorizedRepresentative,
          other_ip_type: disclosure.otherIpType,
          // application_id was removed from schema
          applicants: applicants.map(mapApplicant),
          inventors: inventors.map(mapInventor),
          confirmation: confirmation ? mapConfirmation(confirmation) : undefined,
        };
      })
    );

    const sorted = [...enriched].sort((a, b) => {
      const direction = sortDirection === "asc" ? 1 : -1;

      switch (sortBy) {
        case "email":
          return a.email.localeCompare(b.email) * direction;
        case "status":
          return a.status.localeCompare(b.status) * direction;
        case "updated_at":
          return (
            (new Date(a.updated_at).getTime() -
              new Date(b.updated_at).getTime()) *
            direction
          );
        case "future_work":
          return (
            (a.confirmation?.future_work ?? "").localeCompare(
              b.confirmation?.future_work ?? ""
            ) * direction
          );
        case "created_at":
        default:
          return (
            (new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()) *
            direction
          );
      }
    });

    const total = sorted.length;
    const start = (page - 1) * limit;
    const data = sorted.slice(start, start + limit);

    return { data, total };
  } catch (error) {
    console.error("Error fetching main disclosure inventory:", error);
    return { data: [], total: 0, error: "Failed to fetch IP disclosure data" };
  }
}
