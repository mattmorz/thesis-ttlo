import { NextRequest, NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import {
  ipApplication,
  userAccount,
} from "@/drizzle/migrations/schema";
import { ipApplicationEnrollment } from "@/drizzle/schema";
import { eq, and, inArray } from "drizzle-orm";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

// GET - Fetch enrollments for a project
export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    // Validate authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = params.projectId;

    // Validate project exists
    const project = await db.query.ipApplication.findFirst({
      where: eq(ipApplication.id, projectId),
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Fetch enrollments
    const enrollments = await db.query.ipApplicationEnrollment.findMany({
      where: eq(ipApplicationEnrollment.applicationId, projectId),
      with: {
        userAccount: {
          columns: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(enrollments);
  } catch (error) {
    console.error("Error fetching project enrollments:", error);
    return NextResponse.json(
      { error: "Failed to fetch enrollments" },
      { status: 500 }
    );
  }
}

// POST - Create new enrollments
export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    // Validate authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin permissions
    if (session.user.role !== "admin" && session.user.role !== "ttlo_staff") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const projectId = params.projectId;
    const { userIds } = await req.json();

    // Validate project exists
    const project = await db.query.ipApplication.findFirst({
      where: eq(ipApplication.id, projectId),
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Validate users exist and have eligible roles
    const eligibleUsers = await db.query.userAccount.findMany({
      where: and(
        inArray(userAccount.id, userIds),
        inArray(userAccount.role, ["admin", "ttlo_staff"])
      ),
    });

    if (eligibleUsers.length !== userIds.length) {
      return NextResponse.json(
        { error: "One or more selected users are not eligible for enrollment" },
        { status: 400 }
      );
    }

    // Get existing enrollments to avoid duplicates
    const existingEnrollments = await db.query.ipApplicationEnrollment.findMany(
      {
        where: and(
          eq(ipApplicationEnrollment.applicationId, projectId),
          inArray(ipApplicationEnrollment.userId, userIds)
        ),
      }
    );

    const existingUserIds = existingEnrollments.map((e) => e.userId);
    const newUserIds = userIds.filter((id) => !existingUserIds.includes(id));

    // Create new enrollments
    if (newUserIds.length > 0) {
      const enrollmentData = newUserIds.map((userId) => ({
        applicationId: projectId,
        userId: userId,
      }));

      await db.insert(ipApplicationEnrollment).values(enrollmentData);
    }

    return NextResponse.json({
      message: `Successfully enrolled ${newUserIds.length} users`,
      enrolledUsers: newUserIds,
    });
  } catch (error) {
    console.error("Error creating enrollments:", error);
    return NextResponse.json(
      { error: "Failed to create enrollments" },
      { status: 500 }
    );
  }
}
