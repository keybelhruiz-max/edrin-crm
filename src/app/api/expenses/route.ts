import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAgencySession, agencyWhere, unauthorizedResponse } from "@/lib/agency";

export async function GET(req: Request) {
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
}

export async function POST(req: Request) {
  const s = await getAgencySession();
  if (!s) return unauthorizedResponse();
  const body = await req.json();
  const expense = await prisma.expense.create({
    data: {
      agencyId: s.agencyId || null,
      date: body.date ? new Date(body.date) : new Date(),
      category: body.category,
      description: body.description,
      amount: parseFloat(body.amount),
      currency: body.currency ?? "DOP",
      paymentMethod: body.paymentMethod ?? "EFECTIVO",
      notes: body.notes ?? null,
      userId: body.userId ?? null,
    },
  });
  return NextResponse.json(expense);
}
