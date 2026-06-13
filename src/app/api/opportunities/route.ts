import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const opportunities = await prisma.opportunity.findMany({
    include: { contact: true, stage: true, agent: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(opportunities);
}

export async function POST(req: Request) {
  const body = await req.json();
  const firstStage = await prisma.pipelineStage.findFirst({ orderBy: { order: "asc" } });
  const opp = await prisma.opportunity.create({
    data: {
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
