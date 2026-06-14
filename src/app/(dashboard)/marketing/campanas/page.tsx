"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card, Btn, Input, Select } from "@/components/ui";

interface Campaign {
  id: string;
  name: string;
  platform: string;
  type: string;
  status: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  leads: number;
  revenue: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

const PLATFORM_ICONS: Record<string, string> = {
  META: "👥", INSTAGRAM: "📸", TIKTOK: "🎵", GOOGLE: "🔍",
  WHATSAPP: "💬", EMAIL: "📧", ORGANIC: "🌱", OTHER: "📢",
};

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  DRAFT: { color: "#6b7280", label: "Borrador" },
  ACTIVE: { color: "#10b981", label: "Activa" },
  PAUSED: { color: "#f59e0b", label: "Pausada" },
  ENDED: { color: "#6366f1", label: "Finalizada" },
};

export default function CampanasPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "", platform: "META", type: "PAID_ADS", status: "DRAFT",
    budget: "", startDate: "", endDate: "",
  });
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Campaign | null>(null);

  useEffect(() => {
    fetch("/api/marketing/campaigns").then(r => r.json()).then((d) => setCampaigns(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const filtered = filter === "all" ? campaigns : campaigns.filter(c => c.status === filter);

  const totals = {
    budget: campaigns.reduce((s, c) => s + c.budget, 0),
    spent: campaigns.reduce((s, c) => s + c.spent, 0),
    impressions: campaigns.reduce((s, c) => s + c.impressions, 0),
    clicks: campaigns.reduce((s, c) => s + c.clicks, 0),
    leads: campaigns.reduce((s, c) => s + c.leads, 0),
    revenue: campaigns.reduce((s, c) => s + c.revenue, 0),
  };
  const totalRoi = totals.spent > 0 ? ((totals.revenue - totals.spent) / totals.spent) * 100 : 0;
  const cpl = totals.leads > 0 ? totals.spent / totals.leads : 0;
  const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/marketing/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, budget: parseFloat(form.budget) || 0 }),
      });
      const c = await res.json();
      setCampaigns(prev => [c, ...prev]);
      setShowForm(false);
      setForm({ name: "", platform: "META", type: "PAID_ADS", status: "ACTIVE", budget: "", startDate: "", endDate: "" });
    } finally { setSaving(false); }
  }

  async function deleteCampaign(id: string) {
    await fetch(`/api/marketing/campaigns/${id}`, { method: "DELETE" });
    setCampaigns(prev => prev.filter(c => c.id !== id));
    setSelected(null);
  }

  function roi(c: Campaign) {
    return c.spent > 0 ? ((c.revenue - c.spent) / c.spent) * 100 : 0;
  }

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <div className="max-w-7xl mx-auto px-8 py-8">
        <PageHeader
          title="Campañas publicitarias"
          subtitle="Meta Ads, TikTok Ads, Google Ads y campañas orgánicas"
          action={<Btn onClick={() => setShowForm(true)}>+ Nueva campaña</Btn>}
        />

        {/* Global KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {[
            { label: "Presupuesto", value: `$${totals.budget.toFixed(0)}`, color: "var(--text)" },
            { label: "Gastado", value: `$${totals.spent.toFixed(0)}`, color: "#f59e0b" },
            { label: "Impresiones", value: totals.impressions.toLocaleString(), color: "var(--brand)" },
            { label: "CTR", value: `${ctr.toFixed(2)}%`, color: "#6366f1" },
            { label: "Leads", value: totals.leads, color: "#10b981" },
            { label: "ROI", value: `${totalRoi >= 0 ? "+" : ""}${totalRoi.toFixed(0)}%`, color: totalRoi >= 0 ? "#10b981" : "#ef4444" },
          ].map(k => (
            <Card key={k.label} className="text-center py-3">
              <div className="text-xl font-black mb-0.5" style={{ color: k.color }}>{k.value}</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>{k.label}</div>
            </Card>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5">
          {["all", "ACTIVE", "PAUSED", "ENDED", "DRAFT"].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition"
              style={{
                background: filter === s ? "var(--brand)" : "var(--surface)",
                color: filter === s ? "#fff" : "var(--text)",
                border: "1px solid var(--border)",
              }}>
              {s === "all" ? "Todas" : STATUS_CONFIG[s]?.label}
              {" "}({s === "all" ? campaigns.length : campaigns.filter(c => c.status === s).length})
            </button>
          ))}
        </div>

        {/* Campaigns table */}
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                {["Campaña","Plataforma","Estado","Gastado","Leads","CPL","Revenue","ROI",""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-sm" style={{ color: "var(--text-muted)" }}>
                    Sin campañas {filter !== "all" ? `con estado "${STATUS_CONFIG[filter]?.label}"` : ""}
                  </td>
                </tr>
              )}
              {filtered.map((c, i) => {
                const st = STATUS_CONFIG[c.status] ?? { color: "#6b7280", label: c.status };
                const campRoi = roi(c);
                const campCpl = c.leads > 0 ? c.spent / c.leads : 0;
                return (
                  <tr key={c.id} onClick={() => setSelected(c)}
                    className="cursor-pointer transition hover:opacity-80"
                    style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none", background: "var(--surface)" }}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm" style={{ color: "var(--text)" }}>{c.name}</div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>{c.type}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span>{PLATFORM_ICONS[c.platform] ?? "📢"}</span>
                        <span className="text-sm" style={{ color: "var(--text)" }}>{c.platform}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full font-medium"
                        style={{ background: st.color + "22", color: st.color }}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--text)" }}>${c.spent.toFixed(0)}</td>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: "#10b981" }}>{c.leads}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--text)" }}>
                      {campCpl > 0 ? `$${campCpl.toFixed(0)}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--text)" }}>${c.revenue.toFixed(0)}</td>
                    <td className="px-4 py-3 text-sm font-bold" style={{ color: campRoi >= 0 ? "#10b981" : "#ef4444" }}>
                      {campRoi >= 0 ? "+" : ""}{campRoi.toFixed(0)}%
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={e => { e.stopPropagation(); deleteCampaign(c.id); }}
                        className="text-xs hover:opacity-70" style={{ color: "#ef4444" }}>✕</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary cards */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <Card>
              <h4 className="font-semibold mb-3" style={{ color: "var(--text)" }}>Por plataforma</h4>
              {Object.entries(
                filtered.reduce((acc, c) => {
                  acc[c.platform] = (acc[c.platform] ?? 0) + c.leads;
                  return acc;
                }, {} as Record<string, number>)
              ).sort((a,b) => b[1]-a[1]).map(([p, leads]) => (
                <div key={p} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <span>{PLATFORM_ICONS[p] ?? "📢"}</span>
                    <span className="text-sm" style={{ color: "var(--text)" }}>{p}</span>
                  </div>
                  <span className="text-sm font-medium" style={{ color: "#10b981" }}>{leads} leads</span>
                </div>
              ))}
            </Card>
            <Card>
              <h4 className="font-semibold mb-3" style={{ color: "var(--text)" }}>Resumen financiero</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: "var(--text-muted)" }}>Presupuesto total</span>
                  <span style={{ color: "var(--text)" }}>${totals.budget.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--text-muted)" }}>Total gastado</span>
                  <span style={{ color: "var(--text)" }}>${totals.spent.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--text-muted)" }}>Revenue generado</span>
                  <span style={{ color: "#10b981" }}>${totals.revenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-2" style={{ borderColor: "var(--border)" }}>
                  <span className="font-semibold" style={{ color: "var(--text)" }}>ROI neto</span>
                  <span className="font-bold" style={{ color: totalRoi >= 0 ? "#10b981" : "#ef4444" }}>
                    {totalRoi >= 0 ? "+" : ""}{totalRoi.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--text-muted)" }}>Costo por lead</span>
                  <span style={{ color: "var(--text)" }}>${cpl.toFixed(0)}</span>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Campaign detail */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="rounded-2xl p-6 w-full max-w-md" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold" style={{ color: "var(--text)" }}>{selected.name}</h3>
              <button onClick={() => setSelected(null)} style={{ color: "var(--text-muted)" }}>✕</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {[
                { label: "Presupuesto", value: `$${selected.budget.toLocaleString()}` },
                { label: "Gastado", value: `$${selected.spent.toLocaleString()}` },
                { label: "Impresiones", value: selected.impressions.toLocaleString() },
                { label: "Clics", value: selected.clicks.toLocaleString() },
                { label: "Leads", value: selected.leads },
                { label: "Revenue", value: `$${selected.revenue.toLocaleString()}` },
                { label: "ROI", value: `${roi(selected).toFixed(1)}%` },
                { label: "CPL", value: selected.leads > 0 ? `$${(selected.spent/selected.leads).toFixed(0)}` : "—" },
              ].map(m => (
                <div key={m.label} className="p-3 rounded-lg" style={{ background: "var(--bg)" }}>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>{m.label}</div>
                  <div className="font-bold" style={{ color: "var(--text)" }}>{m.value}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Btn variant="danger" onClick={() => deleteCampaign(selected.id)}>Eliminar</Btn>
              <Btn variant="secondary" onClick={() => setSelected(null)}>Cerrar</Btn>
            </div>
          </div>
        </div>
      )}

      {/* New campaign form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="rounded-2xl p-6 w-full max-w-md" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg" style={{ color: "var(--text)" }}>Nueva campaña</h3>
              <button onClick={() => setShowForm(false)} style={{ color: "var(--text-muted)" }}>✕</button>
            </div>
            <div className="space-y-3">
              <Input label="Nombre" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Semana Santa 2026" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Plataforma</label>
                  <select value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}>
                    {Object.keys(PLATFORM_ICONS).map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Tipo</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}>
                    <option value="PAID_ADS">Pauta pagada</option>
                    <option value="ORGANIC">Orgánica</option>
                    <option value="EMAIL">Email marketing</option>
                    <option value="INFLUENCER">Influencer</option>
                  </select>
                </div>
              </div>
              <Input label="Presupuesto (USD)" type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="500" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Fecha inicio" type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                <Input label="Fecha fin" type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <Btn onClick={save} disabled={saving || !form.name}>{saving ? "Guardando..." : "Crear campaña"}</Btn>
              <Btn variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
