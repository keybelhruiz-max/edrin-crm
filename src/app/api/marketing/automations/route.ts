import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rules = await prisma.automationRule.findMany({
    include: { logs: { orderBy: { createdAt: "desc" }, take: 5 } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(rules);
}

export async function POST(req: Request) {
  const body = await req.json();
  const rule = await prisma.automationRule.create({
    data: {
      name: body.name,
      active: body.active ?? true,
      platform: body.platform || "ALL",
      trigger: body.trigger || "NEW_LEAD",
      conditions: typeof body.conditions === "string" ? body.conditions : JSON.stringify(body.conditions || {}),
      actions: typeof body.actions === "string" ? body.actions : JSON.stringify(body.actions || []),
    },
  });
  return NextResponse.json(rule);
}
