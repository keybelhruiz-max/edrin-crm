import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAgencySession, agencyWhere, unauthorizedResponse } from "@/lib/agency";

export async function GET(req: Request) {
  const s = await getAgencySession();
  if (!s) return unauthorizedResponse();
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const goals = await prisma.salesGoal.findMany({
    where: { ...agencyWhere(s), ...(month ? { month } : {}) },
    orderBy: { month: "desc" },
  });
  return NextResponse.json(goals);
}

export async function POST(req: Request) {
  const s = await getAgencySession();
  if (!s) return unauthorizedResponse();
  const { month, userId, target, currency } = await req.json();
  const goal = await prisma.salesGoal.upsert({
    where: { agencyId_month_userId: { agencyId: s.agencyId || "", month, userId: userId ?? null } },
    update: { target, currency: currency ?? "USD" },
    create: {
      agencyId: s.agencyId || null,
      month,
      userId: userId ?? null,
      target,
      currency: currency ?? "USD",
    },
  });
  return NextResponse.json(goal);
}
