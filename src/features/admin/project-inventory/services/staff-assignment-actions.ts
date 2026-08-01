"use server";

import { db } from "@/drizzle/db";
import {
  userAccount,
  ipApplication,
  applicationPhase,
  phaseTask,
} from "@/drizzle/migrations/schema";
import { ipApplicationEnrollment } from "@/drizzle/schema";
import {
  and,
  count,
  eq,
  sql,
  or,
  like,
  gte,
  lte,
  isNull,
  desc,
  asc,
} from "drizzle-orm";
import { StaffAssignmentFilterType } from "../components/staff-assignment/schema";

export type StaffAssignmentData = {
  userId: string;
  name: string | null;
  email: string;
  role: string;
  image: string | null;
  assignmentCount: number;
  taskCount: number;
  lastAssignedDate: string | null;
};

export type StaffAssignmentResult = {
  data: StaffAssignmentData[];
  total: number;
};

export type StaffIpApplicationDetails = {
  applicationId: string;
  title: string;
  type:
    | "patent"
    | "copyright"
    | "trademark"
    | "utility_model"
    | "industrial_design"
    | "trade_secret"
    | "other"
    | "not_sure";
  status:
    | "draft"
    | "pending"
    | "in_progress"
    | "approved"
    | "rejected"
    | "completed"
    | "archived";
  enrolledAt: string | Date;
  taskCount: number;
};

/**
 * Fetch staff assignments with various filters
 */
