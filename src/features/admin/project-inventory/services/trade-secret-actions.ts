"use server";

import { db } from "@/drizzle/db";
import {
  ipDisclosure,
  tradeSecretApplication,
  disclosureConfirmation,
  ipDisclosureApplicant,
  userAccount,
} from "@/drizzle/schema";
import { and, eq, like, desc, asc, or, sql } from "drizzle-orm";
import {
  TradeSecretInventoryType,
  TradeSecretFilterType,
  PaginationParams,
  TradeSecretType,
} from "../schemas/trade-secret";

/**
 * Fetches trade secret inventory data with filtering and pagination
 */
export async function fetchTradeSecretInventory(
  filters: TradeSecretFilterType = {},
  pagination: PaginationParams = { page: 1, limit: 10 }
) {
  try {
    // Calculate offset
    const offset = (pagination.page - 1) * pagination.limit;

    // Build filter conditions
    const conditions = [];

    // Status filter
    if (filters.status && filters.status !== "all") {
      conditions.push(eq(ipDisclosure.status, filters.status));
    }

    // User filter
    if (filters.userId) {
      conditions.push(eq(ipDisclosure.clientId, filters.userId));
    }

    // Disclosure ID filter
    if (filters.disclosureId) {
      conditions.push(eq(ipDisclosure.disclosureId, filters.disclosureId));
    }

    // Search filter (searches in description and confidentiality measures)
    if (filters.search && filters.search.trim() !== "") {
      const searchTerm = `%${filters.search.trim()}%`;

      // Check if the search might be a complete or partial UUID
      const isUuidSearch = filters.search
        .trim()
        .match(/[0-9a-f]{8}(-[0-9a-f]{4}){0,3}/i);

      conditions.push(
        or(
          // Use ilike for case-insensitive search
          sql`${tradeSecretApplication.description} ILIKE ${searchTerm}`,
          sql`${tradeSecretApplication.confidentialityMeasures} ILIKE ${searchTerm}`,
          // UUID-safe search approach (also make it case-insensitive)
          isUuidSearch
            ? sql`${
                ipDisclosure.disclosureId
              }::text ILIKE ${`%${filters.search.trim()}%`}`
            : sql`false`
        )
      );
    }

    // Build base query with appropriate joins
    const baseQuery = db
      .select()
      .from(tradeSecretApplication)
      .innerJoin(
        ipDisclosure,
        eq(tradeSecretApplication.disclosureId, ipDisclosure.disclosureId)
      )
      .leftJoin(userAccount, eq(ipDisclosure.clientId, userAccount.id))
      .leftJoin(
        disclosureConfirmation,
        eq(
          tradeSecretApplication.disclosureId,
          disclosureConfirmation.disclosureId
        )
      );

    // Apply filters
    const filteredQuery =
      conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;

    // Count total records for pagination
    // Using a separate count query to avoid type issues
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(tradeSecretApplication)
      .innerJoin(
        ipDisclosure,
        eq(tradeSecretApplication.disclosureId, ipDisclosure.disclosureId)
      );

    // Apply the same filters to the count query
    const filteredCountQuery =
      conditions.length > 0 ? countQuery.where(and(...conditions)) : countQuery;

    const countResult = await filteredCountQuery;
    const total = countResult[0]?.count || 0;

    // Get sorting field and direction
    const sortField = pagination.sortBy || "createdAt";
    const sortDir = pagination.sortDirection || "desc";

    // Apply sorting
    const sortedQuery = filteredQuery.orderBy(
      sortDir === "desc"
        ? desc(
            sortField === "description"
              ? tradeSecretApplication.description
              : sortField === "confidentialityMeasures"
              ? tradeSecretApplication.confidentialityMeasures
              : sortField === "status"
              ? ipDisclosure.status
              : sortField === "updatedAt"
              ? tradeSecretApplication.updatedAt
              : tradeSecretApplication.createdAt
          )
        : asc(
            sortField === "description"
              ? tradeSecretApplication.description
              : sortField === "confidentialityMeasures"
              ? tradeSecretApplication.confidentialityMeasures
              : sortField === "status"
              ? ipDisclosure.status
              : sortField === "updatedAt"
              ? tradeSecretApplication.updatedAt
              : tradeSecretApplication.createdAt
          )
    );

    // Apply pagination
    const paginatedQuery = sortedQuery.limit(pagination.limit).offset(offset);

    // Execute query
    const results = await paginatedQuery;

    // Get applicants for each disclosure
    const data = await Promise.all(
      results.map(async (record: any) => {
        const applicants = await db
          .select()
          .from(ipDisclosureApplicant)
          .where(
            eq(
              ipDisclosureApplicant.disclosureId,
              record.ip_disclosure.disclosureId
            )
          );

        // Create default ipTypes object
        const ipTypesObject: {
          patent: boolean;
          copyright: boolean;
          trademark: boolean;
          tradeSecret: boolean;
        } = {
          patent: false,
          copyright: false,
          trademark: false,
          tradeSecret: true, // Default to true since it's a trade secret record
        };

        // If record has selectedIpTypes object, try to map its properties
        if (record.ip_disclosure.selectedIpTypes) {
          try {
            const selectedTypes =
              typeof record.ip_disclosure.selectedIpTypes === "string"
                ? JSON.parse(record.ip_disclosure.selectedIpTypes)
                : record.ip_disclosure.selectedIpTypes;

            if (selectedTypes && typeof selectedTypes === "object") {
              ipTypesObject.patent = Boolean(selectedTypes.patent);
              ipTypesObject.copyright = Boolean(selectedTypes.copyright);
              ipTypesObject.trademark = Boolean(selectedTypes.trademark);
              ipTypesObject.tradeSecret = true; // Always true for trade secret records
            }
          } catch (e) {
            console.error("Error parsing selectedIpTypes:", e);
          }
        }

        return {
          tradeSecret: {
            tradeSecretId: record.trade_secret_application.tradeSecretId,
            disclosureId: record.trade_secret_application.disclosureId,
            description: record.trade_secret_application.description,
            confidentialityMeasures:
              record.trade_secret_application.confidentialityMeasures,
            createdAt: record.trade_secret_application.createdAt ?? undefined,
            updatedAt: record.trade_secret_application.updatedAt ?? undefined,
          },
          disclosure: {
            disclosureId: record.ip_disclosure.disclosureId,
            clientId: record.ip_disclosure.clientId ?? "",
            status: record.ip_disclosure.status ?? "draft",
            title: "IP Disclosure",
            ipTypes: ipTypesObject,
            email: record.ip_disclosure.email ?? undefined,
            authorizedRepresentative:
              record.ip_disclosure.authorizedRepresentative ?? undefined,
            isRightfulOwner: record.ip_disclosure.isRightfulOwner ?? undefined,
            createdAt: record.ip_disclosure.createdAt ?? undefined,
            updatedAt: record.ip_disclosure.updatedAt ?? undefined,
          },
          user: record.user_account
            ? {
                id: record.user_account.id,
                name: record.user_account.name || "",
                email: record.user_account.email,
                role: record.user_account.role ?? undefined,
              }
            : undefined,
          confirmation: record.disclosure_confirmation
            ? {
                confirmationId: record.disclosure_confirmation.confirmationId,
                disclosureId: record.disclosure_confirmation.disclosureId,
                writtenDisclosures: record.disclosure_confirmation
                  .writtenDisclosures as {
                  past: boolean;
                  planned: boolean;
                  notApplicable: boolean;
                  details?: string;
                },
                oralDisclosures: record.disclosure_confirmation
                  .oralDisclosures as {
                  past: boolean;
                  planned: boolean;
                  notApplicable: boolean;
                  details?: string;
                },
                futureWork:
                  record.disclosure_confirmation.futureWork ?? undefined,
                confirmationDeclaration:
                  record.disclosure_confirmation.confirmationDeclaration ??
                  undefined,
                createdAt:
                  record.disclosure_confirmation.createdAt ?? undefined,
                updatedAt:
                  record.disclosure_confirmation.updatedAt ?? undefined,
              }
            : undefined,
          applicants: applicants.map((applicant: any) => ({
            firstName: applicant.firstName,
            middleInitial: applicant.middleInitial,
            lastName: applicant.lastName,
          })),
        } as TradeSecretInventoryType;
      })
    );

    return {
      data,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    };
  } catch (error) {
    console.error("Error fetching trade secret inventory:", error);
    // Return empty results instead of throwing error to be more user-friendly
    return {
      data: [],
      total: 0,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: 0,
      error: "Failed to fetch trade secret records",
    };
  }
}

