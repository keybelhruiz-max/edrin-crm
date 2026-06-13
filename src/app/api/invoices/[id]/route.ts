import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({ where: { id }, include: { items: true } });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(invoice);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const body = await req.json();

  const current = await prisma.invoice.findUnique({ where: { id }, select: { status: true } });
  const invoice = await prisma.invoice.update({
    where: { id },
    data: {
      status: body.status,
      paidAt: body.status === "PAGADO" ? new Date() : undefined,
      notes: body.notes,
    },
    include: { items: true },
  });

  if (body.status && current?.status !== body.status) {
    await prisma.paymentLog.create({
      data: {
        entityType: "INVOICE",
        entityId: id,
        action: "STATUS_CHANGED",
        fromValue: current?.status ?? null,
        toValue: body.status,
        userId: (session?.user as { id?: string })?.id ?? null,
      },
    });
  }
  return NextResponse.json(invoice);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  await prisma.invoice.delete({ where: { id } });
  await prisma.paymentLog.create({
    data: {
      entityType: "INVOICE",
      entityId: id,
      action: "DELETED",
      userId: (session?.user as { id?: string })?.id ?? null,
    },
  });
  return NextResponse.json({ ok: true });
}
