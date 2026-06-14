import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.mayorista !== undefined) data.mayorista = body.mayorista;
    if (body.description !== undefined) data.description = body.description;
    if (body.amount !== undefined) data.amount = parseFloat(body.amount);
    if (body.currency !== undefined) data.currency = body.currency;
    if (body.status !== undefined) {
      data.status = body.status;
      if (body.status === "COBRADO") data.paidAt = new Date();
    }
    if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.notes !== undefined) data.notes = body.notes;
    if (body.invoiceId !== undefined) data.invoiceId = body.invoiceId || null;

    const credit = await prisma.credit.update({
      where: { id },
      data,
      include: { invoice: { select: { number: true, clientName: true } } },
    });
    return NextResponse.json(credit);
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.credit.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
