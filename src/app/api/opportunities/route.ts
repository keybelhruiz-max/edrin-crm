import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAgencySession, agencyWhere, unauthorizedResponse } from "@/lib/agency";

export async function GET() {
  try {
    const s = await getAgencySession();
    if (!s) return unauthorizedResponse();
    const opportunities = await prisma.opportunity.findMany({
      where: agencyWhere(s),
      include: { contact: true, stage: true, agent: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(opportunities);
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const s = await getAgencySession();
    if (!s) return unauthorizedResponse();
    const body = await req.json();

    const firstStage = await prisma.pipelineStage.findFirst({
      where: agencyWhere(s),
      orderBy: { order: "asc" },
    });
    if (!firstStage) {
      return NextResponse.json({ error: "No hay etapas de pipeline configuradas" }, { status: 400 });
    }

    const opp = await prisma.opportunity.create({
      data: {
        agencyId: s.agencyId || null,
        contactId: body.contactId,
        stageId: body.stageId || firstStage.id,
        destination: body.destination || null,
        mayorista: body.mayorista || null,
        estimatedValue: body.estimatedValue ? parseFloat(body.estimatedValue) : null,
        currency: body.currency || "DOP",
        isInternational: body.isInternational ?? false,
        notes: body.notes || null,
        agentId: body.agentId || null,
      },
      include: { contact: true, stage: true },
    });
    return NextResponse.json(opp);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[POST /api/opportunities]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
