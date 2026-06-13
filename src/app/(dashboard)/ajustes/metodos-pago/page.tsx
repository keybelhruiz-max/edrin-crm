"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui";

interface PaymentMethod {
  id: string; name: string; type: string;
  bankName: string | null; accountNum: string | null;
  description: string | null; currency: string;
  isActive: boolean; order: number; createdAt: string;
}

const TYPE_ICONS: Record<string, string> = {
  EFECTIVO: "💵", TRANSFERENCIA: "🏦", TARJETA: "💳", CHEQUE: "📄", OTRO: "💰",
};
const TYPE_LABELS: Record<string, string> = {
  EFECTIVO: "Efectivo", TRANSFERENCIA: "Transferencia", TARJETA: "Tarjeta", CHEQUE: "Cheque", OTRO: "Otro",
};

export default function MetodosPagoPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [form, setForm] = useState({
    name: "", type: "TRANSFERENCIA", bankName: "", accountNum: "",
    description: "", currency: "DOP", isActive: true,
  });

  async function load() {
    setLoading(true);
    const r = await fetch("/api/payment-methods");
    if (r.ok) setMethods(await r.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", type: "TRANSFERENCIA", bankName: "", accountNum: "", description: "", currency: "DOP", isActive: true });
    setShowModal(true);
  }

  function openEdit(m: PaymentMethod) {
    setEditing(m);
    setForm({ name: m.name, type: m.type, bankName: m.bankName ?? "", accountNum: m.accountNum ?? "", description: m.description ?? "", currency: m.currency, isActive: m.isActive });
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, bankName: form.bankName || null, accountNum: form.accountNum || null, description: form.description || null };
    if (editing) {
      await fetch(`/api/payment-methods/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    } else {
      await fetch("/api/payment-methods", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    setShowModal(false);
    load();
  }

  async function toggleActive(m: PaymentMethod) {
    await fetch(`/api/payment-methods/${m.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !m.isActive }) });
    load();
  }

  async function deleteMethod(id: string) {
    if (!confirm("¿Eliminar este método de pago?")) return;
    await fetch(`/api/payment-methods/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--bg)" }}>
      <PageHeader title="Métodos de pago" subtitle="Configura los métodos de pago que acepta la agencia"
        action={
          <button onClick={openCreate}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: "#E8610A" }}>
            + Agregar método
          </button>
        }
      />

      <div className="px-6 py-4">
        {/* Info banner */}
        <div className="mb-5 p-4 rounded-2xl text-sm" style={{ background: "#FFF4EE", border: "1px solid #FED7AA", color: "#92400E" }}>
          <strong>💡 Métodos de pago configurados aquí</strong> aparecerán como opciones al registrar gastos, facturas y pagos a proveedores. Puedes agregar cuentas bancarias, billeteras digitales, efectivo, etc.
        </div>

        {loading ? <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>Cargando...</div>
        : methods.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">💳</div>
            <p className="font-medium" style={{ color: "var(--text)" }}>Sin métodos de pago</p>
            <p className="text-sm mt-1 mb-4" style={{ color: "var(--text-muted)" }}>Agrega los métodos que acepta tu agencia</p>
            <button onClick={openCreate} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: "#E8610A" }}>
              + Agregar el primero
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {methods.map(m => (
              <div key={m.id} className="rounded-2xl border p-5 flex items-center gap-4"
                style={{ background: "var(--surface)", borderColor: "var(--border)", opacity: m.isActive ? 1 : 0.6 }}>
                <div className="text-3xl">{TYPE_ICONS[m.type] ?? "💰"}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold" style={{ color: "var(--text)" }}>{m.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: "var(--bg)", color: "var(--text-muted)" }}>
                      {TYPE_LABELS[m.type]}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-lg font-semibold" style={{ background: m.currency === "USD" ? "#EFF6FF" : "#F0FDF4", color: m.currency === "USD" ? "#1D4ED8" : "#166534" }}>
                      {m.currency}
                    </span>
                    {!m.isActive && <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: "#FEF2F2", color: "#DC2626" }}>Inactivo</span>}
                  </div>
                  {m.bankName && <div className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>{m.bankName}</div>}
                  {m.accountNum && <div className="text-xs font-mono mt-0.5" style={{ color: "var(--text-subtle)" }}>{m.accountNum}</div>}
                  {m.description && <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{m.description}</div>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => toggleActive(m)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium border transition"
                    style={{ borderColor: "var(--border)", color: "var(--text-muted)", background: "var(--bg)" }}>
                    {m.isActive ? "Desactivar" : "Activar"}
                  </button>
                  <button onClick={() => openEdit(m)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium border transition"
                    style={{ borderColor: "var(--border)", color: "var(--text)", background: "var(--bg)" }}>
                    Editar
                  </button>
                  <button onClick={() => deleteMethod(m.id)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium border transition"
                    style={{ borderColor: "#FCA5A5", color: "#DC2626", background: "#FEF2F2" }}>
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-lg rounded-3xl p-6 overflow-y-auto max-h-[90vh]" style={{ background: "var(--surface)", boxShadow: "var(--shadow-lg)" }}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-lg" style={{ color: "var(--text)" }}>{editing ? "Editar método" : "Nuevo método de pago"}</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--bg)", color: "var(--text-muted)" }}>✕</button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Nombre del método *</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)", borderRadius: "10px" }}
                  placeholder="Ej: Cuenta BHD Pesos, Efectivo caja, Zelle..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Tipo</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)", borderRadius: "10px" }}>
                    <option value="TRANSFERENCIA">🏦 Transferencia</option>
                    <option value="EFECTIVO">💵 Efectivo</option>
                    <option value="TARJETA">💳 Tarjeta</option>
                    <option value="CHEQUE">📄 Cheque</option>
                    <option value="OTRO">💰 Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Moneda</label>
                  <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                    className="w-full border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)", borderRadius: "10px" }}>
                    <option value="DOP">🇩🇴 DOP — Pesos</option>
                    <option value="USD">🇺🇸 USD — Dólares</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Banco / Institución</label>
                  <input value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))}
                    className="w-full border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)", borderRadius: "10px" }}
                    placeholder="Ej: BHD León, Popular..." />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Número de cuenta</label>
                  <input value={form.accountNum} onChange={e => setForm(f => ({ ...f, accountNum: e.target.value }))}
                    className="w-full border px-3 py-2 text-sm font-mono" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)", borderRadius: "10px" }}
                    placeholder="Ej: 012-345678-9" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Descripción / Notas internas</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} className="w-full border px-3 py-2 text-sm resize-none" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)", borderRadius: "10px" }} />
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 rounded" />
                  <span className="text-sm" style={{ color: "var(--text)" }}>Activo (disponible al registrar pagos)</span>
                </label>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-medium border" style={{ borderColor: "var(--border)", color: "var(--text)" }}>Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 rounded-2xl text-sm font-semibold text-white" style={{ background: "#E8610A" }}>
                  {editing ? "Guardar cambios" : "Crear método"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
