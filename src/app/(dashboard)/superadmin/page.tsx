"use client";

import { useState, useEffect, useRef } from "react";
import {
  Building2,
  CircleDollarSign,
  UsersRound,
  LifeBuoy,
  TrendingUp,
  TrendingDown,
  Search,
  Bell,
  Plus,
  LogIn,
  Pause,
  Play,
  MoreHorizontal,
  ArrowRight,
} from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────────

type Agency = {
  name: string;
  country: string;
  plan: "Pro" | "Business" | "Starter";
  users: number;
  use: number;
  mrr: number;
  last: string;
  status: "activa" | "prueba" | "suspendida";
  color: string;
};

// ── Static data ─────────────────────────────────────────────────────────────

const AGENCIES: Agency[] = [
  { name: "Edrin Travel", country: "Rep. Dominicana", plan: "Pro", users: 8, use: 72, mrr: 490, last: "hace 5 min", status: "activa", color: "#E8610A" },
  { name: "Caribe Tours", country: "Colombia", plan: "Business", users: 14, use: 88, mrr: 890, last: "hace 1 h", status: "activa", color: "#0E9384" },
  { name: "Andes Viajes", country: "Perú", plan: "Pro", users: 6, use: 54, mrr: 490, last: "hace 2 h", status: "activa", color: "#3B82F6" },
  { name: "Sol y Playa", country: "México", plan: "Starter", users: 3, use: 31, mrr: 190, last: "ayer", status: "prueba", color: "#8B5CF6" },
  { name: "Patagonia Expedic.", country: "Argentina", plan: "Business", users: 18, use: 96, mrr: 890, last: "hace 30 min", status: "activa", color: "#F59E0B" },
  { name: "Tropical Escapes", country: "Panamá", plan: "Pro", users: 7, use: 67, mrr: 490, last: "hace 3 h", status: "activa", color: "#10B981" },
  { name: "Maya Adventures", country: "Guatemala", plan: "Starter", users: 2, use: 18, mrr: 190, last: "hace 4 días", status: "suspendida", color: "#EF4444" },
  { name: "Costa Azul Viajes", country: "Costa Rica", plan: "Pro", users: 9, use: 79, mrr: 490, last: "hace 1 h", status: "activa", color: "#6429b8" },
];

