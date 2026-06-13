import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAgencySession, agencyWhere, unauthorizedResponse } from "@/lib/agency";

export async function GET(req: Request) {
  const s = await getAgencySession();
  if (!s) return unauthorizedResponse();
  const { searchParams } = new URL(req.url);
  const invoiceId = searchParams.get("invoiceId");
  const orders = await prisma.supplierOrder.findMany({
    where: {
      ...agencyWhere(s),
      ...(invoiceId ? { invoiceId } : {}),
    },
    include: { invoice: { select: { number: true, clientName: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}

export async function POST(req: Request) {
  const s = await getAgencySession();
  if (!s) return unauthorizedResponse();
  const body = await req.json();
  const order = await prisma.supplierOrder.create({
    data: {
      agencyId: s.agencyId || null,
      invoiceId: body.invoiceId ?? null,
      mayorista: body.mayorista,
      description: body.description,
      amount: parseFloat(body.amount),
      currency: body.currency ?? "USD",
      status: body.status ?? "PENDIENTE",
      notes: body.notes ?? null,
    },
    include: { invoice: { select: { number: true, clientName: true } } },
  });
  return NextResponse.json(order);
}
