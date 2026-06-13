import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const opportunityId = searchParams.get("opportunityId");
  const quotes = await prisma.quote.findMany({
    where: opportunityId ? { opportunityId } : undefined,
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(quotes);
}

export async function POST(req: Request) {
  const body = await req.json();
  const count = await prisma.quote.count({
    where: { opportunityId: body.opportunityId },
  });

  const quote = await prisma.quote.create({
    data: {
      opportunityId: body.opportunityId ?? null,
      label: body.label ?? `Cotización ${count + 1}`,
      tipo: body.tipo ?? "PLATAFORMA",
      mayorista: body.mayorista ?? "",
      hotelName: body.hotelName ?? "",
      description: body.description ?? null,
      checkIn: body.checkIn ? new Date(body.checkIn) : null,
      checkOut: body.checkOut ? new Date(body.checkOut) : null,
      nights: body.nights ?? null,
      adults: body.adults ?? 1,
      children: body.children ?? 0,
      costPrice: body.costPrice ?? 0,
      salePrice: body.salePrice ?? 0,
      currency: body.currency ?? "USD",
      exchangeRate: body.exchangeRate ?? 62,
      notes: body.notes ?? null,
    },
  });
  return NextResponse.json(quote);
}
