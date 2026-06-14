"use client";

import { useRef, useState } from "react";

type Step = "upload" | "map" | "import" | "done";

interface Preview {
  headers: string[];
  detected: Record<string, string>;
  preview: Record<string, string>[];
  totalRows: number;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: number;
  errorDetails: string[];
  total: number;
}

const FIELD_LABELS: Record<string, { label: string; icon: string; required?: boolean }> = {
  name:           { label: "Nombre",          icon: "👤", required: true },
  phone:          { label: "Teléfono / WhatsApp", icon: "📱" },
  email:          { label: "Email",           icon: "✉️" },
  socialHandle:   { label: "Handle / @usuario", icon: "📲" },
  channel:        { label: "Canal origen",    icon: "📡" },
  notes:          { label: "Notas",           icon: "📝" },
  destination:    { label: "Destino viaje",   icon: "📍" },
  mayorista:      { label: "Proveedor / Mayorista", icon: "🏨" },
  estimatedValue: { label: "Valor estimado",  icon: "💰" },
  currency:       { label: "Moneda",          icon: "💱" },
  isInternational:{ label: "¿Internacional?", icon: "✈️" },
  agentEmail:     { label: "Agente (nombre o email)", icon: "🙋" },
  skip:           { label: "— Ignorar columna —", icon: "✕" },
};

const CHANNELS = ["WHATSAPP", "INSTAGRAM", "TIKTOK", "MESSENGER", "DIRECTO", "OTRO"];

const TEMPLATES = [
  {
    name: "Hubspot",
    file: "contacts_hubspot.csv",
    sample: `First Name,Last Name,Email Address,Phone Number,Lead Source,Notes\nMaría,González,maria@gmail.com,8095550001,Instagram,Le interesa Punta Cana`,
  },
  {
    name: "Zoho CRM",
    file: "zoho_export.csv",
    sample: `Contact Name,Mobile,Email,Lead Source,Description\nCarlos Pérez,8095550002,carlos@empresa.com,Web Site,Familia 4 personas`,
  },
  {
    name: "Google Sheets",
    file: "leads_sheets.csv",
    sample: `Nombre,Teléfono,Email,Canal,Destino,Notas\nAna Martínez,8095550003,ana@gmail.com,WhatsApp,Cancún,Viaje de aniversario`,
  },
  {
    name: "Excel manual",
    file: "base_clientes.csv",
    sample: `Cliente,Celular,Correo,Origen,Destino,Presupuesto,Notas\nPedro Sánchez,8095550004,pedro@hotmail.com,Instagram,Europa,3000,Luna de miel`,
  },
];