const MRR_BARS = [
  { label: "Ene", pct: 46, highlight: false },
  { label: "Feb", pct: 54, highlight: false },
  { label: "Mar", pct: 60, highlight: false },
  { label: "Abr", pct: 68, highlight: false },
  { label: "May", pct: 80, highlight: false },
  { label: "Jun", pct: 94, highlight: true },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string): string {
  return name
    .replace(/[^A-Za-zÁÉÍÓÚáéíóúñÑ ]/g, "")
    .trim()
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function planBadgeStyle(plan: Agency["plan"]): React.CSSProperties {
  if (plan === "Pro") return { color: "var(--brand)", background: "var(--brand-light)", border: "1px solid var(--brand-100)" };
  if (plan === "Business") return { color: "#6429b8", background: "#F4EBFF", border: "1px solid #E9D7FE" };
  return { color: "var(--muted)", background: "var(--bg)", border: "1px solid var(--border)" };
}

function statusStyle(status: Agency["status"]): React.CSSProperties {
  if (status === "activa") return { color: "#067647", background: "#ECFDF3" };
  if (status === "prueba") return { color: "#B54708", background: "#FFFAEB" };
  return { color: "#B42318", background: "#FEF3F2" };
}

function statusLabel(status: Agency["status"]) {
  if (status === "activa") return "Activa";
  if (status === "prueba") return "Prueba";
  return "Suspendida";
}

function usageBarColor(use: number): string {
  if (use >= 90) return "#EF4444";
  if (use >= 75) return "#F59E0B";
  return "var(--cool)";
}

// ── MRR animated bar chart ───────────────────────────────────────────────────

function MrrChart() {
  const [heights, setHeights] = useState<number[]>(MRR_BARS.map(() => 0));
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    MRR_BARS.forEach((bar, i) => {
      setTimeout(() => {
        setHeights((prev) => {
          const next = [...prev];
          next[i] = bar.pct;
          return next;
        });
      }, 60 + i * 80);
    });
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 180, paddingTop: 6 }}>
      {MRR_BARS.map((bar, i) => (
        <div
          key={bar.label}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 9,
            height: "100%",
            justifyContent: "flex-end",
          }}
        >
          <div
            style={{
              width: "62%",
              borderRadius: "6px 6px 3px 3px",
              height: `${heights[i]}%`,
              background: bar.highlight
                ? "linear-gradient(180deg,var(--brand),var(--brand-dark))"
                : "#E9E3DE",
              transition: "height 0.8s cubic-bezier(.2,.7,.2,1)",
              boxShadow: bar.highlight ? "0 4px 12px -4px var(--brand)" : undefined,
            }}
          />
          <span style={{ fontSize: 11, color: "var(--subtle)", fontWeight: 600 }}>{bar.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function SuperAdminPage() {
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [topSearch, setTopSearch] = useState("");

  // Normalize for diacritic-insensitive search
  const norm = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  const effectiveSearch = topSearch || search;

  const filtered = AGENCIES.filter((a) => {
    const q = norm(effectiveSearch.trim());
    const matchSearch = !q || norm(a.name).includes(q) || norm(a.country).includes(q);
    const matchPlan = !planFilter || a.plan === planFilter;
    const matchStatus = !statusFilter || a.status === statusFilter;
    return matchSearch && matchPlan && matchStatus;
  });

  // When top search changes, keep search field in sync
  const handleTopSearch = (val: string) => {
    setTopSearch(val);
    setSearch(val);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      {/* ── Top header ──────────────────────────────────────────────────────── */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "14px 24px",
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          flexWrap: "wrap",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 19,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 9,
              color: "var(--text)",
            }}
          >
            Panel Superadmin
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--brand)",
                background: "var(--brand-light)",
                border: "1px solid var(--brand-100)",
                padding: "3px 8px",
                borderRadius: 6,
              }}
            >
              SUPERADMIN
            </span>
          </h1>
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>
            48 agencias · 14 de junio, 2026
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Search */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: 9,
            padding: "8px 12px",
            width: 280,
            transition: "border-color 0.15s",
          }}
        >
          <Search size={15} style={{ color: "var(--subtle)", flexShrink: 0 }} />
          <input
            value={topSearch}
            onChange={(e) => handleTopSearch(e.target.value)}
            placeholder="Buscar agencia…"
            style={{
              border: 0,
              background: "transparent",
              outline: "none",
              fontFamily: "inherit",
              fontSize: 13,
              color: "var(--text)",
              width: "100%",
            }}
          />
        </div>

        {/* Bell */}
        <button
          style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            display: "grid",
            placeItems: "center",
            color: "var(--muted)",
            cursor: "pointer",
            position: "relative",
          }}
        >
          <Bell size={17} />
          <span
            style={{
              position: "absolute",
              top: 8,
              right: 9,
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "var(--brand)",
              border: "2px solid var(--surface)",
            }}
          />
        </button>

        {/* Nueva agencia */}
        <button
          onClick={() => setShowCreate(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            border: 0,
            borderRadius: 9,
            fontFamily: "inherit",
            fontWeight: 600,
            fontSize: 13,
            padding: "9px 15px",
            cursor: "pointer",
            background: "var(--brand)",
            color: "#fff",
            boxShadow: "0 6px 14px -6px var(--brand)",
          }}
        >
          <Plus size={15} />
          Nueva agencia
        </button>
      </header>

      {/* ── Scrollable content ───────────────────────────────────────────────── */}
      <div style={{ flex: 1, padding: "22px 24px", overflowY: "auto" }}>

        {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
        <div
          className="grid grid-cols-2 lg:grid-cols-4"
          style={{ gap: 14, marginBottom: 18 }}
        >
          {/* Agencias activas */}
          <KpiCard
            icon={<Building2 size={18} />}
            iconStyle={{ background: "var(--brand-light)", color: "var(--brand)" }}
            label="Agencias activas"
            value="48"
            trend="+5 este mes"
            trendUp={true}
          />
          {/* MRR */}
          <KpiCard
            icon={<CircleDollarSign size={18} />}
            iconStyle={{ background: "var(--cool-light)", color: "var(--cool-dark)" }}
            label="MRR"
            value="$18.4k"
            trend="+12%"
            trendUp={true}
          />
          {/* Usuarios */}
          <KpiCard
            icon={<UsersRound size={18} />}
            iconStyle={{ background: "#EFF8FF", color: "#3B82F6" }}
            label="Usuarios totales"
            value="312"
            trend="+24"
            trendUp={true}
          />
          {/* Tickets */}
          <KpiCard
            icon={<LifeBuoy size={18} />}
            iconStyle={{ background: "#FFFAEB", color: "#F59E0B" }}
            label="Tickets abiertos"
            value="12"
            trend="3 críticos"
            trendUp={false}
          />
        </div>

        {/* ── Chart + Plan distribution ──────────────────────────────────────── */}
        <div
          className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr]"
          style={{ gap: 16, marginBottom: 18 }}
        >
          {/* MRR Chart */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-lg)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "15px 18px",
                borderBottom: "1px solid var(--border-light)",
              }}
            >
              <h3 style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text)" }}>
                Ingresos recurrentes (MRR)
              </h3>
              <span style={{ fontSize: 12, color: "var(--subtle)", fontWeight: 500 }}>
                USD · 2026
              </span>
            </div>
            <div style={{ padding: 18 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)" }}>
                  $18.4k
                </span>
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: "var(--cool-dark)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <TrendingUp size={14} />
                  +12% vs mayo
                </span>
              </div>
              <MrrChart />
            </div>
          </div>

          {/* Plan distribution */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-lg)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "15px 18px",
                borderBottom: "1px solid var(--border-light)",
              }}
            >
              <h3 style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text)" }}>
                Agencias por plan
              </h3>
            </div>
            <div style={{ padding: 18 }}>
              {/* Plan rows */}
              {[
                { label: "Pro", count: 26, pct: 54, color: "var(--brand)" },
                { label: "Business", count: 14, pct: 29, color: "#8B5CF6" },
                { label: "Starter", count: 8, pct: 17, color: "var(--subtle)" },
              ].map((row) => (
                <div
                  key={row.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 11,
                    marginBottom: 15,
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 3,
                      flexShrink: 0,
                      background: row.color,
                    }}
                  />
                  <span style={{ fontSize: 12.5, fontWeight: 600, width: 78, flexShrink: 0, color: "var(--text)" }}>
                    {row.label}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 8,
                      background: "var(--bg)",
                      borderRadius: 20,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        display: "block",
                        height: "100%",
                        borderRadius: 20,
                        width: `${row.pct}%`,
                        background: row.color,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 12.5,
                      fontWeight: 800,
                      width: 34,
                      textAlign: "right",
                      color: "var(--text)",
                    }}
                  >
                    {row.count}
                  </span>
                </div>
              ))}

              {/* Stats below */}
              <div
                style={{
                  marginTop: 18,
                  paddingTop: 16,
                  borderTop: "1px solid var(--border-light)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 11,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                  <span style={{ color: "var(--muted)", fontWeight: 600 }}>Churn mensual</span>
                  <b style={{ color: "var(--text)" }}>1.8%</b>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                  <span style={{ color: "var(--muted)", fontWeight: 600 }}>En periodo de prueba</span>
                  <b style={{ color: "#F59E0B" }}>6 agencias</b>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                  <span style={{ color: "var(--muted)", fontWeight: 600 }}>ARPU</span>
                  <b style={{ color: "var(--text)" }}>USD 383</b>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Agency table ───────────────────────────────────────────────────── */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-lg)",
            boxShadow: "var(--shadow-sm)",
            overflow: "hidden",
          }}
        >
          {/* Table header toolbar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "15px 18px",
              borderBottom: "1px solid var(--border-light)",
              flexWrap: "wrap",
            }}
          >
            <h3 style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text)" }}>
              Agencias
            </h3>
            <div style={{ flex: 1 }} />

            {/* Table search */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 9,
                padding: "7px 11px",
                width: 260,
              }}
            >
              <Search size={14} style={{ color: "var(--subtle)", flexShrink: 0 }} />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setTopSearch(e.target.value);
                }}
                placeholder="Buscar por nombre o país…"
                style={{
                  border: 0,
                  background: "transparent",
                  outline: "none",
                  fontFamily: "inherit",
                  fontSize: 12.5,
                  color: "var(--text)",
                  width: "100%",
                }}
              />
            </div>

            {/* Plan filter */}
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              style={{
                appearance: "none",
                WebkitAppearance: "none",
                background: `var(--surface) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2398A2B3' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E") no-repeat right 10px center`,
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "8px 30px 8px 12px",
                fontFamily: "inherit",
                fontSize: 12.5,
                fontWeight: 600,
                color: "var(--muted)",
                cursor: "pointer",
                outline: 0,
              }}
            >
              <option value="">Todos los planes</option>
              <option value="Pro">Pro</option>
              <option value="Business">Business</option>
              <option value="Starter">Starter</option>
            </select>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                appearance: "none",
                WebkitAppearance: "none",
                background: `var(--surface) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2398A2B3' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E") no-repeat right 10px center`,
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "8px 30px 8px 12px",
                fontFamily: "inherit",
                fontSize: 12.5,
                fontWeight: 600,
                color: "var(--muted)",
                cursor: "pointer",
                outline: 0,
              }}
            >
              <option value="">Todos los estados</option>
              <option value="activa">Activa</option>
              <option value="prueba">Prueba</option>
              <option value="suspendida">Suspendida</option>
            </select>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
              <thead>
                <tr style={{ background: "var(--surface-2)" }}>
                  {["Agencia", "Plan", "Usuarios", "Uso (leads)", "MRR", "Último acceso", "Estado", ""].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          fontSize: 11,
                          letterSpacing: "0.03em",
                          textTransform: "uppercase",
                          color: "var(--subtle)",
                          fontWeight: 700,
                          textAlign: "left",
                          padding: "12px 18px",
                          borderBottom: "1px solid var(--border-light)",
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        textAlign: "center",
                        padding: 40,
                        color: "var(--subtle)",
                        fontSize: 13,
                      }}
                    >
                      Sin agencias que coincidan.
                    </td>
                  </tr>
                ) : (
                  filtered.map((ag) => (
                    <AgencyRow key={ag.name} agency={ag} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Create Agency Modal ──────────────────────────────────────────────── */}
      {showCreate && <CreateAgencyModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

// ── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  icon,
  iconStyle,
  label,
  value,
  trend,
  trendUp,
}: {
  icon: React.ReactNode;
  iconStyle: React.CSSProperties;
  label: string;
  value: string;
  trend: string;
  trendUp: boolean;
}) {
  return (
    <div
      className="stat-card"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)",
        padding: 16,
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          display: "grid",
          placeItems: "center",
          marginBottom: 12,
          ...iconStyle,
        }}
      >
        {icon}
      </div>
      <div style={{ fontSize: 12.5, color: "var(--muted)", fontWeight: 500 }}>{label}</div>
      <div
        style={{
          fontSize: 25,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          margin: "3px 0 5px",
          color: "var(--text)",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          display: "inline-flex",
          alignItems: "center",
          gap: 3,
          color: trendUp ? "#10B981" : "#EF4444",
        }}
      >
        {trendUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
        {trend}
      </div>
    </div>
  );
}

