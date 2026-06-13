import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAgencySession, agencyWhere, unauthorizedResponse } from "@/lib/agency";

export async function GET() {
  const s = await getAgencySession();
  if (!s) return unauthorizedResponse();
  const campaigns = await prisma.campaign.findMany({
    where: agencyWhere(s),
    include: { leadSources: true, posts: { select: { id: true, leadsGenerated: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(campaigns);
}

export async function POST(req: Request) {
  const s = await getAgencySession();
  if (!s) return unauthorizedResponse();
  const body = await req.json();
  const campaign = await prisma.campaign.create({
    data: {
      agencyId: s.agencyId || null,
      name: body.name,
      platform: body.platform || "META",
      externalId: body.externalId,
      status: body.status || "ACTIVE",
      objective: body.objective,
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
      budget: body.budget || 0,
      currency: body.currency || "USD",
    },
  });
  return NextResponse.json(campaign);
}

export async function PATCH(req: Request) {
  const s = await getAgencySession();
  if (!s) return unauthorizedResponse();
  const body = await req.json();
  const { id, ...data } = body;
  const campaign = await prisma.campaign.update({
    where: { id, ...agencyWhere(s) },
    data,
  });
  return NextResponse.json(campaign);
}
