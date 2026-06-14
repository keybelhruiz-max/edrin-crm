import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    const body = await req.json();

    const current = await prisma.supplierOrder.findUnique({ where: { id }, select: { status: true, agencyId: true } });
    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const data: Record<string, unknown> = {};
    if (body.status !== undefined) {
      data.status = body.status;
      if (body.status === "PAGADO") data.paidAt = new Date();
    }
    if (body.notes !== undefined) data.notes = body.notes;
    if (body.amount !== undefined) data.amount = parseFloat(body.amount);
    if (body.currency !== undefined) data.currency = body.currency;
    if (body.mayorista !== undefined) data.mayorista = body.mayorista;
    if (body.description !== undefined) data.description = body.description;

    const order = await prisma.supplierOrder.update({
      where: { id },
      data,
      include: { invoice: { select: { number: true, clientName: true } } },
    });

    if (body.status && current?.status !== body.status) {
      await prisma.paymentLog.create({
        data: {
          agencyId: current.agencyId ?? null,
          entityType: "SUPPLIER_ORDER",
          entityId: id,
          action: "STATUS_CHANGED",
          fromValue: current?.status ?? null,
          toValue: body.status,
          userId: (session?.user as { id?: string })?.id ?? null,
        },
      }).catch(() => {});
    }
    return NextResponse.json(order);
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    const ord = await prisma.supplierOrder.findUnique({ where: { id }, select: { agencyId: true } });
    await prisma.supplierOrder.delete({ where: { id } });
    await prisma.paymentLog.create({
      data: {
        agencyId: ord?.agencyId ?? null,
        entityType: "SUPPLIER_ORDER",
        entityId: id,
        action: "DELETED",
        userId: (session?.user as { id?: string })?.id ?? null,
      },
    }).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
