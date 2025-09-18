"use server";

import { db } from "@/drizzle";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import { asc, desc } from "drizzle-orm";
import { ipDisclosure, disclosureConfirmation } from "@/drizzle/schema";
import {
  IndustrialDesignFilterType,
  IndustrialDesignInventoryType,
} from "../schemas/industrial-design";

// Define the type for JSON structures
type IpSelectedTypes = {
  patent?: boolean;
  copyright?: boolean;
  trademark?: boolean;
  industrialDesign?: boolean;
  tradeSecret?: boolean;
  utilityModel?: boolean;
  other?: boolean;
  notSure?: boolean;
};

type IpDisclosureStatus = {
  past: boolean;
  planned: boolean;
  notApplicable: boolean;
};

// Define the type for the database query result
type IpDisclosureWithConfirmation = {
  disclosureId: string;
  clientId: string | null;
  email: string | null;
  isRightfulOwner: boolean | null;
  status: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  authorizedRepresentative: string | null;
  selectedIpTypes: IpSelectedTypes;
  otherIpType: string | null;
  disclosureConfirmations: {
    confirmationId: string;
    disclosureId: string;
    writtenDisclosures: IpDisclosureStatus;
    oralDisclosures: IpDisclosureStatus;
    futureWork: string | null;
    confirmationDeclaration: boolean;
    createdAt: string | null;
    updatedAt: string | null;
  }[];
};

/**
 * Fetch industrial design inventory with filters and pagination
 */
export async function fetchIndustrialDesignInventory(
  filters: IndustrialDesignFilterType,
  pagination: {
    page: number;
    limit: number;
    sortBy: string;
    sortDirection: "asc" | "desc";
  }
) {
  try {
    const { page, limit, sortBy, sortDirection } = pagination;
    const offset = (page - 1) * limit;

    // Build the base query conditions
    const baseConditions = [
      // Add status filter if not "all"
      filters.status && filters.status !== "all"
        ? eq(ipDisclosure.status, filters.status)
        : undefined,
      // Add search filter if provided
      filters.search
        ? or(
            ilike(ipDisclosure.email, `%${filters.search}%`),
            ilike(ipDisclosure.disclosureId, `%${filters.search}%`)
          )
        : undefined,
    ].filter(Boolean);

    // Get all records from the database
    const query = await db.query.ipDisclosure.findMany({
      where: and(...baseConditions),
      with: {
        disclosureConfirmations: true,
      },
      limit,
      offset,
      orderBy: (() => {
        // Handle sorting
        const direction = sortDirection === "asc" ? "asc" : "desc";
        switch (sortBy) {
          case "email":
            return direction === "asc"
              ? [asc(ipDisclosure.email)]
              : [desc(ipDisclosure.email)];
          case "status":
            return direction === "asc"
              ? [asc(ipDisclosure.status)]
              : [desc(ipDisclosure.status)];
          case "updatedAt":
            return direction === "asc"
              ? [asc(ipDisclosure.updatedAt)]
              : [desc(ipDisclosure.updatedAt)];
          case "createdAt":
          default:
            return direction === "asc"
              ? [asc(ipDisclosure.createdAt)]
              : [desc(ipDisclosure.createdAt)];
        }
      })(),
    });

    // Execute the count query
    const countQuery = await db.query.ipDisclosure.findMany({
      where: and(...baseConditions),
    });

    // Get the total count
    const total = countQuery.length;

    // Map the results to the expected format and include industrial design records
    const data = query.map((record) => {
      const confirmation = record.disclosureConfirmations?.[0];

      return {
        disclosureId: record.disclosureId,
        clientId: record.clientId ?? undefined,
        email: record.email ?? undefined,
        isRightfulOwner: record.isRightfulOwner ?? undefined,
        status: record.status ?? undefined,
        createdAt: record.createdAt ?? undefined,
        updatedAt: record.updatedAt ?? undefined,
        authorizedRepresentative: record.authorizedRepresentative ?? undefined,
        selectedIpTypes: record.selectedIpTypes as IpSelectedTypes,
        otherIpType: record.otherIpType ?? undefined,
        confirmation: confirmation
          ? {
              confirmationId: confirmation.confirmationId,
              writtenDisclosures:
                confirmation.writtenDisclosures as IpDisclosureStatus,
              oralDisclosures:
                confirmation.oralDisclosures as IpDisclosureStatus,
              futureWork: confirmation.futureWork ?? undefined,
              confirmationDeclaration: confirmation.confirmationDeclaration,
            }
          : undefined,
      };
    });

    return {
      data,
      total,
      page,
      limit,
    };
  } catch (error) {
    console.error("Error fetching industrial design inventory:", error);
    return { error: "Failed to fetch industrial design inventory" };
  }
}