/**
 * Get a single trade secret record by ID
 */
export async function getTradeSecretById(
  id: string
): Promise<TradeSecretInventoryType | null> {
  try {
    const result = await db
      .select()
      .from(tradeSecretApplication)
      .innerJoin(
        ipDisclosure,
        eq(tradeSecretApplication.disclosureId, ipDisclosure.disclosureId)
      )
      .leftJoin(userAccount, eq(ipDisclosure.clientId, userAccount.id))
      .leftJoin(
        disclosureConfirmation,
        eq(
          tradeSecretApplication.disclosureId,
          disclosureConfirmation.disclosureId
        )
      )
      .where(eq(tradeSecretApplication.tradeSecretId, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const record = result[0];

    // Get applicants for the disclosure
    const applicants = await db
      .select()
      .from(ipDisclosureApplicant)
      .where(
        eq(
          ipDisclosureApplicant.disclosureId,
          record.ip_disclosure.disclosureId
        )
      );

    // Parse the selectedIpTypes if it exists
    let ipTypesObject: {
      patent: boolean;
      copyright: boolean;
      trademark: boolean;
      tradeSecret: boolean;
    } = {
      patent: false,
      copyright: false,
      trademark: false,
      tradeSecret: true, // Default to true for trade secret
    };

    // Handle selectedIpTypes whether it's a string, object, or undefined
    if (record.ip_disclosure.selectedIpTypes) {
      try {
        const selectedTypes =
          typeof record.ip_disclosure.selectedIpTypes === "string"
            ? JSON.parse(record.ip_disclosure.selectedIpTypes)
            : record.ip_disclosure.selectedIpTypes;

        if (selectedTypes && typeof selectedTypes === "object") {
          ipTypesObject = {
            patent: Boolean(selectedTypes.patent),
            copyright: Boolean(selectedTypes.copyright),
            trademark: Boolean(selectedTypes.trademark),
            tradeSecret: true, // Always true for trade secret records
          };
        }
      } catch (e) {
        console.error("Error parsing selectedIpTypes:", e);
      }
    }

    return {
      tradeSecret: {
        tradeSecretId: record.trade_secret_application.tradeSecretId,
        disclosureId: record.trade_secret_application.disclosureId,
        description: record.trade_secret_application.description,
        confidentialityMeasures:
          record.trade_secret_application.confidentialityMeasures,
        createdAt: record.trade_secret_application.createdAt ?? undefined,
        updatedAt: record.trade_secret_application.updatedAt ?? undefined,
      },
      disclosure: {
        disclosureId: record.ip_disclosure.disclosureId,
        clientId: record.ip_disclosure.clientId ?? "",
        status: record.ip_disclosure.status ?? "draft",
        title: record.ip_disclosure.selectedIpTypes ? "IP Disclosure" : "",
        ipTypes: ipTypesObject,
        email: record.ip_disclosure.email ?? undefined,
        authorizedRepresentative:
          record.ip_disclosure.authorizedRepresentative ?? undefined,
        isRightfulOwner: record.ip_disclosure.isRightfulOwner ?? undefined,
        createdAt: record.ip_disclosure.createdAt ?? undefined,
        updatedAt: record.ip_disclosure.updatedAt ?? undefined,
      },
      user: record.user_account
        ? {
            id: record.user_account.id,
            name: record.user_account.name || "",
            email: record.user_account.email,
            role: record.user_account.role ?? undefined,
          }
        : undefined,
      confirmation: record.disclosure_confirmation
        ? {
            confirmationId: record.disclosure_confirmation.confirmationId,
            disclosureId: record.disclosure_confirmation.disclosureId,
            writtenDisclosures: record.disclosure_confirmation
              .writtenDisclosures as {
              past: boolean;
              planned: boolean;
              notApplicable: boolean;
              details?: string;
            },
            oralDisclosures: record.disclosure_confirmation.oralDisclosures as {
              past: boolean;
              planned: boolean;
              notApplicable: boolean;
              details?: string;
            },
            futureWork: record.disclosure_confirmation.futureWork ?? undefined,
            confirmationDeclaration:
              record.disclosure_confirmation.confirmationDeclaration ??
              undefined,
            createdAt: record.disclosure_confirmation.createdAt ?? undefined,
            updatedAt: record.disclosure_confirmation.updatedAt ?? undefined,
          }
        : undefined,
      applicants: applicants.map((applicant: any) => ({
        firstName: applicant.firstName,
        middleInitial: applicant.middleInitial,
        lastName: applicant.lastName,
      })),
    };
  } catch (error) {
    console.error("Error getting trade secret by ID:", error);
    throw new Error(`Failed to get trade secret record: ${error}`);
  }
}

/**
 * Update a trade secret record
 */
export async function updateTradeSecret(
  id: string,
  data: {
    description: string;
    confidentialityMeasures: string;
    status?: string;
  }
): Promise<TradeSecretType> {
  try {
    // First, get the current record to find the disclosure ID
    const currentRecord = await db
      .select()
      .from(tradeSecretApplication)
      .where(eq(tradeSecretApplication.tradeSecretId, id))
      .limit(1);

    if (currentRecord.length === 0) {
      throw new Error("Trade secret record not found");
    }

    const disclosureId = currentRecord[0].disclosureId;

    // Begin a transaction to update both tables
    return await db.transaction(async (tx: any) => {
      // Update the trade secret application
      await tx
        .update(tradeSecretApplication)
        .set({
          description: data.description,
          confidentialityMeasures: data.confidentialityMeasures,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(tradeSecretApplication.tradeSecretId, id));

      // Update disclosure status if provided
      if (data.status) {
        await tx
          .update(ipDisclosure)
          .set({
            status: data.status,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(ipDisclosure.disclosureId, disclosureId));
      }

      // Get the updated record
      const updated = await tx
        .select()
        .from(tradeSecretApplication)
        .where(eq(tradeSecretApplication.tradeSecretId, id))
        .limit(1);

      return {
        tradeSecretId: updated[0].tradeSecretId,
        disclosureId: updated[0].disclosureId,
        description: updated[0].description,
        confidentialityMeasures: updated[0].confidentialityMeasures,
        createdAt: updated[0].createdAt,
        updatedAt: updated[0].updatedAt,
      };
    });
  } catch (error) {
    console.error("Error updating trade secret:", error);
    throw new Error(`Failed to update trade secret: ${error}`);
  }
}

/**
 * Delete a trade secret record
 */
export async function deleteTradeSecret(id: string): Promise<boolean> {
  try {
    const result = await db
      .delete(tradeSecretApplication)
      .where(eq(tradeSecretApplication.tradeSecretId, id));

    return true;
  } catch (error) {
    console.error("Error deleting trade secret:", error);
    throw new Error(`Failed to delete trade secret: ${error}`);
  }
}
