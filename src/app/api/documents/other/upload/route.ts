import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/drizzle/db";
import { otherDocuments } from "@/drizzle/schema";
import { v4 as uuidv4 } from "uuid";
import { validate as validateUuid } from "uuid";
import path from "path";
import fs from "fs";
import { ipApplication } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import {
  DriveAuthError,
  MAX_UPLOAD_SIZE_BYTES,
  ensureDriveFolderPath,
  uploadFileToDrive,
} from "@/lib/google-drive";

export const dynamic = "force-dynamic";
// Import schema. In production, import the actual schema with otherDocuments

// Mock implementation for development
// In production, you'd use a proper file storage solution like AWS S3, Vercel Blob, etc.

export async function POST(req: NextRequest) {
  console.log("[API/documents/other/upload] Received upload request");
  console.log("[API/documents/other/upload] Runtime context:", {
    cwd: process.cwd(),
    hasGoogleDriveStorageEmail: Boolean(
      process.env.GOOGLE_DRIVE_STORAGE_EMAIL?.trim()
    ),
    hasGoogleDriveRootFolderId: Boolean(
      process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID?.trim()
    ),
    hasGoogleDriveSharedDriveId: Boolean(
      process.env.GOOGLE_DRIVE_SHARED_DRIVE_ID?.trim()
    ),
  });
  try {
    const session = await auth();
    console.log("[API/documents/other/upload] Session lookup result:", {
      hasSession: Boolean(session),
      hasUser: Boolean(session?.user),
      userId: session?.user?.id ?? null,
      email: session?.user?.email ?? null,
      role: (session?.user as { role?: string } | undefined)?.role ?? null,
    });
    if (!session?.user?.id) {
      console.error("[API/documents/other/upload] Unauthorized - no session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Parse the form data
    const formData = await req.formData();

    // Log raw form data entries for debugging
    console.log(
      "[API/documents/other/upload] Form data keys:",
      Array.from(formData.keys())
    );

    const formId = formData.get("formId") as string;
    console.log("[API/documents/other/upload] formId:", formId);

    const ipApplicationId = formData.get("ipApplicationId") as string;
    console.log(
      "[API/documents/other/upload] ipApplicationId:",
      ipApplicationId
    );

    const files = formData.getAll("files") as File[];
    console.log("[API/documents/other/upload] Number of files:", files.length);

    // Validate that files array has content
    if (files.length === 0) {
      console.error("[API/documents/other/upload] No files provided");
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Quick check to ensure files are valid
    const validFiles = files.filter((file) => {
      if (!file) {
        console.error("[API/documents/other/upload] Undefined file in array");
        return false;
      }

      // Check if the file has the basic properties we need
      const hasName = !!file.name;
      const hasSize = typeof file.size === "number";
      const hasType = !!file.type;

      if (!hasName || !hasSize || !hasType) {
        console.error("[API/documents/other/upload] Invalid file object:", {
          hasName,
          hasSize,
          hasType,
          fileObject: Object.keys(file),
        });
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) {
      console.error("[API/documents/other/upload] No valid files provided");
      return NextResponse.json(
        {
          error: "No valid files provided",
          details: "The files uploaded do not have the required properties",
        },
        { status: 400 }
      );
    }

    console.log(
      `[API/documents/other/upload] Found ${validFiles.length} valid files`
    );

    // Validate formId
    if (formId) {
      // Format validation - allowing both UUIDs and application IDs
      const formIdIsValid =
        formId && (validateUuid(formId) || /^[a-zA-Z0-9-_]+$/.test(formId)); // Allow alphanumeric IDs with hyphens/underscores

      if (!formIdIsValid) {
        console.error(
          "[API/documents/other/upload] Invalid format for formId:",
          formId
        );
        return NextResponse.json(
          { error: "Form ID must be a valid format" },
          { status: 400 }
        );
      }
    } else {
      console.error(
        "[API/documents/other/upload] formId is required but missing"
      );
      return NextResponse.json(
        { error: "Form ID is required" },
        { status: 400 }
      );
    }

    // Validate ipApplicationId
    if (!ipApplicationId) {
      console.error(
        "[API/documents/other/upload] IP Application ID is required but missing"
      );
      return NextResponse.json(
        { error: "IP Application ID is required" },
        { status: 400 }
      );
    }

    // Validate ipApplicationId is a valid UUID
    if (!validateUuid(ipApplicationId)) {
      console.error(
        "[API/documents/other/upload] Invalid UUID format for ipApplicationId:",
        ipApplicationId
      );
      return NextResponse.json(
        { error: "IP Application ID must be a valid UUID" },
        { status: 400 }
      );
    }

    // Verify that the IP application actually exists in the database
    const ipApplicationExists = await db
      .select({ id: ipApplication.id, title: ipApplication.title })
      .from(ipApplication)
      .where(eq(ipApplication.id, ipApplicationId))
      .limit(1);

    if (!ipApplicationExists || ipApplicationExists.length === 0) {
      console.error(
        "[API/documents/other/upload] IP Application not found in database:",
        ipApplicationId
      );
      return NextResponse.json(
        { error: "IP Application not found in database" },
        { status: 404 }
      );
    }

    console.log(
      "[API/documents/other/upload] IP Application exists:",
      ipApplicationId
    );

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', ipApplicationId);
    await fs.promises.mkdir(uploadDir, { recursive: true });

    // Process each file
    const uploadedFiles = [];
    let insertErrors = 0;

    for (let index = 0; index < validFiles.length; index++) {
      const file = validFiles[index];

      // Get file details, handling potential missing properties
      const fileName = file.name ? file.name.toString() : `file-${index}`;
      const fileSize = file.size ? Number(file.size) : 0;
      const fileType = file.type
        ? file.type.toString()
        : "application/octet-stream";

      if (fileSize > MAX_UPLOAD_SIZE_BYTES) {
        return NextResponse.json(
          { error: "File exceeds 100MB limit" },
          { status: 413 }
        );
      }

      const fileExtension = path.extname(fileName);
      const uniqueFilename = `${uuidv4()}${fileExtension}`;
      const filePath = path.join(uploadDir, uniqueFilename);
      
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      await fs.promises.writeFile(filePath, buffer);

      const fileUrl = `/uploads/${ipApplicationId}/${uniqueFilename}`;

      // Create a document record with a generated UUID
      const documentId = uuidv4();
      console.log(
        `[API/documents/other/upload] Generated document ID: ${documentId}`
      );

      // Get title and description for this file
      const title = (formData.get(`title-${index}`) as string) || "";
      const description =
        (formData.get(`description-${index}`) as string) || "";

      console.log(`[API/documents/other/upload] File metadata:`, {
        title: title || "(not provided)",
        description: description || "(not provided)",
      });

      const newDocument = {
        documentId,
        formId: formId || ipApplicationId, // formId is required (notNull), fallback to ipApplicationId
        userId: userId,
        ipApplicationId,
        fileName: fileName.replace(/[^a-zA-Z0-9.-]/g, "_"),
        originalName: fileName,
        filePath: fileUrl,
        fileSize: fileSize,
        mimeType: fileType,
        category: (formData.get(`category-${index}`) as string) || "other",
        description: description || "",
        uploadedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "active",
        metadata: {
          localUpload: true,
        },
      };

      console.log("[API/documents/other/upload] Document record prepared:", {
        documentId: newDocument.documentId,
        formId: newDocument.formId,
        userId: newDocument.userId,
        ipApplicationId: newDocument.ipApplicationId,
        fileName: newDocument.fileName,
        // Log more fields for debugging
        description: newDocument.description,
        metadata: newDocument.metadata,
      });

      // Validate that userId is a valid UUID before inserting
      if (!validateUuid(newDocument.userId)) {
        console.error(
          `[API/documents/other/upload] Invalid UUID format for userId: ${newDocument.userId}`
        );
        return NextResponse.json(
          {
            error: "Invalid UUID format for user ID",
            details: `The value '${newDocument.userId}' is not a valid UUID`,
          },
          { status: 400 }
        );
      }

      try {
        // Insert document record into the database
        console.log(
          "[API/documents/other/upload] Inserting document into database..."
        );

        // Log the complete document object for debugging
        console.log(
          "[API/documents/other/upload] Document object:",
          JSON.stringify(newDocument, null, 2)
        );

        // Explicitly check all required fields based on schema
        const requiredFields = [
          { field: "documentId", value: newDocument.documentId },
          { field: "formId", value: newDocument.formId },
          { field: "userId", value: newDocument.userId },
          { field: "ipApplicationId", value: newDocument.ipApplicationId },
          { field: "fileName", value: newDocument.fileName },
          { field: "originalName", value: newDocument.originalName },
          { field: "filePath", value: newDocument.filePath },
          { field: "fileSize", value: newDocument.fileSize },
          { field: "mimeType", value: newDocument.mimeType },
        ];

        const missingFields = requiredFields.filter((f) => !f.value);
        if (missingFields.length > 0) {
          console.error(
            "[API/documents/other/upload] Missing required fields:",
            missingFields.map((f) => f.field).join(", ")
          );
          return NextResponse.json(
              {
                error: "Missing required fields",
                details: `Fields ${missingFields
                  .map((f) => f.field)
                  .join(", ")} are required`,
            },
            { status: 400 }
          );
        }

        const result = await db.insert(otherDocuments).values(newDocument as typeof otherDocuments.$inferInsert);
        console.log(
          "[API/documents/other/upload] Document inserted successfully:",
          result
        );

        // Add to response
        uploadedFiles.push(newDocument);
      } catch (dbError) {
        insertErrors++;
        console.error("[API/documents/other/upload] Database error:", dbError);

        // Log detailed error for easier debugging
        if (dbError instanceof Error) {
          console.error(
            "[API/documents/other/upload] Error message:",
            dbError.message
          );
          console.error(
            "[API/documents/other/upload] Error stack:",
            dbError.stack
          );

          // Check for specific database error types
          if (dbError.message.includes("invalid input syntax for type uuid")) {
            // Extract the invalid UUID value from the error message if possible
            const match = dbError.message.match(
              /invalid input syntax for type uuid: "([^"]+)"/
            );
            const invalidValue = match ? match[1] : "unknown value";

            console.error(
              `[API/documents/other/upload] UUID validation failed for value: ${invalidValue}`
            );

            return NextResponse.json(
              {
                error: "Invalid UUID format in database operation",
                details: `The value '${invalidValue}' is not a valid UUID`,
                document: {
                  ipApplicationId: newDocument.ipApplicationId,
                  formId: newDocument.formId,
                  userId: newDocument.userId,
                },
              },
              { status: 400 }
            );
          }

          // Check for foreign key constraint violations
          if (dbError.message.includes("violates foreign key constraint")) {
            // Try to extract the constraint name and details from the error message
            const constraintMatch =
              dbError.message.match(/constraint "([^"]+)"/);
            const constraintName = constraintMatch
              ? constraintMatch[1]
              : "unknown constraint";

            let errorDetail = `Foreign key constraint violation: ${constraintName}`;

            // Add more context based on the specific constraint
            if (constraintName.includes("user_id")) {
              errorDetail = `The user ID '${newDocument.userId}' does not exist in the user_account table.`;
            } else if (constraintName.includes("ip_application_id")) {
              errorDetail = `The IP application ID '${newDocument.ipApplicationId}' does not exist in the ip_application table.`;
            } else if (constraintName.includes("form_id")) {
              errorDetail = `The form ID '${newDocument.formId}' does not exist in the referenced table.`;
            }

            return NextResponse.json(
              {
                error: "Database constraint violation",
                details: errorDetail,
                document: {
                  userId: newDocument.userId,
                  ipApplicationId: newDocument.ipApplicationId,
                  formId: newDocument.formId,
                },
              },
              { status: 400 }
            );
          }
        }

        // In a real implementation, you might want to delete the uploaded file
        // if the database insert fails
      }
    }

    // Check if any files were successfully processed
    if (uploadedFiles.length === 0) {
      console.error(
        "[API/documents/other/upload] No files were successfully uploaded"
      );

      if (insertErrors > 0) {
        return NextResponse.json(
          {
            error: "Failed to insert documents into the database",
            details: `${insertErrors} database errors occurred`,
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          error: "No files were successfully processed",
        },
        { status: 400 }
      );
    }

    console.log(
      "[API/documents/other/upload] Successfully processed all files:",
      uploadedFiles.length
    );
    return NextResponse.json({
      success: true,
      files: uploadedFiles,
    });
  } catch (error) {
    console.error("[API/documents/other/upload] Error uploading files:", error);
    if (error instanceof DriveAuthError) {
      console.error(
        "[API/documents/other/upload] Drive auth failure:",
        {
          message: error.message,
          stack: error.stack,
        }
      );
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }
    // Log more detailed error information
    if (error instanceof Error) {
      console.error(
        "[API/documents/other/upload] Error message:",
        error.message
      );
      console.error("[API/documents/other/upload] Error stack:", error.stack);
    }

    return NextResponse.json(
      {
        error: "Failed to upload files",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
