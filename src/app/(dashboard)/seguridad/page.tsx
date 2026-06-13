"use client";
import { useEffect, useState } from "react";

type Log = {
  id: string;
  event: string;
  email: string | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string } | null;
};

const EVENT_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  LOGIN_OK: { bg: "#DCFCE7", color: "#16a34a", label: "Login OK" },
  LOGIN_FAIL: { bg: "#FEE2E2", color: "#dc2626", label: "Login fallido" },
  LOGOUT: { bg: "#F1F5F9", color: "#64748b", label: "Logout" },
  SESSION_REVOKED: { bg: "#FEF3C7", color: "#d97706", label: "Sesión revocada" },
  PASSWORD_CHANGED: { bg: "#EFF6FF", color: "#2563eb", label: "Contraseña cambiada" },
  "2FA_ENABLED": { bg: "#F5F3FF", color: "#7c3aed", label: "2FA activado" },
};

export default function SeguridadPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetch("/api/security?limit=200")
      .then((r) => r.json())
      .then((d) => { setLogs(d); setLoading(false); });
  }, []);

  const filtered = logs.filter((l) => {
    if (!filter) return true;
    return (
      l.event === filter ||
      l.email?.includes(filter) ||
      l.user?.name?.toLowerCase().includes(filter.toLowerCase()) ||
      l.ip?.includes(filter)
    );
  });

  const stats = {
    total: logs.length,
    ok: logs.filter((l) => l.event === "LOGIN_OK").length,
    fail: logs.filter((l) => l.event === "LOGIN_FAIL").length,
    unique: new Set(logs.map((l) => l.ip).filter(Boolean)).size,
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Centro de seguridad</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-subtle)" }}>
          Auditoría de accesos, intentos de login y eventos de seguridad
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total eventos", value: stats.total, color: "var(--text)" },
          { label: "Logins exitosos", value: stats.ok, color: "#16a34a" },
          { label: "Intentos fallidos", value: stats.fail, color: "#dc2626" },
          { label: "IPs únicas", value: stats.unique, color: "#2563eb" },
        ].map((s) => (
          <div key={s.label} className="card text-center">
            <div className="text-3xl font-black" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs mt-1" style={{ color: "var(--text-subtle)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Info banner */}
      <div className="rounded-xl p-4 flex gap-3" style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
        <span className="text-xl">🔒</span>
        <div>
          <p className="text-sm font-semibold" style={{ color: "#1e40af" }}>Bloqueo automático activo</p>
          <p className="text-xs mt-0.5" style={{ color: "#2563eb" }}>
            Después de 5 intentos fallidos en 15 minutos, la cuenta queda bloqueada automáticamente.
            Los logins exitosos se registran con fecha, hora e IP.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Buscar por email, IP o usuario..."
          className="px-3 py-2 rounded-xl border text-sm flex-1 min-w-48"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
        />
        {["", "LOGIN_OK", "LOGIN_FAIL", "LOGOUT"].map((ev) => (
          <button
            key={ev}
            onClick={() => setFilter(ev)}
            className="px-3 py-2 rounded-xl text-xs font-medium border transition"
            style={{
              background: filter === ev ? "var(--brand)" : "var(--surface)",
              color: filter === ev ? "white" : "var(--text-subtle)",
              border: `1px solid ${filter === ev ? "var(--brand)" : "var(--border)"}`,
            }}
          >
            {ev || "Todos"}
          </button>
        ))}
      </div>

      {/* Logs table */}
      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
              {["Evento", "Usuario", "Email", "IP", "User Agent", "Fecha"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "var(--text-subtle)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="text-center py-8 text-sm" style={{ color: "var(--text-subtle)" }}>Cargando logs...</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-sm" style={{ color: "var(--text-subtle)" }}>Sin eventos registrados</td></tr>
            )}
            {filtered.map((log) => {
              const style = EVENT_STYLES[log.event] ?? { bg: "var(--surface-2)", color: "var(--text-subtle)", label: log.event };
              const ua = log.userAgent ?? "";
              const browser = ua.includes("Chrome") ? "Chrome" : ua.includes("Firefox") ? "Firefox" : ua.includes("Safari") ? "Safari" : "Otro";
              const device = ua.includes("Mobile") ? "📱" : "💻";
              return (
                <tr key={log.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: style.bg, color: style.color }}>
                      {style.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-medium" style={{ color: "var(--text)" }}>
                    {log.user?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--text-subtle)" }}>{log.email ?? "—"}</td>
                  <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--text-subtle)" }}>{log.ip ?? "—"}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--text-subtle)" }}>{device} {browser}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--text-subtle)" }}>
                    {new Date(log.createdAt).toLocaleString("es-DO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
