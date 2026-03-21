import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { nanoid } from "nanoid";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const ip = request.headers.get("x-forwarded-for") || session.user.id;
    const rl = rateLimit(`upload:${ip}`, { limit: 20, windowSeconds: 300 });
    if (!rl.success) return rateLimitResponse(rl);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "请选择文件" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "不支持的文件类型，仅支持 JPG/PNG/GIF/WebP/SVG/PDF" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "文件大小不能超过 5MB" },
        { status: 400 }
      );
    }

    // 生成安全文件名
    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const safeExt = ext.replace(/[^a-z0-9]/g, "");
    const filename = `${nanoid(16)}.${safeExt}`;

    // 按日期组织目录
    const dateDir = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const targetDir = join(UPLOAD_DIR, dateDir);

    await mkdir(targetDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = join(targetDir, filename);
    await writeFile(filePath, buffer);

    const url = `/uploads/${dateDir}/${filename}`;

    return NextResponse.json({
      url,
      filename: file.name,
      mimeType: file.type,
      size: file.size,
    });
  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json({ error: "上传失败" }, { status: 500 });
  }
}