// ── Agency table row ──────────────────────────────────────────────────────────

function AgencyRow({ agency: ag }: { agency: Agency }) {
  const [suspended, setSuspended] = useState(ag.status === "suspendida");

  const tdStyle: React.CSSProperties = {
    padding: "13px 18px",
    borderBottom: "1px solid var(--border-light)",
    fontSize: 13,
    fontWeight: 500,
    color: "var(--text)",
  };

  return (
    <tr style={{ transition: "background 0.12s" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {/* Agency */}
      <td style={tdStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              display: "grid",
              placeItems: "center",
              color: "#fff",
              fontWeight: 800,
              fontSize: 13,
              flexShrink: 0,
              background: ag.color,
            }}
          >
            {initials(ag.name)}
          </span>
          <div>
            <b style={{ fontSize: 13.5, fontWeight: 700, display: "block", color: "var(--text)" }}>
              {ag.name}
            </b>
            <small style={{ fontSize: 11.5, color: "var(--subtle)" }}>{ag.country}</small>
          </div>
        </div>
      </td>

      {/* Plan */}
      <td style={tdStyle}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: "3px 10px",
            borderRadius: 20,
            ...planBadgeStyle(ag.plan),
          }}
        >
          {ag.plan}
        </span>
      </td>

      {/* Usuarios */}
      <td style={tdStyle}>
        <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{ag.users}</span>
      </td>

      {/* Uso */}
      <td style={tdStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 60,
              height: 6,
              background: "var(--bg)",
              borderRadius: 20,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "block",
                height: "100%",
                borderRadius: 20,
                width: `${ag.use}%`,
                background: usageBarColor(ag.use),
              }}
            />
          </div>
          <small style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, width: 38 }}>
            {ag.use}%
          </small>
        </div>
      </td>

      {/* MRR */}
      <td style={tdStyle}>
        <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
          USD {ag.mrr}
        </span>
      </td>

      {/* Último acceso */}
      <td style={{ ...tdStyle, color: "var(--muted)" }}>{ag.last}</td>

      {/* Estado */}
      <td style={tdStyle}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11.5,
            fontWeight: 700,
            padding: "4px 11px",
            borderRadius: 20,
            ...statusStyle(suspended ? "suspendida" : ag.status),
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "currentColor",
              display: "inline-block",
            }}
          />
          {statusLabel(suspended ? "suspendida" : ag.status)}
        </span>
      </td>

      {/* Actions */}
      <td style={{ ...tdStyle, textAlign: "right" }}>
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
          <ActionBtn title="Entrar como agencia">
            <LogIn size={15} />
          </ActionBtn>
          <ActionBtn
            title={suspended ? "Activar" : "Suspender"}
            onClick={() => setSuspended((s) => !s)}
          >
            {suspended ? <Play size={15} /> : <Pause size={15} />}
          </ActionBtn>
          <ActionBtn title="Más opciones">
            <MoreHorizontal size={15} />
          </ActionBtn>
        </div>
      </td>
    </tr>
  );
}

