import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const opp = await prisma.opportunity.findUnique({
    where: { id },
    include: {
      contact: true,
      stage: true,
      agent: { select: { id: true, name: true } },
      quotes: { orderBy: { createdAt: "asc" } },
      invoices: { include: { items: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!opp) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(opp);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.stageId !== undefined) data.stageId = body.stageId;
  if (body.destination !== undefined) data.destination = body.destination;
  if (body.mayorista !== undefined) data.mayorista = body.mayorista;
  if (body.checkIn !== undefined) data.checkIn = body.checkIn ? new Date(body.checkIn) : null;
  if (body.checkOut !== undefined) data.checkOut = body.checkOut ? new Date(body.checkOut) : null;
  if (body.estimatedValue !== undefined) data.estimatedValue = body.estimatedValue;
  if (body.currency !== undefined) data.currency = body.currency;
  if (body.isInternational !== undefined) data.isInternational = body.isInternational;
  if (body.intlChecklist !== undefined) data.intlChecklist = body.intlChecklist;
  if (body.notes !== undefined) data.notes = body.notes;
  if (body.agentId !== undefined) data.agentId = body.agentId;

  const opp = await prisma.opportunity.update({
    where: { id },
    data,
    include: { contact: true, stage: true, quotes: true },
  });
  return NextResponse.json(opp);
}
