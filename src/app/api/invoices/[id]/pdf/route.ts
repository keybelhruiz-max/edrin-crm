import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { InvoicePDF } from "@/lib/invoice-pdf";
import React from "react";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      items: true,
      opportunity: {
        include: { contact: true },
      },
    },
  });

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Load custom terms from config
  const [termsCfg, notesCfg] = await Promise.all([
    prisma.appConfig.findUnique({ where: { key: "invoice_terms" } }),
    prisma.appConfig.findUnique({ where: { key: "invoice_notes" } }),
  ]);

  const opp = invoice.opportunity as { checkOut?: Date | null; contact?: { name?: string }; destination?: string } | null;

  const data = {
    number: invoice.number,
    date: invoice.createdAt.toISOString(),
    dueDate: invoice.createdAt.toISOString(),
    checkOut: opp?.checkOut?.toISOString() ?? undefined,
    clientName: invoice.clientName,
    clientRnc: invoice.clientRnc ?? undefined,
    subject: opp
      ? [opp.contact?.name, (opp as { destination?: string }).destination].filter(Boolean).join(" — ")
      : undefined,
    items: invoice.items.map((item) => ({
      description: item.description,
      qty: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
    })),
    currency: invoice.currency as "USD" | "DOP",
    subtotal: invoice.subtotal,
    itbis: invoice.itbis,
    total: invoice.total,
    amountPaid: invoice.status === "PAGADO" ? invoice.total : 0,
    balance: invoice.status === "PAGADO" ? 0 : invoice.total,
    notes: notesCfg?.value ?? invoice.notes ?? "Gracias por su confianza.",
    customTerms: termsCfg?.value ?? undefined,
    type: invoice.type as "FACTURA" | "PROFORMA" | "RECIBO",
    ncfNumber: invoice.ncfNumber ?? undefined,
  };

  const element = React.createElement(InvoicePDF, { data });
  const buffer = await renderToBuffer(element as Parameters<typeof renderToBuffer>[0]);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.number}.pdf"`,
    },
  });
}
