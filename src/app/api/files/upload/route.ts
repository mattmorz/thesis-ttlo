import { auth } from "@/auth";
import { writeFile } from "fs/promises";
import { NextResponse } from "next/server";
import { join } from "path";

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

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Get the projectId from formData
      const projectId = formData.get("projectId") as string;

      if (!projectId) {
        return NextResponse.json(
          { error: "Project ID is required" },
          { status: 400 }
        );
      }

      // Create project directory if it doesn't exist
      const bucketPath = join(process.cwd(), "bucket");
      const projectPath = join(bucketPath, projectId);
      await ensureDir(projectPath);

      const filePath = join(projectPath, file.name);
      await writeFile(filePath, buffer);

      uploadedFiles.push({
        name: file.name,
        size: file.size,
        path: filePath,
      });
    }

    return NextResponse.json({ files: uploadedFiles });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

async function ensureDir(dirPath: string) {
  try {
    await import("fs/promises").then((fs) =>
      fs.mkdir(dirPath, { recursive: true })
    );
  } catch (error) {
    if ((error as { code?: string }).code !== "EEXIST") {
      throw error;
    }
  }
}
