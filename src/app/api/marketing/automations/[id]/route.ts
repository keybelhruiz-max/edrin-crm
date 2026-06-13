import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.active !== undefined) data.active = body.active;
  if (body.platform !== undefined) data.platform = body.platform;
  if (body.trigger !== undefined) data.trigger = body.trigger;
  if (body.conditions !== undefined) data.conditions = JSON.stringify(body.conditions);
  if (body.actions !== undefined) data.actions = JSON.stringify(body.actions);
  const rule = await prisma.automationRule.update({ where: { id }, data });
  return NextResponse.json(rule);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.automationRule.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
