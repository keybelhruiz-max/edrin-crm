import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const body = await req.json();

  const current = await prisma.supplierOrder.findUnique({ where: { id }, select: { status: true } });
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
    include: { invoice: { select: { number: true, clientName: true } } },
  });

  if (body.status && current?.status !== body.status) {
    await prisma.paymentLog.create({
      data: {
        entityType: "SUPPLIER_ORDER",
        entityId: id,
        action: "STATUS_CHANGED",
        fromValue: current?.status ?? null,
        toValue: body.status,
        userId: (session?.user as { id?: string })?.id ?? null,
      },
    });
  }
  return NextResponse.json(order);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  await prisma.supplierOrder.delete({ where: { id } });
  await prisma.paymentLog.create({
    data: {
      entityType: "SUPPLIER_ORDER",
      entityId: id,
      action: "DELETED",
      userId: (session?.user as { id?: string })?.id ?? null,
    },
  });
  return NextResponse.json({ ok: true });
}
