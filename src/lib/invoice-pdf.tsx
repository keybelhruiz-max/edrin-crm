import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";

const ORANGE = "#E8610A";
const GRAY = "#6B7280";
const DARK = "#111827";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: DARK,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 50,
  },
  // Header
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30 },
  logoArea: { width: 160 },
  logoText: { fontSize: 22, color: ORANGE, fontFamily: "Helvetica-Bold", letterSpacing: 1 },
  logoSub: { fontSize: 8, color: GRAY, marginTop: 2 },
  titleArea: { alignItems: "flex-end" },
  titleFACTURA: { fontSize: 28, fontFamily: "Helvetica-Bold", color: DARK, letterSpacing: 2 },
  invoiceNum: { fontSize: 10, color: DARK, marginTop: 2 },
  balanceLabel: { fontSize: 8, color: GRAY, marginTop: 8 },
  balanceAmount: { fontSize: 16, fontFamily: "Helvetica-Bold", color: DARK },
  // Company info
  companyInfo: { marginBottom: 20 },
  companyName: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  companyLine: { fontSize: 8, color: GRAY, lineHeight: 1.5 },
  // Meta row
  metaRow: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 4 },
  metaLabel: { fontSize: 8, color: GRAY, width: 100, textAlign: "right" },
  metaValue: { fontSize: 8, width: 100, textAlign: "right" },
  // Bill to
  billToSection: { marginBottom: 16 },
  billToLabel: { fontSize: 8, color: GRAY },
  billToName: { fontSize: 10, fontFamily: "Helvetica-Bold" },
  // Subject
  subjectLabel: { fontSize: 8, color: GRAY, marginBottom: 2 },
  subjectText: { fontSize: 9 },
  // Table
  table: { marginTop: 16, marginBottom: 12 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: ORANGE,
    color: "#fff",
    padding: "5 8",
    borderRadius: 2,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    padding: "8 8",
  },
  colHash: { width: 24 },
  colDesc: { flex: 1 },
  colQty: { width: 50, textAlign: "right" },
  colRate: { width: 60, textAlign: "right" },
  colAmt: { width: 70, textAlign: "right" },
  // Totals
  totalsArea: { alignItems: "flex-end", marginBottom: 20 },
  totalRow: { flexDirection: "row", marginBottom: 3 },
  totalLabel: { width: 110, textAlign: "right", fontSize: 8, color: GRAY, marginRight: 16 },
  totalValue: { width: 80, textAlign: "right", fontSize: 8 },
  totalLabelBold: { width: 110, textAlign: "right", fontSize: 9, fontFamily: "Helvetica-Bold", marginRight: 16 },
  totalValueBold: { width: 80, textAlign: "right", fontSize: 9, fontFamily: "Helvetica-Bold" },
  totalValueOrange: { width: 80, textAlign: "right", fontSize: 8, color: ORANGE },
  totalValueBalance: { width: 80, textAlign: "right", fontSize: 10, fontFamily: "Helvetica-Bold" },
  // Notes
  notesSection: { marginTop: 16 },
  notesLabel: { fontSize: 9, color: GRAY, marginBottom: 4 },
  notesText: { fontSize: 8, color: DARK },
  // Terms
  termsSection: { marginTop: 16, borderTopWidth: 1, borderTopColor: "#E5E7EB", paddingTop: 10 },
  termsTitle: { fontSize: 9, color: GRAY, marginBottom: 6 },
  termsText: { fontSize: 7, color: GRAY, lineHeight: 1.6 },
  // Page number
  pageNum: { position: "absolute", bottom: 20, right: 50, fontSize: 8, color: GRAY },
  // Divider
  divider: { borderBottomWidth: 1, borderBottomColor: "#E5E7EB", marginBottom: 12 },
});

const DEFAULT_TERMS = `Condiciones de Reserva:
La reserva se garantiza con un depósito de RD$2,000 por persona (NO reembolsable).
El balance restante puede completarse mediante pagos mensuales o quincenales.
Si transcurren 60 días desde la reserva sin recibir pagos, la misma será cancelada automáticamente.
30 días antes de la llegada para viajes internacionales y 14 días antes para reservas nacionales, el pago debe estar completado al 100%.
En reservas realizadas entre 24 y 72 horas antes de la llegada, el pago debe efectuarse de forma inmediata.
Para precios cotizados en dólares, se aplicará la tasa de cambio vigente al momento de cada pago.

Horarios del Hotel:
Check-in: 3:00 p. m.
Check-out: 12:00 p. m.

Políticas de Cancelación y Penalidades:
Las cancelaciones están sujetas a las políticas del hotel o proveedor.
El depósito inicial no es reembolsable.
Se cobrará el 100% del total si la cancelación se realiza 30 días antes de la llegada.
Se cobrará el 100% del costo en caso de No Show.
Los servicios confirmados y comprados NO son reembolsables, cancelables ni modificables.
Las reservas realizadas un día antes y las tarifas no reembolsables no aplican para reembolsos, cancelaciones ni cambios de nombre.

Edrin Travel no se hace responsable por cancelaciones, expulsiones o decisiones tomadas por el hotel debido a conducta inapropiada de los huéspedes.

Cualquier reclamación o compensación relacionada con el servicio durante la estadía queda a disposición del hotel o proveedor correspondiente.

No nos hacemos responsables por faltas o incumplimientos de hoteles u otros proveedores.`;

