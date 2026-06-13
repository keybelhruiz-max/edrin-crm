"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui";

type Priority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
type TaskStatus = "PENDIENTE" | "EN_PROGRESO" | "COMPLETADA" | "CANCELADA";

interface Task {
  id: string;
  title: string;
  description: string | null;
  contactId: string | null;
  opportunityId: string | null;
  assignedTo: string | null;
  assignee: { id: string; name: string } | null;
  creator: { id: string; name: string } | null;
  contact: { id: string; name: string } | null;
  dueDate: string | null;
  reminderAt: string | null;
  priority: Priority;
  status: TaskStatus;
  createdAt: string;
}
interface User { id: string; name: string; role: string; }

const PRIO: Record<Priority, { label: string; color: string; bg: string; dot: string }> = {
  LOW:    { label: "Baja",    color: "#6B7280", bg: "#F9FAFB", dot: "🔵" },
  NORMAL: { label: "Normal",  color: "#2563EB", bg: "#EFF6FF", dot: "⚪" },
  HIGH:   { label: "Alta",    color: "#D97706", bg: "#FFFBEB", dot: "🟡" },
  URGENT: { label: "Urgente", color: "#DC2626", bg: "#FEF2F2", dot: "🔴" },
};

const STATUS_CFG: Record<TaskStatus, { label: string; color: string; bg: string; next: TaskStatus | null }> = {
  PENDIENTE:   { label: "Pendiente",   color: "#D97706", bg: "#FFFBEB", next: "EN_PROGRESO" },
  EN_PROGRESO: { label: "En progreso", color: "#2563EB", bg: "#EFF6FF", next: "COMPLETADA" },
  COMPLETADA:  { label: "Completada",  color: "#059669", bg: "#ECFDF5", next: null },
  CANCELADA:   { label: "Cancelada",   color: "#6B7280", bg: "#F9FAFB", next: null },
};