function ActionBtn({
  children,
  title,
  onClick,
}: {
  children: React.ReactNode;
  title?: string;
  onClick?: () => void;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 30,
        height: 30,
        borderRadius: 8,
        border: "1px solid var(--border)",
        background: "var(--surface)",
        display: "grid",
        placeItems: "center",
        color: "var(--muted)",
        cursor: "pointer",
        transition: "border-color 0.15s, color 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--brand-100)";
        (e.currentTarget as HTMLButtonElement).style.color = "var(--brand)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
        (e.currentTarget as HTMLButtonElement).style.color = "var(--muted)";
      }}
    >
      {children}
    </button>
  );
}

// ── Create Agency Modal ───────────────────────────────────────────────────────

const PLANS_LIST = ["STARTER", "PRO", "ENTERPRISE"];

function CreateAgencyModal({ onClose }: { onClose: () => void }) {
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    plan: "STARTER",
    primaryColor: "#E8610A",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
  });

  const handleCreate = async () => {
    if (!form.name || !form.slug) return;
    setCreating(true);
    await fetch("/api/agencies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setCreating(false);
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: 10,
    border: "1px solid var(--border)",
    background: "var(--bg)",
    color: "var(--text)",
    fontFamily: "inherit",
    fontSize: 13,
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    fontWeight: 500,
    color: "var(--muted)",
    marginBottom: 4,
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.5)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          borderRadius: 20,
          boxShadow: "var(--shadow-lg)",
          padding: 24,
          background: "var(--surface)",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text)" }}>Nueva agencia</h2>
          <button
            onClick={onClose}
            style={{
              fontSize: 18,
              color: "var(--muted)",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Nombre</label>
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                style={inputStyle}
                placeholder="Viajes El Sol"
              />
            </div>
            <div>
              <label style={labelStyle}>Slug único</label>
              <input
                value={form.slug}
                onChange={(e) =>
                  setForm((p) => ({ ...p, slug: e.target.value.toLowerCase().replace(/\s/g, "-") }))
                }
                style={{ ...inputStyle, fontFamily: "monospace" }}
                placeholder="viajes-el-sol"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Plan</label>
              <select
                value={form.plan}
                onChange={(e) => setForm((p) => ({ ...p, plan: e.target.value }))}
                style={inputStyle}
              >
                {PLANS_LIST.map((pl) => (
                  <option key={pl}>{pl}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Color de marca</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => setForm((p) => ({ ...p, primaryColor: e.target.value }))}
                  style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid var(--border)", cursor: "pointer", padding: 2 }}
                />
                <input
                  value={form.primaryColor}
                  onChange={(e) => setForm((p) => ({ ...p, primaryColor: e.target.value }))}
                  style={{ ...inputStyle, flex: 1, fontFamily: "monospace" }}
                />
              </div>
            </div>
          </div>

          <div
            style={{
              borderTop: "1px solid var(--border)",
              paddingTop: 12,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>
              Admin de la agencia (opcional)
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Nombre</label>
                <input
                  value={form.adminName}
                  onChange={(e) => setForm((p) => ({ ...p, adminName: e.target.value }))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  value={form.adminEmail}
                  onChange={(e) => setForm((p) => ({ ...p, adminEmail: e.target.value }))}
                  style={inputStyle}
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Contraseña inicial</label>
              <input
                type="password"
                value={form.adminPassword}
                onChange={(e) => setForm((p) => ({ ...p, adminPassword: e.target.value }))}
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: 10,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || !form.name || !form.slug}
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: 10,
              border: 0,
              background: "var(--brand)",
              color: "#fff",
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 600,
              cursor: creating || !form.name || !form.slug ? "not-allowed" : "pointer",
              opacity: creating || !form.name || !form.slug ? 0.7 : 1,
            }}
          >
            {creating ? "Creando…" : "Crear agencia"}
          </button>
        </div>
      </div>
    </div>
  );
}
