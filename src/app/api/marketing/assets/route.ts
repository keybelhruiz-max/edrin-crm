import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function GET() {
  const assets = await prisma.mediaAsset.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(assets);
}

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const notes = (formData.get("folder") as string) || "General";

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const uploadDir = join(process.cwd(), "public", "uploads");

    try {
      await mkdir(uploadDir, { recursive: true });
      await writeFile(join(uploadDir, safeName), buffer);
    } catch { /* continue even if write fails */ }

    // Detect type
    let type = "IMAGE";
    if (file.type.startsWith("video/")) type = "VIDEO";
    else if (file.type.includes("pdf") || file.type.includes("document")) type = "DOCUMENT";

    const asset = await prisma.mediaAsset.create({
      data: {
        name: file.name,
        type,
        url: `/uploads/${safeName}`,
        size: file.size,
        tags: "[]",
        notes,
      },
    });

    return NextResponse.json(asset);
  }

  // JSON body (manual create)
  const body = await req.json();
  const asset = await prisma.mediaAsset.create({
    data: {
      name: body.name,
      type: body.type || "IMAGE",
      url: body.url || "",
      size: body.size,
      tags: JSON.stringify(body.tags ?? []),
      notes: body.notes,
    },
  });
  return NextResponse.json(asset);
}
