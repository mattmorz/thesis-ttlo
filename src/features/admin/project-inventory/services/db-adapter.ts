import { db } from "@/drizzle/db";
import {
  ipApplication,
  userAccount,
  ipDisclosure,
  ipDisclosureInventor,
  ipContributors,
  clientProfile,
} from "@/drizzle/migrations/schema";
import { ipApplicationEnrollment } from "@/drizzle/schema";
import {
  eq,
  and,
  like,
  gte,
  lte,
  inArray,
  or,
  isNull,
  isNotNull,
  SQL,
  count,
  sql,
} from "drizzle-orm";
import {
  BaseInventoryType,
  InventoryFilterType,
} from "../schemas/inventory-base";

// Define valid status and IP types explicitly
type ValidStatus =
  | "draft"
  | "pending"
  | "in_progress"
  | "approved"
  | "rejected"
  | "completed"
  | "archived";
type ValidIpType =
  | "patent"
  | "copyright"
  | "trademark"
  | "utility_model"
  | "industrial_design"
  | "trade_secret"
  | "not_sure"
  | "other";

/**
 * Adapter service to connect project inventory to the database
 */
export class ProjectInventoryAdapter {
  /**
   * Fetch project inventory items with filtering, sorting and pagination
   */
  static async fetchInventory(
    filters: InventoryFilterType,
    options?: {
      sortBy?: string;
      sortDirection?: "asc" | "desc";
      page?: number;
      limit?: number;
    }
  ): Promise<{ data: BaseInventoryType[]; total: number }> {
    try {
      // Start with the base query conditions
      const conditions: SQL<unknown>[] = [];
      let sortField = options?.sortBy || "createdAt";
      const sortDir = options?.sortDirection || "desc";
      const page = options?.page || 1;
      const limit = options?.limit || 15;
      const offset = (page - 1) * limit;

      // Apply filters as conditions
      if (filters) {
        if (filters.ipType && filters.ipType !== "all") {
          if (isValidIpType(filters.ipType)) {
            conditions.push(
              eq(ipApplication.ipType, filters.ipType as ValidIpType)
            );
          }
        }

        if (filters.status && isValidStatus(filters.status)) {
          conditions.push(
            eq(ipApplication.status, filters.status as ValidStatus)
          );
        }

        if (filters.department) {
          conditions.push(eq(ipApplication.department, filters.department));
        }

        if (filters.fundingSource) {
          conditions.push(
            eq(ipApplication.fundingSource, filters.fundingSource)
          );
        }

        if (filters.startDate) {
          conditions.push(gte(ipApplication.createdAt, filters.startDate));
        }

        if (filters.endDate) {
          conditions.push(lte(ipApplication.createdAt, filters.endDate));
        }

        // Apply affiliation filters
        if (filters.companyName) {
          const companyPattern = `%${filters.companyName}%`;
          conditions.push(
            sql`EXISTS (
              SELECT 1 FROM client_profile
              WHERE client_profile.ip_application_id = ${ipApplication.id}
              AND client_profile.company_name ILIKE ${companyPattern}
            )`
          );
        }

        if (filters.collegeName) {
          const collegePattern = `%${filters.collegeName}%`;
          conditions.push(
            sql`EXISTS (
              SELECT 1 FROM client_profile
              WHERE client_profile.ip_application_id = ${ipApplication.id}
              AND client_profile.college_name ILIKE ${collegePattern}
            )`
          );
        }

        if (filters.departmentName) {
          const deptPattern = `%${filters.departmentName}%`;
          conditions.push(
            sql`EXISTS (
              SELECT 1 FROM client_profile
              WHERE client_profile.ip_application_id = ${ipApplication.id}
              AND client_profile.department_name ILIKE ${deptPattern}
            )`
          );
        }

        if (filters.search) {
          const searchTerm = `%${filters.search}%`;
          // Extend search to include client profile info
          conditions.push(
            sql`(
              (${ipApplication.title} ILIKE ${searchTerm}) OR 
              (${ipApplication.description} ILIKE ${searchTerm}) OR
              EXISTS (
                SELECT 1 FROM jsonb_array_elements_text(${ipApplication.inventors}) AS inventor
                WHERE inventor ILIKE ${searchTerm}
              ) OR
              EXISTS (
                SELECT 1 FROM client_profile
                WHERE client_profile.ip_application_id = ${ipApplication.id}
                AND (
                  client_profile.first_name ILIKE ${searchTerm} OR
                  client_profile.last_name ILIKE ${searchTerm} OR
                  client_profile.company_name ILIKE ${searchTerm} OR
                  client_profile.college_name ILIKE ${searchTerm} OR
                  client_profile.department_name ILIKE ${searchTerm}
                )
              )
            )`
          );
        }

        // Handle assignment status filter
        if (filters.assignmentStatus && filters.assignmentStatus !== "all") {
          // Subquery to check if application has enrollments
          const hasEnrollmentsSubquery = db
            .select({ enrollmentId: ipApplicationEnrollment.enrollmentId })
            .from(ipApplicationEnrollment)
            .where(eq(ipApplicationEnrollment.applicationId, ipApplication.id))
            .limit(1);

          if (filters.assignmentStatus === "assigned") {
            conditions.push(sql`EXISTS(${hasEnrollmentsSubquery})`);
          } else if (filters.assignmentStatus === "unassigned") {
            conditions.push(sql`NOT EXISTS(${hasEnrollmentsSubquery})`);
          }
        }
      }

      // Get the total count first (without pagination)
      const totalResult = await db
        .select({ count: count() })
        .from(ipApplication)
        .where(conditions.length > 0 ? and(...conditions) : sql`TRUE`);

      const total = totalResult[0]?.count || 0;

      // Set up the correct sort field mapping
      switch (sortField) {
        case "title":
          sortField = "title";
          break;
        case "status":
          sortField = "status";
          break;
        case "progress":
          sortField = "progress";
          break;
        case "department":
          sortField = "department";
          break;
        // Handle affiliation field sorting in memory after results are fetched
        case "companyName":
        case "collegeName":
        case "departmentName":
          // These will be handled in memory after query execution
          sortField = "createdAt"; // Default sort for the DB query
          break;
        case "createdAt":
        default:
          sortField = "createdAt";
          break;
      }

      // Create the sorting expression
      const sortExpression =
        sortDir === "asc"
          ? sql`${ipApplication[sortField as keyof typeof ipApplication]} ASC`
          : sql`${ipApplication[sortField as keyof typeof ipApplication]} DESC`;

      // Execute the main query with sorting and pagination
      const query = db
        .select({
          id: ipApplication.id,
          userId: ipApplication.userId,
          title: ipApplication.title,
          description: ipApplication.description,
          ipType: ipApplication.ipType,
          status: ipApplication.status,
          progress: ipApplication.progress,
          inventors: ipApplication.inventors,
          technicalField: ipApplication.technicalField,
          keywords: ipApplication.keywords,
          researchField: ipApplication.researchField,
          department: ipApplication.department,
          faculty: ipApplication.faculty,
          fundingSource: ipApplication.fundingSource,
          fundingType: ipApplication.fundingType,
          grantNumber: ipApplication.grantNumber,
          commercializationStatus: ipApplication.commercializationStatus,
          createdAt: ipApplication.createdAt,
          updatedAt: ipApplication.updatedAt,
          // Add a subquery to count enrolled staff
          assignedStaffCount: sql<number>`(
            SELECT COUNT(*) FROM ip_application_enrollment
            WHERE ip_application_enrollment.application_id = ${ipApplication.id}
          )`.as("assignedStaffCount"),
          // Add client affiliation information
          companyAffiliation: sql<string>`(
            SELECT company_name FROM client_profile
            WHERE client_profile.ip_application_id = ${ipApplication.id}
            LIMIT 1
          )`.as("companyAffiliation"),
          collegeAffiliation: sql<string>`(
            SELECT college_name FROM client_profile
            WHERE client_profile.ip_application_id = ${ipApplication.id}
            LIMIT 1
          )`.as("collegeAffiliation"),
          departmentAffiliation: sql<string>`(
            SELECT department_name FROM client_profile
            WHERE client_profile.ip_application_id = ${ipApplication.id}
            LIMIT 1
          )`.as("departmentAffiliation"),
        })
        .from(ipApplication)
        .where(conditions.length > 0 ? and(...conditions) : sql`TRUE`)
        .orderBy(sortExpression)
        .limit(limit)
        .offset(offset);

      const results = await query;

      // Format the results to match our schema
      const formattedResults = await Promise.all(
        results.map(async (item) => {
          // Get assignment status with user details
          const assignments = await db
            .select({
              enrollment: ipApplicationEnrollment,
              user: userAccount,
            })
            .from(ipApplicationEnrollment)
            .where(eq(ipApplicationEnrollment.applicationId, item.id))
            .leftJoin(
              userAccount,
              eq(userAccount.id, ipApplicationEnrollment.userId)
            );

          // Get inventors from related tables if available
          let inventorsList: Array<{
            name: string;
            id?: string;
            role?: string;
          }> = [];

          if (item.inventors && Array.isArray(item.inventors)) {
            // Convert string[] to the expected inventor object format
            inventorsList = item.inventors.map((inv) => ({
              name: inv,
            }));
          }

          // First try to get from IP disclosure inventors
          const disclosures = await db
            .select({
              disclosureId: ipDisclosure.disclosureId,
            })
            .from(ipDisclosure)
            .where(eq(ipDisclosure.applicationId, item.id));

          if (disclosures.length > 0) {
            const disclosureId = disclosures[0].disclosureId;
            const inventors = await db
              .select()
              .from(ipDisclosureInventor)
              .where(eq(ipDisclosureInventor.disclosureId, disclosureId));

            if (inventors.length > 0) {
              inventorsList = inventors.map((inv) => ({
                name: `${inv.firstName} ${inv.lastName}`,
                id: inv.inventorId,
                role: "Researcher",
              }));
            }
          }

          // Add affiliation information to the result
          return {
            id: item.id,
            applicationId: item.id,
            userId: item.userId,
            title: item.title,
            description: item.description || "",
            ipType: item.ipType,
            status: item.status,
            progress: item.progress || 0,
            inventors: inventorsList,
            technicalField: item.technicalField || [],
            keywords: item.keywords || [],
            researchField: item.researchField || "",
            department: item.department || item.departmentAffiliation || "",
            faculty: item.faculty || item.collegeAffiliation || "",
            fundingSource: item.fundingSource || "Other",
            fundingType: item.fundingType || "",
            grantNumber: item.grantNumber || "",
            commercializationStatus:
              item.commercializationStatus || "not_licensed",
            startDate: item.createdAt || new Date().toISOString(),
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            field: "Other",
            isAssigned: assignments.length > 0,
            assignedStaffCount:
              Number(item.assignedStaffCount) || assignments.length || 0,
            assignedTo: assignments.map((assign) => ({
              userId: assign.user?.id || "",
              name: assign.user?.name || "Unknown User",
              role: assign.user?.role || "client",
              enrollmentId: assign.enrollment.enrollmentId,
              joinedAt: assign.enrollment.createdAt || "",
            })),
            companyName: item.companyAffiliation || "",
            collegeName: item.collegeAffiliation || "",
            departmentName: item.departmentAffiliation || "",
          } as BaseInventoryType;
        })
      );

      // After formattedResults is populated, handle in-memory sorting for affiliation fields
      if (options?.sortBy) {
        const sortBy = options.sortBy;

        // Handle affiliation-based sorting in memory
        if (
          sortBy === "companyName" ||
          sortBy === "collegeName" ||
          sortBy === "departmentName"
        ) {
          formattedResults.sort((a, b) => {
            const aValue = (a[sortBy as keyof typeof a] as string) || "";
            const bValue = (b[sortBy as keyof typeof b] as string) || "";

            return sortDir === "asc"
              ? aValue.localeCompare(bValue)
              : bValue.localeCompare(aValue);
          });
        }
      }

      return { data: formattedResults, total };
    } catch (error) {
      console.error("Error fetching inventory data:", error);
      throw error;
    }
  }

