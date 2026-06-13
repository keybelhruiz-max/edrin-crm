import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const invoiceId = searchParams.get("invoiceId");
  const status = searchParams.get("status");

  const credits = await prisma.credit.findMany({
    where: {
      ...(invoiceId ? { invoiceId } : {}),
      ...(status ? { status } : {}),
    },
    include: { invoice: { select: { number: true, clientName: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(credits);
}

export async function POST(req: Request) {
  const body = await req.json();
  const credit = await prisma.credit.create({
    data: {
      invoiceId: body.invoiceId || null,
      mayorista: body.mayorista,
      description: body.description,
      amount: parseFloat(body.amount),
      currency: body.currency || "USD",
      status: body.status || "PENDIENTE",
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      notes: body.notes || null,
    },
    include: { invoice: { select: { number: true, clientName: true } } },
  });
  return NextResponse.json(credit, { status: 201 });
}
