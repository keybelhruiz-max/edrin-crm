import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAgencySession, agencyWhere } from "@/lib/agency";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const s = await getAgencySession();
    const invoice = await prisma.invoice.findFirst({
      where: { id, ...(s ? agencyWhere(s) : {}) },
      include: { items: true, supplierOrders: true },
    });
    if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(invoice);
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    const s = await getAgencySession();
    const body = await req.json();

    const current = await prisma.invoice.findUnique({ where: { id }, select: { status: true, agencyId: true } });
    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updateData: Record<string, unknown> = {};
    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === "PAGADO") updateData.paidAt = new Date();
    }
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.clientName !== undefined) updateData.clientName = body.clientName;
    if (body.clientEmail !== undefined) updateData.clientEmail = body.clientEmail;
    if (body.clientPhone !== undefined) updateData.clientPhone = body.clientPhone;
    if (body.ncfNumber !== undefined) updateData.ncfNumber = body.ncfNumber;
    if (body.type !== undefined) updateData.type = body.type;

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: { items: true },
    });

    if (body.status && current?.status !== body.status) {
      await prisma.paymentLog.create({
        data: {
          agencyId: current.agencyId ?? s?.agencyId ?? null,
          entityType: "INVOICE",
          entityId: id,
          action: "STATUS_CHANGED",
          fromValue: current?.status ?? null,
          toValue: body.status,
          userId: (session?.user as { id?: string })?.id ?? null,
        },
      }).catch(() => {});
    }
    return NextResponse.json(invoice);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[PATCH /api/invoices/id]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    const inv = await prisma.invoice.findUnique({ where: { id }, select: { agencyId: true } });
    await prisma.invoice.delete({ where: { id } });
    await prisma.paymentLog.create({
      data: {
        agencyId: inv?.agencyId ?? null,
        entityType: "INVOICE",
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
