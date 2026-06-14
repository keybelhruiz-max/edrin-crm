import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAgencySession, agencyWhere, unauthorizedResponse } from "@/lib/agency";

export async function GET(req: Request) {
  try {
    const s = await getAgencySession();
    if (!s) return unauthorizedResponse();
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const dateFilter = month
      ? {
          date: {
            gte: new Date(`${month}-01`),
            lt: new Date(new Date(`${month}-01`).setMonth(new Date(`${month}-01`).getMonth() + 1)),
          },
        }
      : {};
    const expenses = await prisma.expense.findMany({
      where: { ...agencyWhere(s), ...dateFilter },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(expenses);
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
    if (!body.description?.trim()) {
      return NextResponse.json({ error: "Descripción requerida" }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        agencyId: s.agencyId || null,
        date: body.date ? new Date(body.date) : new Date(),
        category: body.category ?? "OTRO",
        description: body.description.trim(),
        amount,
        currency: body.currency ?? "DOP",
        paymentMethod: body.paymentMethod ?? "EFECTIVO",
        notes: body.notes ?? null,
        userId: body.userId ?? null,
      },
    });
    return NextResponse.json(expense);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[POST /api/expenses]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
