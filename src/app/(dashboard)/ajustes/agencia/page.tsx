"use client";
import { useEffect, useState } from "react";

type Agency = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  plan: string;
  isActive: boolean;
  billingName?: string | null;
  billingRnc?: string | null;
  billingAddress?: string | null;
  billingEmail?: string | null;
  billingPhone?: string | null;
  exchangeRateDOP: number;
  exchangeRateUSD: number;
  mayoristas: string;
};

export default function AgenciaPage() {
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [mayoristasRaw, setMayoristasRaw] = useState("");
  const [form, setForm] = useState<Partial<Agency>>({});

  useEffect(() => {
    fetch("/api/agencies")
      .then((r) => r.json())
      .then((data: Agency[]) => {
        const ag = data[0] ?? null;
        setAgency(ag);
        if (ag) {
          setForm(ag);
          try {
            const arr = JSON.parse(ag.mayoristas);
            setMayoristasRaw(Array.isArray(arr) ? arr.join("\n") : "");
          } catch {
            setMayoristasRaw(ag.mayoristas);
          }
        }
        setLoading(false);
      });
  }, []);

  const save = async () => {
    if (!agency) return;
    setSaving(true);
    const mayoristas = mayoristasRaw
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const res = await fetch(`/api/agencies/${agency.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, mayoristas }),
    });
    if (res.ok) {
      const updated: Agency = await res.json();
      setAgency(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      // Apply branding immediately
      document.documentElement.style.setProperty("--brand", updated.primaryColor);
    }
    setSaving(false);
  };

  const f = (field: keyof Agency) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  if (loading) return <div className="p-8 text-center" style={{ color: "var(--text-subtle)" }}>Cargando...</div>;
  if (!agency) return <div className="p-8 text-center" style={{ color: "var(--text-subtle)" }}>Sin agencia configurada.</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Mi Agencia</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-subtle)" }}>
            Configuración de marca, facturación y mayoristas
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition"
          style={{ background: saved ? "#16a34a" : "var(--brand)", opacity: saving ? 0.7 : 1 }}
        >
          {saving ? "Guardando…" : saved ? "✓ Guardado" : "Guardar cambios"}
        </button>
      </div>

      {/* Identidad de marca */}
      <section className="card space-y-5">
        <h2 className="font-semibold text-base" style={{ color: "var(--text)" }}>Identidad de marca</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-subtle)" }}>
              Nombre comercial
            </label>
            <input
              value={form.name ?? ""}
              onChange={f("name")}
              className="w-full px-3 py-2 rounded-xl border text-sm"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-subtle)" }}>
              Slug (URL interno)
            </label>
            <input
              value={form.slug ?? ""}
              disabled
              className="w-full px-3 py-2 rounded-xl border text-sm opacity-60"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-subtle)" }}>
              Color primario (marca)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.primaryColor ?? "#E8610A"}
                onChange={f("primaryColor")}
                className="w-10 h-10 rounded-lg border cursor-pointer"
                style={{ border: "1px solid var(--border)" }}
              />
              <input
                value={form.primaryColor ?? ""}
                onChange={f("primaryColor")}
                className="flex-1 px-3 py-2 rounded-xl border text-sm font-mono"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
                placeholder="#E8610A"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-subtle)" }}>
              Color sidebar (secundario)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.secondaryColor ?? "#1A1A2E"}
                onChange={f("secondaryColor")}
                className="w-10 h-10 rounded-lg border cursor-pointer"
                style={{ border: "1px solid var(--border)" }}
              />
              <input
                value={form.secondaryColor ?? ""}
                onChange={f("secondaryColor")}
                className="flex-1 px-3 py-2 rounded-xl border text-sm font-mono"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
                placeholder="#1A1A2E"
              />
            </div>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-subtle)" }}>
              URL del logo (opcional)
            </label>
            <input
              value={form.logoUrl ?? ""}
              onChange={f("logoUrl")}
              className="w-full px-3 py-2 rounded-xl border text-sm"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
              placeholder="https://tu-agencia.com/logo.png"
            />
          </div>
        </div>
        {/* Preview */}
        <div
          className="flex items-center gap-3 p-3 rounded-xl mt-2"
          style={{ background: form.secondaryColor ?? "#1A1A2E" }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm"
            style={{ background: form.primaryColor ?? "#E8610A" }}
          >
            {(form.name ?? "A")[0]?.toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-bold text-white">{form.name ?? "Mi Agencia"}</div>
            <div className="text-xs text-gray-400">Vista previa del sidebar</div>
          </div>
        </div>
      </section>

      {/* Tasas de cambio */}
      <section className="card space-y-4">
        <h2 className="font-semibold text-base" style={{ color: "var(--text)" }}>Tasas de cambio</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-subtle)" }}>
              Tasa DOP/USD (RD$ por 1 USD)
            </label>
            <input
              type="number"
              step="0.01"
              value={form.exchangeRateDOP ?? 62}
              onChange={(e) => setForm((prev) => ({ ...prev, exchangeRateDOP: parseFloat(e.target.value) }))}
              className="w-full px-3 py-2 rounded-xl border text-sm"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-subtle)" }}>
              Tasa USD/DOP (USD por 1 DOP)
            </label>
            <input
              type="number"
              step="0.0001"
              value={form.exchangeRateUSD ?? 1}
              onChange={(e) => setForm((prev) => ({ ...prev, exchangeRateUSD: parseFloat(e.target.value) }))}
              className="w-full px-3 py-2 rounded-xl border text-sm"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
          </div>
        </div>
      </section>

      {/* Mayoristas */}
      <section className="card space-y-4">
        <h2 className="font-semibold text-base" style={{ color: "var(--text)" }}>Mayoristas de la agencia</h2>
        <p className="text-xs" style={{ color: "var(--text-subtle)" }}>
          Un mayorista por línea. Aparecen en cotizaciones, órdenes y créditos.
        </p>
        <textarea
          rows={8}
          value={mayoristasRaw}
          onChange={(e) => setMayoristasRaw(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border text-sm font-mono resize-y"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
          placeholder={"Sunwing\nAmResorts\nBahia Principe\nBlueDiamond"}
        />
        <p className="text-xs" style={{ color: "var(--text-subtle)" }}>
          {mayoristasRaw.split("\n").filter((s) => s.trim()).length} mayoristas configurados
        </p>
      </section>

      {/* Facturación */}
      <section className="card space-y-4">
        <h2 className="font-semibold text-base" style={{ color: "var(--text)" }}>Datos de facturación</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { field: "billingName" as const, label: "Razón social" },
            { field: "billingRnc" as const, label: "RNC / Cédula" },
            { field: "billingPhone" as const, label: "Teléfono" },
            { field: "billingEmail" as const, label: "Email de facturación" },
          ].map(({ field, label }) => (
            <div key={field}>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-subtle)" }}>
                {label}
              </label>
              <input
                value={(form[field] as string) ?? ""}
                onChange={f(field)}
                className="w-full px-3 py-2 rounded-xl border text-sm"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
              />
            </div>
          ))}
          <div className="col-span-2">
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-subtle)" }}>
              Dirección
            </label>
            <input
              value={form.billingAddress ?? ""}
              onChange={f("billingAddress")}
              className="w-full px-3 py-2 rounded-xl border text-sm"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
