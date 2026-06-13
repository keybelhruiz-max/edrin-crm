"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card, Btn, Input, Select, Textarea } from "@/components/ui";

interface Post {
  id: string;
  caption: string | null;
  platform: string;
  postType: string;
  status: string;
  scheduledAt: string | null;
  mediaUrls: string;
  hashtags: string | null;
}

const PLATFORMS = ["INSTAGRAM","FACEBOOK","TIKTOK","WHATSAPP","YOUTUBE","LINKEDIN"];
const TYPES = ["POST","REEL","STORY","CAROUSEL","VIDEO"];
const STATUS_COLOR: Record<string, string> = {
  DRAFT: "#6b7280",
  SCHEDULED: "#6366f1",
  PUBLISHED: "#10b981",
  FAILED: "#ef4444",
};

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export default function CalendarioPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [monthIdx, setMonthIdx] = useState(now.getMonth());
  const [posts, setPosts] = useState<Post[]>([]);
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    caption: "", hashtags: "", platform: "INSTAGRAM", postType: "POST",
    status: "DRAFT", scheduledAt: "",
  });
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Post | null>(null);

  const monthStr = `${year}-${String(monthIdx + 1).padStart(2, "0")}`;

  useEffect(() => {
    fetch(`/api/marketing/posts?month=${monthStr}`)
      .then(r => r.json()).then(setPosts).catch(() => {});
  }, [monthStr]);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/marketing/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const newPost = await res.json();
      setPosts(prev => [...prev, newPost]);
      setShowForm(false);
      setForm({ caption: "", hashtags: "", platform: "INSTAGRAM", postType: "POST", status: "DRAFT", scheduledAt: "" });
    } finally { setSaving(false); }
  }

  async function deletePost(id: string) {
    await fetch(`/api/marketing/posts/${id}`, { method: "DELETE" });
    setPosts(prev => prev.filter(p => p.id !== id));
    setSelected(null);
  }

  const firstDay = new Date(year, monthIdx, 1).getDay();
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  function postsForDay(day: number) {
    const dayStr = `${year}-${String(monthIdx + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return posts.filter(p => p.scheduledAt?.startsWith(dayStr));
  }

  function prevMonth() {
    if (monthIdx === 0) { setYear(y => y - 1); setMonthIdx(11); }
    else setMonthIdx(m => m - 1);
  }
  function nextMonth() {
    if (monthIdx === 11) { setYear(y => y + 1); setMonthIdx(0); }
    else setMonthIdx(m => m + 1);
  }

  const label = (p: Post) => p.caption?.slice(0, 30) || `${p.platform} ${p.postType}`;

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <div className="max-w-6xl mx-auto px-8 py-8">
        <PageHeader
          title="Calendario de contenido"
          subtitle={`${MONTHS[monthIdx]} ${year}`}
          action={
            <div className="flex gap-2">
              <button onClick={() => setView(view === "calendar" ? "list" : "calendar")}
                className="px-3 py-2 rounded-lg text-sm transition hover:opacity-80"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>
                {view === "calendar" ? "📋 Lista" : "📅 Calendario"}
              </button>
              <Btn onClick={() => setShowForm(true)}>+ Nuevo post</Btn>
            </div>
          }
        />

        {/* Month navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={prevMonth} className="w-8 h-8 rounded-full flex items-center justify-center transition hover:opacity-70"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>‹</button>
            <span className="font-semibold" style={{ color: "var(--text)" }}>{MONTHS[monthIdx]} {year}</span>
            <button onClick={nextMonth} className="w-8 h-8 rounded-full flex items-center justify-center transition hover:opacity-70"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>›</button>
          </div>
          <div className="flex gap-3 text-xs">
            {Object.entries(STATUS_COLOR).map(([s, c]) => (
              <div key={s} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: c }} />
                <span style={{ color: "var(--text-muted)" }}>{s}</span>
              </div>
            ))}
          </div>
        </div>

        {view === "calendar" ? (
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            <div className="grid grid-cols-7 text-xs font-semibold uppercase tracking-wider"
              style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
              {["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"].map(d => (
                <div key={d} className="text-center py-3" style={{ color: "var(--text-muted)" }}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7" style={{ background: "var(--bg)" }}>
              {cells.map((day, i) => {
                const dayPosts = day ? postsForDay(day) : [];
                const isToday = day === now.getDate() && monthIdx === now.getMonth() && year === now.getFullYear();
                return (
                  <div key={i} className="min-h-24 p-2 border-r border-b last:border-r-0"
                    style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                    {day && (
                      <>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mb-1"
                          style={{ background: isToday ? "var(--brand)" : "transparent", color: isToday ? "#fff" : "var(--text-muted)" }}>
                          {day}
                        </div>
                        <div className="space-y-1">
                          {dayPosts.slice(0, 2).map(p => (
                            <button key={p.id} onClick={() => setSelected(p)}
                              className="w-full text-left text-xs px-1.5 py-0.5 rounded truncate"
                              style={{ background: STATUS_COLOR[p.status] + "22", color: STATUS_COLOR[p.status], border: `1px solid ${STATUS_COLOR[p.status]}44` }}>
                              {p.platform.slice(0, 2)} {label(p)}
                            </button>
                          ))}
                          {dayPosts.length > 2 && (
                            <div className="text-xs" style={{ color: "var(--text-muted)" }}>+{dayPosts.length - 2} más</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.length === 0 && (
              <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
                Sin posts programados para {MONTHS[monthIdx]}
              </div>
            )}
            {posts.map(p => (
              <Card key={p.id} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-2xl">
                    {p.platform === "INSTAGRAM" ? "📸" : p.platform === "FACEBOOK" ? "👥" : p.platform === "TIKTOK" ? "🎵" : "📢"}
                  </div>
                  <div>
                    <div className="font-medium text-sm" style={{ color: "var(--text)" }}>{label(p)}</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {p.platform} · {p.postType} · {p.scheduledAt ? new Date(p.scheduledAt).toLocaleString("es-DO") : "Sin fecha"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-1 rounded-full font-medium"
                    style={{ background: STATUS_COLOR[p.status] + "22", color: STATUS_COLOR[p.status] }}>
                    {p.status}
                  </span>
                  <button onClick={() => deletePost(p.id)} className="text-xs hover:opacity-70" style={{ color: "#ef4444" }}>Eliminar</button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Post detail modal */}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
            <div className="rounded-2xl p-6 w-full max-w-md" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold" style={{ color: "var(--text)" }}>{selected.platform} — {selected.postType}</h3>
                <button onClick={() => setSelected(null)} style={{ color: "var(--text-muted)" }}>✕</button>
              </div>
              <div className="space-y-2 text-sm">
                <div><span style={{ color: "var(--text-muted)" }}>Plataforma:</span> <span style={{ color: "var(--text)" }}>{selected.platform}</span></div>
                <div><span style={{ color: "var(--text-muted)" }}>Tipo:</span> <span style={{ color: "var(--text)" }}>{selected.postType}</span></div>
                <div><span style={{ color: "var(--text-muted)" }}>Estado:</span> <span style={{ color: STATUS_COLOR[selected.status] }}>{selected.status}</span></div>
                <div><span style={{ color: "var(--text-muted)" }}>Programado:</span> <span style={{ color: "var(--text)" }}>{selected.scheduledAt ? new Date(selected.scheduledAt).toLocaleString("es-DO") : "—"}</span></div>
                {selected.hashtags && <div><span style={{ color: "var(--text-muted)" }}>Hashtags:</span> <span style={{ color: "#6366f1" }}>{selected.hashtags}</span></div>}
                {selected.caption && (
                  <div className="pt-2">
                    <div style={{ color: "var(--text-muted)" }} className="mb-1">Caption:</div>
                    <div className="p-3 rounded-lg text-sm whitespace-pre-wrap" style={{ background: "var(--bg)", color: "var(--text)" }}>{selected.caption}</div>
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <Btn variant="danger" onClick={() => deletePost(selected.id)}>Eliminar</Btn>
                <Btn variant="secondary" onClick={() => setSelected(null)}>Cerrar</Btn>
              </div>
            </div>
          </div>
        )}

        {/* New post form modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
            <div className="rounded-2xl p-6 w-full max-w-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-lg" style={{ color: "var(--text)" }}>Nuevo post</h3>
                <button onClick={() => setShowForm(false)} style={{ color: "var(--text-muted)" }}>✕</button>
              </div>
              <div className="space-y-3">
                <Textarea label="Caption / Contenido" value={form.caption}
                  onChange={e => setForm(f => ({ ...f, caption: e.target.value }))}
                  rows={4} placeholder="Escribe el caption aquí..." />
                <Input label="Hashtags" value={form.hashtags}
                  onChange={e => setForm(f => ({ ...f, hashtags: e.target.value }))}
                  placeholder="#viajes #republicadominicana" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Plataforma</label>
                    <select value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}>
                      {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Tipo</label>
                    <select value={form.postType} onChange={e => setForm(f => ({ ...f, postType: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}>
                      {TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Estado</label>
                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}>
                      <option>DRAFT</option>
                      <option>SCHEDULED</option>
                      <option>PUBLISHED</option>
                    </select>
                  </div>
                  <Input label="Fecha programada" type="datetime-local" value={form.scheduledAt}
                    onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <Btn onClick={save} disabled={saving}>{saving ? "Guardando..." : "Guardar post"}</Btn>
                <Btn variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Btn>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