export default function ImportarPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [dataUrl, setDataUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [options, setOptions] = useState({
    createOpportunity: true,
    skipDuplicates: true,
    defaultChannel: "OTRO",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");

  function downloadTemplate(sample: string, file: string) {
    const blob = new Blob(["﻿" + sample], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = file; a.click();
    URL.revokeObjectURL(url);
  }

  async function handleFile(file: File) {
    setError("");
    setFileName(file.name);
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const url = e.target?.result as string;
      setDataUrl(url);
      try {
        const res = await fetch(`/api/import?dataUrl=${encodeURIComponent(url)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setPreview(data);
        // Init mapping from auto-detected
        const m: Record<string, string> = {};
        for (const h of data.headers) {
          m[h] = data.detected[h] ?? "skip";
        }
        setMapping(m);
        setStep("map");
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      }
      setLoading(false);
    };
    reader.readAsDataURL(file);
  }

  async function handleImport() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl, mapping, options }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      setStep("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setLoading(false);
  }

  function reset() {
    setStep("upload");
    setDataUrl("");
    setFileName("");
    setPreview(null);
    setMapping({});
    setResult(null);
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  const mappedFields = Object.values(mapping).filter(v => v !== "skip");
  const hasName = mappedFields.includes("name");

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div className="px-6 py-5 border-b" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">📥</span>
            <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>Importar datos</h1>
          </div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Importa contactos y leads desde HubSpot, Zoho, Excel, Google Sheets o cualquier CSV
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="border-b" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center gap-3">
          {[
            { key: "upload", label: "1. Archivo" },
            { key: "map", label: "2. Mapear campos" },
            { key: "import", label: "3. Importar" },
            { key: "done", label: "4. Resultado" },
          ].map((s, i) => {
            const steps = ["upload", "map", "import", "done"];
            const current = steps.indexOf(step);
            const idx = steps.indexOf(s.key);
            const active = s.key === step;
            const done = idx < current;
            return (
              <div key={s.key} className="flex items-center gap-2">
                {i > 0 && <div className="w-6 h-px" style={{ background: "var(--border)" }} />}
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background: active ? "#E8610A" : done ? "#059669" : "var(--bg)",
                      color: active || done ? "#fff" : "var(--text-muted)",
                      border: active || done ? "none" : "1px solid var(--border)",
                    }}>
                    {done ? "✓" : i + 1}
                  </div>
                  <span className="text-xs font-medium hidden sm:block"
                    style={{ color: active ? "#E8610A" : done ? "#059669" : "var(--text-muted)" }}>
                    {s.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-5">

          {/* ── STEP 1: UPLOAD ────────────────────────────────────────────── */}
          {step === "upload" && (
            <>
              {/* Templates */}
              <div className="rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <div className="font-semibold text-sm mb-3" style={{ color: "var(--text)" }}>
                  📋 Plantillas de ejemplo (descarga y rellena)
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {TEMPLATES.map(t => (
                    <button key={t.name} onClick={() => downloadTemplate(t.sample, t.file)}
                      className="p-3 rounded-xl border text-left hover:border-[#E8610A] transition group"
                      style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
                      <div className="text-xs font-semibold group-hover:text-[#E8610A]" style={{ color: "var(--text)" }}>
                        {t.name}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Descargar plantilla</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Drop zone */}
              <div
                className="rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer hover:border-[#E8610A] transition"
                style={{ borderColor: "var(--border)", background: "var(--surface)" }}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              >
                <div className="text-5xl mb-3">📂</div>
                <div className="font-semibold text-base mb-1" style={{ color: "var(--text)" }}>
                  Arrastra tu archivo aquí o haz clic para seleccionar
                </div>
                <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Soporta: CSV, Excel (.xlsx, .xls), archivos exportados de cualquier CRM
                </div>
                <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              </div>

              {loading && (
                <div className="text-center py-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: "var(--surface)", color: "var(--text-muted)" }}>
                    <span className="animate-spin">⟳</span> Analizando archivo...
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-2xl p-4" style={{ background: "#FEF2F2", color: "#DC2626" }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Info */}
              <div className="rounded-2xl border p-5 space-y-3" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <div className="font-semibold text-sm" style={{ color: "var(--text)" }}>¿Cómo funciona?</div>
                <div className="space-y-2">
                  {[
                    { icon: "1️⃣", text: "Exporta los contactos de tu CRM actual a CSV o Excel" },
                    { icon: "2️⃣", text: "Sube el archivo — detectamos las columnas automáticamente" },
                    { icon: "3️⃣", text: "Confirma qué columna va a qué campo (nombre, teléfono, etc.)" },
                    { icon: "4️⃣", text: "Los contactos se importan con su oportunidad en el pipeline" },
                  ].map(i => (
                    <div key={i.icon} className="flex items-start gap-3">
                      <span className="text-lg">{i.icon}</span>
                      <span className="text-sm" style={{ color: "var(--text-muted)" }}>{i.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── STEP 2: MAP COLUMNS ───────────────────────────────────────── */}
          {step === "map" && preview && (
            <>
              <div className="rounded-2xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <div className="flex items-center justify-between mb-1">
                  <div className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                    📄 {fileName}
                  </div>
                  <div className="text-xs px-2 py-1 rounded-lg" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>
                    {preview.totalRows} filas detectadas
                  </div>
                </div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Detectamos automáticamente las columnas. Ajusta si es necesario.
                </div>
              </div>

              {/* Column mapping */}
              <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                <div className="px-5 py-3 border-b" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
                  <div className="grid grid-cols-2 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                    <span>Columna en tu archivo</span>
                    <span>Campo en el CRM</span>
                  </div>
                </div>
                <div style={{ background: "var(--surface)" }}>
                  {preview.headers.map((h, i) => {
                    const currentField = mapping[h] ?? "skip";
                    const isDetected = preview.detected[h] !== undefined;
                    const sampleValues = preview.preview.map(r => r[h]).filter(Boolean).slice(0, 2);
                    return (
                      <div key={h} className="grid grid-cols-2 gap-4 px-5 py-3 items-center border-t"
                        style={{ borderColor: "var(--border)", background: i % 2 === 0 ? "var(--surface)" : "var(--surface-2)" }}>
                        <div>
                          <div className="text-sm font-medium flex items-center gap-2" style={{ color: "var(--text)" }}>
                            {h}
                            {isDetected && (
                              <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: "#ECFDF5", color: "#059669" }}>auto</span>
                            )}
                          </div>
                          {sampleValues.length > 0 && (
                            <div className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                              Ej: {sampleValues.join(", ")}
                            </div>
                          )}
                        </div>
                        <select
                          value={currentField}
                          onChange={e => setMapping(m => ({ ...m, [h]: e.target.value }))}
                          className="w-full border rounded-lg px-3 py-1.5 text-sm"
                          style={{
                            borderColor: currentField !== "skip" ? "#E8610A" : "var(--border)",
                            background: "var(--bg)", color: "var(--text)",
                          }}
                        >
                          <option value="skip">— Ignorar columna —</option>
                          {Object.entries(FIELD_LABELS).filter(([k]) => k !== "skip").map(([k, v]) => (
                            <option key={k} value={k}>{v.icon} {v.label}{v.required ? " *" : ""}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Preview table */}
              <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                <div className="px-5 py-3 border-b font-semibold text-sm" style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}>
                  👁️ Vista previa (primeras {preview.preview.length} filas)
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ background: "var(--surface-2)" }}>
                        {preview.headers.filter(h => mapping[h] && mapping[h] !== "skip").map(h => (
                          <th key={h} className="text-left px-3 py-2 font-medium whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                            {FIELD_LABELS[mapping[h]]?.icon} {FIELD_LABELS[mapping[h]]?.label ?? mapping[h]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.preview.map((row, i) => (
                        <tr key={i} className="border-t" style={{ borderColor: "var(--border)" }}>
                          {preview.headers.filter(h => mapping[h] && mapping[h] !== "skip").map(h => (
                            <td key={h} className="px-3 py-2 max-w-[140px] truncate" style={{ color: "var(--text)" }}>
                              {row[h] || <span style={{ color: "var(--border)" }}>—</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Options */}
              <div className="rounded-2xl border p-5 space-y-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <div className="font-semibold text-sm" style={{ color: "var(--text)" }}>Opciones de importación</div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={options.skipDuplicates}
                    onChange={e => setOptions(o => ({ ...o, skipDuplicates: e.target.checked }))}
                    className="mt-0.5 w-4 h-4 accent-[#E8610A]" />
                  <div>
                    <div className="text-sm font-medium" style={{ color: "var(--text)" }}>Omitir duplicados</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>Si ya existe un contacto con el mismo nombre, teléfono o email, se salta</div>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={options.createOpportunity}
                    onChange={e => setOptions(o => ({ ...o, createOpportunity: e.target.checked }))}
                    className="mt-0.5 w-4 h-4 accent-[#E8610A]" />
                  <div>
                    <div className="text-sm font-medium" style={{ color: "var(--text)" }}>Agregar al pipeline automáticamente</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>Crea una oportunidad en la primera etapa del pipeline para cada contacto</div>
                  </div>
                </label>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Canal por defecto</label>
                  <select value={options.defaultChannel}
                    onChange={e => setOptions(o => ({ ...o, defaultChannel: e.target.value }))}
                    className="border rounded-lg px-3 py-2 text-sm"
                    style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }}>
                    {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Se usa si el archivo no tiene columna de canal</div>
                </div>
              </div>

              {!hasName && (
                <div className="rounded-2xl p-4 text-sm" style={{ background: "#FFFBEB", color: "#D97706", border: "1px solid #FDE68A" }}>
                  ⚠️ Debes mapear al menos la columna <strong>Nombre</strong> para poder importar
                </div>
              )}

              {error && (
                <div className="rounded-2xl p-4" style={{ background: "#FEF2F2", color: "#DC2626" }}>
                  ⚠️ {error}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={reset}
                  className="px-5 py-2.5 rounded-2xl text-sm font-medium border"
                  style={{ borderColor: "var(--border)", color: "var(--text)" }}>
                  ← Cambiar archivo
                </button>
                <button onClick={() => setStep("import")} disabled={!hasName}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-semibold text-white transition"
                  style={{ background: hasName ? "#E8610A" : "var(--border)", cursor: hasName ? "pointer" : "not-allowed" }}>
                  Continuar → Revisar importación
                </button>
              </div>
            </>
          )}

          {/* ── STEP 3: CONFIRM & IMPORT ─────────────────────────────────── */}
          {step === "import" && preview && (
            <>
              <div className="rounded-2xl border p-6 text-center" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <div className="text-5xl mb-3">🚀</div>
                <div className="font-bold text-lg mb-2" style={{ color: "var(--text)" }}>
                  Listo para importar
                </div>
                <div className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
                  Se importarán hasta <strong>{preview.totalRows} contactos</strong> desde <strong>{fileName}</strong>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { label: "Total filas", value: preview.totalRows, color: "#6366F1" },
                    { label: "Campos mapeados", value: mappedFields.length, color: "#059669" },
                    { label: "Duplicados", value: options.skipDuplicates ? "Se omiten" : "Se importan", color: "#D97706" },
                  ].map(s => (
                    <div key={s.label} className="rounded-2xl p-3 border" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>{s.label}</div>
                      <div className="font-bold mt-0.5" style={{ color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 text-left mb-6">
                  {mappedFields.filter(f => f !== "skip").map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm" style={{ color: "var(--text)" }}>
                      <span className="text-green-500">✓</span>
                      {FIELD_LABELS[f]?.icon} {FIELD_LABELS[f]?.label ?? f}
                    </div>
                  ))}
                  {options.createOpportunity && (
                    <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text)" }}>
                      <span className="text-green-500">✓</span>
                      ⬡ Oportunidad en pipeline (primera etapa)
                    </div>
                  )}
                </div>

                {loading ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="text-3xl animate-spin">⟳</div>
                    <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                      Importando contactos... esto puede tomar unos segundos
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button onClick={() => setStep("map")}
                      className="flex-1 py-2.5 rounded-2xl text-sm font-medium border"
                      style={{ borderColor: "var(--border)", color: "var(--text)" }}>
                      ← Ajustar mapeo
                    </button>
                    <button onClick={handleImport}
                      className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-white"
                      style={{ background: "#E8610A" }}>
                      Importar {preview.totalRows} contactos →
                    </button>
                  </div>
                )}

                {error && (
                  <div className="rounded-2xl p-4 mt-4 text-sm text-left" style={{ background: "#FEF2F2", color: "#DC2626" }}>
                    ⚠️ {error}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── STEP 4: DONE ─────────────────────────────────────────────── */}
          {step === "done" && result && (
            <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="px-6 py-8 text-center border-b" style={{ borderColor: "var(--border)", background: result.errors === 0 ? "#ECFDF5" : "#FFFBEB" }}>
                <div className="text-5xl mb-3">{result.errors === 0 ? "🎉" : "⚠️"}</div>
                <div className="font-bold text-xl mb-1" style={{ color: result.errors === 0 ? "#059669" : "#D97706" }}>
                  {result.errors === 0 ? "¡Importación completada!" : "Importación con advertencias"}
                </div>
                <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {result.imported} de {result.total} contactos importados exitosamente
                </div>
              </div>

              <div className="grid grid-cols-3 divide-x divide-[var(--border)]">
                {[
                  { label: "Importados", value: result.imported, color: "#059669", bg: "#ECFDF5" },
                  { label: "Omitidos (duplicados)", value: result.skipped, color: "#D97706", bg: "#FFFBEB" },
                  { label: "Errores", value: result.errors, color: "#DC2626", bg: "#FEF2F2" },
                ].map(s => (
                  <div key={s.label} className="p-5 text-center" style={{ background: s.value > 0 ? s.bg : "var(--surface)" }}>
                    <div className="text-2xl font-bold" style={{ color: s.value > 0 ? s.color : "var(--text-muted)" }}>{s.value}</div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {result.errorDetails.length > 0 && (
                <div className="px-6 py-4 border-t" style={{ borderColor: "var(--border)" }}>
                  <div className="text-xs font-semibold mb-2" style={{ color: "#DC2626" }}>Detalles de errores:</div>
                  {result.errorDetails.map((e, i) => (
                    <div key={i} className="text-xs py-1" style={{ color: "var(--text-muted)" }}>• {e}</div>
                  ))}
                </div>
              )}

              <div className="px-6 py-5 flex gap-3 border-t" style={{ borderColor: "var(--border)" }}>
                <button onClick={reset}
                  className="px-5 py-2.5 rounded-2xl text-sm font-medium border"
                  style={{ borderColor: "var(--border)", color: "var(--text)" }}>
                  Importar otro archivo
                </button>
                <a href="/leads"
                  className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-white text-center"
                  style={{ background: "#E8610A" }}>
                  Ver contactos importados →
                </a>
                {options.createOpportunity && (
                  <a href="/pipeline"
                    className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-white text-center"
                    style={{ background: "#6366F1" }}>
                    Ver pipeline →
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
