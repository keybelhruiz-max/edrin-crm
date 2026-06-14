"use client";

import { useEffect, useState, useRef } from "react";
import { PageHeader, Card, Btn, Input } from "@/components/ui";

interface Asset {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number | null;
  tags: string;
  notes: string | null;
  createdAt: string;
}

const TYPE_ICONS: Record<string, string> = {
  IMAGE: "🖼️", VIDEO: "🎬", DOCUMENT: "📄", TEMPLATE: "📐", LOGO: "🏷️", GRAPHIC: "🎨", OTHER: "📦",
};

export default function BibliotecaPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<Asset | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/marketing/assets").then(r => r.json()).then(setAssets).catch(() => {});
  }, []);

  const filtered = assets.filter(a => {
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.tags && a.tags.toLowerCase().includes(search.toLowerCase()));
    const matchType = filterType === "all" || a.type === filterType;
    return matchSearch && matchType;
  });

  async function handleUpload(files: FileList) {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", "General");
        const res = await fetch("/api/marketing/assets", { method: "POST", body: fd });
        if (res.ok) {
          const newAsset = await res.json();
          setAssets(prev => [newAsset, ...prev]);
        }
      }
    } finally { setUploading(false); }
  }

  async function deleteAsset(id: string) {
    await fetch(`/api/marketing/assets/${id}`, { method: "DELETE" });
    setAssets(prev => prev.filter(a => a.id !== id));
    setSelected(null);
  }

  function fmt(bytes: number | null) {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function parseTags(raw: string): string[] {
    try { return JSON.parse(raw); } catch { return raw.split(",").filter(Boolean); }
  }

  const TYPES = ["all", "IMAGE", "VIDEO", "DOCUMENT", "TEMPLATE", "LOGO", "GRAPHIC"];

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <div className="max-w-7xl mx-auto px-8 py-8">
        <PageHeader
          title="Biblioteca de medios"
          subtitle="Imágenes, videos, documentos y plantillas"
          action={
            <div className="flex gap-2">
              <button onClick={() => setViewMode(v => v === "grid" ? "list" : "grid")}
                className="px-3 py-2 rounded-lg text-sm"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>
                {viewMode === "grid" ? "☰ Lista" : "⊞ Grid"}
              </button>
              <Btn onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? "Subiendo..." : "↑ Subir archivo"}
              </Btn>
              <input ref={fileRef} type="file" multiple className="hidden"
                onChange={e => e.target.files && handleUpload(e.target.files)} />
            </div>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total archivos", value: assets.length, icon: "📁" },
            { label: "Imágenes", value: assets.filter(a => a.type === "IMAGE").length, icon: "🖼️" },
            { label: "Videos", value: assets.filter(a => a.type === "VIDEO").length, icon: "🎬" },
            { label: "Tamaño total", value: fmt(assets.reduce((s, a) => s + (a.size ?? 0), 0)), icon: "💾" },
          ].map(s => (
            <Card key={s.label} className="flex items-center gap-3">
              <span className="text-2xl">{s.icon}</span>
              <div>
                <div className="font-bold text-lg" style={{ color: "var(--text)" }}>{s.value}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>{s.label}</div>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex gap-4">
          {/* Type filter sidebar */}
          <div className="w-44 flex-shrink-0">
            <div className="text-xs font-semibold uppercase tracking-wider mb-2 px-2" style={{ color: "var(--text-muted)" }}>Tipo</div>
            {TYPES.map(t => (
              <button key={t} onClick={() => setFilterType(t)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition"
                style={{
                  background: filterType === t ? "var(--brand)" : "transparent",
                  color: filterType === t ? "#fff" : "var(--text)",
                }}>
                {t === "all" ? "📁 Todos" : `${TYPE_ICONS[t] ?? "📦"} ${t}`}
              </button>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1">
            <div className="mb-4">
              <Input placeholder="🔍 Buscar por nombre o etiqueta..." value={search}
                onChange={e => setSearch(e.target.value)} />
            </div>

            {/* Drop zone */}
            <div
              className="border-2 border-dashed rounded-xl p-6 text-center mb-6 transition cursor-pointer hover:opacity-80"
              style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); e.dataTransfer.files && handleUpload(e.dataTransfer.files); }}
            >
              <div className="text-3xl mb-2">📤</div>
              <div className="text-sm">Arrastra archivos aquí o haz click para subir</div>
              <div className="text-xs mt-1">JPG, PNG, GIF, MP4, PDF (máx. 50MB)</div>
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
                {search ? "Sin resultados para tu búsqueda" : "Sin archivos. Sube el primero."}
              </div>
            )}

            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {filtered.map(a => (
                  <div key={a.id} onClick={() => setSelected(a)}
                    className="rounded-xl overflow-hidden cursor-pointer transition hover:shadow-lg"
                    style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
                    <div className="h-32 flex items-center justify-center text-4xl" style={{ background: "var(--bg)" }}>
                      {a.type === "IMAGE"
                        ? <img src={a.url} alt={a.name} className="w-full h-full object-cover"
                            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        : TYPE_ICONS[a.type] ?? "📦"}
                    </div>
                    <div className="p-2">
                      <div className="text-xs font-medium truncate" style={{ color: "var(--text)" }}>{a.name}</div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>{fmt(a.size)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map(a => (
                  <div key={a.id} onClick={() => setSelected(a)}
                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition hover:opacity-80"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <span className="text-2xl">{TYPE_ICONS[a.type] ?? "📦"}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium" style={{ color: "var(--text)" }}>{a.name}</div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {a.type} · {fmt(a.size)} · {new Date(a.createdAt).toLocaleDateString("es-DO")}
                        {a.notes ? ` · ${a.notes}` : ""}
                      </div>
                    </div>
                    {parseTags(a.tags).slice(0, 2).map(t => (
                      <span key={t} className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "var(--bg)", color: "var(--text-muted)" }}>{t}</span>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Asset detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="rounded-2xl p-6 w-full max-w-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold" style={{ color: "var(--text)" }}>{selected.name}</h3>
              <button onClick={() => setSelected(null)} style={{ color: "var(--text-muted)" }}>✕</button>
            </div>
            {selected.type === "IMAGE" && (
              <img src={selected.url} alt={selected.name}
                className="w-full h-48 object-contain rounded-lg mb-4"
                style={{ background: "var(--bg)" }} />
            )}
            <div className="space-y-2 text-sm mb-4">
              <div><span style={{ color: "var(--text-muted)" }}>Tipo:</span> <span style={{ color: "var(--text)" }}>{selected.type}</span></div>
              <div><span style={{ color: "var(--text-muted)" }}>Tamaño:</span> <span style={{ color: "var(--text)" }}>{fmt(selected.size)}</span></div>
              {selected.notes && <div><span style={{ color: "var(--text-muted)" }}>Carpeta:</span> <span style={{ color: "var(--text)" }}>{selected.notes}</span></div>}
              {selected.tags && parseTags(selected.tags).length > 0 && (
                <div><span style={{ color: "var(--text-muted)" }}>Etiquetas:</span> <span style={{ color: "var(--text)" }}>{parseTags(selected.tags).join(", ")}</span></div>
              )}
              <div><span style={{ color: "var(--text-muted)" }}>Subido:</span> <span style={{ color: "var(--text)" }}>{new Date(selected.createdAt).toLocaleDateString("es-DO")}</span></div>
            </div>
            <div className="flex gap-2">
              <a href={selected.url} download={selected.name}
                className="px-4 py-2 rounded-lg text-sm text-white font-medium"
                style={{ background: "var(--brand)" }}>
                ↓ Descargar
              </a>
              <Btn variant="danger" onClick={() => deleteAsset(selected.id)}>Eliminar</Btn>
              <Btn variant="secondary" onClick={() => setSelected(null)}>Cerrar</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
