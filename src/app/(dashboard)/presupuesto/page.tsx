"use client";
import { useEffect, useState, useCallback } from "react";

const CATEGORIES = [
  { key: "VENTAS", label: "Ventas esperadas", color: "#16a34a", icon: "💰" },
  { key: "MARKETING", label: "Marketing", color: "#2563eb", icon: "📣" },
  { key: "OPERACION", label: "Operación", color: "#d97706", icon: "⚙️" },
  { key: "COMISIONES", label: "Comisiones", color: "#7c3aed", icon: "🏅" },
];
const MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

type BudgetItem = { year: number; month: number; category: string; target: number; currency: string };
type Actuals = Record<number, { ventas: number; operacion: number; marketing: number }>;

function fmt(n: number) {
  return new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(n);
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-1.5 rounded-full w-full" style={{ background: "var(--border)" }}>
      <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export default function PresupuestoPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState<{ budgets: BudgetItem[]; actuals: Actuals } | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ month: number; category: string } | null>(null);
  const [editVal, setEditVal] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/budget?year=${year}`)
      .then((r) => r.json())
      .then((d) => { setData(d && typeof d === "object" && !d.error ? d : null); setLoading(false); });
  }, [year]);

  useEffect(() => { load(); }, [load]);

  const getBudget = (month: number, category: string) =>
    data?.budgets.find((b) => b.month === month && b.category === category)?.target ?? 0;

  const getActual = (month: number, category: string): number => {
    const a = data?.actuals[month];
    if (!a) return 0;
    if (category === "VENTAS") return a.ventas;
    if (category === "MARKETING") return a.marketing;
    if (category === "OPERACION") return a.operacion;
    return 0;
  };

  const saveEdit = async () => {
    if (!editing) return;
    await fetch("/api/budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, month: editing.month, category: editing.category, target: parseFloat(editVal) || 0 }),
    });
    setEditing(null);
    load();
  };

  // Annual totals per category
  const annualTotals = CATEGORIES.map((cat) => {
    const target = Array.from({ length: 12 }, (_, i) => getBudget(i + 1, cat.key)).reduce((a, b) => a + b, 0);
    const actual = Array.from({ length: 12 }, (_, i) => getActual(i + 1, cat.key)).reduce((a, b) => a + b, 0);
    return { ...cat, target, actual };
  });

  return (
    <div className="p-6 space-y-6 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Presupuesto anual</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-subtle)" }}>
            Compara metas vs resultados reales por mes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setYear((y) => y - 1)} className="px-3 py-1.5 rounded-lg border text-sm" style={{ border: "1px solid var(--border)", color: "var(--text)" }}>‹</button>
          <span className="px-4 py-1.5 rounded-lg text-sm font-semibold" style={{ background: "var(--surface)", color: "var(--text)" }}>{year}</span>
          <button onClick={() => setYear((y) => y + 1)} className="px-3 py-1.5 rounded-lg border text-sm" style={{ border: "1px solid var(--border)", color: "var(--text)" }}>›</button>
        </div>
      </div>

      {/* Annual KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {annualTotals.map((cat) => {
          const pct = cat.target > 0 ? Math.round((cat.actual / cat.target) * 100) : 0;
          return (
            <div key={cat.key} className="card space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{cat.icon}</span>
                <span className="text-xs font-semibold" style={{ color: "var(--text-subtle)" }}>{cat.label}</span>
              </div>
              <div>
                <div className="text-xl font-black" style={{ color: "var(--text)" }}>{fmt(cat.actual)}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-subtle)" }}>Meta: {fmt(cat.target)}</div>
              </div>
              <MiniBar value={cat.actual} max={cat.target || cat.actual || 1} color={cat.color} />
              <div className="text-xs font-semibold" style={{ color: pct >= 100 ? "#16a34a" : pct >= 70 ? "#d97706" : "#dc2626" }}>
                {pct}% cumplido
              </div>
            </div>
          );
        })}
      </div>

      {/* Monthly breakdown table */}
      <div className="card overflow-x-auto p-0">
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="font-semibold" style={{ color: "var(--text)" }}>Desglose mensual — click en una celda para editar la meta</h2>
        </div>
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
              <th className="text-left px-4 py-3 font-semibold text-xs" style={{ color: "var(--text-subtle)", minWidth: 120 }}>Categoría</th>
              {MONTHS.map((m) => (
                <th key={m} className="text-center px-2 py-3 font-semibold text-xs" style={{ color: "var(--text-subtle)" }}>{m}</th>
              ))}
              <th className="text-right px-4 py-3 font-semibold text-xs" style={{ color: "var(--text-subtle)" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map((cat) => (
              <>
                {/* Meta row */}
                <tr key={`${cat.key}-meta`} style={{ borderBottom: "1px solid var(--border-light)" }}>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <div>
                        <div className="text-xs font-semibold" style={{ color: "var(--text)" }}>{cat.label}</div>
                        <div className="text-xs" style={{ color: "var(--text-subtle)" }}>Meta</div>
                      </div>
                    </div>
                  </td>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                    const val = getBudget(m, cat.key);
                    const isEditing = editing?.month === m && editing?.category === cat.key;
                    return (
                      <td key={m} className="px-2 py-2 text-center">
                        {isEditing ? (
                          <input
                            autoFocus
                            value={editVal}
                            onChange={(e) => setEditVal(e.target.value)}
                            onBlur={saveEdit}
                            onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                            className="w-20 px-1 py-0.5 text-xs text-center rounded border"
                            style={{ background: "var(--surface)", border: `1px solid ${cat.color}`, color: "var(--text)" }}
                          />
                        ) : (
                          <button
                            onClick={() => { setEditing({ month: m, category: cat.key }); setEditVal(String(val || "")); }}
                            className="text-xs px-1 py-0.5 rounded hover:opacity-80 transition w-full"
                            style={{ color: cat.color, fontWeight: 600 }}
                          >
                            {val > 0 ? `${(val / 1000).toFixed(0)}k` : "—"}
                          </button>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-4 py-2 text-right text-xs font-bold" style={{ color: cat.color }}>
                    {fmt(Array.from({ length: 12 }, (_, i) => getBudget(i + 1, cat.key)).reduce((a, b) => a + b, 0))}
                  </td>
                </tr>
                {/* Real row */}
                <tr key={`${cat.key}-real`} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="px-4 py-2">
                    <div className="pl-6 text-xs" style={{ color: "var(--text-subtle)" }}>Real</div>
                  </td>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                    const actual = getActual(m, cat.key);
                    const target = getBudget(m, cat.key);
                    const over = target > 0 && actual >= target;
                    return (
                      <td key={m} className="px-2 py-2 text-center">
                        <span
                          className="text-xs"
                          style={{ color: over ? "#16a34a" : actual > 0 ? "var(--text)" : "var(--text-subtle)" }}
                        >
                          {actual > 0 ? `${(actual / 1000).toFixed(0)}k` : "—"}
                        </span>
                      </td>
                    );
                  })}
                  <td className="px-4 py-2 text-right text-xs" style={{ color: "var(--text)" }}>
                    {fmt(Array.from({ length: 12 }, (_, i) => getActual(i + 1, cat.key)).reduce((a, b) => a + b, 0))}
                  </td>
                </tr>
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Instructions */}
      <p className="text-xs text-center" style={{ color: "var(--text-subtle)" }}>
        💡 Haz click en cualquier celda de Meta para editar el presupuesto mensual. Los valores Reales se calculan automáticamente desde facturas y gastos.
      </p>

      {loading && (
        <div className="text-center text-sm" style={{ color: "var(--text-subtle)" }}>Cargando datos...</div>
      )}
    </div>
  );
}