  /**
   * Create a new inventory item
   */
  static async createInventoryItem(
    data: Omit<BaseInventoryType, "id" | "applicationId">
  ): Promise<string> {
    try {
      // Prepare the data for insertion
      const insertData = {
        userId: data.userId || "", // This should be provided
        title: data.title,
        description: data.description,
        ipType: data.ipType as ValidIpType,
        status: "draft" as ValidStatus, // Define as a literal type for db insert
        progress: data.progress || 0,
        inventors: data.inventors.map((inv) => inv.name),
        technicalField: data.technicalField || [],
        keywords: data.keywords || [],
        researchField: data.researchField,
        department: data.department,
        faculty: data.faculty,
        fundingSource: data.fundingSource,
        fundingType: data.fundingType,
        grantNumber: data.grantNumber,
        commercializationStatus: data.commercializationStatus,
      };

      // Insert into IP application table
      const result = await db
        .insert(ipApplication)
        .values(insertData)
        .returning({ id: ipApplication.id });

      if (result.length === 0) {
        throw new Error("Failed to create inventory item");
      }

      const applicationId = result[0].id;

      // If there are staff assigned, create enrollment records
      if (data.assignedTo && data.assignedTo.length > 0) {
        await Promise.all(
          data.assignedTo.map((staff) =>
            db.insert(ipApplicationEnrollment).values({
              applicationId,
              userId: staff.userId,
            })
          )
        );
      }

      return applicationId;
    } catch (error) {
      console.error("Error creating project inventory item:", error);
      throw error;
    }
  }

