import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAgencySession, agencyWhere, unauthorizedResponse } from "@/lib/agency";

export async function GET() {
  const s = await getAgencySession();
  if (!s) return unauthorizedResponse();
  const flows = await prisma.workflowDef.findMany({
    where: agencyWhere(s),
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(flows);
}

export async function POST(req: Request) {
  const s = await getAgencySession();
  if (!s) return unauthorizedResponse();
  const body = await req.json();
  const flow = await prisma.workflowDef.create({
    data: {
      agencyId: s.agencyId || null,
      name: body.name,
      description: body.description ?? null,
      trigger: body.trigger ?? "LEAD_CREATED",
      nodes: JSON.stringify(body.nodes ?? []),
      edges: JSON.stringify(body.edges ?? []),
      isActive: body.isActive ?? false,
    },
  });
  return NextResponse.json(flow, { status: 201 });
}
