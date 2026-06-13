import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // "2026-06"
  const where = month
    ? {
        date: {
          gte: new Date(`${month}-01`),
          lt: new Date(new Date(`${month}-01`).setMonth(new Date(`${month}-01`).getMonth() + 1)),
        },
      }
    : undefined;
  const expenses = await prisma.expense.findMany({ where, orderBy: { date: "desc" } });
  return NextResponse.json(expenses);
}

export async function POST(req: Request) {
  const body = await req.json();
  const expense = await prisma.expense.create({
    data: {
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
