"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card } from "@/components/ui";

interface ReportData {
  // Commercial
  totalThisMonth?: number;
  totalPrevMonth?: number;
  growth?: number;
  leadsThisMonth?: number;
  oppsWon?: number;
  conversionRate?: number;
  // Financial
  totalBilled?: number;
  totalPaid?: number;
  totalPending?: number;
  totalOverdue?: number;
  byAgent?: Array<{ agentName: string; total: number; count: number }>;
  // By destination
  byDestination?: Array<{ destination: string; total: number; count: number }>;
  // By channel
  byChannel?: Array<{ channel: string; count: number; percentage: number }>;
  // Campaigns
  totalSpent?: number;
  totalLeads?: number;
  totalRevenue?: number;
  roiPercent?: number;
  byPlatform?: Array<{ platform: string; leads: number; spent: number; revenue: number }>;
}

const REPORT_TYPES = [
  { key: "commercial", label: "Resumen comercial", icon: "📊" },
  { key: "financial", label: "Financiero", icon: "💰" },
  { key: "leads", label: "Leads y canales", icon: "◎" },
  { key: "campaigns", label: "Campañas", icon: "📢" },
];

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export default function ReportesPage() {
  const now = new Date();
  const [type, setType] = useState("commercial");
  const [monthIdx, setMonthIdx] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<ReportData>({});
  const [loading, setLoading] = useState(false);

  const month = `${year}-${String(monthIdx + 1).padStart(2, "0")}`;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/marketing/reports?type=${type}&month=${month}`)
      .then(r => r.json()).then((d) => setData(d && typeof d === "object" && !d.error ? d : {})).catch(() => {}).finally(() => setLoading(false));
  }, [type, month]);

  function prevMonth() {
    if (monthIdx === 0) { setYear(y => y - 1); setMonthIdx(11); }
    else setMonthIdx(m => m - 1);
  }
  function nextMonth() {
    if (monthIdx === 11) { setYear(y => y + 1); setMonthIdx(0); }
    else setMonthIdx(m => m + 1);
  }

  const currentReport = REPORT_TYPES.find(r => r.key === type);

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <div className="max-w-7xl mx-auto px-8 py-8">
        <PageHeader
          title="Reportes del negocio"
          subtitle="Análisis completo: comercial, financiero, marketing y más"
        />

        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          {/* Report type tabs */}
          <div className="flex gap-2">
            {REPORT_TYPES.map(r => (
              <button key={r.key} onClick={() => setType(r.key)}
                className="px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5"
                style={{
                  background: type === r.key ? "var(--brand)" : "var(--surface)",
                  color: type === r.key ? "#fff" : "var(--text)",
                  border: "1px solid var(--border)",
                }}>
                <span>{r.icon}</span> {r.label}
              </button>
            ))}
          </div>
          {/* Month nav */}
          <div className="flex items-center gap-3">
            <button onClick={prevMonth} className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>‹</button>
            <span className="font-semibold text-sm" style={{ color: "var(--text)" }}>{MONTHS[monthIdx]} {year}</span>
            <button onClick={nextMonth} className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>›</button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>Cargando reporte...</div>
        ) : (
          <>
            {/* COMMERCIAL REPORT */}
            {type === "commercial" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Facturado este mes", value: `$${(data.totalThisMonth ?? 0).toLocaleString("es-DO", { minimumFractionDigits: 2 })}`, sub: data.growth !== undefined ? `${data.growth >= 0 ? "+" : ""}${data.growth.toFixed(1)}% vs mes anterior` : "", color: "var(--brand)" },
                    { label: "Mes anterior", value: `$${(data.totalPrevMonth ?? 0).toLocaleString("es-DO", { minimumFractionDigits: 2 })}`, sub: "Comparativo", color: "var(--text-muted)" },
                    { label: "Leads este mes", value: data.leadsThisMonth ?? 0, sub: `${data.oppsWon ?? 0} negocios cerrados`, color: "#10b981" },
                    { label: "Tasa de conversión", value: `${(data.conversionRate ?? 0).toFixed(1)}%`, sub: "Leads → Ventas", color: "#6366f1" },
                  ].map(k => (
                    <Card key={k.label} className="text-center">
                      <div className="text-2xl font-black mb-1" style={{ color: k.color }}>{k.value}</div>
                      <div className="text-sm font-medium" style={{ color: "var(--text)" }}>{k.label}</div>
                      <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{k.sub}</div>
                    </Card>
                  ))}
                </div>

                {/* By agent */}
                {data.byAgent && data.byAgent.length > 0 && (
                  <Card>
                    <h3 className="font-bold mb-4" style={{ color: "var(--text)" }}>Rendimiento por agente</h3>
                    <div className="space-y-3">
                      {data.byAgent.map(a => {
                        const pct = data.totalThisMonth ? (a.total / data.totalThisMonth) * 100 : 0;
                        return (
                          <div key={a.agentName}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{a.agentName}</span>
                              <div className="text-right">
                                <span className="text-sm font-bold" style={{ color: "var(--text)" }}>${a.total.toLocaleString()}</span>
                                <span className="text-xs ml-2" style={{ color: "var(--text-muted)" }}>{a.count} facturas</span>
                              </div>
                            </div>
                            <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg)" }}>
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--brand)" }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* FINANCIAL REPORT */}
            {type === "financial" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Total facturado", value: `$${(data.totalBilled ?? 0).toLocaleString()}`, color: "var(--brand)" },
                    { label: "Total cobrado", value: `$${(data.totalPaid ?? 0).toLocaleString()}`, color: "#10b981" },
                    { label: "Pendiente de cobro", value: `$${(data.totalPending ?? 0).toLocaleString()}`, color: "#f59e0b" },
                    { label: "Vencido", value: `$${(data.totalOverdue ?? 0).toLocaleString()}`, color: "#ef4444" },
                  ].map(k => (
                    <Card key={k.label} className="text-center">
                      <div className="text-2xl font-black mb-1" style={{ color: k.color }}>{k.value}</div>
                      <div className="text-sm" style={{ color: "var(--text)" }}>{k.label}</div>
                    </Card>
                  ))}
                </div>

                {/* Collection rate */}
                {(data.totalBilled ?? 0) > 0 && (
                  <Card>
                    <h3 className="font-bold mb-3" style={{ color: "var(--text)" }}>Tasa de cobro</h3>
                    <div className="h-4 rounded-full overflow-hidden mb-2" style={{ background: "var(--bg)" }}>
                      <div className="h-full rounded-full" style={{
                        width: `${((data.totalPaid ?? 0) / (data.totalBilled ?? 1)) * 100}%`,
                        background: "linear-gradient(90deg, #10b981, var(--brand))"
                      }} />
                    </div>
                    <div className="flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                      <span>0%</span>
                      <span className="font-medium" style={{ color: "var(--text)" }}>
                        {(((data.totalPaid ?? 0) / (data.totalBilled ?? 1)) * 100).toFixed(1)}% cobrado
                      </span>
                      <span>100%</span>
                    </div>
                  </Card>
                )}

                {data.byAgent && data.byAgent.length > 0 && (
                  <Card>
                    <h3 className="font-bold mb-4" style={{ color: "var(--text)" }}>Por agente — {MONTHS[monthIdx]}</h3>
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--border)" }}>
                          {["Agente","Facturas","Total"].map(h => (
                            <th key={h} className="text-left py-2 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.byAgent.map(a => (
                          <tr key={a.agentName} style={{ borderBottom: "1px solid var(--border)" }}>
                            <td className="py-2" style={{ color: "var(--text)" }}>{a.agentName}</td>
                            <td className="py-2" style={{ color: "var(--text-muted)" }}>{a.count}</td>
                            <td className="py-2 font-medium" style={{ color: "var(--text)" }}>${a.total.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Card>
                )}
              </div>
            )}

            {/* LEADS REPORT */}
            {type === "leads" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: "Leads este mes", value: data.leadsThisMonth ?? 0, color: "var(--brand)" },
                    { label: "Negocios cerrados", value: data.oppsWon ?? 0, color: "#10b981" },
                    { label: "Conversión", value: `${(data.conversionRate ?? 0).toFixed(1)}%`, color: "#6366f1" },
                  ].map(k => (
                    <Card key={k.label} className="text-center">
                      <div className="text-3xl font-black mb-1" style={{ color: k.color }}>{k.value}</div>
                      <div className="text-sm" style={{ color: "var(--text)" }}>{k.label}</div>
                    </Card>
                  ))}
                </div>

                {data.byChannel && data.byChannel.length > 0 && (
                  <Card>
                    <h3 className="font-bold mb-4" style={{ color: "var(--text)" }}>Leads por canal de adquisición</h3>
                    <div className="space-y-3">
                      {data.byChannel.map(c => (
                        <div key={c.channel}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{c.channel}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm" style={{ color: "var(--text-muted)" }}>{c.count} leads</span>
                              <span className="text-sm font-bold" style={{ color: "var(--brand)" }}>{c.percentage.toFixed(1)}%</span>
                            </div>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg)" }}>
                            <div className="h-full rounded-full" style={{ width: `${c.percentage}%`, background: "var(--brand)" }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* CAMPAIGNS REPORT */}
            {type === "campaigns" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Total invertido", value: `$${(data.totalSpent ?? 0).toFixed(0)}`, color: "#f59e0b" },
                    { label: "Leads generados", value: data.totalLeads ?? 0, color: "#10b981" },
                    { label: "Revenue atribuido", value: `$${(data.totalRevenue ?? 0).toLocaleString()}`, color: "var(--brand)" },
                    { label: "ROI global", value: `${(data.roiPercent ?? 0) >= 0 ? "+" : ""}${(data.roiPercent ?? 0).toFixed(1)}%`, color: (data.roiPercent ?? 0) >= 0 ? "#10b981" : "#ef4444" },
                  ].map(k => (
                    <Card key={k.label} className="text-center">
                      <div className="text-2xl font-black mb-1" style={{ color: k.color }}>{k.value}</div>
                      <div className="text-sm" style={{ color: "var(--text)" }}>{k.label}</div>
                    </Card>
                  ))}
                </div>

                {data.byPlatform && data.byPlatform.length > 0 && (
                  <Card>
                    <h3 className="font-bold mb-4" style={{ color: "var(--text)" }}>Rendimiento por plataforma</h3>
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--border)" }}>
                          {["Plataforma","Leads","Invertido","Revenue","ROI"].map(h => (
                            <th key={h} className="text-left py-2 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.byPlatform.map(p => {
                          const r = p.spent > 0 ? ((p.revenue - p.spent) / p.spent) * 100 : 0;
                          return (
                            <tr key={p.platform} style={{ borderBottom: "1px solid var(--border)" }}>
                              <td className="py-2 font-medium" style={{ color: "var(--text)" }}>{p.platform}</td>
                              <td className="py-2" style={{ color: "#10b981" }}>{p.leads}</td>
                              <td className="py-2" style={{ color: "var(--text)" }}>${p.spent.toFixed(0)}</td>
                              <td className="py-2" style={{ color: "var(--brand)" }}>${p.revenue.toLocaleString()}</td>
                              <td className="py-2 font-bold" style={{ color: r >= 0 ? "#10b981" : "#ef4444" }}>
                                {r >= 0 ? "+" : ""}{r.toFixed(0)}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </Card>
                )}

                {(!data.byPlatform || data.byPlatform.length === 0) && (
                  <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
                    Sin datos de campañas para {MONTHS[monthIdx]} {year}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
