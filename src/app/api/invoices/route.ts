import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAgencySession, agencyWhere, unauthorizedResponse } from "@/lib/agency";

async function nextInvoiceNumber(agencyId: string | null) {
  // Only look at INV-XXXXXX formatted numbers to avoid NaN from custom numbers like EDR-XXXX
  const last = await prisma.invoice.findFirst({
    where: {
      ...(agencyId ? { agencyId } : {}),
      number: { startsWith: "INV-" },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!last) return "INV-000001";
  const num = parseInt(last.number.slice(4), 10);
  if (isNaN(num)) return "INV-000001";
  return `INV-${String(num + 1).padStart(6, "0")}`;
}

export async function GET(req: Request) {
  try {
    const s = await getAgencySession();
    if (!s) return unauthorizedResponse();
    const { searchParams } = new URL(req.url);
    const opportunityId = searchParams.get("opportunityId");
    const includeOrders = searchParams.has("include") && searchParams.get("include")?.includes("supplierOrders");
    const invoices = await prisma.invoice.findMany({
      where: {
        ...agencyWhere(s),
        ...(opportunityId ? { opportunityId } : {}),
      },
      include: {
        items: true,
        ...(includeOrders ? { supplierOrders: true } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(invoices);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const s = await getAgencySession();
    if (!s) return unauthorizedResponse();
    const body = await req.json();

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

    const number = await nextInvoiceNumber(s.agencyId || null);
    const subtotal = body.subtotal ?? salePrice;
    const itbis = body.itbis ?? 0;
    const total = body.total ?? subtotal + itbis;
    const currency = (body.currency ?? quoteCurrency) as "USD" | "DOP";

    const invoice = await prisma.invoice.create({
      data: {
        agencyId: s.agencyId || null,
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
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[POST /api/invoices]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
