"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui";

type PaymentStatus = "PENDIENTE" | "PAGADO" | "PARCIAL" | "CANCELADO";
type InvoiceType = "NCF" | "PROFORMA" | "RECIBO";
type Currency = "USD" | "DOP";
type Tab = "cliente" | "proveedor" | "gastos" | "creditos";

interface PayLog {
  id: string; entityType: string; entityId: string; action: string;
  fromValue: string | null; toValue: string | null; notes: string | null;
  user: { id: string; name: string } | null;
  createdAt: string;
}
type Category = "NOMINA" | "OFICINA" | "MARKETING" | "SOFTWARE" | "VIAJES" | "PROVEEDOR" | "IMPUESTO" | "OTRO";
type PaymentMethod = "EFECTIVO" | "TRANSFERENCIA" | "TARJETA" | "CHEQUE";
type CreditStatus = "PENDIENTE" | "COBRADO" | "CANCELADO";

interface Expense {
  id: string; date: string; category: Category; description: string;
  amount: number; currency: Currency; paymentMethod: PaymentMethod;
  notes: string | null; createdAt: string;
}

interface Credit {
  id: string; invoiceId: string | null; mayorista: string; description: string;
  amount: number; currency: Currency; status: CreditStatus;
  dueDate: string | null; paidAt: string | null; notes: string | null; createdAt: string;
  invoice?: { number: string; clientName: string } | null;
}

const CAT_CONFIG: Record<Category, { label: string; color: string; bg: string; icon: string }> = {
  NOMINA:    { label: "Nómina",     color: "#7C3AED", bg: "#F5F3FF", icon: "👥" },
  OFICINA:   { label: "Oficina",    color: "#0891B2", bg: "#ECFEFF", icon: "🏢" },
  MARKETING: { label: "Marketing",  color: "#DB2777", bg: "#FDF2F8", icon: "📣" },
  SOFTWARE:  { label: "Software",   color: "#2563EB", bg: "#EFF6FF", icon: "💻" },
  VIAJES:    { label: "Viajes",     color: "#059669", bg: "#ECFDF5", icon: "✈️" },
  PROVEEDOR: { label: "Proveedor",  color: "#D97706", bg: "#FFFBEB", icon: "📦" },
  IMPUESTO:  { label: "Impuestos",  color: "#DC2626", bg: "#FEF2F2", icon: "🏛️" },
  OTRO:      { label: "Otro",       color: "#6B7280", bg: "#F9FAFB", icon: "📋" },
};

interface InvoiceItem { id: string; description: string; quantity: number; unitPrice: number; total: number; }
interface Invoice {
  id: string; number: string; type: InvoiceType; clientName: string;
  clientEmail: string | null; clientPhone: string | null;
  currency: Currency; subtotal: number; itbis: number; total: number;
  status: PaymentStatus; notes: string | null; createdAt: string;
  items: InvoiceItem[];
  supplierOrders: SupplierOrder[];
}
interface SupplierOrder {
  id: string; mayorista: string; description: string;
  amount: number; currency: Currency; status: PaymentStatus;
  notes: string | null; createdAt: string; invoiceId: string | null;
  invoice?: { number: string; clientName: string } | null;
}

const ST: Record<PaymentStatus, { label: string; color: string; bg: string }> = {
  PENDIENTE: { label: "Pendiente", color: "#D97706", bg: "#FFFBEB" },
  PAGADO:    { label: "Pagado",    color: "#059669", bg: "#ECFDF5" },
  PARCIAL:   { label: "Parcial",   color: "#2563EB", bg: "#EFF6FF" },
  CANCELADO: { label: "Cancelado", color: "#DC2626", bg: "#FEF2F2" },
};
const CS: Record<CreditStatus, { label: string; color: string; bg: string }> = {
  PENDIENTE: { label: "Pendiente", color: "#D97706", bg: "#FFFBEB" },
  COBRADO:   { label: "Cobrado",   color: "#059669", bg: "#ECFDF5" },
  CANCELADO: { label: "Cancelado", color: "#DC2626", bg: "#FEF2F2" },
};
const TYPE_LABELS: Record<InvoiceType, string> = { NCF: "NCF", PROFORMA: "Proforma", RECIBO: "Recibo" };

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat("es-DO", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  const s = ST[status];
  return <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ color: s.color, background: s.bg }}>{s.label}</span>;
}

