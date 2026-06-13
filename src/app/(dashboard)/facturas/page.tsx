"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui";

type PaymentStatus = "PENDIENTE" | "PAGADO" | "PARCIAL" | "CANCELADO";
type InvoiceType = "NCF" | "PROFORMA" | "RECIBO";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Invoice {
  id: string;
  number: string;
  type: InvoiceType;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  currency: "USD" | "DOP";
  subtotal: number;
  itbis: number;
  total: number;
  status: PaymentStatus;
  notes: string | null;
  createdAt: string;
  items: InvoiceItem[];
}

const STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string; bg: string }> = {
  PENDIENTE: { label: "Pendiente", color: "#D97706", bg: "#FFFBEB" },
  PAGADO: { label: "Pagado", color: "#059669", bg: "#ECFDF5" },
  PARCIAL: { label: "Parcial", color: "#2563EB", bg: "#EFF6FF" },
  CANCELADO: { label: "Cancelado", color: "#DC2626", bg: "#FEF2F2" },
};

const TYPE_LABELS: Record<InvoiceType, string> = {
  NCF: "NCF",
  PROFORMA: "Proforma",
  RECIBO: "Recibo",
};

export default function FacturasPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | PaymentStatus>("ALL");
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Invoice | null>(null);

  const [form, setForm] = useState({
    clientName: "", clientEmail: "", clientPhone: "",
    type: "PROFORMA" as InvoiceType,
    currency: "DOP" as "USD" | "DOP",
    subtotal: "", itbis: "", notes: "",
    items: [{ description: "", quantity: 1, unitPrice: 0, total: 0 }],
  });

  async function load() {
    setLoading(true);
    const r = await fetch("/api/invoices");
    if (r.ok) setInvoices(await r.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = filter === "ALL" ? invoices : invoices.filter(i => i.status === filter);

  const totals = {
    billed: invoices.reduce((s, i) => s + i.total, 0),
    paid: invoices.filter(i => i.status === "PAGADO").reduce((s, i) => s + i.total, 0),
    pending: invoices.filter(i => i.status === "PENDIENTE").reduce((s, i) => s + i.total, 0),
  };

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const subtotal = parseFloat(form.subtotal) || 0;
    const itbis = parseFloat(form.itbis) || 0;
    const total = subtotal + itbis;
    await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form, subtotal, itbis, total,
        items: form.items.filter(i => i.description),
      }),
    });
    setShowModal(false);
    setForm({ clientName: "", clientEmail: "", clientPhone: "", type: "PROFORMA", currency: "DOP", subtotal: "", itbis: "", notes: "", items: [{ description: "", quantity: 1, unitPrice: 0, total: 0 }] });
    load();
  }

  async function updateStatus(id: string, status: PaymentStatus) {
    await fetch(`/api/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  function fmt(amount: number, currency: string) {
    return new Intl.NumberFormat("es-DO", { style: "currency", currency }).format(amount);
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <PageHeader
        title="Facturación"
        subtitle="Facturas y estado de pagos"
        action={
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition"
            style={{ background: "#E8610A" }}
          >
            + Nueva factura
          </button>
        }
      />

      {/* Stats */}
      <div className="px-6 pt-4 pb-2 grid grid-cols-3 gap-3 shrink-0">
        {[
          { label: "Total facturado", value: fmt(totals.billed, "DOP"), color: "#6366F1" },
          { label: "Cobrado", value: fmt(totals.paid, "DOP"), color: "#10B981" },
          { label: "Pendiente", value: fmt(totals.pending, "DOP"), color: "#F59E0B" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>{s.label}</div>
            <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="px-6 pt-2 pb-3 flex gap-2 shrink-0">
        {(["ALL", "PENDIENTE", "PAGADO", "PARCIAL", "CANCELADO"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
            style={{
              background: filter === f ? "#E8610A" : "var(--surface)",
              color: filter === f ? "#fff" : "var(--text-muted)",
              border: `1px solid ${filter === f ? "#E8610A" : "var(--border)"}`,
            }}
          >
            {f === "ALL" ? "Todas" : STATUS_CONFIG[f].label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        {loading ? (
          <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">≡</div>
            <p className="font-medium" style={{ color: "var(--text)" }}>No hay facturas</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Crea la primera factura con el botón de arriba</p>
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
            {/* Desktop table */}
            <table className="w-full hidden md:table">
              <thead>
                <tr style={{ background: "var(--bg)", borderBottom: `1px solid var(--border)` }}>
                  {["#", "Cliente", "Tipo", "Total", "Estado", "Fecha", "Acciones"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv, i) => {
                  const st = STATUS_CONFIG[inv.status];
                  return (
                    <tr
                      key={inv.id}
                      className="border-t cursor-pointer hover:bg-orange-50/30 transition"
                      style={{ borderColor: "var(--border)", background: i % 2 === 0 ? "var(--surface)" : "transparent" }}
                      onClick={() => setSelected(inv)}
                    >
                      <td className="px-4 py-3 text-xs font-mono font-medium" style={{ color: "var(--text-muted)" }}>{inv.number}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-sm" style={{ color: "var(--text)" }}>{inv.clientName}</div>
                        {inv.clientEmail && <div className="text-xs" style={{ color: "var(--text-muted)" }}>{inv.clientEmail}</div>}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>{TYPE_LABELS[inv.type]}</td>
                      <td className="px-4 py-3 font-semibold text-sm" style={{ color: "var(--text)" }}>
                        {fmt(inv.total, inv.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ color: st.color, background: st.bg }}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
                        {new Date(inv.createdAt).toLocaleDateString("es-DO")}
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <select
                          value={inv.status}
                          onChange={e => updateStatus(inv.id, e.target.value as PaymentStatus)}
                          className="text-xs px-2 py-1 rounded-lg border"
                          style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
                        >
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

            {/* Mobile cards */}
            <div className="md:hidden divide-y" style={{ borderColor: "var(--border)" }}>
              {filtered.map((inv) => {
                const st = STATUS_CONFIG[inv.status];
                return (
                  <div key={inv.id} className="p-4" style={{ background: "var(--surface)" }} onClick={() => setSelected(inv)}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-sm" style={{ color: "var(--text)" }}>{inv.clientName}</div>
                        <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{inv.number} · {TYPE_LABELS[inv.type]}</div>
                      </div>
                      <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ color: st.color, background: st.bg }}>
                        {st.label}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="font-bold" style={{ color: "var(--text)" }}>{fmt(inv.total, inv.currency)}</div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>{new Date(inv.createdAt).toLocaleDateString("es-DO")}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* New invoice modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-lg rounded-2xl p-6 overflow-y-auto max-h-[90vh]" style={{ background: "var(--surface)" }}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-lg" style={{ color: "var(--text)" }}>Nueva factura</h3>
              <button onClick={() => setShowModal(false)} style={{ color: "var(--text-muted)" }}>✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Cliente *</label>
                  <input required value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }}
                    placeholder="Nombre del cliente" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Email</label>
                  <input value={form.clientEmail} onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))}
                    type="email" className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }} />
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
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Moneda</label>
                  <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value as "USD" | "DOP" }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }}>
                    <option value="DOP">DOP (Pesos)</option>
                    <option value="USD">USD (Dólares)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Subtotal *</label>
                  <input required value={form.subtotal} onChange={e => setForm(f => ({ ...f, subtotal: e.target.value }))}
                    type="number" step="0.01" className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>ITBIS (18%)</label>
                  <input value={form.itbis} onChange={e => setForm(f => ({ ...f, itbis: e.target.value }))}
                    type="number" step="0.01" className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Notas</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    rows={2} className="w-full border rounded-lg px-3 py-2 text-sm resize-none" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }} />
                </div>
              </div>

              {/* Total preview */}
              <div className="rounded-xl p-3 flex justify-between items-center" style={{ background: "var(--bg)" }}>
                <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Total</span>
                <span className="text-lg font-bold" style={{ color: "#E8610A" }}>
                  {new Intl.NumberFormat("es-DO", { style: "currency", currency: form.currency }).format(
                    (parseFloat(form.subtotal) || 0) + (parseFloat(form.itbis) || 0)
                  )}
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium border transition"
                  style={{ borderColor: "var(--border)", color: "var(--text)" }}>
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition"
                  style={{ background: "#E8610A" }}>
                  Crear factura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-lg rounded-2xl p-6 overflow-y-auto max-h-[90vh]" style={{ background: "var(--surface)" }}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="font-bold text-lg" style={{ color: "var(--text)" }}>{selected.number}</div>
                <div className="text-sm" style={{ color: "var(--text-muted)" }}>{TYPE_LABELS[selected.type]}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ color: "var(--text-muted)" }}>✕</button>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl p-4 border" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
                <div className="font-semibold text-sm mb-2" style={{ color: "var(--text)" }}>Cliente</div>
                <div style={{ color: "var(--text)" }}>{selected.clientName}</div>
                {selected.clientEmail && <div className="text-sm" style={{ color: "var(--text-muted)" }}>{selected.clientEmail}</div>}
                {selected.clientPhone && <div className="text-sm" style={{ color: "var(--text-muted)" }}>{selected.clientPhone}</div>}
              </div>

              {selected.items.length > 0 && (
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                  <div className="px-4 py-2 text-xs font-semibold" style={{ background: "var(--bg)", color: "var(--text-muted)" }}>Ítems</div>
                  {selected.items.map((item) => (
                    <div key={item.id} className="flex justify-between px-4 py-2 border-t text-sm" style={{ borderColor: "var(--border)" }}>
                      <span style={{ color: "var(--text)" }}>{item.description} × {item.quantity}</span>
                      <span className="font-medium" style={{ color: "var(--text)" }}>{fmt(item.total, selected.currency)}</span>
                    </div>
                  ))}
                </div>
              )}

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

              <div className="flex gap-2">
                {(["PENDIENTE", "PAGADO", "PARCIAL", "CANCELADO"] as PaymentStatus[]).map(st => (
                  <button
                    key={st}
                    onClick={() => { updateStatus(selected.id, st); setSelected(null); }}
                    className="flex-1 py-2 rounded-lg text-xs font-medium transition"
                    style={{
                      background: selected.status === st ? "#E8610A" : "var(--bg)",
                      color: selected.status === st ? "#fff" : "var(--text-muted)",
                      border: `1px solid ${selected.status === st ? "#E8610A" : "var(--border)"}`,
                    }}
                  >
                    {STATUS_CONFIG[st].label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
