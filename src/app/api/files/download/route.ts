import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Get the UUID and filename from the search params
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get("projectId");
    const fileName = searchParams.get("fileName");

    // Check authentication and authorization
    const session = await auth();
    if (!session?.user) {
      return NextResponse.redirect(new URL("/auth/unauthorized", request.url));
    }

    // TODO must add signed url
    if (!projectId || !fileName) {
      return NextResponse.json(
        { error: "projectId and fileName parameters are required" },
        { status: 400 }
      );
    }

    // Construct the file path
    const filePath = path.join(process.cwd(), "bucket", projectId, fileName);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Read the file
    const fileBuffer = fs.readFileSync(filePath);

    // Get file mime type
    const mimeType = getMimeType(fileName);

    // Create response headers
    const headers = new Headers();
    headers.set("Content-Type", mimeType);
    headers.set(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(fileName)}"`
    );
    headers.set("Content-Length", fileBuffer.length.toString());

    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function getMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
  };

  return mimeTypes[ext] || "application/octet-stream";
}