  /**
   * Update an existing inventory item
   */
  static async updateInventoryItem(
    id: string,
    data: Partial<BaseInventoryType>
  ): Promise<void> {
    try {
      // Prepare update data
      const updateData: Partial<typeof ipApplication.$inferInsert> = {};

      // Only include fields that are present in the data
      if (data.title) updateData.title = data.title;
      if (data.description !== undefined)
        updateData.description = data.description;
      if (data.ipType) updateData.ipType = data.ipType;
      if (data.status && isValidStatus(data.status))
        updateData.status = data.status as ValidStatus;
      if (data.progress !== undefined) updateData.progress = data.progress;
      if (data.inventors)
        updateData.inventors = data.inventors.map((inv) => inv.name);
      if (data.technicalField) updateData.technicalField = data.technicalField;
      if (data.keywords) updateData.keywords = data.keywords;
      if (data.researchField) updateData.researchField = data.researchField;
      if (data.department) updateData.department = data.department;
      if (data.faculty) updateData.faculty = data.faculty;
      if (data.fundingSource) updateData.fundingSource = data.fundingSource;
      if (data.fundingType) updateData.fundingType = data.fundingType;
      if (data.grantNumber) updateData.grantNumber = data.grantNumber;
      if (data.commercializationStatus)
        updateData.commercializationStatus = data.commercializationStatus;

      // Only update if there's data to update
      if (Object.keys(updateData).length > 0) {
        await db
          .update(ipApplication)
          .set(updateData)
          .where(eq(ipApplication.id, id));
      }

      // Handle staff assignments separately
      if (data.assignedTo) {
        // First get existing assignments
        const currentAssignments = await db
          .select()
          .from(ipApplicationEnrollment)
          .where(eq(ipApplicationEnrollment.applicationId, id));

        const currentUserIds = currentAssignments.map((a) => a.userId);
        const newUserIds = data.assignedTo.map((a) => a.userId);

        // Users to add (in new but not in current)
        const usersToAdd = newUserIds.filter(
          (userId) => !currentUserIds.includes(userId)
        );

        // Users to remove (in current but not in new)
        const usersToRemove = currentUserIds.filter(
          (userId) => !newUserIds.includes(userId)
        );

        // Add new enrollments
        if (usersToAdd.length > 0) {
          await Promise.all(
            usersToAdd.map((userId) =>
              db.insert(ipApplicationEnrollment).values({
                applicationId: id,
                userId,
              })
            )
          );
        }

        // Remove old enrollments
        if (usersToRemove.length > 0) {
          await db
            .delete(ipApplicationEnrollment)
            .where(
              and(
                eq(ipApplicationEnrollment.applicationId, id),
                inArray(ipApplicationEnrollment.userId, usersToRemove)
              )
            );
        }
      }
    } catch (error) {
      console.error("Error updating project inventory item:", error);
      throw error;
    }
  }

