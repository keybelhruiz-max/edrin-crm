import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const order = await prisma.supplierOrder.update({
    where: { id },
    data: {
      status: body.status,
      paidAt: body.status === "PAGADO" ? new Date() : undefined,
      notes: body.notes,
      amount: body.amount !== undefined ? parseFloat(body.amount) : undefined,
      currency: body.currency,
      mayorista: body.mayorista,
      description: body.description,
    },
  });
  return NextResponse.json(order);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.supplierOrder.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
