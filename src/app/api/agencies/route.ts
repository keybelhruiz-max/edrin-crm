import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAgencySession, unauthorizedResponse } from "@/lib/agency";

export async function GET() {
  const s = await getAgencySession();
  if (!s) return unauthorizedResponse();
  // Only SUPERADMIN can list all agencies
  if (s.role !== "SUPERADMIN") {
    const agency = await prisma.agency.findUnique({ where: { id: s.agencyId } });
    return NextResponse.json(agency ? [agency] : []);
  }
  const agencies = await prisma.agency.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(agencies);
}

export async function POST(req: Request) {
  const s = await getAgencySession();
  if (!s || s.role !== "SUPERADMIN") return unauthorizedResponse();
  const body = await req.json();
  const agency = await prisma.agency.create({
    data: {
      name: body.name,
      slug: body.slug,
      logoUrl: body.logoUrl ?? null,
      primaryColor: body.primaryColor ?? "#E8610A",
      secondaryColor: body.secondaryColor ?? "#1A1A2E",
      plan: body.plan ?? "STARTER",
      billingName: body.billingName ?? null,
      billingRnc: body.billingRnc ?? null,
      billingAddress: body.billingAddress ?? null,
      billingEmail: body.billingEmail ?? null,
      billingPhone: body.billingPhone ?? null,
      exchangeRateDOP: body.exchangeRateDOP ?? 62,
      mayoristas: body.mayoristas ? JSON.stringify(body.mayoristas) : "[]",
    },
  });
  // Optionally create the first admin user for this agency
  if (body.adminEmail && body.adminPassword && body.adminName) {
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash(body.adminPassword, 10);
    await prisma.user.create({
      data: {
        agencyId: agency.id,
        name: body.adminName,
        email: body.adminEmail,
        passwordHash: hash,
        role: "ADMIN",
      },
    });
  }
  return NextResponse.json(agency, { status: 201 });
}
