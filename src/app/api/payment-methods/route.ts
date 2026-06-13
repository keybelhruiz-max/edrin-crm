import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAgencySession, agencyWhere, unauthorizedResponse } from "@/lib/agency";

export async function GET() {
  const s = await getAgencySession();
  if (!s) return unauthorizedResponse();
  const methods = await prisma.paymentMethodConfig.findMany({
    where: agencyWhere(s),
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(methods);
}

export async function POST(req: Request) {
  const s = await getAgencySession();
  if (!s) return unauthorizedResponse();
  const body = await req.json();
  const method = await prisma.paymentMethodConfig.create({
    data: {
      agencyId: s.agencyId || null,
      name: body.name,
      type: body.type ?? "TRANSFERENCIA",
      bankName: body.bankName ?? null,
      accountNum: body.accountNum ?? null,
      description: body.description ?? null,
      currency: body.currency ?? "DOP",
      isActive: body.isActive ?? true,
      order: body.order ?? 0,
    },
  });
  return NextResponse.json(method, { status: 201 });
}
