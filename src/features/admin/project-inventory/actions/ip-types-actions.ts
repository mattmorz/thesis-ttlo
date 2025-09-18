"use server";

import { db } from "@/drizzle";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import { asc, desc } from "drizzle-orm";
import { ipDisclosure, disclosureConfirmation } from "@/drizzle/schema";
import {
  IndustrialDesignFilterType,
  IndustrialDesignInventoryType,
} from "../schemas/industrial-design";
import {
  NoneIpTypesFilterType,
  NoneIpTypesInventoryType,
  NoneIpTypesPaginationType,
} from "../schemas/none-ip-types";
import {
  OtherIpTypesFilterType,
  OtherIpTypesInventoryType,
} from "../schemas/other-ip-types";

// Shared types for IP disclosures
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

// Generic pagination type
type PaginationType = {
  page: number;
  limit: number;
  sortBy: string;
  sortDirection: "asc" | "desc";
};

// Shared utility functions

/**
 * Build common query conditions for IP type filtering
 */
function buildBaseConditions(
  filterField: string,
  filters: { status?: string; search?: string },
  additionalConditions: SQL<unknown>[] = []
) {
  const conditions = [
    // Only fetch records with the specified IP type in selectedIpTypes
    sql`${ipDisclosure.selectedIpTypes}::jsonb->>'${sql.raw(
      filterField
    )}' = 'true'`,

    // Add status filter if not "all"
    filters.status && filters.status !== "all"
      ? eq(ipDisclosure.status, filters.status)
      : undefined,

    // Add search filter if provided - using ilike for case-insensitive search
    filters.search
      ? or(
          ilike(ipDisclosure.email, `%${filters.search}%`),
          ilike(ipDisclosure.disclosureId, `%${filters.search}%`),
          ilike(
            ipDisclosure.authorizedRepresentative || "",
            `%${filters.search}%`
          )
        )
      : undefined,

    // Add any additional conditions
    ...additionalConditions,
  ].filter(Boolean);

  return conditions;
}

/**
 * Map database record to inventory type
 */
function mapDisclosureRecord(record: any, ipType: string) {
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
}

// Industrial Design Actions
//------------------------------------------------------------------------------

/**
 * Fetch industrial design inventory with filters and pagination
 */
export async function fetchIndustrialDesignInventory(
  filters: IndustrialDesignFilterType,
  pagination: PaginationType
) {
  try {
    const { page, limit, sortBy, sortDirection } = pagination;
    const offset = (page - 1) * limit;

    // Build the base query conditions
    const baseConditions = buildBaseConditions("industrialDesign", filters);
    const whereClause =
      baseConditions.length > 0 ? and(...baseConditions) : undefined;

    // Get the total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(ipDisclosure)
      .where(whereClause);

    const total = countResult[0]?.count || 0;

    // Execute the main query
    const query = await db.query.ipDisclosure.findMany({
      where: whereClause,
      with: {
        disclosureConfirmations: true,
      },
      orderBy:
        sortDirection === "asc"
          ? asc(ipDisclosure[sortBy as keyof typeof ipDisclosure] as any)
          : desc(ipDisclosure[sortBy as keyof typeof ipDisclosure] as any),
      limit,
      offset,
    });

    // Map the results to the expected format
    const data = query.map((record) =>
      mapDisclosureRecord(record, "industrialDesign")
    );

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

    return mapDisclosureRecord(
      record,
      "industrialDesign"
    ) as IndustrialDesignInventoryType;
  } catch (error) {
    console.error("Error fetching industrial design record:", error);
    return null;
  }
}

