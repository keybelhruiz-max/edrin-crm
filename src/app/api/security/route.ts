import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAgencySession, agencyWhere, unauthorizedResponse } from "@/lib/agency";

export async function GET(req: Request) {
  const s = await getAgencySession();
  if (!s) return unauthorizedResponse();
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") ?? "100");

  const logs = await prisma.securityLog.findMany({
    where: agencyWhere(s),
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return NextResponse.json(logs);
}

export async function POST(req: Request) {
  const s = await getAgencySession();
  const body = await req.json();
  const log = await prisma.securityLog.create({
    data: {
      agencyId: s?.agencyId || null,
      userId: body.userId ?? s?.userId ?? null,
      event: body.event,
      email: body.email ?? null,
      ip: body.ip ?? null,
      userAgent: body.userAgent ?? null,
      metadata: body.metadata ? JSON.stringify(body.metadata) : null,
    },
  });
  return NextResponse.json(log, { status: 201 });
}
