import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAgencySession, agencyWhere, unauthorizedResponse } from "@/lib/agency";

export async function GET(req: Request) {
  const s = await getAgencySession();
  if (!s) return unauthorizedResponse();
  const { searchParams } = new URL(req.url);
  const entityId = searchParams.get("entityId");
  const entityType = searchParams.get("entityType");
  const logs = await prisma.paymentLog.findMany({
    where: {
      ...agencyWhere(s),
      ...(entityId ? { entityId } : {}),
      ...(entityType ? { entityType } : {}),
    },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(logs);
}

export async function POST(req: Request) {
  const s = await getAgencySession();
  if (!s) return unauthorizedResponse();
  const session = await auth();
  const body = await req.json();
  const log = await prisma.paymentLog.create({
    data: {
      agencyId: s.agencyId || null,
      entityType: body.entityType,
      entityId: body.entityId,
      action: body.action,
      fromValue: body.fromValue ?? null,
      toValue: body.toValue ?? null,
      notes: body.notes ?? null,
      userId: (session?.user as { id?: string })?.id ?? body.userId ?? null,
    },
    include: { user: { select: { id: true, name: true } } },
  });
  return NextResponse.json(log, { status: 201 });
}
