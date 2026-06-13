import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAgencySession, agencyWhere, unauthorizedResponse } from "@/lib/agency";

export async function GET() {
  const s = await getAgencySession();
  if (!s) return unauthorizedResponse();
  const opportunities = await prisma.opportunity.findMany({
    where: agencyWhere(s),
    include: { contact: true, stage: true, agent: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(opportunities);
}

export async function POST(req: Request) {
  const s = await getAgencySession();
  if (!s) return unauthorizedResponse();
  const body = await req.json();
  const firstStage = await prisma.pipelineStage.findFirst({
    where: agencyWhere(s),
    orderBy: { order: "asc" },
  });
  const opp = await prisma.opportunity.create({
    data: {
      agencyId: s.agencyId || null,
      contactId: body.contactId,
      stageId: body.stageId || firstStage!.id,
      destination: body.destination,
      mayorista: body.mayorista,
      estimatedValue: body.estimatedValue,
      currency: body.currency || "DOP",
      notes: body.notes,
    },
    include: { contact: true, stage: true },
  });
  return NextResponse.json(opp);
}
