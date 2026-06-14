"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { PageHeader, Card, SectionTitle } from "@/components/ui";

type Invoice = { id: string; number: string; total: number; currency: string; status: string; createdAt: string };
type CommissionEntry = {
  user: { id: string; name: string; email: string; role: string };
  commissionRate: { rate: number; type: string };
  invoices: Invoice[];
  totalBilled: number;
  commission: number;
};

const months = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(2026, i, 1);
  return {
    value: `2026-${String(i + 1).padStart(2, "0")}`,
    label: d.toLocaleDateString("es-DO", { month: "long", year: "numeric" }),
  };
});

const currentMonth = `2026-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

export default function ComisionesPage() {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role;
  const userId = (session?.user as { id?: string })?.id;

  const [month, setMonth] = useState(currentMonth);
  const [data, setData] = useState<CommissionEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ month });
    if (role !== "ADMIN") params.set("userId", userId ?? "");
    fetch(`/api/commissions?${params}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, [month, role, userId]);

  const totalBilledAll = data.reduce((s, d) => s + d.totalBilled, 0);
  const totalCommAll = data.reduce((s, d) => s + d.commission, 0);

  return (
    <div className="flex flex-col h-screen overflow-auto" style={{ background: "var(--bg)" }}>
      <PageHeader
        title="Comisiones"
        subtitle="Seguimiento mensual de comisiones por vendedor"
      >
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm"
          style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
        >
          {months.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </PageHeader>

      <div className="p-6 space-y-6">
        {/* Summary cards — admin only */}
        {role === "ADMIN" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <div className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Total facturado</div>
              <div className="text-2xl font-bold" style={{ color: "var(--text)" }}>
                ${totalBilledAll.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{data.length} vendedores activos</div>
            </Card>
            <Card>
              <div className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Total en comisiones</div>
              <div className="text-2xl font-bold text-[#E8610A]">
                ${totalCommAll.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                {totalBilledAll > 0 ? ((totalCommAll / totalBilledAll) * 100).toFixed(1) : 0}% promedio
              </div>
            </Card>
            <Card>
              <div className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Facturas pagadas</div>
              <div className="text-2xl font-bold" style={{ color: "var(--text)" }}>
                {data.reduce((s, d) => s + d.invoices.length, 0)}
              </div>
            </Card>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>Cargando...</div>
        ) : data.length === 0 ? (
          <Card>
            <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>
              Sin facturas pagadas en este período.
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {data.map((entry) => (
              <Card key={entry.user.id}>
                {/* Agent header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ background: "var(--brand)" }}
                    >
                      {entry.user.name?.[0] ?? "?"}
                    </div>
                    <div>
                      <div className="font-semibold" style={{ color: "var(--text)" }}>{entry.user.name}</div>
                      <div className="text-xs flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
                        <span>{entry.commissionRate.type}</span>
                        <span
                          className="px-2 py-0.5 rounded-full text-white text-xs"
                          style={{ background: "var(--brand)" }}
                        >
                          {entry.commissionRate.rate}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>Comisión del mes</div>
                    <div className="text-xl font-bold text-[#E8610A]">
                      ${entry.commission.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      de ${entry.totalBilled.toLocaleString("en-US", { minimumFractionDigits: 2 })} facturados
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 rounded-full mb-4" style={{ background: "var(--border)" }}>
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min((entry.commissionRate.rate), 100)}%`,
                      background: "var(--brand)",
                    }}
                  />
                </div>

                {/* Invoices table */}
                {entry.invoices.length > 0 && (
                  <>
                    <SectionTitle>Facturas incluidas</SectionTitle>
                    <div
                      className="rounded-lg overflow-hidden border text-sm"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <table className="w-full">
                        <thead>
                          <tr style={{ background: "var(--bg)" }}>
                            <th className="text-left px-3 py-2 text-xs font-medium" style={{ color: "var(--text-muted)" }}>Factura</th>
                            <th className="text-left px-3 py-2 text-xs font-medium" style={{ color: "var(--text-muted)" }}>Fecha</th>
                            <th className="text-right px-3 py-2 text-xs font-medium" style={{ color: "var(--text-muted)" }}>Monto</th>
                            <th className="text-right px-3 py-2 text-xs font-medium" style={{ color: "var(--text-muted)" }}>Comisión</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entry.invoices.map((inv) => (
                            <tr key={inv.id} style={{ borderTop: "1px solid var(--border)" }}>
                              <td className="px-3 py-2.5 font-medium" style={{ color: "var(--text)" }}>{inv.number}</td>
                              <td className="px-3 py-2.5" style={{ color: "var(--text-muted)" }}>
                                {new Date(inv.createdAt).toLocaleDateString("es-DO")}
                              </td>
                              <td className="px-3 py-2.5 text-right font-semibold" style={{ color: "var(--text)" }}>
                                {inv.currency} {inv.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-3 py-2.5 text-right font-semibold text-[#E8610A]">
                                ${((inv.total * entry.commissionRate.rate) / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {entry.invoices.length === 0 && (
                  <div className="text-sm text-center py-3" style={{ color: "var(--text-muted)" }}>
                    Sin facturas pagadas este mes
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
