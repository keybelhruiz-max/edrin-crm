import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAgencySession, agencyWhere, unauthorizedResponse } from "@/lib/agency";

export async function GET() {
  try {
    const s = await getAgencySession();
    if (!s) return unauthorizedResponse();
    const stages = await prisma.pipelineStage.findMany({
      where: agencyWhere(s),
      orderBy: { order: "asc" },
    });
    return NextResponse.json(stages);
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const s = await getAgencySession();
    if (!s) return unauthorizedResponse();
    const { name, color } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
    const last = await prisma.pipelineStage.findFirst({
      where: agencyWhere(s),
      orderBy: { order: "desc" },
    });
    const stage = await prisma.pipelineStage.create({
      data: {
        agencyId: s.agencyId || null,
        name: name.trim(),
        color: color || "#6B7280",
        order: (last?.order ?? 0) + 1,
      },
    });
    return NextResponse.json(stage);
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
