import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const method = await prisma.paymentMethodConfig.update({
    where: { id },
    data: {
      name: body.name,
      type: body.type,
      bankName: body.bankName !== undefined ? body.bankName || null : undefined,
      accountNum: body.accountNum !== undefined ? body.accountNum || null : undefined,
      description: body.description !== undefined ? body.description || null : undefined,
      currency: body.currency,
      isActive: body.isActive,
      order: body.order,
    },
  });
  return NextResponse.json(method);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.paymentMethodConfig.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
