"use client";
import { useEffect, useState, use } from "react";

type Agency = {
  id: string; name: string; slug: string; plan: string; isActive: boolean;
  primaryColor: string; secondaryColor: string;
  billingName?: string | null; billingRnc?: string | null;
  billingEmail?: string | null; billingPhone?: string | null;
  exchangeRateDOP: number; mayoristas: string;
  createdAt: string; updatedAt: string;
};
type User = { id: string; name: string | null; email: string; role: string; active: boolean; createdAt: string };
type SecurityLog = { id: string; event: string; email: string | null; ip: string | null; createdAt: string };

export default function AgencyDevView({ params }: { params: Promise<{ agencyId: string }> }) {
  const { agencyId } = use(params);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [tab, setTab] = useState<"overview" | "users" | "security" | "config">("overview");
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "VENTAS" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/agencies/${agencyId}`).then((r) => r.json()),
      fetch(`/api/users`).then((r) => r.json()),
      fetch(`/api/security?limit=50`).then((r) => r.json()),
    ]).then(([ag, us, sl]) => {
      setAgency(ag);
      setUsers(us);
      setLogs(sl);
      setLoading(false);
    });
  }, [agencyId]);

  const createUser = async () => {
    setSaving(true);
    await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });
    const updated = await fetch("/api/users").then((r) => r.json());
    setUsers(updated);
    setShowAddUser(false);
    setNewUser({ name: "", email: "", password: "", role: "VENTAS" });
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-center" style={{ color: "var(--text-subtle)" }}>Cargando datos de agencia...</div>;
  if (!agency) return <div className="p-8 text-center" style={{ color: "var(--text-subtle)" }}>Agencia no encontrada</div>;

  const tabs = [
    { id: "overview", label: "Resumen", icon: "📊" },
    { id: "users", label: `Usuarios (${users.length})`, icon: "👥" },
    { id: "security", label: "Seguridad", icon: "🔒" },
    { id: "config", label: "Configuración", icon: "⚙️" },
  ] as const;

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <a href="/superadmin" className="text-sm" style={{ color: "var(--text-subtle)" }}>← Agencias</a>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black" style={{ background: agency.primaryColor }}>
            {agency.name[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>{agency.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-mono" style={{ color: "var(--text-subtle)" }}>/{agency.slug}</span>
              <span className="px-1.5 py-0.5 rounded text-xs font-semibold" style={{ background: agency.isActive ? "#DCFCE7" : "#FEE2E2", color: agency.isActive ? "#16a34a" : "#dc2626" }}>
                {agency.isActive ? "Activa" : "Inactiva"}
              </span>
              <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: "var(--surface-2)", color: "var(--text-subtle)" }}>{agency.plan}</span>
              <span className="text-xs px-2 py-0.5 rounded" style={{ background: "#FEF3C7", color: "#d97706" }}>
                🛠 Vista Desarrollador
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: "var(--border)" }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px"
            style={{
              borderBottomColor: tab === t.id ? "var(--brand)" : "transparent",
              color: tab === t.id ? "var(--brand)" : "var(--text-subtle)",
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: "Usuarios activos", value: users.filter((u) => u.active).length },
            { label: "Tasa de cambio DOP", value: `$${agency.exchangeRateDOP}` },
            { label: "Eventos de seguridad", value: logs.length },
            { label: "Creada", value: new Date(agency.createdAt).toLocaleDateString("es-DO") },
            { label: "Última actualización", value: new Date(agency.updatedAt).toLocaleDateString("es-DO") },
            { label: "Mayoristas", value: (() => { try { return JSON.parse(agency.mayoristas).length; } catch { return 0; } })() },
          ].map((item) => (
            <div key={item.label} className="card">
              <div className="text-xs font-medium" style={{ color: "var(--text-subtle)" }}>{item.label}</div>
              <div className="text-2xl font-black mt-1" style={{ color: "var(--text)" }}>{item.value}</div>
            </div>
          ))}

          <div className="col-span-2 md:col-span-3 card space-y-2">
            <h3 className="font-semibold text-sm" style={{ color: "var(--text)" }}>Colores de marca</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg" style={{ background: agency.primaryColor }} />
                <div>
                  <div className="text-xs font-medium" style={{ color: "var(--text)" }}>Primario</div>
                  <div className="text-xs font-mono" style={{ color: "var(--text-subtle)" }}>{agency.primaryColor}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg" style={{ background: agency.secondaryColor }} />
                <div>
                  <div className="text-xs font-medium" style={{ color: "var(--text)" }}>Sidebar</div>
                  <div className="text-xs font-mono" style={{ color: "var(--text-subtle)" }}>{agency.secondaryColor}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users */}
      {tab === "users" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold" style={{ color: "var(--text)" }}>Usuarios de la agencia</h2>
            <button
              onClick={() => setShowAddUser(true)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: "var(--brand)" }}
            >
              + Agregar perfil
            </button>
          </div>
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                  {["Nombre", "Email", "Rol", "Estado", "Creado"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "var(--text-subtle)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} style={{ borderTop: "1px solid var(--border)" }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "var(--brand)" }}>
                          {(user.name ?? "U")[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-sm" style={{ color: "var(--text)" }}>{user.name ?? "Sin nombre"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text-subtle)" }}>{user.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "var(--surface-2)", color: "var(--text-subtle)" }}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: user.active ? "#DCFCE7" : "#FEE2E2", color: user.active ? "#16a34a" : "#dc2626" }}>
                        {user.active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text-subtle)" }}>
                      {new Date(user.createdAt).toLocaleDateString("es-DO")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {showAddUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
              <div className="w-96 rounded-2xl p-6 space-y-4 shadow-xl" style={{ background: "var(--surface)" }}>
                <h2 className="font-bold" style={{ color: "var(--text)" }}>Nuevo perfil / usuario</h2>
                {[
                  { key: "name" as const, label: "Nombre", type: "text" },
                  { key: "email" as const, label: "Email", type: "email" },
                  { key: "password" as const, label: "Contraseña inicial", type: "password" },
                ].map(({ key, label, type }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-subtle)" }}>{label}</label>
                    <input
                      type={type}
                      value={newUser[key]}
                      onChange={(e) => setNewUser((p) => ({ ...p, [key]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border text-sm"
                      style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-subtle)" }}>Rol</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border text-sm"
                    style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                  >
                    {["ADMIN", "VENTAS", "CONTABLE", "CONTENIDO"].map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowAddUser(false)} className="flex-1 py-2 rounded-xl border text-sm" style={{ border: "1px solid var(--border)", color: "var(--text)" }}>Cancelar</button>
                  <button onClick={createUser} disabled={saving} className="flex-1 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: "var(--brand)" }}>
                    {saving ? "Creando…" : "Crear"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Security */}
      {tab === "security" && (
        <div className="space-y-3">
          <h2 className="font-semibold" style={{ color: "var(--text)" }}>Últimos 50 eventos de seguridad</h2>
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                  {["Evento", "Email", "IP", "Fecha"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "var(--text-subtle)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 && <tr><td colSpan={4} className="text-center py-6 text-sm" style={{ color: "var(--text-subtle)" }}>Sin eventos</td></tr>}
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderTop: "1px solid var(--border)" }}>
                    <td className="px-4 py-2.5">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{
                          background: log.event === "LOGIN_OK" ? "#DCFCE7" : log.event === "LOGIN_FAIL" ? "#FEE2E2" : "var(--surface-2)",
                          color: log.event === "LOGIN_OK" ? "#16a34a" : log.event === "LOGIN_FAIL" ? "#dc2626" : "var(--text-subtle)",
                        }}
                      >
                        {log.event}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: "var(--text-subtle)" }}>{log.email ?? "—"}</td>
                    <td className="px-4 py-2.5 text-xs font-mono" style={{ color: "var(--text-subtle)" }}>{log.ip ?? "—"}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: "var(--text-subtle)" }}>
                      {new Date(log.createdAt).toLocaleString("es-DO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Config raw */}
      {tab === "config" && (
        <div className="space-y-4">
          <h2 className="font-semibold" style={{ color: "var(--text)" }}>Datos técnicos de la agencia</h2>
          <div className="card p-0 overflow-hidden">
            <pre
              className="p-5 text-xs overflow-auto"
              style={{ background: "var(--surface-2)", color: "var(--text)", maxHeight: 500, fontFamily: "monospace" }}
            >
              {JSON.stringify(agency, null, 2)}
            </pre>
          </div>
          <p className="text-xs" style={{ color: "var(--text-subtle)" }}>
            ⚠️ Vista de solo lectura. Para modificar, usa la página de ajustes de la agencia o la API directamente.
          </p>
        </div>
      )}
    </div>
  );
}
