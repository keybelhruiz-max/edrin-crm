import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAgencySession, agencyWhere, unauthorizedResponse } from "@/lib/agency";

export async function GET() {
  try {
    const s = await getAgencySession();
    if (!s) return unauthorizedResponse();
    const contacts = await prisma.contact.findMany({
      where: agencyWhere(s),
      include: { agent: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(contacts);
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const s = await getAgencySession();
    if (!s) return unauthorizedResponse();
    const body = await req.json();

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
    }

    const contact = await prisma.contact.create({
      data: {
        agencyId: s.agencyId || null,
        name: body.name.trim(),
        phone: body.phone || null,
        email: body.email || null,
        socialHandle: body.socialHandle || null,
        channel: body.channel || "WHATSAPP",
        tags: body.tags ? JSON.stringify(body.tags) : "[]",
        notes: body.notes || null,
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
            destination: body.destination || null,
            isInternational: body.isInternational ?? false,
            agentId: body.agentId || null,
          },
        });
      }
    }

    return NextResponse.json(contact);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[POST /api/contacts]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
