"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui";

type Role = "ADMIN" | "VENTAS" | "CONTENIDO" | "CONTABLE";
interface User {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  active: boolean;
  createdAt: string;
  commissionRate: { rate: number } | null;
}

const ROLES: Record<Role, { label: string; color: string; bg: string }> = {
  ADMIN:     { label: "Admin",     color: "#7C3AED", bg: "#F5F3FF" },
  VENTAS:    { label: "Ventas",    color: "#E8610A", bg: "#FFF7ED" },
  CONTENIDO: { label: "Contenido", color: "#0891B2", bg: "#ECFEFF" },
  CONTABLE:  { label: "Contable",  color: "#059669", bg: "#ECFDF5" },
};

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "VENTAS" as Role, commissionRate: "5" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const r = await fetch("/api/users");
    if (r.ok) setUsers(await r.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openNew() {
    setEditing(null);
    setForm({ name: "", email: "", password: "", role: "VENTAS", commissionRate: "5" });
    setError("");
    setShowModal(true);
  }

  function openEdit(u: User) {
    setEditing(u);
    setForm({ name: u.name ?? "", email: u.email, password: "", role: u.role, commissionRate: String(u.commissionRate?.rate ?? 5) });
    setError("");
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      let res: Response;
      if (editing) {
        const body: Record<string, unknown> = { name: form.name, role: form.role, commissionRate: form.commissionRate };
        if (form.password) body.password = form.password;
        res = await fetch(`/api/users/${editing.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
      } else {
        res = await fetch("/api/users", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, commissionRate: form.commissionRate }),
        });
      }
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Error al guardar");
      } else {
        setShowModal(false);
        load();
      }
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(u: User) {
    await fetch(`/api/users/${u.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !u.active }),
    });
    load();
  }

  return (
    <div className="flex flex-col min-h-screen pb-20 md:pb-0" style={{ background: "var(--bg)" }}>
      <PageHeader title="Usuarios" subtitle="Gestiona el equipo y sus permisos">
        <button onClick={openNew}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: "#E8610A" }}>
          + Nuevo usuario
        </button>
      </PageHeader>

      <div className="p-4 md:p-6">
        {loading ? (
          <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>Cargando...</div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
              <table className="w-full">
                <thead>
                  <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                    {["Usuario", "Email", "Rol", "Comisión", "Estado", ""].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => {
                    const rc = ROLES[u.role] ?? ROLES.VENTAS;
                    return (
                      <tr key={u.id}
                        className="border-t transition hover:bg-orange-50/20"
                        style={{ borderColor: "var(--border)", background: i % 2 === 0 ? "var(--surface)" : "var(--surface-2)", opacity: u.active ? 1 : 0.5 }}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                              style={{ background: "#E8610A" }}>
                              {(u.name ?? u.email)[0].toUpperCase()}
                            </div>
                            <span className="font-medium text-sm" style={{ color: "var(--text)" }}>{u.name ?? "—"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>{u.email}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ color: rc.color, background: rc.bg }}>
                            {rc.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: "var(--text)" }}>
                          {u.commissionRate ? `${u.commissionRate.rate}%` : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => toggleActive(u)}
                            className="px-2 py-0.5 rounded-full text-xs font-semibold"
                            style={{ background: u.active ? "#ECFDF5" : "#FEF2F2", color: u.active ? "#059669" : "#DC2626" }}>
                            {u.active ? "Activo" : "Inactivo"}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => openEdit(u)}
                            className="text-xs px-3 py-1 rounded-lg border transition"
                            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                            Editar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {users.map(u => {
                const rc = ROLES[u.role] ?? ROLES.VENTAS;
                return (
                  <div key={u.id} className="rounded-2xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)", opacity: u.active ? 1 : 0.6 }}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                          style={{ background: "#E8610A" }}>
                          {(u.name ?? u.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-sm" style={{ color: "var(--text)" }}>{u.name ?? "—"}</div>
                          <div className="text-xs" style={{ color: "var(--text-muted)" }}>{u.email}</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ color: rc.color, background: rc.bg }}>{rc.label}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <button onClick={() => toggleActive(u)}
                        className="px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: u.active ? "#ECFDF5" : "#FEF2F2", color: u.active ? "#059669" : "#DC2626" }}>
                        {u.active ? "Activo" : "Inactivo"}
                      </button>
                      {u.commissionRate && <span className="text-xs" style={{ color: "var(--text-muted)" }}>Comisión: {u.commissionRate.rate}%</span>}
                      <button onClick={() => openEdit(u)} className="ml-auto text-xs px-3 py-1 rounded-lg border"
                        style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>Editar</button>
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
          <div className="w-full max-w-md rounded-3xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: "var(--surface)" }}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-lg" style={{ color: "var(--text)" }}>
                {editing ? "Editar usuario" : "Nuevo usuario"}
              </h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "var(--bg)", color: "var(--text-muted)" }}>✕</button>
            </div>

            {error && (
              <div className="mb-4 px-3 py-2 rounded-xl text-sm" style={{ background: "#FEF2F2", color: "#DC2626" }}>{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Nombre *</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border px-3 py-2 text-sm rounded-xl"
                  style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }}
                  placeholder="Nombre completo" />
              </div>
              {!editing && (
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Email *</label>
                  <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full border px-3 py-2 text-sm rounded-xl"
                    style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }}
                    placeholder="correo@agencia.com" />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
                  {editing ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña *"}
                </label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required={!editing}
                  className="w-full border px-3 py-2 text-sm rounded-xl"
                  style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }}
                  placeholder="Mínimo 6 caracteres" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Rol</label>
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as Role }))}
                    className="w-full border px-3 py-2 text-sm rounded-xl"
                    style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }}>
                    <option value="VENTAS">Ventas</option>
                    <option value="ADMIN">Admin</option>
                    <option value="CONTENIDO">Contenido</option>
                    <option value="CONTABLE">Contable</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Comisión (%)</label>
                  <input type="number" min="0" max="100" step="0.5" value={form.commissionRate}
                    onChange={e => setForm(f => ({ ...f, commissionRate: e.target.value }))}
                    className="w-full border px-3 py-2 text-sm rounded-xl"
                    style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-medium border"
                  style={{ borderColor: "var(--border)", color: "var(--text)" }}>Cancelar</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-semibold text-white"
                  style={{ background: saving ? "#ccc" : "#E8610A" }}>
                  {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
