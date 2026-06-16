import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads", "studio");

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);
const VIDEO_EXT = new Set([".mp4", ".mov", ".webm", ".m4v"]);

export async function saveStudioUpload(file: File, subdir = "") {
  const ext = path.extname(file.name).toLowerCase();
  if (!IMAGE_EXT.has(ext) && !VIDEO_EXT.has(ext)) {
    throw new Error("Tipo de archivo no permitido");
  }
  const mediaType: "IMAGE" | "VIDEO" = IMAGE_EXT.has(ext) ? "IMAGE" : "VIDEO";

  const dir = path.join(UPLOAD_ROOT, subdir);
  await mkdir(dir, { recursive: true });

  const filename = `${crypto.randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  const urlPath = ["/uploads/studio", subdir, filename].filter(Boolean).join("/");
  return { url: urlPath, mediaType, size: buffer.length, name: file.name };
}
