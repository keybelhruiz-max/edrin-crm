"use client";
import { useEffect, useState } from "react";

type UserScore = {
  user: { id: string; name: string | null; role: string };
  leads: number;
  opportunities: number;
  closed: number;
  conversionRate: number;
  revenue: number;
  commission: number;
  commissionRate: number;
};
type Marketing = {
  totalLeads: number;
  campaignLeads: number;
  cpl: number;
  roi: number;
  totalSpent: number;
  campaigns: { name: string; platform: string; leads: number; spent: number; revenue: number }[];
};

function fmt(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
  return `$${n.toFixed(0)}`;
}

function ScoreBar({ value, max, color = "var(--brand)" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full" style={{ background: "var(--border)" }}>
        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold w-8 text-right" style={{ color: "var(--text)" }}>{value}</span>
    </div>
  );
}

const MONTHS_LABELS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function MetricasPage() {
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState<{ scorecard: UserScore[]; marketing: Marketing } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/metrics?month=${month}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, [month]);

  const maxRevenue = Math.max(...(data?.scorecard.map((u) => u.revenue) ?? [1]), 1);
  const maxLeads = Math.max(...(data?.scorecard.map((u) => u.leads) ?? [1]), 1);

  const [y, m] = month.split("-").map(Number);
  const monthLabel = `${MONTHS_LABELS[m - 1]} ${y}`;

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Centro de métricas</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-subtle)" }}>Scorecard por vendedor y métricas de marketing</p>
        </div>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="px-3 py-2 rounded-xl border text-sm"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
        />
      </div>

      {loading && <div className="text-center py-12 text-sm" style={{ color: "var(--text-subtle)" }}>Calculando métricas...</div>}

      {data && (
        <>
          {/* Vendedores scorecard */}
          <section className="space-y-3">
            <h2 className="font-semibold text-sm uppercase tracking-wide" style={{ color: "var(--text-subtle)" }}>
              Scorecard vendedores — {monthLabel}
            </h2>
            <div className="grid gap-4">
              {data.scorecard.length === 0 && (
                <div className="card text-center text-sm" style={{ color: "var(--text-subtle)" }}>Sin vendedores con datos este mes.</div>
              )}
              {data.scorecard.map((u, idx) => (
                <div key={u.user.id} className="card">
                  <div className="flex items-start gap-4 flex-wrap">
                    {/* Rank + Name */}
                    <div className="flex items-center gap-3 min-w-[160px]">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-black shrink-0"
                        style={{ background: idx === 0 ? "#d97706" : idx === 1 ? "#64748b" : idx === 2 ? "#92400e" : "var(--brand)" }}
                      >
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-sm" style={{ color: "var(--text)" }}>{u.user.name ?? "Sin nombre"}</div>
                        <div className="text-xs" style={{ color: "var(--text-subtle)" }}>{u.user.role}</div>
                      </div>
                    </div>

                    {/* KPIs grid */}
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="text-center p-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
                        <div className="text-xs font-medium mb-1" style={{ color: "var(--text-subtle)" }}>Leads asignados</div>
                        <div className="text-2xl font-black" style={{ color: "var(--text)" }}>{u.leads}</div>
                        <ScoreBar value={u.leads} max={maxLeads} color="#3b82f6" />
                      </div>
                      <div className="text-center p-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
                        <div className="text-xs font-medium mb-1" style={{ color: "var(--text-subtle)" }}>Conversión</div>
                        <div className="text-2xl font-black" style={{ color: u.conversionRate >= 50 ? "#16a34a" : u.conversionRate >= 25 ? "#d97706" : "var(--text)" }}>
                          {u.conversionRate}%
                        </div>
                        <div className="text-xs mt-1" style={{ color: "var(--text-subtle)" }}>{u.closed}/{u.opportunities} opp.</div>
                      </div>
                      <div className="text-center p-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
                        <div className="text-xs font-medium mb-1" style={{ color: "var(--text-subtle)" }}>Facturación</div>
                        <div className="text-2xl font-black" style={{ color: "var(--brand)" }}>{fmt(u.revenue)}</div>
                        <ScoreBar value={u.revenue} max={maxRevenue} color="var(--brand)" />
                      </div>
                      <div className="text-center p-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
                        <div className="text-xs font-medium mb-1" style={{ color: "var(--text-subtle)" }}>Comisión ({u.commissionRate}%)</div>
                        <div className="text-2xl font-black" style={{ color: "#7c3aed" }}>{fmt(u.commission)}</div>
                        <div className="text-xs mt-1" style={{ color: "var(--text-subtle)" }}>Calculada</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Marketing metrics */}
          <section className="space-y-3">
            <h2 className="font-semibold text-sm uppercase tracking-wide" style={{ color: "var(--text-subtle)" }}>
              Marketing — acumulado general
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total leads", value: data.marketing.totalLeads, color: "#3b82f6", format: (n: number) => String(n) },
                { label: "Leads por campañas", value: data.marketing.campaignLeads, color: "#2563eb", format: (n: number) => String(n) },
                { label: "CPL promedio", value: data.marketing.cpl, color: "#d97706", format: fmt },
                { label: "ROI campañas", value: data.marketing.roi, color: data.marketing.roi >= 0 ? "#16a34a" : "#dc2626", format: (n: number) => `${n.toFixed(1)}%` },
              ].map((kpi) => (
                <div key={kpi.label} className="card text-center">
                  <div className="text-xs font-medium mb-2" style={{ color: "var(--text-subtle)" }}>{kpi.label}</div>
                  <div className="text-3xl font-black" style={{ color: kpi.color }}>{kpi.format(kpi.value)}</div>
                </div>
              ))}
            </div>

            {data.marketing.campaigns.length > 0 && (
              <div className="card overflow-hidden p-0">
                <div className="px-5 py-3 border-b" style={{ borderColor: "var(--border)" }}>
                  <h3 className="font-semibold text-sm" style={{ color: "var(--text)" }}>Campañas activas</h3>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "var(--surface-2)" }}>
                      {["Campaña", "Plataforma", "Leads", "Invertido", "Revenue", "ROI"].map((h) => (
                        <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold" style={{ color: "var(--text-subtle)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.marketing.campaigns.map((c, i) => {
                      const roi = c.spent > 0 ? ((c.revenue - c.spent) / c.spent) * 100 : 0;
                      return (
                        <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
                          <td className="px-4 py-2.5 font-medium" style={{ color: "var(--text)" }}>{c.name}</td>
                          <td className="px-4 py-2.5">
                            <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: "var(--surface-2)", color: "var(--text-subtle)" }}>
                              {c.platform}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 font-semibold" style={{ color: "#3b82f6" }}>{c.leads}</td>
                          <td className="px-4 py-2.5" style={{ color: "var(--text)" }}>{fmt(c.spent)}</td>
                          <td className="px-4 py-2.5" style={{ color: "var(--brand)" }}>{fmt(c.revenue)}</td>
                          <td className="px-4 py-2.5 font-semibold" style={{ color: roi >= 0 ? "#16a34a" : "#dc2626" }}>
                            {roi.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