  /**
   * Delete an inventory item
   */
  static async deleteInventoryItem(id: string): Promise<void> {
    try {
      await db.delete(ipApplication).where(eq(ipApplication.id, id));
    } catch (error) {
      console.error("Error deleting project inventory item:", error);
      throw error;
    }
  }

  /**
   * Assign staff to an inventory item with a specific role
   */
  static async assignStaff(
    applicationId: string,
    userId: string,
    role: string = "project_manager"
  ): Promise<void> {
    try {
      // Check if assignment already exists
      const existingAssignment = await db
        .select()
        .from(ipApplicationEnrollment)
        .where(
          and(
            eq(ipApplicationEnrollment.applicationId, applicationId),
            eq(ipApplicationEnrollment.userId, userId)
          )
        );

      // Only insert if no existing assignment
      if (existingAssignment.length === 0) {
        await db.insert(ipApplicationEnrollment).values({
          applicationId,
          userId,
          role, // Store the staff role in the enrollment
        });
      } else {
        // Update the role if the assignment already exists
        await db
          .update(ipApplicationEnrollment)
          .set({ role })
          .where(
            and(
              eq(ipApplicationEnrollment.applicationId, applicationId),
              eq(ipApplicationEnrollment.userId, userId)
            )
          );
      }
    } catch (error) {
      console.error("Error assigning staff to project:", error);
      throw error;
    }
  }

