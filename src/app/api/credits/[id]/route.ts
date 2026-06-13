import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const credit = await prisma.credit.update({
    where: { id },
    data: {
      mayorista: body.mayorista,
      description: body.description,
      amount: body.amount !== undefined ? parseFloat(body.amount) : undefined,
      currency: body.currency,
      status: body.status,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      paidAt: body.paidAt ? new Date(body.paidAt) : body.status === "COBRADO" ? new Date() : undefined,
      notes: body.notes,
      invoiceId: body.invoiceId !== undefined ? body.invoiceId || null : undefined,
    },
    include: { invoice: { select: { number: true, clientName: true } } },
  });
  return NextResponse.json(credit);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.credit.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
