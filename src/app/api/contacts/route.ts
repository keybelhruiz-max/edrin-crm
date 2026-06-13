import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAgencySession, agencyWhere, unauthorizedResponse } from "@/lib/agency";

export async function GET() {
  const s = await getAgencySession();
  if (!s) return unauthorizedResponse();
  const contacts = await prisma.contact.findMany({
    where: agencyWhere(s),
    include: { agent: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(contacts);
}

export async function POST(req: Request) {
  const s = await getAgencySession();
  if (!s) return unauthorizedResponse();
  const body = await req.json();
  const contact = await prisma.contact.create({
    data: {
      agencyId: s.agencyId || null,
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

  if (body.createOpportunity) {
    const firstStage = await prisma.pipelineStage.findFirst({
      where: agencyWhere(s),
      orderBy: { order: "asc" },
    });
    if (firstStage) {
      await prisma.opportunity.create({
        data: {
          agencyId: s.agencyId || null,
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