// ── Client invoices tab ───────────────────────────────────────────────────────
function ClienteTab() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | PaymentStatus>("ALL");
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [payHistory, setPayHistory] = useState<PayLog[]>([]);
  const [form, setForm] = useState({
    clientName: "", clientEmail: "", clientPhone: "",
    type: "PROFORMA" as InvoiceType, currency: "DOP" as Currency,
    subtotal: "", itbis: "", notes: "",
  });

  async function load() {
    setLoading(true);
    const r = await fetch("/api/invoices?include=supplierOrders");
    if (r.ok) setInvoices(await r.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const filtered = filter === "ALL" ? invoices : invoices.filter(i => i.status === filter);
  const totalBilled = invoices.reduce((s, i) => s + i.total, 0);
  const totalPaid   = invoices.filter(i => i.status === "PAGADO").reduce((s, i) => s + i.total, 0);
  const totalPend   = invoices.filter(i => i.status === "PENDIENTE").reduce((s, i) => s + i.total, 0);

  function getProfit(inv: Invoice): { amount: number; currency: Currency } | null {
    const orders = inv.supplierOrders ?? [];
    if (orders.length === 0) return null;
    // Only same-currency orders for a clean calculation
    const sameCurrency = orders.filter(o => o.currency === inv.currency);
    if (sameCurrency.length === 0) return null;
    const cost = sameCurrency.reduce((s, o) => s + o.amount, 0);
    return { amount: inv.total - cost, currency: inv.currency };
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const subtotal = parseFloat(form.subtotal) || 0;
    const itbis    = parseFloat(form.itbis) || 0;
    await fetch("/api/invoices", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, subtotal, itbis, total: subtotal + itbis }),
    });
    setShowModal(false);
    setForm({ clientName: "", clientEmail: "", clientPhone: "", type: "PROFORMA", currency: "DOP", subtotal: "", itbis: "", notes: "" });
    load();
  }

  async function updateStatus(id: string, status: PaymentStatus) {
    await fetch(`/api/invoices/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    load();
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
  }

  return (
    <>
      {/* Stats */}
      <div className="px-6 pt-4 pb-3 grid grid-cols-3 gap-3">
        {[
          { label: "Total facturado", value: fmt(totalBilled, "DOP"), color: "#6366F1" },
          { label: "Cobrado",         value: fmt(totalPaid,   "DOP"), color: "#10B981" },
          { label: "Pendiente",       value: fmt(totalPend,   "DOP"), color: "#F59E0B" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 border stat-card" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>{s.label}</div>
            <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter + action */}
      <div className="px-6 pb-3 flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {(["ALL", "PENDIENTE", "PAGADO", "PARCIAL", "CANCELADO"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium border transition"
              style={{ background: filter === f ? "#E8610A" : "var(--surface)", color: filter === f ? "#fff" : "var(--text-muted)", borderColor: filter === f ? "#E8610A" : "var(--border)" }}>
              {f === "ALL" ? "Todas" : ST[f].label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: "#E8610A" }}>
          + Nueva factura
        </button>
      </div>

      {/* Table */}
      <div className="px-6 pb-6 flex-1 overflow-auto">
        {loading ? (
          <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🧾</div>
            <p className="font-medium" style={{ color: "var(--text)" }}>No hay facturas</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Crea la primera con el botón de arriba</p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
              <table className="w-full">
                <thead>
                  <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                    {["#", "Cliente", "Tipo", "Moneda", "Total cliente", "Costo prov.", "Ganancia", "Estado", ""].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inv, i) => {
                    const profit = getProfit(inv);
                    const costOrders = (inv.supplierOrders ?? []).filter(o => o.currency === inv.currency);
                    const cost = costOrders.reduce((s, o) => s + o.amount, 0);
                    return (
                      <tr key={inv.id} onClick={async () => { setSelected(inv); const r = await fetch(`/api/payment-logs?entityId=${inv.id}&entityType=INVOICE`); if (r.ok) setPayHistory(await r.json()); }}
                        className="border-t cursor-pointer hover:bg-orange-50/30 transition"
                        style={{ borderColor: "var(--border)", background: i % 2 === 0 ? "var(--surface)" : "var(--surface-2)" }}>
                        <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--text-muted)" }}>{inv.number}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-sm" style={{ color: "var(--text)" }}>{inv.clientName}</div>
                          {inv.clientEmail && <div className="text-xs" style={{ color: "var(--text-muted)" }}>{inv.clientEmail}</div>}
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>{TYPE_LABELS[inv.type]}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-lg text-xs font-semibold"
                            style={{ background: inv.currency === "USD" ? "#EFF6FF" : "#F0FDF4", color: inv.currency === "USD" ? "#1D4ED8" : "#166534" }}>
                            {inv.currency}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-sm" style={{ color: "var(--text)" }}>{fmt(inv.total, inv.currency)}</td>
                        <td className="px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
                          {cost > 0 ? fmt(cost, inv.currency) : <span style={{ color: "var(--border)" }}>—</span>}
                        </td>
                        <td className="px-4 py-3">
                          {profit !== null ? (
                            <span className="px-2 py-0.5 rounded-lg text-xs font-bold"
                              style={{ background: profit.amount >= 0 ? "#ECFDF5" : "#FEF2F2", color: profit.amount >= 0 ? "#059669" : "#DC2626" }}>
                              {profit.amount >= 0 ? "+" : ""}{fmt(profit.amount, profit.currency)}
                            </span>
                          ) : <span style={{ color: "var(--border)" }}>—</span>}
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <select value={inv.status} onChange={e => updateStatus(inv.id, e.target.value as PaymentStatus)}
                            className="text-xs px-2 py-1 rounded-lg border"
                            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}>
                            <option value="PENDIENTE">Pendiente</option>
                            <option value="PAGADO">Pagado</option>
                            <option value="PARCIAL">Parcial</option>
                            <option value="CANCELADO">Cancelado</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-2">
              {filtered.map(inv => {
                const profit = getProfit(inv);
                return (
                  <div key={inv.id} onClick={() => setSelected(inv)}
                    className="rounded-2xl border p-4 cursor-pointer" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-sm" style={{ color: "var(--text)" }}>{inv.clientName}</div>
                        <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{inv.number} · {TYPE_LABELS[inv.type]}</div>
                      </div>
                      <StatusBadge status={inv.status} />
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <div className="font-bold" style={{ color: "var(--text)" }}>{fmt(inv.total, inv.currency)}</div>
                      {profit && (
                        <span className="px-2 py-0.5 rounded-lg text-xs font-bold"
                          style={{ background: profit.amount >= 0 ? "#ECFDF5" : "#FEF2F2", color: profit.amount >= 0 ? "#059669" : "#DC2626" }}>
                          {profit.amount >= 0 ? "+" : ""}{fmt(profit.amount, profit.currency)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* New invoice modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-lg rounded-3xl p-6 overflow-y-auto max-h-[90vh]" style={{ background: "var(--surface)", boxShadow: "var(--shadow-lg)" }}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-lg" style={{ color: "var(--text)" }}>Nueva factura — Cliente</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--bg)", color: "var(--text-muted)" }}>✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Cliente *</label>
                <input required value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                  className="w-full border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)", borderRadius: "10px" }} placeholder="Nombre del cliente" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Email</label>
                  <input value={form.clientEmail} onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))} type="email"
                    className="w-full border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)", borderRadius: "10px" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Teléfono</label>
                  <input value={form.clientPhone} onChange={e => setForm(f => ({ ...f, clientPhone: e.target.value }))}
                    className="w-full border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)", borderRadius: "10px" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Tipo</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as InvoiceType }))}
                    className="w-full border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)", borderRadius: "10px" }}>
                    <option value="PROFORMA">Proforma</option>
                    <option value="NCF">NCF</option>
                    <option value="RECIBO">Recibo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Moneda del cliente</label>
                  <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value as Currency }))}
                    className="w-full border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)", borderRadius: "10px" }}>
                    <option value="DOP">🇩🇴 DOP — Pesos</option>
                    <option value="USD">🇺🇸 USD — Dólares</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Subtotal ({form.currency}) *</label>
                  <input required value={form.subtotal} onChange={e => setForm(f => ({ ...f, subtotal: e.target.value }))}
                    type="number" step="0.01" className="w-full border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)", borderRadius: "10px" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>ITBIS 18%</label>
                  <input value={form.itbis} onChange={e => setForm(f => ({ ...f, itbis: e.target.value }))}
                    type="number" step="0.01" className="w-full border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)", borderRadius: "10px" }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Notas</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} className="w-full border px-3 py-2 text-sm resize-none" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)", borderRadius: "10px" }} />
              </div>
              <div className="rounded-2xl p-3 flex justify-between items-center" style={{ background: "var(--brand-light)" }}>
                <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Total a cobrar al cliente</span>
                <span className="text-xl font-bold" style={{ color: "#E8610A" }}>
                  {fmt((parseFloat(form.subtotal) || 0) + (parseFloat(form.itbis) || 0), form.currency)}
                </span>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-medium border"
                  style={{ borderColor: "var(--border)", color: "var(--text)" }}>Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 rounded-2xl text-sm font-semibold text-white" style={{ background: "#E8610A" }}>
                  Crear factura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-lg rounded-3xl p-6 overflow-y-auto max-h-[90vh]" style={{ background: "var(--surface)", boxShadow: "var(--shadow-lg)" }}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="font-bold text-lg" style={{ color: "var(--text)" }}>{selected.number}</div>
                <div className="text-sm flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
                  {TYPE_LABELS[selected.type]}
                  <span className="px-2 py-0.5 rounded-lg text-xs font-semibold"
                    style={{ background: selected.currency === "USD" ? "#EFF6FF" : "#F0FDF4", color: selected.currency === "USD" ? "#1D4ED8" : "#166534" }}>
                    {selected.currency}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--bg)", color: "var(--text-muted)" }}>✕</button>
            </div>
            <div className="space-y-3">
              <div className="rounded-2xl p-4 border" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
                <div className="font-semibold text-sm mb-1" style={{ color: "var(--text)" }}>Cliente</div>
                <div style={{ color: "var(--text)" }}>{selected.clientName}</div>
                {selected.clientEmail && <div className="text-sm" style={{ color: "var(--text-muted)" }}>{selected.clientEmail}</div>}
              </div>
              <div className="rounded-2xl p-4 border space-y-2" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--text-muted)" }}>Subtotal</span>
                  <span style={{ color: "var(--text)" }}>{fmt(selected.subtotal, selected.currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--text-muted)" }}>ITBIS</span>
                  <span style={{ color: "var(--text)" }}>{fmt(selected.itbis, selected.currency)}</span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t" style={{ borderColor: "var(--border)" }}>
                  <span style={{ color: "var(--text)" }}>Total facturado</span>
                  <span style={{ color: "#E8610A" }}>{fmt(selected.total, selected.currency)}</span>
                </div>
                {(selected.supplierOrders ?? []).length > 0 && (() => {
                  const cost = (selected.supplierOrders ?? []).filter(o => o.currency === selected.currency).reduce((s, o) => s + o.amount, 0);
                  const profit = selected.total - cost;
                  return cost > 0 ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: "var(--text-muted)" }}>Costo proveedores</span>
                        <span style={{ color: "#6366F1" }}>-{fmt(cost, selected.currency)}</span>
                      </div>
                      <div className="flex justify-between font-bold pt-1 border-t" style={{ borderColor: "var(--border)" }}>
                        <span style={{ color: "var(--text)" }}>Ganancia neta</span>
                        <span style={{ color: profit >= 0 ? "#059669" : "#DC2626", fontWeight: 800 }}>
                          {profit >= 0 ? "+" : ""}{fmt(profit, selected.currency)}
                        </span>
                      </div>
                    </>
                  ) : null;
                })()}
              </div>
              {(selected.supplierOrders ?? []).length > 0 && (
                <div className="rounded-2xl p-3 border" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
                  <div className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>Pagos a proveedores vinculados</div>
                  {(selected.supplierOrders ?? []).map(o => (
                    <div key={o.id} className="flex justify-between items-center py-1">
                      <span className="text-sm" style={{ color: "var(--text)" }}>{o.mayorista}</span>
                      <span className="text-sm font-semibold" style={{ color: "#6366F1" }}>{fmt(o.amount, o.currency)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-4 gap-2">
                {(["PENDIENTE", "PAGADO", "PARCIAL", "CANCELADO"] as PaymentStatus[]).map(st => (
                  <button key={st} onClick={() => { updateStatus(selected.id, st); setSelected(null); }}
                    className="py-2 rounded-xl text-xs font-medium border transition"
                    style={{ background: selected.status === st ? "#E8610A" : "var(--bg)", color: selected.status === st ? "#fff" : "var(--text-muted)", borderColor: selected.status === st ? "#E8610A" : "var(--border)" }}>
                    {ST[st].label}
                  </button>
                ))}
              </div>
              {/* Payment history */}
              {payHistory.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>📋 Historial de cambios</div>
                  <div className="space-y-1">
                    {payHistory.map(log => (
                      <div key={log.id} className="flex items-center justify-between text-xs px-3 py-1.5 rounded-xl" style={{ background: "var(--bg)" }}>
                        <div className="flex items-center gap-2">
                          <span style={{ color: "var(--text-muted)" }}>
                            {log.fromValue && log.toValue ? `${log.fromValue} → ${log.toValue}` : log.action}
                          </span>
                          {log.user && <span className="font-semibold px-1.5 py-0.5 rounded-lg" style={{ background: "#FFF4EE", color: "#E8610A" }}>{log.user.name}</span>}
                        </div>
                        <span style={{ color: "var(--text-subtle)" }}>{new Date(log.createdAt).toLocaleString("es-DO", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Supplier orders tab ───────────────────────────────────────────────────────
function ProveedorTab() {
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [invoices, setInvoices] = useState<{ id: string; number: string; clientName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | PaymentStatus>("ALL");
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<SupplierOrder | null>(null);
  const [form, setForm] = useState({
    mayorista: "", description: "", amount: "",
    currency: "USD" as Currency, notes: "",
    invoiceId: "",
    paymentType: "normal" as "normal" | "client_pays",
    clientPaysNote: "",
  });

  async function load() {
    setLoading(true);
    const [rO, rI] = await Promise.all([
      fetch("/api/supplier-orders"),
      fetch("/api/invoices"),
    ]);
    if (rO.ok) setOrders(await rO.json());
    if (rI.ok) setInvoices(await rI.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const filtered = filter === "ALL" ? orders : orders.filter(o => o.status === filter);
  const totalUSD = orders.filter(o => o.currency === "USD").reduce((s, o) => s + o.amount, 0);
  const totalDOP = orders.filter(o => o.currency === "DOP").reduce((s, o) => s + o.amount, 0);
  const pendUSD  = orders.filter(o => o.currency === "USD" && o.status === "PENDIENTE").reduce((s, o) => s + o.amount, 0);
  const pendDOP  = orders.filter(o => o.currency === "DOP" && o.status === "PENDIENTE").reduce((s, o) => s + o.amount, 0);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      mayorista: form.mayorista,
      description: form.description,
      amount: form.amount,
      currency: form.currency,
      notes: form.notes,
      invoiceId: form.invoiceId || null,
      status: form.paymentType === "client_pays" ? "PAGADO" : "PENDIENTE",
    };
    await fetch("/api/supplier-orders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    // If client pays directly to supplier, create a credit
    if (form.paymentType === "client_pays") {
      const linkedInv = invoices.find(i => i.id === form.invoiceId);
      await fetch("/api/credits", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: form.invoiceId || null,
          mayorista: form.mayorista,
          description: `Comisión — ${form.description}${linkedInv ? ` (Fac. ${linkedInv.number})` : ""}`,
          amount: parseFloat(form.amount) || 0,
          currency: form.currency,
          status: "PENDIENTE",
          notes: form.clientPaysNote || "El cliente pagó directamente al proveedor. Crédito generado automáticamente.",
        }),
      });
    }
    setShowModal(false);
    setForm({ mayorista: "", description: "", amount: "", currency: "USD", notes: "", invoiceId: "", paymentType: "normal", clientPaysNote: "" });
    load();
  }

  async function updateStatus(id: string, status: PaymentStatus) {
    await fetch(`/api/supplier-orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    load();
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
  }

  return (
    <>
      {/* Stats */}
      <div className="px-6 pt-4 pb-3 grid grid-cols-2 gap-3">
        {[
          { label: "USD — Total proveedores", total: fmt(totalUSD, "USD"), pend: fmt(pendUSD, "USD"), flag: "🇺🇸", color: "#1D4ED8" },
          { label: "DOP — Total proveedores", total: fmt(totalDOP, "DOP"), pend: fmt(pendDOP, "DOP"), flag: "🇩🇴", color: "#166534" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 border col-span-2 md:col-span-1 stat-card" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: s.color }}>{s.flag} {s.label}</div>
            <div className="flex justify-between">
              <div><div className="text-xs" style={{ color: "var(--text-muted)" }}>Total pagado</div><div className="text-lg font-bold" style={{ color: "var(--text)" }}>{s.total}</div></div>
              <div className="text-right"><div className="text-xs" style={{ color: "var(--text-muted)" }}>Pendiente</div><div className="text-lg font-bold" style={{ color: "#F59E0B" }}>{s.pend}</div></div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter + action */}
      <div className="px-6 pb-3 flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {(["ALL", "PENDIENTE", "PAGADO", "PARCIAL", "CANCELADO"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium border transition"
              style={{ background: filter === f ? "#6366F1" : "var(--surface)", color: filter === f ? "#fff" : "var(--text-muted)", borderColor: filter === f ? "#6366F1" : "var(--border)" }}>
              {f === "ALL" ? "Todos" : ST[f].label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: "#6366F1" }}>
          + Nuevo pago proveedor
        </button>
      </div>

      {/* List */}
      <div className="px-6 pb-6 flex-1 overflow-auto">
        {loading ? (
          <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📦</div>
            <p className="font-medium" style={{ color: "var(--text)" }}>No hay pagos a proveedores</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Registra el pago a un mayorista arriba</p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
              <table className="w-full">
                <thead>
                  <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                    {["Proveedor", "Descripción", "Factura cliente", "Moneda", "Monto", "Estado", "Fecha", ""].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o, i) => (
                    <tr key={o.id} onClick={() => setSelected(o)}
                      className="border-t cursor-pointer hover:bg-indigo-50/30 transition"
                      style={{ borderColor: "var(--border)", background: i % 2 === 0 ? "var(--surface)" : "var(--surface-2)" }}>
                      <td className="px-4 py-3 font-semibold text-sm" style={{ color: "var(--text)" }}>{o.mayorista}</td>
                      <td className="px-4 py-3 text-sm max-w-[180px] truncate" style={{ color: "var(--text-muted)" }}>{o.description}</td>
                      <td className="px-4 py-3">
                        {o.invoice ? (
                          <span className="px-2 py-0.5 rounded-lg text-xs font-semibold" style={{ background: "#FFF4EE", color: "#E8610A" }}>
                            {o.invoice.number}
                          </span>
                        ) : <span style={{ color: "var(--border)" }}>—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-lg text-xs font-semibold"
                          style={{ background: o.currency === "USD" ? "#EFF6FF" : "#F0FDF4", color: o.currency === "USD" ? "#1D4ED8" : "#166534" }}>
                          {o.currency}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-sm" style={{ color: "var(--text)" }}>{fmt(o.amount, o.currency)}</td>
                      <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>{new Date(o.createdAt).toLocaleDateString("es-DO")}</td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <select value={o.status} onChange={e => updateStatus(o.id, e.target.value as PaymentStatus)}
                          className="text-xs px-2 py-1 rounded-lg border"
                          style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}>
                          <option value="PENDIENTE">Pendiente</option>
                          <option value="PAGADO">Pagado</option>
                          <option value="PARCIAL">Parcial</option>
                          <option value="CANCELADO">Cancelado</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden space-y-2">
              {filtered.map(o => (
                <div key={o.id} onClick={() => setSelected(o)}
                  className="rounded-2xl border p-4 cursor-pointer" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-sm" style={{ color: "var(--text)" }}>{o.mayorista}</div>
                      <div className="text-xs mt-0.5 truncate max-w-[200px]" style={{ color: "var(--text-muted)" }}>{o.description}</div>
                      {o.invoice && (
                        <span className="mt-1 inline-block px-2 py-0.5 rounded-lg text-xs font-semibold" style={{ background: "#FFF4EE", color: "#E8610A" }}>
                          {o.invoice.number}
                        </span>
                      )}
                    </div>
                    <StatusBadge status={o.status} />
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <div className="font-bold" style={{ color: "var(--text)" }}>{fmt(o.amount, o.currency)}</div>
                    <span className="px-2 py-0.5 rounded-lg text-xs font-semibold"
                      style={{ background: o.currency === "USD" ? "#EFF6FF" : "#F0FDF4", color: o.currency === "USD" ? "#1D4ED8" : "#166534" }}>
                      {o.currency}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-lg rounded-3xl p-6 overflow-y-auto max-h-[90vh]" style={{ background: "var(--surface)", boxShadow: "var(--shadow-lg)" }}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-lg" style={{ color: "var(--text)" }}>Pago a proveedor</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--bg)", color: "var(--text-muted)" }}>✕</button>
            </div>

            {/* Payment type */}
            <div className="mb-4">
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Tipo de pago</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setForm(f => ({ ...f, paymentType: "normal" }))}
                  className="p-3 rounded-2xl border text-left transition"
                  style={{ borderColor: form.paymentType === "normal" ? "#6366F1" : "var(--border)", background: form.paymentType === "normal" ? "#EEF2FF" : "var(--bg)" }}>
                  <div className="text-sm font-semibold" style={{ color: form.paymentType === "normal" ? "#6366F1" : "var(--text)" }}>🏦 La agencia paga</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Pago normal al proveedor</div>
                </button>
                <button type="button" onClick={() => setForm(f => ({ ...f, paymentType: "client_pays" }))}
                  className="p-3 rounded-2xl border text-left transition"
                  style={{ borderColor: form.paymentType === "client_pays" ? "#059669" : "var(--border)", background: form.paymentType === "client_pays" ? "#ECFDF5" : "var(--bg)" }}>
                  <div className="text-sm font-semibold" style={{ color: form.paymentType === "client_pays" ? "#059669" : "var(--text)" }}>💳 El cliente paga</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Genera crédito para la agencia</div>
                </button>
              </div>
            </div>

            {form.paymentType === "client_pays" && (
              <div className="mb-3 p-3 rounded-2xl text-sm" style={{ background: "#ECFDF5", color: "#059669", border: "1px solid #A7F3D0" }}>
                <strong>💡 Se creará un crédito automáticamente</strong> en la tab Créditos. El proveedor le debe a la agencia su comisión.
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Proveedor / Mayorista *</label>
                <input required value={form.mayorista} onChange={e => setForm(f => ({ ...f, mayorista: e.target.value }))}
                  className="w-full border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)", borderRadius: "10px" }}
                  placeholder="Ej: Sunwing, Karisma, Iberostar..." />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Descripción *</label>
                <input required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)", borderRadius: "10px" }}
                  placeholder="Ej: Reserva Punta Cana 15-22 julio" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Vincular a factura cliente</label>
                <select value={form.invoiceId} onChange={e => setForm(f => ({ ...f, invoiceId: e.target.value }))}
                  className="w-full border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)", borderRadius: "10px" }}>
                  <option value="">— Sin vincular —</option>
                  {invoices.map(inv => (
                    <option key={inv.id} value={inv.id}>{inv.number} — {inv.clientName}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Moneda del proveedor</label>
                  <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value as Currency }))}
                    className="w-full border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)", borderRadius: "10px" }}>
                    <option value="USD">🇺🇸 USD</option>
                    <option value="DOP">🇩🇴 DOP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Monto ({form.currency}) *</label>
                  <input required value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    type="number" step="0.01" className="w-full border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)", borderRadius: "10px" }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Notas</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} className="w-full border px-3 py-2 text-sm resize-none" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)", borderRadius: "10px" }} />
              </div>

              <div className="rounded-2xl p-3 flex justify-between items-center" style={{ background: "var(--bg)" }}>
                <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Monto al proveedor</span>
                <span className="text-xl font-bold" style={{ color: "#6366F1" }}>
                  {fmt(parseFloat(form.amount) || 0, form.currency)}
                </span>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-medium border" style={{ borderColor: "var(--border)", color: "var(--text)" }}>Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 rounded-2xl text-sm font-semibold text-white" style={{ background: "#6366F1" }}>
                  {form.paymentType === "client_pays" ? "Registrar + Crear crédito" : "Registrar pago"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-lg rounded-3xl p-6" style={{ background: "var(--surface)", boxShadow: "var(--shadow-lg)" }}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="font-bold text-lg" style={{ color: "var(--text)" }}>{selected.mayorista}</div>
                <div className="text-sm" style={{ color: "var(--text-muted)" }}>{selected.description}</div>
                {selected.invoice && (
                  <span className="mt-1 inline-block px-2 py-0.5 rounded-lg text-xs font-semibold" style={{ background: "#FFF4EE", color: "#E8610A" }}>
                    Fac. {selected.invoice.number} — {selected.invoice.clientName}
                  </span>
                )}
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--bg)", color: "var(--text-muted)" }}>✕</button>
            </div>
            <div className="space-y-3">
              <div className="rounded-2xl p-4 border flex justify-between items-center" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
                <div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>Monto total</div>
                  <div className="text-2xl font-bold" style={{ color: "#6366F1" }}>{fmt(selected.amount, selected.currency)}</div>
                </div>
                <span className="px-3 py-1 rounded-xl text-sm font-semibold"
                  style={{ background: selected.currency === "USD" ? "#EFF6FF" : "#F0FDF4", color: selected.currency === "USD" ? "#1D4ED8" : "#166534" }}>
                  {selected.currency}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(["PENDIENTE", "PAGADO", "PARCIAL", "CANCELADO"] as PaymentStatus[]).map(st => (
                  <button key={st} onClick={() => { updateStatus(selected.id, st); setSelected(null); }}
                    className="py-2 rounded-xl text-xs font-medium border transition"
                    style={{ background: selected.status === st ? "#6366F1" : "var(--bg)", color: selected.status === st ? "#fff" : "var(--text-muted)", borderColor: selected.status === st ? "#6366F1" : "var(--border)" }}>
                    {ST[st].label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Gastos tab ────────────────────────────────────────────────────────────────
function GastosTab() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState<"ALL" | Category>("ALL");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    category: "OTRO" as Category,
    description: "",
    amount: "",
    currency: "DOP" as Currency,
    paymentMethod: "TRANSFERENCIA" as PaymentMethod,
    notes: "",
  });

  async function load() {
    setLoading(true);
    const r = await fetch("/api/expenses");
    if (r.ok) setExpenses(await r.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const filtered = filterCat === "ALL" ? expenses : expenses.filter(e => e.category === filterCat);
  const totalDOP = expenses.filter(e => e.currency === "DOP").reduce((s, e) => s + e.amount, 0);
  const totalUSD = expenses.filter(e => e.currency === "USD").reduce((s, e) => s + e.amount, 0);

  const byCat = Object.keys(CAT_CONFIG).map(cat => ({
    cat: cat as Category,
    total: expenses.filter(e => e.category === cat && e.currency === "DOP").reduce((s, e) => s + e.amount, 0),
    totalUSD: expenses.filter(e => e.category === cat && e.currency === "USD").reduce((s, e) => s + e.amount, 0),
    count: expenses.filter(e => e.category === cat).length,
  })).filter(c => c.count > 0);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/expenses", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form }),
    });
    setShowModal(false);
    setForm({ date: new Date().toISOString().split("T")[0], category: "OTRO", description: "", amount: "", currency: "DOP", paymentMethod: "TRANSFERENCIA", notes: "" });
    load();
  }

  async function deleteExpense(id: string) {
    if (!confirm("¿Eliminar este gasto?")) return;
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <>
      <div className="px-6 pt-4 pb-3 grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4 border stat-card" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Total gastos (DOP)</div>
          <div className="text-xl font-bold" style={{ color: "#DC2626" }}>{fmt(totalDOP, "DOP")}</div>
        </div>
        <div className="rounded-2xl p-4 border stat-card" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Total gastos (USD)</div>
          <div className="text-xl font-bold" style={{ color: "#DC2626" }}>{fmt(totalUSD, "USD")}</div>
        </div>
      </div>

      {byCat.length > 0 && (
        <div className="px-6 pb-3">
          <div className="rounded-2xl border p-3 grid grid-cols-2 md:grid-cols-4 gap-2" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
            {byCat.map(c => {
              const cfg = CAT_CONFIG[c.cat];
              return (
                <button key={c.cat} onClick={() => setFilterCat(filterCat === c.cat ? "ALL" : c.cat)}
                  className="flex items-center gap-2 p-2 rounded-xl text-left transition"
                  style={{ background: filterCat === c.cat ? cfg.bg : "transparent" }}>
                  <span>{cfg.icon}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate" style={{ color: cfg.color }}>{cfg.label}</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {c.total > 0 && fmt(c.total, "DOP")}{c.totalUSD > 0 && ` · ${fmt(c.totalUSD, "USD")}`}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="px-6 pb-3 flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterCat("ALL")}
            className="px-3 py-1.5 rounded-xl text-xs font-medium border transition"
            style={{ background: filterCat === "ALL" ? "#E8610A" : "var(--surface)", color: filterCat === "ALL" ? "#fff" : "var(--text-muted)", borderColor: filterCat === "ALL" ? "#E8610A" : "var(--border)" }}>
            Todos
          </button>
          {Object.entries(CAT_CONFIG).map(([cat, cfg]) => (
            <button key={cat} onClick={() => setFilterCat(filterCat === cat as Category ? "ALL" : cat as Category)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium border transition"
              style={{ background: filterCat === cat ? cfg.color : "var(--surface)", color: filterCat === cat ? "#fff" : "var(--text-muted)", borderColor: filterCat === cat ? cfg.color : "var(--border)" }}>
              {cfg.icon} {cfg.label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: "#DC2626" }}>
          + Registrar gasto
        </button>
      </div>

      <div className="px-6 pb-6 flex-1 overflow-auto">
        {loading ? <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>Cargando...</div>
        : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">💸</div>
            <p className="font-medium" style={{ color: "var(--text)" }}>No hay gastos registrados</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
              <table className="w-full">
                <thead>
                  <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                    {["Fecha", "Categoría", "Descripción", "Método pago", "Moneda", "Monto", ""].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((exp, i) => {
                    const cfg = CAT_CONFIG[exp.category];
                    return (
                      <tr key={exp.id} className="border-t" style={{ borderColor: "var(--border)", background: i % 2 === 0 ? "var(--surface)" : "var(--surface-2)" }}>
                        <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>{new Date(exp.date).toLocaleDateString("es-DO")}</td>
                        <td className="px-4 py-3"><span className="px-2 py-1 rounded-xl text-xs font-semibold" style={{ color: cfg.color, background: cfg.bg }}>{cfg.icon} {cfg.label}</span></td>
                        <td className="px-4 py-3 text-sm max-w-[200px] truncate" style={{ color: "var(--text)" }}>{exp.description}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>{exp.paymentMethod}</td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-lg text-xs font-semibold" style={{ background: exp.currency === "USD" ? "#EFF6FF" : "#F0FDF4", color: exp.currency === "USD" ? "#1D4ED8" : "#166534" }}>{exp.currency}</span></td>
                        <td className="px-4 py-3 font-bold text-sm" style={{ color: "#DC2626" }}>{fmt(exp.amount, exp.currency)}</td>
                        <td className="px-4 py-3"><button onClick={() => deleteExpense(exp.id)} className="text-xs hover:opacity-70" style={{ color: "#DC2626" }}>🗑</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="md:hidden space-y-2">
              {filtered.map(exp => {
                const cfg = CAT_CONFIG[exp.category];
                return (
                  <div key={exp.id} className="rounded-2xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate" style={{ color: "var(--text)" }}>{exp.description}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 rounded-xl text-xs font-semibold" style={{ color: cfg.color, background: cfg.bg }}>{cfg.icon} {cfg.label}</span>
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>{exp.paymentMethod}</span>
                        </div>
                      </div>
                      <button onClick={() => deleteExpense(exp.id)} className="ml-2 text-sm" style={{ color: "#DC2626" }}>🗑</button>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="font-bold" style={{ color: "#DC2626" }}>{fmt(exp.amount, exp.currency)}</div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>{new Date(exp.date).toLocaleDateString("es-DO")}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-lg rounded-3xl p-6 overflow-y-auto max-h-[90vh]" style={{ background: "var(--surface)", boxShadow: "var(--shadow-lg)" }}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-lg" style={{ color: "var(--text)" }}>Registrar gasto</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--bg)", color: "var(--text-muted)" }}>✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Fecha</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)", borderRadius: "10px" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Categoría *</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as Category }))}
                    className="w-full border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)", borderRadius: "10px" }}>
                    {Object.entries(CAT_CONFIG).map(([cat, cfg]) => <option key={cat} value={cat}>{cfg.icon} {cfg.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Descripción *</label>
                <input required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)", borderRadius: "10px" }}
                  placeholder="Ej: Renta de oficina junio..." />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Moneda</label>
                  <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value as Currency }))}
                    className="w-full border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)", borderRadius: "10px" }}>
                    <option value="DOP">🇩🇴 DOP</option>
                    <option value="USD">🇺🇸 USD</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Monto ({form.currency}) *</label>
                  <input required value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    type="number" step="0.01" className="w-full border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)", borderRadius: "10px" }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Método de pago</label>
                <select value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value as PaymentMethod }))}
                  className="w-full border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)", borderRadius: "10px" }}>
                  <option value="TRANSFERENCIA">🏦 Transferencia</option>
                  <option value="EFECTIVO">💵 Efectivo</option>
                  <option value="TARJETA">💳 Tarjeta</option>
                  <option value="CHEQUE">📄 Cheque</option>
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-medium border" style={{ borderColor: "var(--border)", color: "var(--text)" }}>Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 rounded-2xl text-sm font-semibold text-white" style={{ background: "#DC2626" }}>Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ── Credits tab ───────────────────────────────────────────────────────────────
function CreditosTab() {
  const [credits, setCredits] = useState<Credit[]>([]);
  const [invoices, setInvoices] = useState<{ id: string; number: string; clientName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | CreditStatus>("ALL");
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Credit | null>(null);
  const [form, setForm] = useState({
    mayorista: "", description: "", amount: "",
    currency: "USD" as Currency, invoiceId: "",
    dueDate: "", notes: "",
  });

  async function load() {
    setLoading(true);
    const [rC, rI] = await Promise.all([fetch("/api/credits"), fetch("/api/invoices")]);
    if (rC.ok) setCredits(await rC.json());
    if (rI.ok) setInvoices(await rI.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const filtered = filter === "ALL" ? credits : credits.filter(c => c.status === filter);
  const pendTotal = credits.filter(c => c.status === "PENDIENTE");
  const pendUSD = pendTotal.filter(c => c.currency === "USD").reduce((s, c) => s + c.amount, 0);
  const pendDOP = pendTotal.filter(c => c.currency === "DOP").reduce((s, c) => s + c.amount, 0);
  const cobUSD = credits.filter(c => c.status === "COBRADO" && c.currency === "USD").reduce((s, c) => s + c.amount, 0);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/credits", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, invoiceId: form.invoiceId || null, dueDate: form.dueDate || null }),
    });
    setShowModal(false);
    setForm({ mayorista: "", description: "", amount: "", currency: "USD", invoiceId: "", dueDate: "", notes: "" });
    load();
  }

  async function updateStatus(id: string, status: CreditStatus) {
    await fetch(`/api/credits/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    load();
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
  }

  async function deleteCredit(id: string) {
    if (!confirm("¿Eliminar este crédito?")) return;
    await fetch(`/api/credits/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <>
      <div className="px-6 pt-4 pb-3 grid grid-cols-3 gap-3">
        <div className="rounded-2xl p-4 border stat-card" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Por cobrar (USD)</div>
          <div className="text-xl font-bold" style={{ color: "#059669" }}>{fmt(pendUSD, "USD")}</div>
        </div>
        <div className="rounded-2xl p-4 border stat-card" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Por cobrar (DOP)</div>
          <div className="text-xl font-bold" style={{ color: "#059669" }}>{fmt(pendDOP, "DOP")}</div>
        </div>
        <div className="rounded-2xl p-4 border stat-card" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Cobrado (USD)</div>
          <div className="text-xl font-bold" style={{ color: "#6366F1" }}>{fmt(cobUSD, "USD")}</div>
        </div>
      </div>

      <div className="px-6 pb-3 flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2">
          {(["ALL", "PENDIENTE", "COBRADO", "CANCELADO"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium border transition"
              style={{ background: filter === f ? "#059669" : "var(--surface)", color: filter === f ? "#fff" : "var(--text-muted)", borderColor: filter === f ? "#059669" : "var(--border)" }}>
              {f === "ALL" ? "Todos" : CS[f].label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: "#059669" }}>
          + Nuevo crédito
        </button>
      </div>

      <div className="px-6 pb-6 flex-1 overflow-auto">
        {loading ? <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>Cargando...</div>
        : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">💳</div>
            <p className="font-medium" style={{ color: "var(--text)" }}>No hay créditos</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Los créditos se generan cuando el cliente paga directo al proveedor</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
              <table className="w-full">
                <thead>
                  <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                    {["Proveedor", "Descripción", "Factura cliente", "Moneda", "Monto", "Estado", "Vence", ""].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => (
                    <tr key={c.id} onClick={() => setSelected(c)}
                      className="border-t cursor-pointer hover:bg-green-50/30 transition"
                      style={{ borderColor: "var(--border)", background: i % 2 === 0 ? "var(--surface)" : "var(--surface-2)" }}>
                      <td className="px-4 py-3 font-semibold text-sm" style={{ color: "var(--text)" }}>{c.mayorista}</td>
                      <td className="px-4 py-3 text-sm max-w-[180px] truncate" style={{ color: "var(--text-muted)" }}>{c.description}</td>
                      <td className="px-4 py-3">
                        {c.invoice ? (
                          <span className="px-2 py-0.5 rounded-lg text-xs font-semibold" style={{ background: "#FFF4EE", color: "#E8610A" }}>
                            {c.invoice.number}
                          </span>
                        ) : <span style={{ color: "var(--border)" }}>—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-lg text-xs font-semibold"
                          style={{ background: c.currency === "USD" ? "#EFF6FF" : "#F0FDF4", color: c.currency === "USD" ? "#1D4ED8" : "#166534" }}>
                          {c.currency}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-sm" style={{ color: "#059669" }}>{fmt(c.amount, c.currency)}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-xl text-xs font-semibold" style={{ color: CS[c.status].color, background: CS[c.status].bg }}>
                          {CS[c.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
                        {c.dueDate ? new Date(c.dueDate).toLocaleDateString("es-DO") : "—"}
                      </td>
                      <td className="px-4 py-3 flex gap-2" onClick={e => e.stopPropagation()}>
                        {c.status === "PENDIENTE" && (
                          <button onClick={() => updateStatus(c.id, "COBRADO")}
                            className="px-2 py-1 rounded-lg text-xs font-semibold text-white" style={{ background: "#059669" }}>
                            Cobrar
                          </button>
                        )}
                        <button onClick={() => deleteCredit(c.id)} className="text-xs" style={{ color: "#DC2626" }}>🗑</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden space-y-2">
              {filtered.map(c => (
                <div key={c.id} onClick={() => setSelected(c)}
                  className="rounded-2xl border p-4 cursor-pointer" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-sm" style={{ color: "var(--text)" }}>{c.mayorista}</div>
                      <div className="text-xs mt-0.5 max-w-[200px] truncate" style={{ color: "var(--text-muted)" }}>{c.description}</div>
                    </div>
                    <span className="px-2 py-1 rounded-xl text-xs font-semibold" style={{ color: CS[c.status].color, background: CS[c.status].bg }}>
                      {CS[c.status].label}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <div className="font-bold" style={{ color: "#059669" }}>{fmt(c.amount, c.currency)}</div>
                    {c.status === "PENDIENTE" && (
                      <button onClick={e => { e.stopPropagation(); updateStatus(c.id, "COBRADO"); }}
                        className="px-2 py-1 rounded-lg text-xs font-semibold text-white" style={{ background: "#059669" }}>
                        Cobrar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-lg rounded-3xl p-6 overflow-y-auto max-h-[90vh]" style={{ background: "var(--surface)", boxShadow: "var(--shadow-lg)" }}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-lg" style={{ color: "var(--text)" }}>Nuevo crédito</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--bg)", color: "var(--text-muted)" }}>✕</button>
            </div>
            <div className="mb-4 p-3 rounded-2xl text-sm" style={{ background: "#ECFDF5", color: "#059669", border: "1px solid #A7F3D0" }}>
              💡 Los créditos representan comisiones que los proveedores deben a tu agencia, cuando el cliente pagó directamente al proveedor.
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Proveedor que debe el crédito *</label>
                <input required value={form.mayorista} onChange={e => setForm(f => ({ ...f, mayorista: e.target.value }))}
                  className="w-full border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)", borderRadius: "10px" }}
                  placeholder="Ej: Sunwing, Karisma..." />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Descripción *</label>
                <input required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)", borderRadius: "10px" }}
                  placeholder="Ej: Comisión viaje Punta Cana julio" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Vincular a factura cliente</label>
                <select value={form.invoiceId} onChange={e => setForm(f => ({ ...f, invoiceId: e.target.value }))}
                  className="w-full border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)", borderRadius: "10px" }}>
                  <option value="">— Sin vincular —</option>
                  {invoices.map(inv => <option key={inv.id} value={inv.id}>{inv.number} — {inv.clientName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Moneda</label>
                  <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value as Currency }))}
                    className="w-full border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)", borderRadius: "10px" }}>
                    <option value="USD">🇺🇸 USD</option>
                    <option value="DOP">🇩🇴 DOP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Monto ({form.currency}) *</label>
                  <input required value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    type="number" step="0.01" className="w-full border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)", borderRadius: "10px" }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Fecha límite de cobro</label>
                <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                  className="w-full border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)", borderRadius: "10px" }} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-medium border" style={{ borderColor: "var(--border)", color: "var(--text)" }}>Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 rounded-2xl text-sm font-semibold text-white" style={{ background: "#059669" }}>
                  Crear crédito
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-lg rounded-3xl p-6" style={{ background: "var(--surface)", boxShadow: "var(--shadow-lg)" }}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="font-bold text-lg" style={{ color: "var(--text)" }}>{selected.mayorista}</div>
                <div className="text-sm" style={{ color: "var(--text-muted)" }}>{selected.description}</div>
                {selected.invoice && <span className="mt-1 inline-block px-2 py-0.5 rounded-lg text-xs font-semibold" style={{ background: "#FFF4EE", color: "#E8610A" }}>Fac. {selected.invoice.number}</span>}
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--bg)", color: "var(--text-muted)" }}>✕</button>
            </div>
            <div className="space-y-3">
              <div className="rounded-2xl p-4 border flex justify-between items-center" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
                <div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>Crédito a cobrar</div>
                  <div className="text-2xl font-bold" style={{ color: "#059669" }}>{fmt(selected.amount, selected.currency)}</div>
                </div>
                <span className="px-2 py-1 rounded-xl text-xs font-semibold" style={{ color: CS[selected.status].color, background: CS[selected.status].bg }}>
                  {CS[selected.status].label}
                </span>
              </div>
              {selected.dueDate && (
                <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Vence: <strong style={{ color: "var(--text)" }}>{new Date(selected.dueDate).toLocaleDateString("es-DO")}</strong>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                {(["PENDIENTE", "COBRADO", "CANCELADO"] as CreditStatus[]).map(st => (
                  <button key={st} onClick={() => { updateStatus(selected.id, st); setSelected(null); }}
                    className="py-2 rounded-xl text-xs font-medium border transition"
                    style={{ background: selected.status === st ? "#059669" : "var(--bg)", color: selected.status === st ? "#fff" : "var(--text-muted)", borderColor: selected.status === st ? "#059669" : "var(--border)" }}>
                    {CS[st].label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function FacturasPage() {
  const [tab, setTab] = useState<Tab>("cliente");

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <PageHeader title="Facturación" subtitle="Facturas, proveedores, gastos y créditos" />

      <div className="px-6 pt-4 flex gap-0 border-b shrink-0 overflow-x-auto" style={{ borderColor: "var(--border)" }}>
        {([
          { key: "cliente",   label: "🧑 Clientes",   color: "#E8610A" },
          { key: "proveedor", label: "📦 Proveedores", color: "#6366F1" },
          { key: "gastos",    label: "💸 Gastos",      color: "#DC2626" },
          { key: "creditos",  label: "💳 Créditos",    color: "#059669" },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-4 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-px whitespace-nowrap"
            style={{ borderColor: tab === t.key ? t.color : "transparent", color: tab === t.key ? t.color : "var(--text-muted)" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto flex flex-col">
        {tab === "cliente"   ? <ClienteTab />   :
         tab === "proveedor" ? <ProveedorTab />  :
         tab === "gastos"    ? <GastosTab />     :
         <CreditosTab />}
      </div>
    </div>
  );
}