const fmt = (n: number, cur = "USD") =>
  cur === "USD"
    ? `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `RD$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d: string | Date | null) => {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" });
};

export type InvoicePDFData = {
  number: string;
  date: string;
  dueDate?: string;
  checkOut?: string;
  clientName: string;
  clientRnc?: string;
  subject?: string;
  items: { description: string; qty: number; unitPrice: number; total: number }[];
  currency: "USD" | "DOP";
  subtotal: number;
  customTerms?: string;
  itbis: number;
  total: number;
  amountPaid: number;
  balance: number;
  notes?: string;
  type: "FACTURA" | "PROFORMA" | "RECIBO";
  ncfNumber?: string;
};

export function InvoicePDF({ data }: { data: InvoicePDFData }) {
  const cur = data.currency;

  return (
    <Document>
      {/* PAGE 1 — Invoice */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoArea}>
            <Text style={styles.logoText}>edrín</Text>
            <Text style={styles.logoSub}>Rent & Travel — Agencia De Viajes</Text>
          </View>
          <View style={styles.titleArea}>
            <Text style={styles.titleFACTURA}>{data.type === "FACTURA" ? "FACTURA" : data.type}</Text>
            <Text style={styles.invoiceNum}># {data.number}</Text>
            {data.ncfNumber && <Text style={{ fontSize: 7, color: GRAY }}>NCF: {data.ncfNumber}</Text>}
            <Text style={styles.balanceLabel}>Saldo adeudado</Text>
            <Text style={styles.balanceAmount}>{fmt(data.balance, cur)}</Text>
          </View>
        </View>

        {/* Company info */}
        <View style={styles.companyInfo}>
          <Text style={styles.companyName}>Edrin Rent & Travel SRL</Text>
          <Text style={styles.companyLine}>Calle Presidente Billini esq Mella</Text>
          <Text style={styles.companyLine}>BANI Peravia 94000</Text>
          <Text style={styles.companyLine}>Dominican Republic</Text>
          <Text style={styles.companyLine}>edysis@edrintravel.com</Text>
        </View>

        {/* Meta dates and bill-to — two-column */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
          <View style={styles.billToSection}>
            <Text style={styles.billToLabel}>Facturar a</Text>
            <Text style={styles.billToName}>{data.clientName}</Text>
            {data.clientRnc && <Text style={{ fontSize: 8, color: GRAY }}>RNC/Cédula: {data.clientRnc}</Text>}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Fecha de la factura :</Text>
              <Text style={styles.metaValue}>{fmtDate(data.date)}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Términos :</Text>
              <Text style={styles.metaValue}>Pagadero a la recepción</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Fecha de vencimiento :</Text>
              <Text style={styles.metaValue}>{fmtDate(data.dueDate || data.date)}</Text>
            </View>
            {data.checkOut && (
              <View style={styles.metaRow}>
                <Text style={[styles.metaLabel, { fontFamily: "Helvetica-Bold" }]}>FECHA CHECK OUT :</Text>
                <Text style={styles.metaValue}>{fmtDate(data.checkOut)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Subject */}
        {data.subject && (
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.subjectLabel}>Asunto :</Text>
            <Text style={styles.subjectText}>{data.subject}</Text>
          </View>
        )}

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colHash, { color: "#fff" }]}>#</Text>
            <Text style={[styles.colDesc, { color: "#fff" }]}>Artículo & Descripción</Text>
            <Text style={[styles.colQty, { color: "#fff" }]}>Cant.</Text>
            <Text style={[styles.colRate, { color: "#fff" }]}>Tarifa</Text>
            <Text style={[styles.colAmt, { color: "#fff" }]}>Cantidad</Text>
          </View>
          {data.items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colHash}>{i + 1}</Text>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{item.qty.toFixed(2)}</Text>
              <Text style={styles.colRate}>{item.unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}</Text>
              <Text style={styles.colAmt}>{item.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsArea}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{data.subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</Text>
          </View>
          {data.itbis > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>ITBIS (18%)</Text>
              <Text style={styles.totalValue}>{data.itbis.toLocaleString("en-US", { minimumFractionDigits: 2 })}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabelBold}>Total</Text>
            <Text style={styles.totalValueBold}>{fmt(data.total, cur)}</Text>
          </View>
          {data.amountPaid > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Pago realizado (-)</Text>
              <Text style={styles.totalValueOrange}>{fmt(data.amountPaid, cur)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabelBold}>Saldo adeudado</Text>
            <Text style={styles.totalValueBalance}>{fmt(data.balance, cur)}</Text>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.divider} />
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>Notas</Text>
          <Text style={styles.notesText}>{data.notes || "Gracias por su confianza."}</Text>
        </View>

        {/* Terms title only on page 1 */}
        <View style={styles.termsSection}>
          <Text style={styles.termsTitle}>Términos y condiciones</Text>
        </View>

        <Text style={styles.pageNum} render={({ pageNumber }) => `${pageNumber}`} fixed />
      </Page>

      {/* PAGE 2 — Terms */}
      <Page size="A4" style={styles.page}>
        <View style={styles.termsSection}>
          <Text style={styles.termsText}>{data.customTerms ?? DEFAULT_TERMS}</Text>
        </View>
        <Text style={styles.pageNum} render={({ pageNumber }) => `${pageNumber}`} fixed />
      </Page>
    </Document>
  );
}