/**
 * Update industrial design disclosure
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
    // Update disclosure data
    if (
      data.status ||
      data.isRightfulOwner !== undefined ||
      data.authorizedRepresentative !== undefined
    ) {
      const disclosureUpdate: any = {};
      if (data.status) disclosureUpdate.status = data.status;
      if (data.isRightfulOwner !== undefined)
        disclosureUpdate.isRightfulOwner = data.isRightfulOwner;
      if (data.authorizedRepresentative !== undefined)
        disclosureUpdate.authorizedRepresentative =
          data.authorizedRepresentative;

      await db
        .update(ipDisclosure)
        .set(disclosureUpdate)
        .where(eq(ipDisclosure.disclosureId, id));
    }

    // Update confirmation data if provided
    if (data.confirmation) {
      // First check if confirmation exists
      const exists = await db.query.disclosureConfirmation.findFirst({
        where: eq(disclosureConfirmation.disclosureId, id),
      });

      if (exists) {
        const confirmationUpdate: any = {};

        if (data.confirmation.writtenDisclosures) {
          confirmationUpdate.writtenDisclosures =
            data.confirmation.writtenDisclosures;
        }

        if (data.confirmation.oralDisclosures) {
          confirmationUpdate.oralDisclosures =
            data.confirmation.oralDisclosures;
        }

        if (data.confirmation.futureWork !== undefined) {
          confirmationUpdate.futureWork = data.confirmation.futureWork;
        }

        if (data.confirmation.confirmationDeclaration !== undefined) {
          confirmationUpdate.confirmationDeclaration =
            data.confirmation.confirmationDeclaration;
        }

        await db
          .update(disclosureConfirmation)
          .set(confirmationUpdate)
          .where(eq(disclosureConfirmation.disclosureId, id));
      } else {
        // Create new confirmation
        await db.insert(disclosureConfirmation).values({
          disclosureId: id,
          writtenDisclosures: data.confirmation.writtenDisclosures || {
            past: false,
            planned: false,
            notApplicable: true,
          },
          oralDisclosures: data.confirmation.oralDisclosures || {
            past: false,
            planned: false,
            notApplicable: true,
          },
          futureWork: data.confirmation.futureWork || null,
          confirmationDeclaration:
            data.confirmation.confirmationDeclaration || false,
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating industrial design disclosure:", error);
    return {
      success: false,
      error: "Failed to update industrial design disclosure",
    };
  }
}

/**
 * Delete industrial design disclosure
 */
export async function deleteIndustrialDesign(id: string) {
  try {
    // First delete related confirmation record if exists
    await db
      .delete(disclosureConfirmation)
      .where(eq(disclosureConfirmation.disclosureId, id));

    // Then delete the disclosure
    await db.delete(ipDisclosure).where(eq(ipDisclosure.disclosureId, id));

    return { success: true };
  } catch (error) {
    console.error("Error deleting industrial design disclosure:", error);
    return {
      success: false,
      error: "Failed to delete industrial design disclosure",
    };
  }
}

// Other IP Types Actions
//------------------------------------------------------------------------------

/**
 * Fetch other IP types inventory with filters and pagination
 */
export async function fetchOtherIpTypesInventory(
  filters: OtherIpTypesFilterType,
  pagination: PaginationType
) {
  try {
    const { page, limit, sortBy, sortDirection } = pagination;
    const offset = (page - 1) * limit;

    // Build the base query conditions with additional check for otherIpType
    const additionalConditions = [
      filters.search && ipDisclosure.otherIpType
        ? ilike(ipDisclosure.otherIpType, `%${filters.search}%`)
        : undefined,
    ].filter(Boolean);

    const baseConditions = buildBaseConditions(
      "other",
      filters,
      additionalConditions
    );
    const whereClause =
      baseConditions.length > 0 ? and(...baseConditions) : undefined;

    // Get the total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(ipDisclosure)
      .where(whereClause);

    const total = countResult[0]?.count || 0;

    // Execute the main query
    const query = await db.query.ipDisclosure.findMany({
      where: whereClause,
      with: {
        disclosureConfirmations: true,
      },
      orderBy:
        sortDirection === "asc"
          ? asc(ipDisclosure[sortBy as keyof typeof ipDisclosure] as any)
          : desc(ipDisclosure[sortBy as keyof typeof ipDisclosure] as any),
      limit,
      offset,
    });

    // Map the results to the expected format
    const data = query.map((record) => mapDisclosureRecord(record, "other"));

    return {
      data,
      total,
      page,
      limit,
    };
  } catch (error) {
    console.error("Error fetching other IP types inventory:", error);
    return { error: "Failed to fetch other IP types inventory" };
  }
}

/**
 * Get other IP type record by ID
 */
export async function getOtherIpTypeById(
  id: string
): Promise<OtherIpTypesInventoryType | null> {
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

    return mapDisclosureRecord(record, "other") as OtherIpTypesInventoryType;
  } catch (error) {
    console.error("Error fetching other IP type record:", error);
    return null;
  }
}

/**
 * Update other IP type disclosure
 */
