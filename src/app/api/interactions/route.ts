import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAgencySession, unauthorizedResponse } from "@/lib/agency";

export async function GET(req: Request) {
  const s = await getAgencySession();
  if (!s) return unauthorizedResponse();
  const { searchParams } = new URL(req.url);
  const contactId = searchParams.get("contactId");
  if (!contactId) return NextResponse.json([], { status: 200 });
  // Scope check: verify contact belongs to agency
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, agencyId: s.agencyId || undefined },
  });
  if (!contact) return NextResponse.json([], { status: 200 });
  const interactions = await prisma.interaction.findMany({
    where: { contactId },
    include: { agent: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(interactions);
}

export async function POST(req: Request) {
  const s = await getAgencySession();
  if (!s) return unauthorizedResponse();
  const session = await auth();
  const body = await req.json();
  const interaction = await prisma.interaction.create({
    data: {
      contactId: body.contactId,
      channel: body.channel,
      content: body.content,
      sentBy: body.sentBy ?? null,
      isInternal: body.isInternal ?? false,
      agentId: (session?.user as { id?: string })?.id ?? body.agentId ?? null,
    },
    include: { agent: { select: { id: true, name: true } } },
  });
  return NextResponse.json(interaction, { status: 201 });
}