export async function getStaffAssignments(
  filter: StaffAssignmentFilterType = {
    role: "all",
    assignmentCount: "all",
    taskCount: "all",
  },
  pagination = { page: 1, limit: 15 },
  sorting = { field: "assignmentCount", direction: "desc" as "asc" | "desc" }
): Promise<StaffAssignmentResult> {
  try {
    const { role, search, assignmentCount, taskCount, startDate, endDate } =
      filter;
    const { page, limit } = pagination;
    const { field, direction } = sorting;

    const offset = (page - 1) * limit;

    // Build the filter conditions
    const conditions = [];

    // Filter by role
    if (role && role !== "all") {
      conditions.push(eq(userAccount.role, role));
    } else {
      conditions.push(
        or(eq(userAccount.role, "admin"), eq(userAccount.role, "ttlo_staff"))
      );
    }

    // Search by name or email
    if (search) {
      conditions.push(
        or(
          like(userAccount.name, `%${search}%`),
          like(userAccount.email, `%${search}%`)
        )
      );
    }

    // Date range filters
    if (startDate) {
      conditions.push(gte(ipApplicationEnrollment.createdAt, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(ipApplicationEnrollment.createdAt, new Date(endDate)));
    }

    // Perform the query
    const staffAssignmentsSubquery = db
      .select({
        userId: userAccount.id,
        name: userAccount.name,
        email: userAccount.email,
        role: userAccount.role,
        image: userAccount.image,
        assignmentCount: count(ipApplicationEnrollment.enrollmentId).as(
          "assignmentCount"
        ),
        lastAssignedDate:
          sql<string>`MAX(${ipApplicationEnrollment.createdAt})`.as(
            "lastAssignedDate"
          ),
      })
      .from(userAccount)
      .leftJoin(
        ipApplicationEnrollment,
        eq(userAccount.id, ipApplicationEnrollment.userId)
      )
      .where(and(...conditions))
      .groupBy(
        userAccount.id,
        userAccount.name,
        userAccount.email,
        userAccount.role,
        userAccount.image
      )
      .as("staffAssignments");

    // Get task counts via joined subquery
    const staffWithTaskCounts = await db
      .select({
        userId: staffAssignmentsSubquery.userId,
        name: staffAssignmentsSubquery.name,
        email: staffAssignmentsSubquery.email,
        role: staffAssignmentsSubquery.role,
        image: staffAssignmentsSubquery.image,
        assignmentCount: staffAssignmentsSubquery.assignmentCount,
        lastAssignedDate: staffAssignmentsSubquery.lastAssignedDate,
        // Count tasks from applications that the user is assigned to
        taskCount: sql<number>`
          COALESCE((
            SELECT COUNT(pt.task_id)
            FROM phase_task pt
            JOIN application_phase ap ON pt.phase_id = ap.phase_id
            JOIN ip_application_enrollment iae ON ap.application_id = iae.application_id
            WHERE iae.user_id = ${staffAssignmentsSubquery.userId}
          ), 0)
        `.as("taskCount"),
      })
      .from(staffAssignmentsSubquery);

    // Apply additional filters based on counts
    let filteredStaff = staffWithTaskCounts.map((staff) => ({
      ...staff,
      role: staff.role || "unknown",
    }));

    if (assignmentCount && assignmentCount !== "all") {
      // Define thresholds for assignment counts
      filteredStaff = filteredStaff.filter((staff) => {
        const count = staff.assignmentCount;
        if (assignmentCount === "high") return count > 5;
        if (assignmentCount === "medium") return count >= 3 && count <= 5;
        if (assignmentCount === "low") return count < 3;
        return true;
      });
    }

    if (taskCount && taskCount !== "all") {
      // Define thresholds for task counts
      filteredStaff = filteredStaff.filter((staff) => {
        const count = staff.taskCount;
        if (taskCount === "high") return count > 10;
        if (taskCount === "medium") return count >= 5 && count <= 10;
        if (taskCount === "low") return count < 5;
        return true;
      });
    }

    // Apply sorting
    filteredStaff.sort((a, b) => {
      if (field === "name") {
        return direction === "asc"
          ? (a.name || "").localeCompare(b.name || "")
          : (b.name || "").localeCompare(a.name || "");
      }

      if (field === "assignmentCount") {
        return direction === "asc"
          ? a.assignmentCount - b.assignmentCount
          : b.assignmentCount - a.assignmentCount;
      }

      if (field === "taskCount") {
        return direction === "asc"
          ? a.taskCount - b.taskCount
          : b.taskCount - a.taskCount;
      }

      if (field === "lastAssignedDate") {
        const dateA = a.lastAssignedDate
          ? new Date(a.lastAssignedDate).getTime()
          : 0;
        const dateB = b.lastAssignedDate
          ? new Date(b.lastAssignedDate).getTime()
          : 0;
        return direction === "asc" ? dateA - dateB : dateB - dateA;
      }

      return 0;
    });

    // Get the total count for pagination
    const total = filteredStaff.length;

    // Apply pagination
    const paginatedStaff = filteredStaff.slice(offset, offset + limit);

    return {
      data: paginatedStaff,
      total,
    };
  } catch (error) {
    console.error("Error fetching staff assignments:", error);
    throw new Error("Failed to fetch staff assignments");
  }
}

/**
 * Get detailed staff assignment information for a specific user
 */
export async function getStaffAssignmentDetails(userId: string) {
  try {
    // Get assigned projects
    const assignedProjects = await db
      .select({
        enrollmentId: ipApplicationEnrollment.enrollmentId,
        applicationId: ipApplication.id,
        title: ipApplication.title,
        ipType: ipApplication.ipType,
        status: ipApplication.status,
        createdAt: ipApplicationEnrollment.createdAt,
      })
      .from(ipApplicationEnrollment)
      .innerJoin(
        ipApplication,
        eq(ipApplicationEnrollment.applicationId, ipApplication.id)
      )
      .where(eq(ipApplicationEnrollment.userId, userId))
      .orderBy(desc(ipApplicationEnrollment.createdAt));

    // Get task counts per project
    const projectsWithTaskCounts = await Promise.all(
      assignedProjects.map(async (project) => {
        const tasks = await db
          .select({
            count: count(phaseTask.taskId),
          })
          .from(phaseTask)
          .innerJoin(
            applicationPhase,
            eq(phaseTask.phaseId, applicationPhase.phaseId)
          )
          .where(eq(applicationPhase.applicationId, project.applicationId));

        return {
          ...project,
          taskCount: tasks[0]?.count || 0,
        };
      })
    );

    // Get user details
    const user = await db
      .select({
        id: userAccount.id,
        name: userAccount.name,
        email: userAccount.email,
        role: userAccount.role,
        image: userAccount.image,
        createdAt: userAccount.createdAt,
      })
      .from(userAccount)
      .where(eq(userAccount.id, userId))
      .limit(1);

    return {
      user: user[0]
        ? {
            ...user[0],
            role: user[0].role || "unknown",
          }
        : null,
      assignedProjects: projectsWithTaskCounts,
      totalProjects: projectsWithTaskCounts.length,
      totalTasks: projectsWithTaskCounts.reduce(
        (sum, project) => sum + project.taskCount,
        0
      ),
    };
  } catch (error) {
    console.error("Error fetching staff assignment details:", error);
    throw new Error("Failed to fetch staff assignment details");
  }
}

/**
 * Fetch IP application details for a specific user
 */
export async function getStaffIpApplications(
  userId: string
): Promise<StaffIpApplicationDetails[]> {
  try {
    const applications = await db
      .select({
        applicationId: ipApplication.id,
        title: ipApplication.title,
        type: ipApplication.ipType,
        status: ipApplication.status,
        enrolledAt: ipApplicationEnrollment.createdAt,
        taskCount: sql<number>`
          COALESCE((
            SELECT COUNT(pt.task_id)
            FROM phase_task pt
            JOIN application_phase ap ON pt.phase_id = ap.phase_id
            WHERE ap.application_id = ${ipApplication.id}
          ), 0)
        `.as("taskCount"),
      })
      .from(ipApplicationEnrollment)
      .innerJoin(
        ipApplication,
        eq(ipApplicationEnrollment.applicationId, ipApplication.id)
      )
      .where(eq(ipApplicationEnrollment.userId, userId))
      .orderBy(desc(ipApplicationEnrollment.createdAt));

    // Filter out any null values and map to ensure type safety
    return applications
      .filter((app) => app.status !== null && app.enrolledAt !== null)
      .map((app) => ({
        ...app,
        enrolledAt: app.enrolledAt as Date,
        status: app.status as StaffIpApplicationDetails["status"],
        type: app.type as StaffIpApplicationDetails["type"],
      }));
  } catch (error) {
    console.error("Error fetching staff IP applications:", error);
    throw new Error("Failed to fetch staff IP applications");
  }
}
