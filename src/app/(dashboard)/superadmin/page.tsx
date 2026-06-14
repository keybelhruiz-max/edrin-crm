"use client";
import { useEffect, useState } from "react";

type Agency = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  isActive: boolean;
  primaryColor: string;
  billingEmail?: string | null;
  createdAt: string;
};

const PLANS = ["STARTER", "PRO", "ENTERPRISE"];

export default function SuperAdminPage() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    plan: "STARTER",
    primaryColor: "#E8610A",
    secondaryColor: "#1A1A2E",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
  });

  const load = () =>
    fetch("/api/agencies")
      .then((r) => r.json())
      .then((data) => { setAgencies(data); setLoading(false); });

  useEffect(() => { load(); }, []);

  const createAgency = async () => {
    if (!form.name || !form.slug) return;
    setCreating(true);
    await fetch("/api/agencies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowCreate(false);
    setForm({ name: "", slug: "", plan: "STARTER", primaryColor: "#E8610A", secondaryColor: "#1A1A2E", adminName: "", adminEmail: "", adminPassword: "" });
    setCreating(false);
    load();
  };

  const toggleActive = async (ag: Agency) => {
    await fetch(`/api/agencies/${ag.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !ag.isActive }),
    });
    load();
  };

  if (loading) return <div className="p-8 text-center" style={{ color: "var(--text-subtle)" }}>Cargando...</div>;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Gestión de agencias</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-subtle)" }}>
            Panel de plataforma — solo visible para SUPERADMIN
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-5 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: "var(--brand)" }}
        >
          + Nueva agencia
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total agencias", value: agencies.length },
          { label: "Activas", value: agencies.filter((a) => a.isActive).length },
          { label: "Enterprise", value: agencies.filter((a) => a.plan === "ENTERPRISE").length },
        ].map((stat) => (
          <div key={stat.label} className="card text-center">
            <div className="text-3xl font-black" style={{ color: "var(--brand)" }}>{stat.value}</div>
            <div className="text-xs mt-1" style={{ color: "var(--text-subtle)" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
              {["Agencia", "Slug", "Plan", "Email admin", "Creada", "Estado", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide" style={{ color: "var(--text-subtle)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {agencies.map((ag) => (
              <tr key={ag.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: ag.primaryColor }}
                    >
                      {ag.name[0]?.toUpperCase()}
                    </div>
                    <span className="font-medium" style={{ color: "var(--text)" }}>{ag.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text-subtle)" }}>{ag.slug}</td>
                <td className="px-4 py-3">
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{
                      background: ag.plan === "ENTERPRISE" ? "#FFF4EE" : ag.plan === "PRO" ? "#EFF6FF" : "var(--surface-2)",
                      color: ag.plan === "ENTERPRISE" ? "var(--brand)" : ag.plan === "PRO" ? "#2563EB" : "var(--text-subtle)",
                    }}
                  >
                    {ag.plan}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: "var(--text-subtle)" }}>{ag.billingEmail ?? "—"}</td>
                <td className="px-4 py-3 text-xs" style={{ color: "var(--text-subtle)" }}>
                  {new Date(ag.createdAt).toLocaleDateString("es-DO")}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{
                      background: ag.isActive ? "#DCFCE7" : "#FEE2E2",
                      color: ag.isActive ? "#16A34A" : "#DC2626",
                    }}
                  >
                    {ag.isActive ? "Activa" : "Inactiva"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(ag)}
                    className="text-xs px-3 py-1 rounded-lg border transition hover:opacity-80"
                    style={{ border: "1px solid var(--border)", color: "var(--text-subtle)" }}
                  >
                    {ag.isActive ? "Desactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-lg rounded-2xl shadow-xl p-6 space-y-5" style={{ background: "var(--surface)" }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Nueva agencia</h2>
              <button onClick={() => setShowCreate(false)} className="text-xl" style={{ color: "var(--text-subtle)" }}>✕</button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-subtle)" }}>Nombre</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border text-sm"
                    style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                    placeholder="Viajes El Sol"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-subtle)" }}>Slug único</label>
                  <input
                    value={form.slug}
                    onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value.toLowerCase().replace(/\s/g, "-") }))}
                    className="w-full px-3 py-2 rounded-xl border text-sm font-mono"
                    style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                    placeholder="viajes-el-sol"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-subtle)" }}>Plan</label>
                  <select
                    value={form.plan}
                    onChange={(e) => setForm((p) => ({ ...p, plan: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border text-sm"
                    style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                  >
                    {PLANS.map((pl) => <option key={pl}>{pl}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-subtle)" }}>Color de marca</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.primaryColor}
                      onChange={(e) => setForm((p) => ({ ...p, primaryColor: e.target.value }))}
                      className="w-9 h-9 rounded-lg border cursor-pointer"
                    />
                    <input
                      value={form.primaryColor}
                      onChange={(e) => setForm((p) => ({ ...p, primaryColor: e.target.value }))}
                      className="flex-1 px-3 py-2 rounded-xl border text-sm font-mono"
                      style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-3" style={{ borderColor: "var(--border)" }}>
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-subtle)" }}>
                  Admin de la agencia (opcional)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-subtle)" }}>Nombre</label>
                    <input
                      value={form.adminName}
                      onChange={(e) => setForm((p) => ({ ...p, adminName: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border text-sm"
                      style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-subtle)" }}>Email</label>
                    <input
                      type="email"
                      value={form.adminEmail}
                      onChange={(e) => setForm((p) => ({ ...p, adminEmail: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border text-sm"
                      style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-subtle)" }}>Contraseña inicial</label>
                    <input
                      type="password"
                      value={form.adminPassword}
                      onChange={(e) => setForm((p) => ({ ...p, adminPassword: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border text-sm"
                      style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 px-4 py-2 rounded-xl border text-sm"
                style={{ border: "1px solid var(--border)", color: "var(--text)" }}
              >
                Cancelar
              </button>
              <button
                onClick={createAgency}
                disabled={creating || !form.name || !form.slug}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: "var(--brand)", opacity: creating ? 0.7 : 1 }}
              >
                {creating ? "Creando…" : "Crear agencia"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
