import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAgencySession, agencyWhere, unauthorizedResponse } from "@/lib/agency";

export async function GET(req: Request) {
  const s = await getAgencySession();
  if (!s) return unauthorizedResponse();
  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));

  const [budgets, invoices, expenses, commissions] = await Promise.all([
    prisma.budgetItem.findMany({
      where: { ...agencyWhere(s), year },
      orderBy: [{ month: "asc" }, { category: "asc" }],
    }),
    prisma.invoice.findMany({
      where: {
        ...agencyWhere(s),
        createdAt: { gte: new Date(`${year}-01-01`), lt: new Date(`${year + 1}-01-01`) },
        status: { in: ["PAGADO", "PARCIAL"] },
      },
      select: { total: true, currency: true, createdAt: true },
    }),
    prisma.expense.findMany({
      where: {
        ...agencyWhere(s),
        date: { gte: new Date(`${year}-01-01`), lt: new Date(`${year + 1}-01-01`) },
      },
      select: { amount: true, currency: true, date: true, category: true },
    }),
    prisma.commissionRate.findMany({
      where: { user: { ...agencyWhere(s) } },
      include: { user: { select: { id: true } } },
    }),
  ]);

  // Build actuals per month
  const actualsByMonth: Record<number, { ventas: number; operacion: number; marketing: number }> = {};
  for (let m = 1; m <= 12; m++) {
    actualsByMonth[m] = { ventas: 0, operacion: 0, marketing: 0 };
  }
  invoices.forEach((inv) => {
    const m = new Date(inv.createdAt).getMonth() + 1;
    actualsByMonth[m].ventas += inv.total;
  });
  expenses.forEach((exp) => {
    const m = new Date(exp.date).getMonth() + 1;
    const cat = exp.category.toLowerCase();
    if (cat === "marketing") actualsByMonth[m].marketing += exp.amount;
    else actualsByMonth[m].operacion += exp.amount;
  });

  return NextResponse.json({ budgets, actuals: actualsByMonth });
}

export async function POST(req: Request) {
  const s = await getAgencySession();
  if (!s) return unauthorizedResponse();
  const body = await req.json();
  const item = await prisma.budgetItem.upsert({
    where: {
      agencyId_year_month_category: {
        agencyId: s.agencyId || "",
        year: body.year,
        month: body.month,
        category: body.category,
      },
    },
    update: { target: parseFloat(body.target), currency: body.currency ?? "DOP", label: body.label },
    create: {
      agencyId: s.agencyId || null,
      year: body.year,
      month: body.month,
      category: body.category,
      target: parseFloat(body.target),
      currency: body.currency ?? "DOP",
      label: body.label ?? null,
    },
  });
  return NextResponse.json(item);
}
