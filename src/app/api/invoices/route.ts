import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function nextInvoiceNumber() {
  const last = await prisma.invoice.findFirst({ orderBy: { createdAt: "desc" } });
  if (!last) return "INV-000001";
  const num = parseInt(last.number.replace("INV-", ""), 10) + 1;
  return `INV-${String(num).padStart(6, "0")}`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const opportunityId = searchParams.get("opportunityId");
  const includeOrders = searchParams.has("include") && searchParams.get("include")?.includes("supplierOrders");
  const invoices = await prisma.invoice.findMany({
    where: opportunityId ? { opportunityId } : undefined,
    include: {
      items: true,
      ...(includeOrders ? { supplierOrders: true } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(invoices);
}

export async function POST(req: Request) {
  const body = await req.json();

  // If quoteId provided, auto-fill from quote
  let salePrice = 0;
  let quoteCurrency: "USD" | "DOP" = "USD";
  let quoteRate = 62;

  if (body.quoteId) {
    const quote = await prisma.quote.findUnique({ where: { id: body.quoteId } });
    if (quote) {
      salePrice = quote.salePrice;
      quoteCurrency = quote.currency as "USD" | "DOP";
      quoteRate = quote.exchangeRate;
    }
  }

  const number = await nextInvoiceNumber();
  const subtotal = body.subtotal ?? salePrice;
  const itbis = body.itbis ?? 0;
  const total = body.total ?? subtotal + itbis;
  const currency = (body.currency ?? quoteCurrency) as "USD" | "DOP";

  const invoice = await prisma.invoice.create({
    data: {
      number,
      type: body.type ?? "PROFORMA",
      ncfNumber: body.ncfNumber ?? null,
      ncfType: body.ncfType ?? null,
      opportunityId: body.opportunityId ?? null,
      clientName: body.clientName ?? "",
      clientRnc: body.clientRnc ?? null,
      clientEmail: body.clientEmail ?? null,
      clientPhone: body.clientPhone ?? null,
      currency,
      exchangeRate: body.exchangeRate ?? quoteRate,
      subtotal,
      itbis,
      total,
      status: "PENDIENTE",
      notes: body.notes ?? null,
      agentId: body.agentId ?? null,
      items: {
        create: ((body.items ?? []) as Array<{
          description: string;
          quantity?: number;
          unitPrice: number;
          total: number;
        }>).map((item) => ({
          description: item.description,
          quantity: item.quantity ?? 1,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
      },
    },
    include: { items: true },
  });

  return NextResponse.json(invoice);
}
