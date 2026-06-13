import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const campaigns = await prisma.campaign.findMany({
    include: { leadSources: true, posts: { select: { id: true, leadsGenerated: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(campaigns);
}

export async function POST(req: Request) {
  const body = await req.json();
  const campaign = await prisma.campaign.create({
    data: {
      name: body.name,
      platform: body.platform || "META",
      externalId: body.externalId,
      status: body.status || "ACTIVE",
      objective: body.objective,
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
      budget: body.budget || 0,
      currency: body.currency || "USD",
      spent: body.spent || 0,
      reach: body.reach || 0,
      impressions: body.impressions || 0,
      clicks: body.clicks || 0,
      leads: body.leads || 0,
      conversions: body.conversions || 0,
      revenue: body.revenue || 0,
    },
  });
  return NextResponse.json(campaign);
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const { id, ...data } = body;
  const campaign = await prisma.campaign.update({ where: { id }, data });
  return NextResponse.json(campaign);
}