export async function updateOtherIpType(
  id: string,
  data: {
    status?: string;
    isRightfulOwner?: boolean;
    authorizedRepresentative?: string;
    otherIpType?: string;
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
    // Update disclosure data
    if (
      data.status ||
      data.isRightfulOwner !== undefined ||
      data.authorizedRepresentative !== undefined ||
      data.otherIpType !== undefined
    ) {
      const disclosureUpdate: any = {};
      if (data.status) disclosureUpdate.status = data.status;
      if (data.isRightfulOwner !== undefined)
        disclosureUpdate.isRightfulOwner = data.isRightfulOwner;
      if (data.authorizedRepresentative !== undefined)
        disclosureUpdate.authorizedRepresentative =
          data.authorizedRepresentative;
      if (data.otherIpType !== undefined)
        disclosureUpdate.otherIpType = data.otherIpType;

      await db
        .update(ipDisclosure)
        .set(disclosureUpdate)
        .where(eq(ipDisclosure.disclosureId, id));
    }

    // Update confirmation data if provided (same as industrial design)
    if (data.confirmation) {
      // First check if confirmation exists
      const exists = await db.query.disclosureConfirmation.findFirst({
        where: eq(disclosureConfirmation.disclosureId, id),
      });

      if (exists) {
        const confirmationUpdate: any = {};

        if (data.confirmation.writtenDisclosures) {
          confirmationUpdate.writtenDisclosures =
            data.confirmation.writtenDisclosures;
        }

        if (data.confirmation.oralDisclosures) {
          confirmationUpdate.oralDisclosures =
            data.confirmation.oralDisclosures;
        }

        if (data.confirmation.futureWork !== undefined) {
          confirmationUpdate.futureWork = data.confirmation.futureWork;
        }

        if (data.confirmation.confirmationDeclaration !== undefined) {
          confirmationUpdate.confirmationDeclaration =
            data.confirmation.confirmationDeclaration;
        }

        await db
          .update(disclosureConfirmation)
          .set(confirmationUpdate)
          .where(eq(disclosureConfirmation.disclosureId, id));
      } else {
        // Create new confirmation
        await db.insert(disclosureConfirmation).values({
          disclosureId: id,
          writtenDisclosures: data.confirmation.writtenDisclosures || {
            past: false,
            planned: false,
            notApplicable: true,
          },
          oralDisclosures: data.confirmation.oralDisclosures || {
            past: false,
            planned: false,
            notApplicable: true,
          },
          futureWork: data.confirmation.futureWork || null,
          confirmationDeclaration:
            data.confirmation.confirmationDeclaration || false,
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating other IP type disclosure:", error);
    return {
      success: false,
      error: "Failed to update other IP type disclosure",
    };
  }
}

/**
 * Delete other IP type disclosure (same as industrial design)
 */
export async function deleteOtherIpType(id: string) {
  try {
    // First delete related confirmation record if exists
    await db
      .delete(disclosureConfirmation)
      .where(eq(disclosureConfirmation.disclosureId, id));

    // Then delete the disclosure
    await db.delete(ipDisclosure).where(eq(ipDisclosure.disclosureId, id));

    return { success: true };
  } catch (error) {
    console.error("Error deleting other IP type disclosure:", error);
    return {
      success: false,
      error: "Failed to delete other IP type disclosure",
    };
  }
}

// None IP Types Actions
//------------------------------------------------------------------------------

/**
 * Fetch none IP types inventory with filters and pagination
 */
export async function fetchNoneIpTypesInventory(
  filters: NoneIpTypesFilterType,
  pagination: NoneIpTypesPaginationType
): Promise<{
  data: NoneIpTypesInventoryType[];
  total: number;
  error?: string;
}> {
  try {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;

    // Build WHERE clause conditions
    const conditions = [
      // Only fetch records with notSure: true in selectedIpTypes
      sql`${ipDisclosure.selectedIpTypes}::jsonb->>'notSure' = 'true'`,
    ];

    // Add status filter if not "all"
    if (filters.status && filters.status !== "all") {
      conditions.push(eq(ipDisclosure.status, filters.status));
    }

    // Add search filter if provided
    if (filters.search) {
      conditions.push(
        or(
          ilike(ipDisclosure.email, `%${filters.search}%`),
          ilike(ipDisclosure.disclosureId, `%${filters.search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(ipDisclosure)
      .where(whereClause);

    const totalCount = totalCountResult[0]?.count || 0;

    // Execute the main query with pagination
    const noneIpTypes = await db.query.ipDisclosure.findMany({
      where: whereClause,
      orderBy: (fields, { asc, desc }) => {
        return pagination.sortDirection === "asc"
          ? asc(fields[pagination.sortBy as keyof typeof fields])
          : desc(fields[pagination.sortBy as keyof typeof fields]);
      },
      limit: pagination.limit,
      offset: skip,
    });

    // Map the result to the expected format without using relations that don't exist
    const formattedData = noneIpTypes.map((item) => {
      return {
        id: item.disclosureId,
        ipDisclosureId: item.disclosureId,
        email: item.email || "",
        status: item.status || "draft",
        createdAt: item.createdAt
          ? new Date(item.createdAt).toISOString()
          : undefined,
        updatedAt: item.updatedAt
          ? new Date(item.updatedAt).toISOString()
          : undefined,
        writtenDisclosures: undefined,
        oralDisclosures: undefined,
        futureWork: undefined,
        confirmationDeclaration: false,
      };
    });

    return {
      data: formattedData,
      total: totalCount,
    };
  } catch (error) {
    console.error("Error fetching None IP Types inventory:", error);
    return {
      data: [],
      total: 0,
      error: "Failed to fetch None IP Types inventory",
    };
  }
}

/**
 * Get a specific None IP Type by ID
 */
export async function getNoneIpTypeById(
  id: string
): Promise<NoneIpTypesInventoryType | null> {
  try {
    const result = await db.query.ipDisclosure.findFirst({
      where: (fields, { and, eq }) =>
        and(
          eq(fields.disclosureId, id),
          sql`${fields.selectedIpTypes}::jsonb->>'notSure' = 'true'`
        ),
    });

    if (!result) {
      return null;
    }

    return {
      id: result.disclosureId,
      ipDisclosureId: result.disclosureId,
      email: result.email || "",
      status: result.status || "draft",
      createdAt: result.createdAt
        ? new Date(result.createdAt).toISOString()
        : undefined,
      updatedAt: result.updatedAt
        ? new Date(result.updatedAt).toISOString()
        : undefined,
      writtenDisclosures: undefined,
      oralDisclosures: undefined,
      futureWork: undefined,
      confirmationDeclaration: false,
    };
  } catch (error) {
    console.error("Error fetching None IP Type record:", error);
    return null;
  }
}

/**
 * Update None IP Type
 */
export async function updateNoneIpType(
  id: string,
  data: {
    status?: string;
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
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update the status if provided
    if (data.status) {
      await db
        .update(ipDisclosure)
        .set({ status: data.status })
        .where(eq(ipDisclosure.disclosureId, id));
    }

    // Handle confirmation details if provided
    if (data.confirmation) {
      // Check if a confirmation record already exists
      const existingConfirmation =
        await db.query.disclosureConfirmation.findFirst({
          where: eq(disclosureConfirmation.disclosureId, id),
        });

      const confirmationData: any = {};

      if (data.confirmation.writtenDisclosures) {
        confirmationData.writtenDisclosures =
          data.confirmation.writtenDisclosures;
      }

      if (data.confirmation.oralDisclosures) {
        confirmationData.oralDisclosures = data.confirmation.oralDisclosures;
      }

      if (data.confirmation.futureWork !== undefined) {
        confirmationData.futureWork = data.confirmation.futureWork;
      }

      if (data.confirmation.confirmationDeclaration !== undefined) {
        confirmationData.confirmationDeclaration =
          data.confirmation.confirmationDeclaration;
      }

      if (existingConfirmation) {
        // Update existing confirmation
        await db
          .update(disclosureConfirmation)
          .set(confirmationData)
          .where(eq(disclosureConfirmation.disclosureId, id));
      } else {
        // Create new confirmation
        await db.insert(disclosureConfirmation).values({
          disclosureId: id,
          ...confirmationData,
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating None IP Type:", error);
    return {
      success: false,
      error: `Failed to update None IP Type: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}

/**
 * Delete None IP Type
 */
export async function deleteNoneIpType(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // First delete any confirmation records
    await db
      .delete(disclosureConfirmation)
      .where(eq(disclosureConfirmation.disclosureId, id));

    // Then delete the disclosure record
    await db.delete(ipDisclosure).where(eq(ipDisclosure.disclosureId, id));

    return { success: true };
  } catch (error) {
    console.error("Error deleting None IP Type:", error);
    return {
      success: false,
      error: `Failed to delete None IP Type: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}
