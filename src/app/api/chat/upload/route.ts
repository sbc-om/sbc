import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { mediaUrlFromRelativePath } from "@/lib/uploads/storage";

// Generate a unique filename
function generateFilename(originalName: string): string {
  const ext = originalName.split(".").pop() || "";
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}.${ext}`;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null;

    if (!file) {
      return NextResponse.json({ ok: false, error: "No file provided" }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { ok: false, error: "File too large. Max 10MB" },
        { status: 400 }
      );
    }

    // Validate file type based on upload type
    const allowedImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const allowedAudioTypes = ["audio/webm", "audio/mp3", "audio/mpeg", "audio/ogg", "audio/wav"];
    
    if (type === "image" && !allowedImageTypes.includes(file.type)) {
      return NextResponse.json(
        { ok: false, error: "Invalid image type" },
        { status: 400 }
      );
    }
    
    if (type === "voice" && !allowedAudioTypes.includes(file.type)) {
      return NextResponse.json(
        { ok: false, error: "Invalid audio type" },
        { status: 400 }
      );
    }

    const uploadsRoot = process.env.UPLOAD_DIR?.trim()
      ? (process.env.UPLOAD_DIR.startsWith("/")
          ? process.env.UPLOAD_DIR
          : join(process.cwd(), process.env.UPLOAD_DIR))
      : join(process.cwd(), ".data", "uploads");

    // Create upload directory if it doesn't exist
    const uploadDir = join(uploadsRoot, "chat", user.id);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate filename and save
    const filename = generateFilename(file.name);
    const filepath = join(uploadDir, filename);
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Return media URL served by /media/[...path]
    const url = mediaUrlFromRelativePath(`chat/${user.id}/${filename}`);

    return NextResponse.json({
      ok: true,
      url,
      filename,
      type: file.type,
      size: file.size,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { ok: false, error: "Upload failed" },
      { status: 500 }
    );
  }
}
