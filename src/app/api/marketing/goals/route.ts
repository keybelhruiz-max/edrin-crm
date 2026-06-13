import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const goals = await prisma.salesGoal.findMany({
    where: month ? { month } : undefined,
    orderBy: { month: "desc" },
  });
  return NextResponse.json(goals);
}

export async function POST(req: Request) {
  const { month, userId, target, currency } = await req.json();
  const goal = await prisma.salesGoal.upsert({
    where: { month_userId: { month, userId: userId ?? null } },
    update: { target, currency: currency ?? "USD" },
    create: { month, userId: userId ?? null, target, currency: currency ?? "USD" },
  });
  return NextResponse.json(goal);
}