/**
 * Get industrial design record by ID
 */
export async function getIndustrialDesignById(
  id: string
): Promise<IndustrialDesignInventoryType | null> {
  try {
    const record = await db.query.ipDisclosure.findFirst({
      where: eq(ipDisclosure.disclosureId, id),
      with: {
        disclosureConfirmations: true,
      },
    });

    if (!record) {
      return null;
    }

    const confirmation = record.disclosureConfirmations?.[0];

    return {
      disclosureId: record.disclosureId,
      clientId: record.clientId ?? undefined,
      email: record.email ?? undefined,
      isRightfulOwner: record.isRightfulOwner ?? undefined,
      status: record.status ?? undefined,
      createdAt: record.createdAt ?? undefined,
      updatedAt: record.updatedAt ?? undefined,
      authorizedRepresentative: record.authorizedRepresentative ?? undefined,
      selectedIpTypes: record.selectedIpTypes as IpSelectedTypes,
      otherIpType: record.otherIpType ?? undefined,
      confirmation: confirmation
        ? {
            confirmationId: confirmation.confirmationId,
            writtenDisclosures:
              confirmation.writtenDisclosures as IpDisclosureStatus,
            oralDisclosures: confirmation.oralDisclosures as IpDisclosureStatus,
            futureWork: confirmation.futureWork ?? undefined,
            confirmationDeclaration: confirmation.confirmationDeclaration,
          }
        : undefined,
    };
  } catch (error) {
    console.error("Error fetching industrial design record:", error);
    return null;
  }
}

/**
 * Update industrial design record
 */
export async function updateIndustrialDesign(
  id: string,
  data: {
    status?: string;
    isRightfulOwner?: boolean;
    authorizedRepresentative?: string;
    confirmation?: {
      writtenDisclosures?: {
        past?: boolean;
        planned?: boolean;
        notApplicable?: boolean;
      };
      oralDisclosures?: {
        past?: boolean;
        planned?: boolean;
        notApplicable?: boolean;
      };
      futureWork?: string;
      confirmationDeclaration?: boolean;
    };
  }
) {
  try {
    const { confirmation, ...disclosureData } = data;

    // Update the ip_disclosure record
    if (Object.keys(disclosureData).length > 0) {
      await db
        .update(ipDisclosure)
        .set({
          ...disclosureData,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(ipDisclosure.disclosureId, id));
    }

    // Update the disclosure_confirmation record if provided
    if (confirmation) {
      const existingConfirmation =
        await db.query.disclosureConfirmation.findFirst({
          where: eq(disclosureConfirmation.disclosureId, id),
        });

      if (existingConfirmation) {
        await db
          .update(disclosureConfirmation)
          .set({
            ...confirmation,
            updatedAt: new Date().toISOString(),
          })
          .where(
            eq(
              disclosureConfirmation.confirmationId,
              existingConfirmation.confirmationId
            )
          );
      } else {
        // If no confirmation record exists, create one
        await db.insert(disclosureConfirmation).values({
          disclosureId: id,
          writtenDisclosures: confirmation.writtenDisclosures || {
            past: false,
            planned: false,
            notApplicable: false,
          },
          oralDisclosures: confirmation.oralDisclosures || {
            past: false,
            planned: false,
            notApplicable: false,
          },
          futureWork: confirmation.futureWork || "",
          confirmationDeclaration:
            confirmation.confirmationDeclaration || false,
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating industrial design record:", error);
    return { error: "Failed to update industrial design record" };
  }
}

/**
 * Delete industrial design record
 */
export async function deleteIndustrialDesign(id: string) {
  try {
    // Delete the ip_disclosure record (cascade will delete related records)
    await db.delete(ipDisclosure).where(eq(ipDisclosure.disclosureId, id));
    return { success: true };
  } catch (error) {
    console.error("Error deleting industrial design record:", error);
    return { error: "Failed to delete industrial design record" };
  }
}
