import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const invoiceId = searchParams.get("invoiceId");
  const orders = await prisma.supplierOrder.findMany({
    where: invoiceId ? { invoiceId } : undefined,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}

export async function POST(req: Request) {
  const body = await req.json();
  const order = await prisma.supplierOrder.create({
    data: {
      invoiceId: body.invoiceId ?? null,
      mayorista: body.mayorista,
      description: body.description,
      amount: parseFloat(body.amount),
      currency: body.currency ?? "USD",
      status: "PENDIENTE",
      notes: body.notes ?? null,
    },
  });
  return NextResponse.json(order);
}
