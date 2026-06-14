import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAgencySession, unauthorizedResponse } from "@/lib/agency";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const s = await getAgencySession();
    if (!s) return unauthorizedResponse();
    const { id } = await params;
    const contact = await prisma.contact.findFirst({
      where: { id, agencyId: s.agencyId || undefined },
      include: {
        agent: { select: { id: true, name: true } },
        interactions: { include: { agent: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } },
        opportunities: { include: { stage: true }, orderBy: { createdAt: "desc" } },
        tasks: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    });
    if (!contact) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json(contact);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const s = await getAgencySession();
    if (!s) return unauthorizedResponse();
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.contact.findFirst({ where: { id, agencyId: s.agencyId || undefined } });
    if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = body.name.trim();
    if (body.phone !== undefined) data.phone = body.phone || null;
    if (body.email !== undefined) data.email = body.email || null;
    if (body.socialHandle !== undefined) data.socialHandle = body.socialHandle || null;
    if (body.channel !== undefined) data.channel = body.channel;
    if (body.notes !== undefined) data.notes = body.notes || null;
    if (body.agentId !== undefined) data.agentId = body.agentId || null;
    if (body.tags !== undefined) data.tags = body.tags;

    const contact = await prisma.contact.update({
      where: { id },
      data,
      include: { agent: { select: { id: true, name: true } } },
    });
    return NextResponse.json(contact);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const s = await getAgencySession();
    if (!s) return unauthorizedResponse();
    const { id } = await params;

    const existing = await prisma.contact.findFirst({ where: { id, agencyId: s.agencyId || undefined } });
    if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    await prisma.contact.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