function fmt(d: string) {
  const date = new Date(d);
  const now = new Date();
  const diff = (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return { text: `Venció ${Math.abs(Math.ceil(diff))}d atrás`, overdue: true };
  if (diff < 1) return { text: "Hoy", overdue: false };
  if (diff < 2) return { text: "Mañana", overdue: false };
  return { text: date.toLocaleDateString("es-DO", { month: "short", day: "numeric" }), overdue: false };
}

export default function TareasPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"ALL" | TaskStatus>("ALL");
  const [filterPrio, setFilterPrio] = useState<"ALL" | Priority>("ALL");
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Task | null>(null);
  const [form, setForm] = useState({
    title: "", description: "", assignedTo: "", dueDate: "",
    reminderAt: "", priority: "NORMAL" as Priority,
  });

  async function load() {
    setLoading(true);
    const [rT, rU] = await Promise.all([fetch("/api/tasks"), fetch("/api/users")]);
    if (rT.ok) setTasks(await rT.json());
    if (rU.ok) setUsers(await rU.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const filtered = tasks.filter(t => {
    const matchStatus = filterStatus === "ALL" || t.status === filterStatus;
    const matchPrio = filterPrio === "ALL" || t.priority === filterPrio;
    return matchStatus && matchPrio;
  });

  const counts = {
    PENDIENTE: tasks.filter(t => t.status === "PENDIENTE").length,
    EN_PROGRESO: tasks.filter(t => t.status === "EN_PROGRESO").length,
    COMPLETADA: tasks.filter(t => t.status === "COMPLETADA").length,
  };
  const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "COMPLETADA" && t.status !== "CANCELADA").length;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/tasks", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowModal(false);
    setForm({ title: "", description: "", assignedTo: "", dueDate: "", reminderAt: "", priority: "NORMAL" });
    load();
  }

  async function updateStatus(id: string, status: TaskStatus) {
    await fetch(`/api/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    load();
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
  }

  async function deleteTask(id: string) {
    if (!confirm("¿Eliminar esta tarea?")) return;
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    load();
    setSelected(null);
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--bg)" }}>
      <PageHeader title="Tareas" subtitle="Gestiona tareas y recordatorios del equipo"
        action={
          <button onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: "#E8610A" }}>
            + Nueva tarea
          </button>
        }
      />

      {/* Stats */}
      <div className="px-6 pt-4 pb-3 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Pendientes",   value: counts.PENDIENTE,   color: "#D97706" },
          { label: "En progreso",  value: counts.EN_PROGRESO, color: "#2563EB" },
          { label: "Completadas",  value: counts.COMPLETADA,  color: "#059669" },
          { label: "⚠️ Vencidas", value: overdue,             color: "#DC2626" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 border stat-card" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>{s.label}</div>
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="px-6 pb-3 flex flex-wrap gap-2 items-center">
        <div className="flex gap-1">
          {(["ALL", "PENDIENTE", "EN_PROGRESO", "COMPLETADA", "CANCELADA"] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium border transition"
              style={{ background: filterStatus === s ? "#E8610A" : "var(--surface)", color: filterStatus === s ? "#fff" : "var(--text-muted)", borderColor: filterStatus === s ? "#E8610A" : "var(--border)" }}>
              {s === "ALL" ? "Todas" : STATUS_CFG[s].label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 ml-2">
          {(["ALL", "URGENT", "HIGH", "NORMAL", "LOW"] as const).map(p => (
            <button key={p} onClick={() => setFilterPrio(p)}
              className="px-2 py-1 rounded-xl text-xs font-medium border transition"
              style={{ background: filterPrio === p ? "#111" : "var(--surface)", color: filterPrio === p ? "#fff" : "var(--text-muted)", borderColor: filterPrio === p ? "#111" : "var(--border)" }}>
              {p === "ALL" ? "Prioridad" : PRIO[p].dot + " " + PRIO[p].label}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks list */}
      <div className="px-6 pb-24 flex-1">
        {loading ? <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>Cargando...</div>
        : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">✅</div>
            <p className="font-medium" style={{ color: "var(--text)" }}>Sin tareas</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(task => {
              const pCfg = PRIO[task.priority];
              const sCfg = STATUS_CFG[task.status];
              const due = task.dueDate ? fmt(task.dueDate) : null;
              const done = task.status === "COMPLETADA" || task.status === "CANCELADA";
              return (
                <div key={task.id} onClick={() => setSelected(task)}
                  className="rounded-2xl border p-4 cursor-pointer transition"
                  style={{ background: "var(--surface)", borderColor: "var(--border)", opacity: done ? 0.65 : 1 }}>
                  <div className="flex items-start gap-3">
                    {/* Quick-complete button */}
                    <button onClick={e => { e.stopPropagation(); updateStatus(task.id, done ? "PENDIENTE" : "COMPLETADA"); }}
                      className="mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition"
                      style={{ borderColor: done ? "#059669" : "var(--border)", background: done ? "#059669" : "transparent" }}>
                      {done && <span className="text-white text-xs">✓</span>}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-semibold ${done ? "line-through" : ""}`} style={{ color: "var(--text)" }}>
                          {task.title}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg text-xs font-semibold" style={{ color: pCfg.color, background: pCfg.bg }}>
                          {pCfg.dot} {pCfg.label}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg text-xs font-semibold" style={{ color: sCfg.color, background: sCfg.bg }}>
                          {sCfg.label}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--text-muted)" }}>{task.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {task.assignee && (
                          <span className="text-xs flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                            <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold">
                              {task.assignee.name[0]}
                            </span>
                            {task.assignee.name}
                          </span>
                        )}
                        {due && (
                          <span className="text-xs font-medium" style={{ color: due.overdue ? "#DC2626" : "var(--text-muted)" }}>
                            {due.overdue ? "⚠️" : "📅"} {due.text}
                          </span>
                        )}
                        {task.contact && (
                          <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: "var(--bg)", color: "var(--text-muted)" }}>
                            👤 {task.contact.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create task modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-lg rounded-3xl p-6 overflow-y-auto max-h-[90vh]" style={{ background: "var(--surface)", boxShadow: "var(--shadow-lg)" }}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-lg" style={{ color: "var(--text)" }}>Nueva tarea</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--bg)", color: "var(--text-muted)" }}>✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Título *</label>
                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)", borderRadius: "10px" }}
                  placeholder="¿Qué hay que hacer?" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Descripción</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} className="w-full border px-3 py-2 text-sm resize-none" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)", borderRadius: "10px" }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Asignar a</label>
                  <select value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}
                    className="w-full border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)", borderRadius: "10px" }}>
                    <option value="">— Sin asignar —</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Prioridad</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))}
                    className="w-full border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)", borderRadius: "10px" }}>
                    <option value="LOW">🔵 Baja</option>
                    <option value="NORMAL">⚪ Normal</option>
                    <option value="HIGH">🟡 Alta</option>
                    <option value="URGENT">🔴 Urgente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Fecha límite</label>
                  <input type="datetime-local" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                    className="w-full border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)", borderRadius: "10px" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Recordatorio</label>
                  <input type="datetime-local" value={form.reminderAt} onChange={e => setForm(f => ({ ...f, reminderAt: e.target.value }))}
                    className="w-full border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)", borderRadius: "10px" }} />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-medium border" style={{ borderColor: "var(--border)", color: "var(--text)" }}>Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 rounded-2xl text-sm font-semibold text-white" style={{ background: "#E8610A" }}>
                  Crear tarea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-lg rounded-3xl p-6 overflow-y-auto max-h-[90vh]" style={{ background: "var(--surface)", boxShadow: "var(--shadow-lg)" }}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex-1">
                <div className="font-bold text-lg" style={{ color: "var(--text)" }}>{selected.title}</div>
                <div className="flex gap-2 mt-1 flex-wrap">
                  <span className="px-2 py-0.5 rounded-lg text-xs font-semibold" style={{ color: PRIO[selected.priority].color, background: PRIO[selected.priority].bg }}>
                    {PRIO[selected.priority].dot} {PRIO[selected.priority].label}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg text-xs font-semibold" style={{ color: STATUS_CFG[selected.status].color, background: STATUS_CFG[selected.status].bg }}>
                    {STATUS_CFG[selected.status].label}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--bg)", color: "var(--text-muted)" }}>✕</button>
            </div>

            <div className="space-y-3">
              {selected.description && (
                <div className="p-3 rounded-2xl text-sm" style={{ background: "var(--bg)", color: "var(--text)" }}>
                  {selected.description}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-sm">
                {selected.assignee && (
                  <div className="p-3 rounded-2xl" style={{ background: "var(--bg)" }}>
                    <div className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Asignado a</div>
                    <div style={{ color: "var(--text)" }}>{selected.assignee.name}</div>
                  </div>
                )}
                {selected.creator && (
                  <div className="p-3 rounded-2xl" style={{ background: "var(--bg)" }}>
                    <div className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Creado por</div>
                    <div style={{ color: "var(--text)" }}>{selected.creator.name}</div>
                  </div>
                )}
                {selected.dueDate && (
                  <div className="p-3 rounded-2xl" style={{ background: "var(--bg)" }}>
                    <div className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Fecha límite</div>
                    <div style={{ color: "var(--text)" }}>{new Date(selected.dueDate).toLocaleString("es-DO")}</div>
                  </div>
                )}
                {selected.contact && (
                  <div className="p-3 rounded-2xl" style={{ background: "var(--bg)" }}>
                    <div className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Contacto</div>
                    <div style={{ color: "var(--text)" }}>{selected.contact.name}</div>
                  </div>
                )}
              </div>

              {/* Status actions */}
              <div className="grid grid-cols-4 gap-2">
                {(["PENDIENTE", "EN_PROGRESO", "COMPLETADA", "CANCELADA"] as TaskStatus[]).map(st => (
                  <button key={st} onClick={() => { updateStatus(selected.id, st); }}
                    className="py-2 rounded-xl text-xs font-medium border transition"
                    style={{ background: selected.status === st ? "#E8610A" : "var(--bg)", color: selected.status === st ? "#fff" : "var(--text-muted)", borderColor: selected.status === st ? "#E8610A" : "var(--border)" }}>
                    {STATUS_CFG[st].label}
                  </button>
                ))}
              </div>

              <button onClick={() => deleteTask(selected.id)}
                className="w-full py-2 rounded-xl text-xs font-medium border"
                style={{ borderColor: "#FCA5A5", color: "#DC2626", background: "#FEF2F2" }}>
                🗑 Eliminar tarea
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
