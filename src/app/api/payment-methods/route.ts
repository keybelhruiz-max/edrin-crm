import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const methods = await prisma.paymentMethodConfig.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(methods);
}

export async function POST(req: Request) {
  const body = await req.json();
  const method = await prisma.paymentMethodConfig.create({
    data: {
      name: body.name,
      type: body.type ?? "TRANSFERENCIA",
      bankName: body.bankName ?? null,
      accountNum: body.accountNum ?? null,
      description: body.description ?? null,
      currency: body.currency ?? "DOP",
      isActive: body.isActive ?? true,
      order: body.order ?? 0,
    },
  });
  return NextResponse.json(method, { status: 201 });
}
