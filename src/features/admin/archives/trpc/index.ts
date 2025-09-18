import { auth } from "@/auth";
import { db } from "@/drizzle/db";
import { archives, ipApplication } from "@/drizzle/migrations/schema";
import { publicProcedure, router } from "@/trpc/init";
import { and, arrayContains, eq, gte, ilike, lte, sql, SQL } from "drizzle-orm";
import { createSelectSchema } from "drizzle-zod";
import { archiveFiltersSchema } from "../schemas/archive-filter";

const dtzArchiveSchema = createSelectSchema(archives);

export const archivesRouter = router({
  get: publicProcedure.input(archiveFiltersSchema).query(async ({ input }) => {
    const filters: SQL[] = [];
    if (input.search) {
      filters.push(ilike(ipApplication.title, `%${input.search}%`));
    }
    if (input.ipType && input.ipType !== "all") {
      filters.push(eq(ipApplication.ipType, input.ipType));
    }
    if (input.dateRange) {
      const fromDate = input.dateRange.from.toISOString();
      const toDate = input.dateRange.to.toISOString();
      const dateRangeFilter = and(
        gte(archives.archiveAt, fromDate),
        lte(archives.archiveAt, toDate)
      );
      if (dateRangeFilter) {
        filters.push(dateRangeFilter);
      }
    }
    if (input.inventorName) {
      filters.push(
        arrayContains(ipApplication.inventors, [input.inventorName])
      );
    }
    if (input.department) {
      filters.push(ilike(ipApplication.department, `%${input.department}%`));
    }
    const res = await db
      .select({
        archives: archives,
        ip_application: ipApplication,
        totalRows: sql<number>`count(*) over()`,
      })
      .from(archives)
      .leftJoin(ipApplication, eq(archives.applicationId, ipApplication.id))
      .where(and(...filters));
    return res;
  }),
  create: publicProcedure
    .input(dtzArchiveSchema.partial())
    .mutation(async ({ input }) => {
      const session = await auth();
      const userId = session?.user?.id;
      const [newArchive] = await db
        .insert(archives)
        .values({
          applicationId: input.applicationId ?? "",
          archivedBy: userId ?? "",
          archiveReason: input.archiveReason ?? "",
        })
        .returning({ id: archives.id });
      return newArchive;
    }),
  delete: publicProcedure
    .input(dtzArchiveSchema.partial())
    .mutation(async ({ input }) => {
      const [newArchive] = await db
        .delete(archives)
        .where(eq(archives.applicationId, input.applicationId!));
      return newArchive;
    }),
});
