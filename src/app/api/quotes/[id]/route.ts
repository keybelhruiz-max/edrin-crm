import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.label !== undefined) data.label = body.label;
  if (body.tipo !== undefined) data.tipo = body.tipo;
  if (body.mayorista !== undefined) data.mayorista = body.mayorista;
  if (body.hotelName !== undefined) data.hotelName = body.hotelName;
  if (body.description !== undefined) data.description = body.description;
  if (body.checkIn !== undefined) data.checkIn = body.checkIn ? new Date(body.checkIn) : null;
  if (body.checkOut !== undefined) data.checkOut = body.checkOut ? new Date(body.checkOut) : null;
  if (body.nights !== undefined) data.nights = body.nights;
  if (body.adults !== undefined) data.adults = body.adults;
  if (body.children !== undefined) data.children = body.children;
  if (body.costPrice !== undefined) data.costPrice = body.costPrice;
  if (body.salePrice !== undefined) data.salePrice = body.salePrice;
  if (body.currency !== undefined) data.currency = body.currency;
  if (body.exchangeRate !== undefined) data.exchangeRate = body.exchangeRate;
  if (body.isSelected !== undefined) data.isSelected = body.isSelected;
  if (body.notes !== undefined) data.notes = body.notes;

  const quote = await prisma.quote.update({ where: { id }, data });
  return NextResponse.json(quote);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.quote.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
