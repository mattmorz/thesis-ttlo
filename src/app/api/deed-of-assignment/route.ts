import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/drizzle/db";
import { eq, and, desc } from "drizzle-orm";
import {
  deedOfAssignment,
  formSubmissionRegistry,
  ipDisclosure,
  ipApplication,
} from "@/drizzle/migrations/schema";

export const dynamic = "force-dynamic";

// Define the creator type
interface Creator {
  firstName: string;
  middleInitial?: string;
  lastName: string;
}

// GET: Fetch deed of assignment data for the current user
export async function GET(req: NextRequest) {
  try {
    console.log("[API:GET] Starting deed of assignment fetch");
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      console.log("[API:GET] Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    console.log(`[API:GET] Fetching deed of assignment for user: ${userId}`);

    // Get application ID from URL query params if provided
    const url = new URL(req.url);
    const applicationIdParam = url.searchParams.get("applicationId");

    // Get the user's IP application based on the criteria
    let ipApplications;
    if (applicationIdParam) {
      console.log(
        `[API:GET] Using provided applicationId: ${applicationIdParam}`
      );
      ipApplications = await db
        .select({
          id: ipApplication.id,
        })
        .from(ipApplication)
        .where(
          and(
            eq(ipApplication.userId, userId),
            eq(ipApplication.id, applicationIdParam)
          )
        );
      console.log(
        `[API:GET] IP applications query result:`,
        JSON.stringify(ipApplications, null, 2)
      );
    } else {
      console.log(
        "[API:GET] No applicationId provided, fetching most recent application"
      );
      ipApplications = await db
        .select({
          id: ipApplication.id,
        })
        .from(ipApplication)
        .where(eq(ipApplication.userId, userId))
        .orderBy(desc(ipApplication.createdAt))
        .limit(1);
      console.log(
        `[API:GET] Most recent IP application query result:`,
        JSON.stringify(ipApplications, null, 2)
      );
    }

    if (ipApplications.length === 0) {
      console.log(`[API:GET] No applications found for user: ${userId}`);
      return NextResponse.json(
        {
          success: false,
          error: "No applications found for current user",
          data: null,
        },
        { status: 404 }
      );
    }

    const applicationId = ipApplications[0].id;
    console.log(`[API:GET] Found application ID: ${applicationId}`);

    try {
      // Query the database for the user's deed of assignment with specific applicationId
      const deedData = await db.query.deedOfAssignment.findFirst({
        where: (deed) =>
          and(eq(deed.userId, userId), eq(deed.applicationId, applicationId)),
      });

      if (!deedData) {
        console.log(
          `[API:GET] No deed of assignment found for application: ${applicationId}`
        );
        return NextResponse.json(
          {
            success: false,
            error: "No deed of assignment found for this application",
            data: null,
          },
          { status: 404 }
        );
      }

      console.log(
        `[API:GET] Successfully fetched deed of assignment for application: ${applicationId}`
      );

      // Transform data to ensure consistent structure
      const transformedData = {
        ...deedData,
        // Ensure these specific fields are present with camelCase names
        researchTitle: deedData.researchTitle || "",
        creatorAddress: deedData.creatorAddress || "",
        assigneeName: deedData.assigneeName || "CARAGA STATE UNIVERSITY",
        assigneeRepresentative:
          deedData.assigneeRepresentative || "ROLYN C. DAGUIL, Ph.D.",
        // Add metadata
        metadata: {
          applicationId,
          deedId: deedData.deedId,
          fetchedAt: new Date().toISOString(),
        },
      };

      // Print the full transformed data structure in nice JSON format
      console.log(
        `[API:GET] FULL DATA OUTPUT START ==========================================`
      );
      console.log(JSON.stringify(transformedData, null, 2));
      console.log(
        `[API:GET] FULL DATA OUTPUT END ============================================`
      );

      // Return the combined data
      return NextResponse.json(
        {
          success: true,
          data: transformedData,
        },
        { status: 200 }
      );
    } catch (schemaError: unknown) {
      // If there was a schema error, log it and return a helpful error
      console.error(
        "[API:GET] Schema error in deed of assignment fetch:",
        schemaError
      );
      return NextResponse.json(
        {
          success: false,
          error:
            "Database schema error - column names may not match expected structure",
          details:
            schemaError instanceof Error
              ? schemaError.message
              : String(schemaError),
          data: null,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[API:GET] Error fetching deed of assignment data:", error);
    return NextResponse.json(
      { success: false, error: "Database error", data: null },
      { status: 500 }
    );
  }
}

// POST: Create a new deed of assignment
export async function POST(req: NextRequest) {
  try {
    console.log("[API:POST] Starting deed of assignment creation");
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      console.log("[API:POST] Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const data = await req.json();
    console.log(`[API:POST] Received data for user ${userId}`);

    const applicationId = data.applicationId;
    if (!applicationId) {
      console.log("[API:POST] No applicationId provided in request data");
      return NextResponse.json(
        { error: "applicationId is required" },
        { status: 400 }
      );
    }

    // Check if a deed of assignment already exists for this application
    const existingDeed = await db.query.deedOfAssignment.findFirst({
      where: (deed) =>
        and(eq(deed.userId, userId), eq(deed.applicationId, applicationId)),
    });

    if (existingDeed) {
      console.log(
        `[API:POST] A deed of assignment already exists for application: ${applicationId}`
      );
      return NextResponse.json(
        { error: "A deed of assignment already exists for this application" },
        { status: 409 }
      );
    }

    // Format the data for insertion with type safety - explicitly listing all valid columns
    const formattedData = {
      userId: userId,
      applicationId: applicationId, // Add the applicationId
      researchTitle: data.researchTitle || "",
      creators: data.creators || [],
      creatorAddress: data.creatorAddress || null,
      assigneeName: data.assigneeName || "CARAGA STATE UNIVERSITY",
      assigneeRepresentative:
        data.assigneeRepresentative || "ROLYN C. DAGUIL, Ph.D.",
      day: data.day || null,
      month: data.month || null,
      year: data.year || null,
      assigneeId: data.assigneeId || "M98 – 009",
      assigneeDate: data.assigneeDate || null,
      assigneePlace: data.assigneePlace || "Butuan City",
      assignorId: data.assignorId || null,
      assignorDate: data.assignorDate || null,
      assignorPlace: data.assignorPlace || "Butuan City",
      notarizedDocumentPath: data.notarizedDocumentPath || null,
      status: data.status || "draft",
    };

    console.log(
      "[API:POST] Research title being saved:",
      formattedData.researchTitle
    );

    // Insert the new deed of assignment
    const result = await db
      .insert(deedOfAssignment)
      .values(formattedData)
      .returning();
    console.log("[API:POST] Insert completed");

    // If an application ID was provided, register this deed in the form submission registry
    if (applicationId && result.length > 0 && result[0].deedId) {
      console.log(
        `[API:POST] Registering deed of assignment for application ${applicationId}`
      );

      // Check if a registry entry already exists for this application and source type
      const existingRegistry = await db.query.formSubmissionRegistry.findFirst({
        where: and(
          eq(formSubmissionRegistry.ipApplicationId, applicationId),
          eq(formSubmissionRegistry.sourceType, "deed_of_assignment")
        ),
      });

      if (!existingRegistry) {
        // Create a new registry entry
        await db.insert(formSubmissionRegistry).values({
          userId: userId,
          sourceType: "deed_of_assignment",
          sourceId: result[0].deedId,
          ipApplicationId: applicationId,
          status: formattedData.status,
          title: `Deed of Assignment: ${
            formattedData.researchTitle || "Untitled"
          }`,
          description: `Deed of Assignment for ${
            formattedData.assigneeName || "Assignee"
          }`,
          inventorsCreators:
            Array.isArray(formattedData.creators) &&
            formattedData.creators.length > 0
              ? JSON.stringify(
                  (formattedData.creators as Creator[]).map(
                    (creator: Creator) => ({
                      name: `${creator.firstName} ${
                        creator.middleInitial || ""
                      } ${creator.lastName}`.trim(),
                      role: "Creator",
                    })
                  )
                )
              : null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        console.log("[API:POST] Created form submission registry entry");
      } else {
        // Update the existing registry entry
        await db
          .update(formSubmissionRegistry)
          .set({
            sourceId: result[0].deedId,
            status: formattedData.status,
            title: `Deed of Assignment: ${
              formattedData.researchTitle || "Untitled"
            }`,
            description: `Deed of Assignment for ${
              formattedData.assigneeName || "Assignee"
            }`,
            inventorsCreators:
              Array.isArray(formattedData.creators) &&
              formattedData.creators.length > 0
                ? JSON.stringify(
                    (formattedData.creators as Creator[]).map(
                      (creator: Creator) => ({
                        name: `${creator.firstName} ${
                          creator.middleInitial || ""
                        } ${creator.lastName}`.trim(),
                        role: "Creator",
                      })
                    )
                  )
                : null,
            updatedAt: new Date().toISOString(),
          })
          .where(
            eq(formSubmissionRegistry.registryId, existingRegistry.registryId)
          );
        console.log("[API:POST] Updated form submission registry entry");
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Deed of assignment created successfully",
        data: {
          deedId: result[0].deedId,
          ...formattedData,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API:POST] Error creating deed of assignment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create deed of assignment" },
      { status: 500 }
    );
  }
}

// PUT: Update an existing deed of assignment
export async function PUT(req: NextRequest) {
  try {
    console.log("[API:PUT] Starting deed of assignment update");
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      console.log("[API:PUT] Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const data = await req.json();
    console.log(`[API:PUT] Received update request for user ${userId}`);

    // Get applicationId from request data
    const applicationId = data.applicationId;
    if (!applicationId) {
      console.log("[API:PUT] No applicationId provided in request data");
      return NextResponse.json(
        { error: "applicationId is required" },
        { status: 400 }
      );
    }

    // Check if the deed of assignment exists for this application
    const existingDeed = await db.query.deedOfAssignment.findFirst({
      where: (deed) =>
        and(eq(deed.userId, userId), eq(deed.applicationId, applicationId)),
    });

    if (!existingDeed) {
      console.log(
        `[API:PUT] No deed of assignment found for application: ${applicationId}`
      );
      return NextResponse.json(
        { error: "No deed of assignment found for this application" },
        { status: 404 }
      );
    }

    console.log(
      `[API:PUT] Found existing deed for application: ${applicationId}`
    );

    // Format the data for update - explicitly listing all valid columns
    const formattedData = {
      researchTitle: data.researchTitle || existingDeed.researchTitle,
      creators: data.creators || (existingDeed.creators as Creator[]),
      creatorAddress: data.creatorAddress || existingDeed.creatorAddress,
      assigneeName: data.assigneeName || existingDeed.assigneeName,
      assigneeRepresentative:
        data.assigneeRepresentative || existingDeed.assigneeRepresentative,
      day: data.day || existingDeed.day,
      month: data.month || existingDeed.month,
      year: data.year || existingDeed.year,
      assigneeId: data.assigneeId || existingDeed.assigneeId,
      assigneeDate: data.assigneeDate || existingDeed.assigneeDate,
      assigneePlace: data.assigneePlace || existingDeed.assigneePlace,
      assignorId: data.assignorId || existingDeed.assignorId,
      assignorDate: data.assignorDate || existingDeed.assignorDate,
      assignorPlace: data.assignorPlace || existingDeed.assignorPlace,
      notarizedDocumentPath:
        data.notarizedDocumentPath || existingDeed.notarizedDocumentPath,
      status: data.status || existingDeed.status,
    };

    console.log("[API:PUT] Updating deed with new research title and data");

    // Update the deed of assignment
    await db
      .update(deedOfAssignment)
      .set(formattedData)
      .where(
        and(
          eq(deedOfAssignment.userId, userId),
          eq(deedOfAssignment.applicationId, applicationId)
        )
      );

    console.log(
      `[API:PUT] Successfully updated deed of assignment for application: ${applicationId}`
    );

    // Update the form submission registry as well
    console.log("[API:PUT] Checking for form submission registry entry");
    const existingRegistry = await db.query.formSubmissionRegistry.findFirst({
      where: and(
        eq(formSubmissionRegistry.ipApplicationId, applicationId),
        eq(formSubmissionRegistry.sourceType, "deed_of_assignment")
      ),
    });

    if (existingRegistry) {
      console.log("[API:PUT] Updating form submission registry entry");
      await db
        .update(formSubmissionRegistry)
        .set({
          status: formattedData.status,
          title: `Deed of Assignment: ${
            formattedData.researchTitle || "Untitled"
          }`,
          description: `Deed of Assignment for ${
            formattedData.assigneeName || "Assignee"
          }`,
          inventorsCreators:
            Array.isArray(formattedData.creators) &&
            formattedData.creators.length > 0
              ? JSON.stringify(
                  (formattedData.creators as Creator[]).map(
                    (creator: Creator) => ({
                      name: `${creator.firstName} ${
                        creator.middleInitial || ""
                      } ${creator.lastName}`.trim(),
                      role: "Creator",
                    })
                  )
                )
              : null,
          updatedAt: new Date().toISOString(),
        })
        .where(
          eq(formSubmissionRegistry.registryId, existingRegistry.registryId)
        );
      console.log("[API:PUT] Form submission registry entry updated");
    } else {
      // If no registry entry exists, create one
      console.log("[API:PUT] Creating new form submission registry entry");
      await db.insert(formSubmissionRegistry).values({
        userId: userId,
        sourceType: "deed_of_assignment",
        sourceId: existingDeed.deedId,
        ipApplicationId: applicationId,
        status: formattedData.status,
        title: `Deed of Assignment: ${
          formattedData.researchTitle || "Untitled"
        }`,
        description: `Deed of Assignment for ${
          formattedData.assigneeName || "Assignee"
        }`,
        inventorsCreators:
          Array.isArray(formattedData.creators) &&
          formattedData.creators.length > 0
            ? JSON.stringify(
                (formattedData.creators as Creator[]).map(
                  (creator: Creator) => ({
                    name: `${creator.firstName} ${
                      creator.middleInitial || ""
                    } ${creator.lastName}`.trim(),
                    role: "Creator",
                  })
                )
              )
            : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log("[API:PUT] Created new form submission registry entry");
    }

    return NextResponse.json(
      {
        success: true,
        message: "Deed of assignment updated successfully",
        data: {
          deedId: existingDeed.deedId,
          ...formattedData,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API:PUT] Error updating deed of assignment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update deed of assignment" },
      { status: 500 }
    );
  }
}

// PATCH: Update the status of a deed of assignment (e.g., submit, approve, reject)
export async function PATCH(req: NextRequest) {
  try {
    console.log("[API:PATCH] Starting deed of assignment status update");
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      console.log("[API:PATCH] Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const data = await req.json();
    console.log(
      `[API:PATCH] Received data for user ${userId}:`,
      JSON.stringify(data, null, 2)
    );

    if (
      !data.status ||
      ![
        "draft",
        "submitted",
        "approved",
        "rejected",
        "pending_revision",
      ].includes(data.status)
    ) {
      console.log(`[API:PATCH] Invalid status value: ${data.status}`);
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    // Get applicationId from request data
    const applicationId = data.applicationId;
    if (!applicationId) {
      console.log("[API:PATCH] No applicationId provided in request data");
      return NextResponse.json(
        { error: "applicationId is required" },
        { status: 400 }
      );
    }

    // Check if the deed of assignment exists for this application
    const existingDeed = await db.query.deedOfAssignment.findFirst({
      where: (deed) =>
        and(eq(deed.userId, userId), eq(deed.applicationId, applicationId)),
    });

    if (!existingDeed) {
      console.log(
        `[API:PATCH] No deed of assignment found for application: ${applicationId}`
      );
      return NextResponse.json(
        { error: "No deed of assignment found for this application" },
        { status: 404 }
      );
    }

    console.log(
      `[API:PATCH] Updating status to ${data.status} for application: ${applicationId}`
    );

    // Update only the status
    await db
      .update(deedOfAssignment)
      .set({ status: data.status })
      .where(
        and(
          eq(deedOfAssignment.userId, userId),
          eq(deedOfAssignment.applicationId, applicationId)
        )
      );

    console.log(
      `[API:PATCH] Successfully updated status for application: ${applicationId}`
    );

    // Also update the status in the form submission registry
    console.log("[API:PATCH] Checking for form submission registry entry");
    const existingRegistry = await db.query.formSubmissionRegistry.findFirst({
      where: and(
        eq(formSubmissionRegistry.ipApplicationId, applicationId),
        eq(formSubmissionRegistry.sourceType, "deed_of_assignment")
      ),
    });

    if (existingRegistry) {
      console.log("[API:PATCH] Updating form submission registry status");
      await db
        .update(formSubmissionRegistry)
        .set({
          status: data.status,
          updatedAt: new Date().toISOString(),
          // If status is submitted, set the submittedAt timestamp
          ...(data.status === "submitted"
            ? { submittedAt: new Date().toISOString() }
            : {}),
        })
        .where(
          eq(formSubmissionRegistry.registryId, existingRegistry.registryId)
        );
      console.log("[API:PATCH] Form submission registry status updated");
    } else {
      // If no registry entry exists, create one
      console.log("[API:PATCH] Creating new form submission registry entry");
      await db.insert(formSubmissionRegistry).values({
        userId: userId,
        sourceType: "deed_of_assignment",
        sourceId: existingDeed.deedId,
        ipApplicationId: applicationId,
        status: data.status,
        title: `Deed of Assignment: ${
          existingDeed.researchTitle || "Untitled"
        }`,
        description: `Deed of Assignment for ${
          existingDeed.assigneeName || "Assignee"
        }`,
        inventorsCreators:
          Array.isArray(existingDeed.creators) &&
          existingDeed.creators.length > 0
            ? JSON.stringify(
                (existingDeed.creators as Creator[]).map(
                  (creator: Creator) => ({
                    name: `${creator.firstName} ${
                      creator.middleInitial || ""
                    } ${creator.lastName}`.trim(),
                    role: "Creator",
                  })
                )
              )
            : null,
        // If status is submitted, set the submittedAt timestamp
        ...(data.status === "submitted"
          ? { submittedAt: new Date().toISOString() }
          : {}),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log("[API:PATCH] Created new form submission registry entry");
    }

    return NextResponse.json(
      {
        success: true,
        message: "Deed of assignment status updated successfully",
        data: {
          deedId: existingDeed.deedId,
          status: data.status,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "[API:PATCH] Error updating deed of assignment status:",
      error
    );
    return NextResponse.json(
      { success: false, error: "Failed to update deed of assignment status" },
      { status: 500 }
    );
  }
}
