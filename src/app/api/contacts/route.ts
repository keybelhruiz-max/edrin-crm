import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const contacts = await prisma.contact.findMany({
    include: { agent: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(contacts);
}

export async function POST(req: Request) {
  const body = await req.json();
  const contact = await prisma.contact.create({
    data: {
      name: body.name,
      phone: body.phone,
      email: body.email,
      socialHandle: body.socialHandle,
      channel: body.channel || "WHATSAPP",
      tags: body.tags ? JSON.stringify(body.tags) : "[]",
      notes: body.notes,
      agentId: body.agentId || null,
    },
    include: { agent: { select: { id: true, name: true } } },
  });

  // Auto-create opportunity in first stage
  if (body.createOpportunity) {
    const firstStage = await prisma.pipelineStage.findFirst({ orderBy: { order: "asc" } });
    if (firstStage) {
      await prisma.opportunity.create({
        data: {
          contactId: contact.id,
          stageId: firstStage.id,
          destination: body.destination,
          isInternational: body.isInternational ?? false,
          agentId: body.agentId || null,
        },
      });
    }
  }

  return NextResponse.json(contact);
}
