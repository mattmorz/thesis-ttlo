"use server";

import { db } from "@/drizzle/db";
import { SQL, sql, eq, and, or, ilike, desc, asc, gte, lte } from "drizzle-orm";

/**
 * Shared utility functions for database adapters to reduce code duplication
 */
export class SharedAdapter {
  /**
   * Verify the database connection
   */
  static async verifyDbConnection(): Promise<boolean> {
    try {
      // Try a simple query to verify the connection
      const result = await db.execute(sql`SELECT 1 as test`);
      return result.length > 0;
    } catch (error) {
      console.error("Database connection verification failed:", error);
      return false;
    }
  }

  /**
   * Format a date value to ISO string if it's valid
   */
  static formatDate(
    date: Date | string | null | undefined
  ): string | undefined {
    if (!date) return undefined;

    try {
      if (typeof date === "string") {
        return new Date(date).toISOString();
      }
      return date.toISOString();
    } catch (error) {
      console.error("Date formatting error:", error);
      return undefined;
    }
  }

  /**
   * Build common query conditions for filtering
   */
  static buildSearchConditions<T>(
    table: any,
    searchFields: (keyof T)[],
    searchValue: string
  ): SQL<unknown>[] {
    if (!searchValue) return [];

    return searchFields.map((field) =>
      ilike(table[field as string], `%${searchValue}%`)
    );
  }

  /**
   * Apply date range filter conditions
   */
  static buildDateRangeConditions(
    table: any,
    field: string,
    startDate?: string,
    endDate?: string
  ): SQL<unknown>[] {
    const conditions: SQL<unknown>[] = [];

    if (startDate) {
      conditions.push(gte(table[field], startDate));
    }

    if (endDate) {
      conditions.push(lte(table[field], endDate));
    }

    return conditions;
  }

  /**
   * Apply sorting based on configuration
   */
  static applySorting(
    query: any,
    table: any,
    sortField: string = "createdAt",
    sortDirection: "asc" | "desc" = "desc"
  ): any {
    try {
      if (sortDirection === "asc") {
        return query.orderBy(asc(table[sortField]));
      } else {
        return query.orderBy(desc(table[sortField]));
      }
    } catch (error) {
      console.error(`Error applying sorting to field ${sortField}:`, error);
      return query.orderBy(desc(table.createdAt)); // Fallback to default sorting
    }
  }

  /**
   * Apply pagination to a query
   */
  static applyPagination(
    query: any,
    page: number = 1,
    limit: number = 10
  ): any {
    const offset = (page - 1) * limit;
    return query.limit(limit).offset(offset);
  }

  /**
   * Create a JSON field condition for Postgres
   */
  static createJsonFieldCondition(
    table: any,
    jsonField: string,
    property: string,
    value: string | boolean | number
  ): SQL<unknown> {
    if (typeof value === "boolean") {
      return sql`${table[jsonField]}::jsonb->>'${sql.raw(property)}' = '${
        value ? "true" : "false"
      }'`;
    }

    if (typeof value === "number") {
      return sql`${table[jsonField]}::jsonb->>'${sql.raw(
        property
      )}' = '${value}'`;
    }

    return sql`${table[jsonField]}::jsonb->>'${sql.raw(
      property
    )}' = '${value}'`;
  }

  /**
   * Apply standard error handling to an async operation
   */
  static async withErrorHandling<T>(
    operationName: string,
    operation: () => Promise<T>,
    fallbackValue: T
  ): Promise<T> {
    try {
      console.log(`[DB Operation] ${operationName} - Started`);
      const result = await operation();
      console.log(`[DB Operation] ${operationName} - Succeeded`);
      return result;
    } catch (error) {
      console.error(`[DB Operation] ${operationName} - Failed:`, error);
      console.error(
        error instanceof Error ? error.stack : "Unknown error stack"
      );
      return fallbackValue;
    }
  }
}
