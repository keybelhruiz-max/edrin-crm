import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAgencySession, agencyWhere, unauthorizedResponse } from "@/lib/agency";

export async function GET(req: Request) {
  try {
    const s = await getAgencySession();
    if (!s) return unauthorizedResponse();
    const { searchParams } = new URL(req.url);
    const invoiceId = searchParams.get("invoiceId");
    const status = searchParams.get("status");
    const credits = await prisma.credit.findMany({
      where: {
        ...agencyWhere(s),
        ...(invoiceId ? { invoiceId } : {}),
        ...(status ? { status } : {}),
      },
      include: { invoice: { select: { number: true, clientName: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(credits);
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const s = await getAgencySession();
    if (!s) return unauthorizedResponse();
    const body = await req.json();

    const amount = parseFloat(body.amount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "Monto inválido" }, { status: 400 });
    }

    const credit = await prisma.credit.create({
      data: {
        agencyId: s.agencyId || null,
        invoiceId: body.invoiceId || null,
        mayorista: body.mayorista,
        description: body.description,
        amount,
        currency: body.currency || "USD",
        status: body.status || "PENDIENTE",
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        notes: body.notes || null,
      },
      include: { invoice: { select: { number: true, clientName: true } } },
    });
    return NextResponse.json(credit, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[POST /api/credits]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
