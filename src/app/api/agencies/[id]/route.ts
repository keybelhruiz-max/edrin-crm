import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAgencySession, unauthorizedResponse } from "@/lib/agency";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getAgencySession();
  if (!s) return unauthorizedResponse();
  // Users can only see their own agency; SUPERADMIN can see any
  if (s.role !== "SUPERADMIN" && s.agencyId !== id) return unauthorizedResponse();
  const agency = await prisma.agency.findUnique({ where: { id } });
  if (!agency) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(agency);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getAgencySession();
  if (!s) return unauthorizedResponse();
  // Only SUPERADMIN or ADMIN of this agency can edit
  if (s.role !== "SUPERADMIN" && (s.agencyId !== id || s.role !== "ADMIN")) {
    return unauthorizedResponse();
  }
  const body = await req.json();
  const agency = await prisma.agency.update({
    where: { id },
    data: {
      name: body.name,
      logoUrl: body.logoUrl,
      primaryColor: body.primaryColor,
      secondaryColor: body.secondaryColor,
      plan: body.plan,
      isActive: body.isActive,
      billingName: body.billingName,
      billingRnc: body.billingRnc,
      billingAddress: body.billingAddress,
      billingEmail: body.billingEmail,
      billingPhone: body.billingPhone,
      exchangeRateDOP: body.exchangeRateDOP,
      exchangeRateUSD: body.exchangeRateUSD,
      mayoristas: body.mayoristas !== undefined ? JSON.stringify(body.mayoristas) : undefined,
    },
  });
  return NextResponse.json(agency);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getAgencySession();
  if (!s || s.role !== "SUPERADMIN") return unauthorizedResponse();
  await prisma.agency.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