  /**
   * Unassign staff from an inventory item
   */
  static async unassignStaff(
    applicationId: string,
    userId: string
  ): Promise<void> {
    try {
      await db
        .delete(ipApplicationEnrollment)
        .where(
          and(
            eq(ipApplicationEnrollment.applicationId, applicationId),
            eq(ipApplicationEnrollment.userId, userId)
          )
        );
    } catch (error) {
      console.error("Error unassigning staff from project:", error);
      throw error;
    }
  }

  /**
   * Get all available TTLO staff
   */
  static async getAvailableStaff(): Promise<
    Array<{ id: string; name: string; role: string }>
  > {
    try {
      const staff = await db
        .select({
          id: userAccount.id,
          name: userAccount.name,
          role: userAccount.role,
        })
        .from(userAccount)
        .where(
          or(eq(userAccount.role, "ttlo_staff"), eq(userAccount.role, "admin"))
        );

      return staff.map((s) => ({
        id: s.id,
        name: s.name || "Unknown",
        role: s.role || "ttlo_staff", // Provide a default value in case of null
      }));
    } catch (error) {
      console.error("Error fetching available staff:", error);
      throw error;
    }
  }

  /**
   * Get staff assigned to a specific project
   */
  static async getAssignedStaff(projectId: string): Promise<
    Array<{
      id: string;
      name: string;
      role: string;
      assignmentRole: string;
      assignedAt: string;
    }>
  > {
    try {
      const assignments = await db
        .select({
          enrollment: ipApplicationEnrollment,
          user: userAccount,
        })
        .from(ipApplicationEnrollment)
        .where(eq(ipApplicationEnrollment.applicationId, projectId))
        .leftJoin(
          userAccount,
          eq(userAccount.id, ipApplicationEnrollment.userId)
        );

      return assignments.map((assignment) => ({
        id: assignment.user?.id || "",
        name: assignment.user?.name || "Unknown",
        role: assignment.user?.role || "unknown",
        assignmentRole: assignment.enrollment.role || "project_manager",
        assignedAt: assignment.enrollment.createdAt || new Date().toISOString(),
      }));
    } catch (error) {
      console.error("Error fetching assigned staff:", error);
      throw error;
    }
  }
}

// Helper function to validate application status
function isValidStatus(status: string): status is ValidStatus {
  return [
    "draft",
    "pending",
    "in_progress",
    "approved",
    "rejected",
    "completed",
    "archived",
  ].includes(status as ValidStatus);
}

// Helper function to validate IP type
function isValidIpType(ipType: string): ipType is ValidIpType {
  return [
    "patent",
    "copyright",
    "trademark",
    "utility_model",
    "industrial_design",
    "trade_secret",
    "not_sure",
    "other",
  ].includes(ipType as ValidIpType);
}
