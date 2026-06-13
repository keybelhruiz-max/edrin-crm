"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui";

type PaymentStatus = "PENDIENTE" | "PAGADO" | "PARCIAL" | "CANCELADO";
type InvoiceType = "NCF" | "PROFORMA" | "RECIBO";
type Currency = "USD" | "DOP";
type Tab = "cliente" | "proveedor" | "gastos";
type Category = "NOMINA" | "OFICINA" | "MARKETING" | "SOFTWARE" | "VIAJES" | "PROVEEDOR" | "IMPUESTO" | "OTRO";
type PaymentMethod = "EFECTIVO" | "TRANSFERENCIA" | "TARJETA" | "CHEQUE";

interface Expense {
  id: string; date: string; category: Category; description: string;
  amount: number; currency: Currency; paymentMethod: PaymentMethod;
  notes: string | null; createdAt: string;
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
  status: PaymentStatus; notes: string | null; createdAt: string; items: InvoiceItem[];
}
interface SupplierOrder {
  id: string; mayorista: string; description: string;
  amount: number; currency: Currency; status: PaymentStatus;
  notes: string | null; createdAt: string; invoiceId: string | null;
}

const ST: Record<PaymentStatus, { label: string; color: string; bg: string }> = {
  PENDIENTE: { label: "Pendiente", color: "#D97706", bg: "#FFFBEB" },
  PAGADO:    { label: "Pagado",    color: "#059669", bg: "#ECFDF5" },
  PARCIAL:   { label: "Parcial",   color: "#2563EB", bg: "#EFF6FF" },
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
  const [form, setForm] = useState({
    clientName: "", clientEmail: "", clientPhone: "",
    type: "PROFORMA" as InvoiceType, currency: "DOP" as Currency,
    subtotal: "", itbis: "", notes: "",
  });

  async function load() {
    setLoading(true);
    const r = await fetch("/api/invoices");
    if (r.ok) setInvoices(await r.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const filtered = filter === "ALL" ? invoices : invoices.filter(i => i.status === filter);
  const totalBilled = invoices.reduce((s, i) => s + i.total, 0);
  const totalPaid   = invoices.filter(i => i.status === "PAGADO").reduce((s, i) => s + i.total, 0);
  const totalPend   = invoices.filter(i => i.status === "PENDIENTE").reduce((s, i) => s + i.total, 0);

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
          <div key={s.label} className="rounded-xl p-4 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
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
              className="px-3 py-1.5 rounded-lg text-xs font-medium border transition"
              style={{ background: filter === f ? "#E8610A" : "var(--surface)", color: filter === f ? "#fff" : "var(--text-muted)", borderColor: filter === f ? "#E8610A" : "var(--border)" }}>
              {f === "ALL" ? "Todas" : ST[f].label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "#E8610A" }}>
          + Nueva factura
        </button>
      </div>

      {/* Table */}
      <div className="px-6 pb-6 flex-1 overflow-auto">
        {loading ? (
          <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">≡</div>
            <p className="font-medium" style={{ color: "var(--text)" }}>No hay facturas</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Crea la primera con el botón de arriba</p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
              <table className="w-full">
                <thead>
                  <tr style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
                    {["#", "Cliente", "Tipo", "Moneda", "Total", "Estado", "Fecha", ""].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inv, i) => (
                    <tr key={inv.id} onClick={() => setSelected(inv)}
                      className="border-t cursor-pointer hover:bg-orange-50/30 transition"
                      style={{ borderColor: "var(--border)", background: i % 2 === 0 ? "var(--surface)" : "transparent" }}>
                      <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--text-muted)" }}>{inv.number}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-sm" style={{ color: "var(--text)" }}>{inv.clientName}</div>
                        {inv.clientEmail && <div className="text-xs" style={{ color: "var(--text-muted)" }}>{inv.clientEmail}</div>}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>{TYPE_LABELS[inv.type]}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-xs font-semibold"
                          style={{ background: inv.currency === "USD" ? "#EFF6FF" : "#F0FDF4", color: inv.currency === "USD" ? "#1D4ED8" : "#166534" }}>
                          {inv.currency}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-sm" style={{ color: "var(--text)" }}>{fmt(inv.total, inv.currency)}</td>
                      <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>{new Date(inv.createdAt).toLocaleDateString("es-DO")}</td>
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
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-2">
              {filtered.map(inv => (
                <div key={inv.id} onClick={() => setSelected(inv)}
                  className="rounded-xl border p-4 cursor-pointer" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-sm" style={{ color: "var(--text)" }}>{inv.clientName}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{inv.number} · {TYPE_LABELS[inv.type]}</div>
                    </div>
                    <StatusBadge status={inv.status} />
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <div className="font-bold" style={{ color: "var(--text)" }}>{fmt(inv.total, inv.currency)}</div>
                    <span className="px-2 py-0.5 rounded text-xs font-semibold"
                      style={{ background: inv.currency === "USD" ? "#EFF6FF" : "#F0FDF4", color: inv.currency === "USD" ? "#1D4ED8" : "#166534" }}>
                      {inv.currency}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* New invoice modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="w-full max-w-lg rounded-2xl p-6 overflow-y-auto max-h-[90vh]" style={{ background: "var(--surface)" }}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-lg" style={{ color: "var(--text)" }}>Nueva factura — Cliente</h3>
              <button onClick={() => setShowModal(false)} style={{ color: "var(--text-muted)" }}>✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Cliente *</label>
                <input required value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }} placeholder="Nombre del cliente" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Email</label>
                  <input value={form.clientEmail} onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))} type="email"
                    className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Teléfono</label>
                  <input value={form.clientPhone} onChange={e => setForm(f => ({ ...f, clientPhone: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Tipo</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as InvoiceType }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }}>
                    <option value="PROFORMA">Proforma</option>
                    <option value="NCF">NCF</option>
                    <option value="RECIBO">Recibo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Moneda del cliente</label>
                  <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value as Currency }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }}>
                    <option value="DOP">🇩🇴 DOP — Pesos dominicanos</option>
                    <option value="USD">🇺🇸 USD — Dólares</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Subtotal ({form.currency}) *</label>
                  <input required value={form.subtotal} onChange={e => setForm(f => ({ ...f, subtotal: e.target.value }))}
                    type="number" step="0.01" className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>ITBIS 18%</label>
                  <input value={form.itbis} onChange={e => setForm(f => ({ ...f, itbis: e.target.value }))}
                    type="number" step="0.01" className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Notas</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} className="w-full border rounded-lg px-3 py-2 text-sm resize-none" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }} />
              </div>

              <div className="rounded-xl p-3 flex justify-between items-center" style={{ background: "var(--bg)" }}>
                <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Total a cobrar al cliente</span>
                <span className="text-xl font-bold" style={{ color: "#E8610A" }}>
                  {fmt((parseFloat(form.subtotal) || 0) + (parseFloat(form.itbis) || 0), form.currency)}
                </span>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium border"
                  style={{ borderColor: "var(--border)", color: "var(--text)" }}>Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "#E8610A" }}>
                  Crear factura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="w-full max-w-lg rounded-2xl p-6 overflow-y-auto max-h-[90vh]" style={{ background: "var(--surface)" }}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="font-bold text-lg" style={{ color: "var(--text)" }}>{selected.number}</div>
                <div className="text-sm flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
                  {TYPE_LABELS[selected.type]}
                  <span className="px-2 py-0.5 rounded text-xs font-semibold"
                    style={{ background: selected.currency === "USD" ? "#EFF6FF" : "#F0FDF4", color: selected.currency === "USD" ? "#1D4ED8" : "#166534" }}>
                    {selected.currency}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ color: "var(--text-muted)" }}>✕</button>
            </div>
            <div className="space-y-3">
              <div className="rounded-xl p-4 border" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
                <div className="font-semibold text-sm mb-1" style={{ color: "var(--text)" }}>Cliente</div>
                <div style={{ color: "var(--text)" }}>{selected.clientName}</div>
                {selected.clientEmail && <div className="text-sm" style={{ color: "var(--text-muted)" }}>{selected.clientEmail}</div>}
              </div>
              <div className="rounded-xl p-4 border space-y-2" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--text-muted)" }}>Subtotal</span>
                  <span style={{ color: "var(--text)" }}>{fmt(selected.subtotal, selected.currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--text-muted)" }}>ITBIS</span>
                  <span style={{ color: "var(--text)" }}>{fmt(selected.itbis, selected.currency)}</span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t" style={{ borderColor: "var(--border)" }}>
                  <span style={{ color: "var(--text)" }}>Total</span>
                  <span style={{ color: "#E8610A" }}>{fmt(selected.total, selected.currency)}</span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(["PENDIENTE", "PAGADO", "PARCIAL", "CANCELADO"] as PaymentStatus[]).map(st => (
                  <button key={st} onClick={() => { updateStatus(selected.id, st); setSelected(null); }}
                    className="py-2 rounded-lg text-xs font-medium border transition"
                    style={{ background: selected.status === st ? "#E8610A" : "var(--bg)", color: selected.status === st ? "#fff" : "var(--text-muted)", borderColor: selected.status === st ? "#E8610A" : "var(--border)" }}>
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

// ── Supplier orders tab ───────────────────────────────────────────────────────
function ProveedorTab() {
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | PaymentStatus>("ALL");
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<SupplierOrder | null>(null);
  const [form, setForm] = useState({
    mayorista: "", description: "", amount: "",
    currency: "USD" as Currency, notes: "",
  });

  async function load() {
    setLoading(true);
    const r = await fetch("/api/supplier-orders");
    if (r.ok) setOrders(await r.json());
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
    await fetch("/api/supplier-orders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form }),
    });
    setShowModal(false);
    setForm({ mayorista: "", description: "", amount: "", currency: "USD", notes: "" });
    load();
  }

  async function updateStatus(id: string, status: PaymentStatus) {
    await fetch(`/api/supplier-orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    load();
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
  }

  return (
    <>
      {/* Stats — split by currency */}
      <div className="px-6 pt-4 pb-3 grid grid-cols-2 gap-3">
        <div className="rounded-xl p-4 border col-span-2 md:col-span-1" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: "#1D4ED8" }}>🇺🇸 USD — Dólares</div>
          <div className="flex justify-between">
            <div><div className="text-xs" style={{ color: "var(--text-muted)" }}>Total pagado a proveedores</div><div className="text-lg font-bold" style={{ color: "var(--text)" }}>{fmt(totalUSD, "USD")}</div></div>
            <div className="text-right"><div className="text-xs" style={{ color: "var(--text-muted)" }}>Pendiente</div><div className="text-lg font-bold" style={{ color: "#F59E0B" }}>{fmt(pendUSD, "USD")}</div></div>
          </div>
        </div>
        <div className="rounded-xl p-4 border col-span-2 md:col-span-1" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: "#166534" }}>🇩🇴 DOP — Pesos</div>
          <div className="flex justify-between">
            <div><div className="text-xs" style={{ color: "var(--text-muted)" }}>Total pagado a proveedores</div><div className="text-lg font-bold" style={{ color: "var(--text)" }}>{fmt(totalDOP, "DOP")}</div></div>
            <div className="text-right"><div className="text-xs" style={{ color: "var(--text-muted)" }}>Pendiente</div><div className="text-lg font-bold" style={{ color: "#F59E0B" }}>{fmt(pendDOP, "DOP")}</div></div>
          </div>
        </div>
      </div>

      {/* Filter + action */}
      <div className="px-6 pb-3 flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {(["ALL", "PENDIENTE", "PAGADO", "PARCIAL", "CANCELADO"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border transition"
              style={{ background: filter === f ? "#E8610A" : "var(--surface)", color: filter === f ? "#fff" : "var(--text-muted)", borderColor: filter === f ? "#E8610A" : "var(--border)" }}>
              {f === "ALL" ? "Todos" : ST[f].label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "#E8610A" }}>
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
            <div className="hidden md:block rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
              <table className="w-full">
                <thead>
                  <tr style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
                    {["Proveedor/Mayorista", "Descripción", "Moneda", "Monto", "Estado", "Fecha", ""].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o, i) => (
                    <tr key={o.id} onClick={() => setSelected(o)}
                      className="border-t cursor-pointer hover:bg-orange-50/30 transition"
                      style={{ borderColor: "var(--border)", background: i % 2 === 0 ? "var(--surface)" : "transparent" }}>
                      <td className="px-4 py-3 font-semibold text-sm" style={{ color: "var(--text)" }}>{o.mayorista}</td>
                      <td className="px-4 py-3 text-sm max-w-[200px] truncate" style={{ color: "var(--text-muted)" }}>{o.description}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-xs font-semibold"
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
                  className="rounded-xl border p-4 cursor-pointer" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-sm" style={{ color: "var(--text)" }}>{o.mayorista}</div>
                      <div className="text-xs mt-0.5 truncate max-w-[200px]" style={{ color: "var(--text-muted)" }}>{o.description}</div>
                    </div>
                    <StatusBadge status={o.status} />
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <div className="font-bold" style={{ color: "var(--text)" }}>{fmt(o.amount, o.currency)}</div>
                    <span className="px-2 py-0.5 rounded text-xs font-semibold"
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
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="w-full max-w-lg rounded-2xl p-6" style={{ background: "var(--surface)" }}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-lg" style={{ color: "var(--text)" }}>Pago a proveedor / Mayorista</h3>
              <button onClick={() => setShowModal(false)} style={{ color: "var(--text-muted)" }}>✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Proveedor / Mayorista *</label>
                <input required value={form.mayorista} onChange={e => setForm(f => ({ ...f, mayorista: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }}
                  placeholder="Ej: Sunwing, Karisma, Iberostar..." />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Descripción *</label>
                <input required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }}
                  placeholder="Ej: Pago reserva Punta Cana 15-22 julio" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Moneda del proveedor</label>
                  <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value as Currency }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }}>
                    <option value="USD">🇺🇸 USD — Dólares</option>
                    <option value="DOP">🇩🇴 DOP — Pesos</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Monto ({form.currency}) *</label>
                  <input required value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    type="number" step="0.01" className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Notas</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} className="w-full border rounded-lg px-3 py-2 text-sm resize-none" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }} />
              </div>

              <div className="rounded-xl p-3 flex justify-between items-center" style={{ background: "var(--bg)" }}>
                <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Monto a pagar al proveedor</span>
                <span className="text-xl font-bold" style={{ color: "#6366F1" }}>
                  {fmt(parseFloat(form.amount) || 0, form.currency)}
                </span>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium border" style={{ borderColor: "var(--border)", color: "var(--text)" }}>Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "#6366F1" }}>
                  Registrar pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="w-full max-w-lg rounded-2xl p-6" style={{ background: "var(--surface)" }}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="font-bold text-lg" style={{ color: "var(--text)" }}>{selected.mayorista}</div>
                <div className="text-sm" style={{ color: "var(--text-muted)" }}>{selected.description}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ color: "var(--text-muted)" }}>✕</button>
            </div>
            <div className="space-y-3">
              <div className="rounded-xl p-4 border flex justify-between items-center" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
                <div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>Monto total</div>
                  <div className="text-2xl font-bold" style={{ color: "#6366F1" }}>{fmt(selected.amount, selected.currency)}</div>
                </div>
                <span className="px-3 py-1 rounded-lg text-sm font-semibold"
                  style={{ background: selected.currency === "USD" ? "#EFF6FF" : "#F0FDF4", color: selected.currency === "USD" ? "#1D4ED8" : "#166534" }}>
                  {selected.currency}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(["PENDIENTE", "PAGADO", "PARCIAL", "CANCELADO"] as PaymentStatus[]).map(st => (
                  <button key={st} onClick={() => { updateStatus(selected.id, st); setSelected(null); }}
                    className="py-2 rounded-lg text-xs font-medium border transition"
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

  // By category totals
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
      {/* Summary */}
      <div className="px-6 pt-4 pb-3 grid grid-cols-2 gap-3">
        <div className="rounded-xl p-4 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Total gastos (DOP)</div>
          <div className="text-xl font-bold" style={{ color: "#DC2626" }}>{fmt(totalDOP, "DOP")}</div>
        </div>
        <div className="rounded-xl p-4 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Total gastos (USD)</div>
          <div className="text-xl font-bold" style={{ color: "#DC2626" }}>{fmt(totalUSD, "USD")}</div>
        </div>
      </div>

      {/* Category breakdown */}
      {byCat.length > 0 && (
        <div className="px-6 pb-3">
          <div className="rounded-xl border p-3 grid grid-cols-2 md:grid-cols-4 gap-2" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
            {byCat.map(c => {
              const cfg = CAT_CONFIG[c.cat];
              return (
                <button key={c.cat} onClick={() => setFilterCat(filterCat === c.cat ? "ALL" : c.cat)}
                  className="flex items-center gap-2 p-2 rounded-lg text-left transition"
                  style={{ background: filterCat === c.cat ? cfg.bg : "transparent" }}>
                  <span>{cfg.icon}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate" style={{ color: cfg.color }}>{cfg.label}</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {c.total > 0 && fmt(c.total, "DOP")}
                      {c.totalUSD > 0 && ` · ${fmt(c.totalUSD, "USD")}`}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter + action */}
      <div className="px-6 pb-3 flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterCat("ALL")}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border transition"
            style={{ background: filterCat === "ALL" ? "#E8610A" : "var(--surface)", color: filterCat === "ALL" ? "#fff" : "var(--text-muted)", borderColor: filterCat === "ALL" ? "#E8610A" : "var(--border)" }}>
            Todos
          </button>
          {Object.entries(CAT_CONFIG).map(([cat, cfg]) => (
            <button key={cat} onClick={() => setFilterCat(filterCat === cat as Category ? "ALL" : cat as Category)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border transition"
              style={{ background: filterCat === cat ? cfg.color : "var(--surface)", color: filterCat === cat ? "#fff" : "var(--text-muted)", borderColor: filterCat === cat ? cfg.color : "var(--border)" }}>
              {cfg.icon} {cfg.label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "#DC2626" }}>
          + Registrar gasto
        </button>
      </div>

      {/* List */}
      <div className="px-6 pb-6 flex-1 overflow-auto">
        {loading ? (
          <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">💸</div>
            <p className="font-medium" style={{ color: "var(--text)" }}>No hay gastos registrados</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Registra el primer gasto con el botón de arriba</p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
              <table className="w-full">
                <thead>
                  <tr style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
                    {["Fecha", "Categoría", "Descripción", "Método pago", "Moneda", "Monto", ""].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((exp, i) => {
                    const cfg = CAT_CONFIG[exp.category];
                    return (
                      <tr key={exp.id} className="border-t"
                        style={{ borderColor: "var(--border)", background: i % 2 === 0 ? "var(--surface)" : "transparent" }}>
                        <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
                          {new Date(exp.date).toLocaleDateString("es-DO")}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ color: cfg.color, background: cfg.bg }}>
                            {cfg.icon} {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm max-w-[200px] truncate" style={{ color: "var(--text)" }}>{exp.description}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>{exp.paymentMethod}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-xs font-semibold"
                            style={{ background: exp.currency === "USD" ? "#EFF6FF" : "#F0FDF4", color: exp.currency === "USD" ? "#1D4ED8" : "#166534" }}>
                            {exp.currency}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-sm" style={{ color: "#DC2626" }}>{fmt(exp.amount, exp.currency)}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => deleteExpense(exp.id)} className="text-xs hover:opacity-70 transition" style={{ color: "#DC2626" }}>🗑</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden space-y-2">
              {filtered.map(exp => {
                const cfg = CAT_CONFIG[exp.category];
                return (
                  <div key={exp.id} className="rounded-xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate" style={{ color: "var(--text)" }}>{exp.description}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ color: cfg.color, background: cfg.bg }}>
                            {cfg.icon} {cfg.label}
                          </span>
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

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="w-full max-w-lg rounded-2xl p-6 overflow-y-auto max-h-[90vh]" style={{ background: "var(--surface)" }}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-lg" style={{ color: "var(--text)" }}>Registrar gasto</h3>
              <button onClick={() => setShowModal(false)} style={{ color: "var(--text-muted)" }}>✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Fecha</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Categoría *</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as Category }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }}>
                    {Object.entries(CAT_CONFIG).map(([cat, cfg]) => (
                      <option key={cat} value={cat}>{cfg.icon} {cfg.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Descripción *</label>
                <input required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }}
                  placeholder="Ej: Renta de oficina junio, Salario Maria..." />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Moneda</label>
                  <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value as Currency }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }}>
                    <option value="DOP">🇩🇴 DOP</option>
                    <option value="USD">🇺🇸 USD</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Monto ({form.currency}) *</label>
                  <input required value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    type="number" step="0.01" className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Método de pago</label>
                <select value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value as PaymentMethod }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }}>
                  <option value="TRANSFERENCIA">🏦 Transferencia</option>
                  <option value="EFECTIVO">💵 Efectivo</option>
                  <option value="TARJETA">💳 Tarjeta</option>
                  <option value="CHEQUE">📄 Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Notas</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} className="w-full border rounded-lg px-3 py-2 text-sm resize-none" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }} />
              </div>

              <div className="rounded-xl p-3 flex justify-between items-center" style={{ background: "#FEF2F2" }}>
                <span className="text-sm font-medium" style={{ color: "#DC2626" }}>Total del gasto</span>
                <span className="text-xl font-bold" style={{ color: "#DC2626" }}>
                  {fmt(parseFloat(form.amount) || 0, form.currency)}
                </span>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium border" style={{ borderColor: "var(--border)", color: "var(--text)" }}>Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "#DC2626" }}>
                  Registrar gasto
                </button>
              </div>
            </form>
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
      <PageHeader title="Facturación" subtitle="Facturas, pagos a proveedores y gastos de la empresa" />

      {/* Tabs */}
      <div className="px-6 pt-4 flex gap-1 border-b shrink-0 overflow-x-auto" style={{ borderColor: "var(--border)" }}>
        {([
          { key: "cliente",   label: "🧑 Clientes",   color: "#E8610A" },
          { key: "proveedor", label: "📦 Proveedores", color: "#6366F1" },
          { key: "gastos",    label: "💸 Gastos",      color: "#DC2626" },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-4 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-px whitespace-nowrap"
            style={{ borderColor: tab === t.key ? t.color : "transparent", color: tab === t.key ? t.color : "var(--text-muted)" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto flex flex-col">
        {tab === "cliente" ? <ClienteTab /> : tab === "proveedor" ? <ProveedorTab /> : <GastosTab />}
      </div>
    </div>
  );
}
