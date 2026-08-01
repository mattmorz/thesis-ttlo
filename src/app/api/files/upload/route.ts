import { auth } from "@/auth";
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";

const MAX_UPLOAD_SIZE_BYTES = 100 * 1024 * 1024; // 100MB

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
    const projectId = formData.get("projectId") as string;

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Use local public/uploads directory for now as requested
    const uploadDir = path.join(process.cwd(), "public", "uploads", projectId);
    
    // Ensure the directory exists
    await fs.mkdir(uploadDir, { recursive: true });

    for (const file of files) {
      if (file.size > MAX_UPLOAD_SIZE_BYTES) {
        return NextResponse.json(
          { error: "File exceeds 100MB limit" },
          { status: 413 }
        );
      }

      const fileExtension = path.extname(file.name);
      const uniqueFilename = `${uuidv4()}${fileExtension}`;
      const filePath = path.join(uploadDir, uniqueFilename);
      
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      await fs.writeFile(filePath, buffer);

      // Return the public URL path
      const publicPath = `/uploads/${projectId}/${uniqueFilename}`;

      uploadedFiles.push({
        name: file.name,
        size: file.size,
        path: publicPath,
        driveFileId: uniqueFilename, // Storing filename here for compatibility
      });
    }

    return NextResponse.json({ files: uploadedFiles });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
