import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const expense = await prisma.expense.update({
    where: { id },
    data: {
      category: body.category,
      description: body.description,
      amount: body.amount !== undefined ? parseFloat(body.amount) : undefined,
      currency: body.currency,
      paymentMethod: body.paymentMethod,
      notes: body.notes,
      date: body.date ? new Date(body.date) : undefined,
    },
  });
  return NextResponse.json(expense);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.expense.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
