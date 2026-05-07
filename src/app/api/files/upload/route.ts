import { auth } from "@/auth";
import { NextResponse } from "next/server";
import {
  DriveAuthError,
  MAX_UPLOAD_SIZE_BYTES,
  ensureDriveFolderPath,
  uploadFileToDrive,
} from "@/lib/google-drive";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.redirect(new URL("/auth/unauthorized", request.url));
    }
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const uploadedFiles = [];
    const formName = (formData.get("formName") as string | null) || "";
    const projectId = formData.get("projectId") as string;

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    const applicationFolderId = projectId;
    // Use the configured Drive root folder directly; do not add an extra TTLO parent.
    const folderPath = [applicationFolderId, formName || "General Uploads"];
    const { folderId } = await ensureDriveFolderPath({
      pathSegments: folderPath,
    });

    for (const file of files) {

      if (file.size > MAX_UPLOAD_SIZE_BYTES) {
        return NextResponse.json(
          { error: "File exceeds 100MB limit" },
          { status: 413 }
        );
      }

      const driveFile = await uploadFileToDrive({
        file,
        fileName: `${projectId}-${file.name}`,
        mimeType: file.type || "application/octet-stream",
        parentId: folderId,
      });

      uploadedFiles.push({
        name: file.name,
        size: file.size,
        path: driveFile.webViewLink || driveFile.webContentLink || "",
        driveFileId: driveFile.fileId,
      });
    }

    return NextResponse.json({ files: uploadedFiles });
  } catch (error) {
    console.error("Upload error:", error);
    if (error instanceof DriveAuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
