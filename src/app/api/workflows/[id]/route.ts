import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAgencySession, agencyWhere, unauthorizedResponse } from "@/lib/agency";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getAgencySession();
  if (!s) return unauthorizedResponse();
  const body = await req.json();
  const flow = await prisma.workflowDef.updateMany({
    where: { id, ...agencyWhere(s) },
    data: {
      name: body.name,
      description: body.description,
      trigger: body.trigger,
      nodes: body.nodes !== undefined ? JSON.stringify(body.nodes) : undefined,
      edges: body.edges !== undefined ? JSON.stringify(body.edges) : undefined,
      isActive: body.isActive,
    },
  });
  return NextResponse.json(flow);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getAgencySession();
  if (!s) return unauthorizedResponse();
  await prisma.workflowDef.deleteMany({ where: { id, ...agencyWhere(s) } });
  return NextResponse.json({ ok: true });
}
