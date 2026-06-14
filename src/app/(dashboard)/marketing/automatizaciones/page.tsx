"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card, Btn, Input, Select } from "@/components/ui";

interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  conditions: string;
  actions: string;
  active: boolean;
  executions: number;
  lastRun: string | null;
  createdAt: string;
}

const TRIGGERS = [
  { value: "NEW_LEAD", label: "Nuevo lead creado" },
  { value: "STAGE_CHANGE", label: "Oportunidad cambia de etapa" },
  { value: "INVOICE_PAID", label: "Factura pagada" },
  { value: "BIRTHDAY", label: "Cumpleaños del cliente" },
  { value: "NO_CONTACT_7D", label: "Sin contacto en 7 días" },
  { value: "NO_CONTACT_30D", label: "Sin contacto en 30 días" },
  { value: "DEAL_WON", label: "Negocio cerrado/ganado" },
  { value: "DEAL_LOST", label: "Negocio perdido" },
];

const ACTIONS = [
  { value: "SEND_WHATSAPP", label: "Enviar mensaje por WhatsApp" },
  { value: "SEND_EMAIL", label: "Enviar correo electrónico" },
  { value: "CREATE_TASK", label: "Crear tarea para agente" },
  { value: "MOVE_STAGE", label: "Mover a otra etapa" },
  { value: "ASSIGN_AGENT", label: "Asignar a agente" },
  { value: "ADD_TAG", label: "Agregar etiqueta" },
  { value: "POST_INSTAGRAM", label: "Publicar en Instagram" },
  { value: "NOTIFY_SLACK", label: "Notificar en Slack" },
];

const TEMPLATE_RULES = [
  {
    name: "Bienvenida a nuevo lead",
    trigger: "NEW_LEAD",
    description: "Envía WhatsApp automático cuando llega un nuevo lead",
    actions: ["SEND_WHATSAPP"],
    icon: "👋",
    color: "#10b981",
  },
  {
    name: "Recuperación de clientes inactivos",
    trigger: "NO_CONTACT_30D",
    description: "Contacta clientes que llevan 30 días sin actividad",
    actions: ["SEND_EMAIL", "CREATE_TASK"],
    icon: "🔄",
    color: "#6366f1",
  },
  {
    name: "Felicitación por negocio cerrado",
    trigger: "DEAL_WON",
    description: "Envía mensaje de agradecimiento cuando se cierra una venta",
    actions: ["SEND_WHATSAPP", "SEND_EMAIL"],
    icon: "🎉",
    color: "#f59e0b",
  },
  {
    name: "Seguimiento post-pago",
    trigger: "INVOICE_PAID",
    description: "Tarea automática de seguimiento al recibir pago",
    actions: ["CREATE_TASK", "SEND_WHATSAPP"],
    icon: "✅",
    color: "#3b82f6",
  },
];

export default function AutomatizacionesPage() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    trigger: "NEW_LEAD",
    conditions: "{}",
    actions: "SEND_WHATSAPP",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/marketing/automations").then(r => r.json()).then((d) => setRules(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  async function toggleRule(id: string, active: boolean) {
    await fetch(`/api/marketing/automations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    setRules(prev => prev.map(r => r.id === id ? { ...r, active: !active } : r));
  }

  async function deleteRule(id: string) {
    await fetch(`/api/marketing/automations/${id}`, { method: "DELETE" });
    setRules(prev => prev.filter(r => r.id !== id));
  }

  async function saveRule() {
    setSaving(true);
    try {
      const res = await fetch("/api/marketing/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, actions: JSON.stringify([form.actions]) }),
      });
      const newRule = await res.json();
      setRules(prev => [newRule, ...prev]);
      setShowForm(false);
      setForm({ name: "", trigger: "NEW_LEAD", conditions: "{}", actions: "SEND_WHATSAPP" });
    } finally { setSaving(false); }
  }

  async function createFromTemplate(tmpl: typeof TEMPLATE_RULES[0]) {
    const res = await fetch("/api/marketing/automations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: tmpl.name,
        trigger: tmpl.trigger,
        conditions: "{}",
        actions: JSON.stringify(tmpl.actions),
      }),
    });
    const newRule = await res.json();
    setRules(prev => [newRule, ...prev]);
  }

  const activeCount = rules.filter(r => r.active).length;

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <div className="max-w-6xl mx-auto px-8 py-8">
        <PageHeader
          title="Automatizaciones"
          subtitle="Motor de reglas if/then para automatizar acciones del CRM"
          action={<Btn onClick={() => setShowForm(true)}>+ Nueva automatización</Btn>}
        />

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="text-center">
            <div className="text-3xl font-black mb-1" style={{ color: "var(--brand)" }}>{rules.length}</div>
            <div className="text-sm" style={{ color: "var(--text)" }}>Reglas totales</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-black mb-1" style={{ color: "#10b981" }}>{activeCount}</div>
            <div className="text-sm" style={{ color: "var(--text)" }}>Activas</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-black mb-1" style={{ color: "#6366f1" }}>
              {rules.reduce((s, r) => s + r.executions, 0)}
            </div>
            <div className="text-sm" style={{ color: "var(--text)" }}>Ejecuciones totales</div>
          </Card>
        </div>

        {/* Templates */}
        {rules.length === 0 && (
          <div className="mb-8">
            <h3 className="font-bold mb-4" style={{ color: "var(--text)" }}>Plantillas recomendadas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {TEMPLATE_RULES.map(t => (
                <div key={t.name} className="p-4 rounded-xl"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{t.icon}</span>
                      <div>
                        <div className="font-medium text-sm" style={{ color: "var(--text)" }}>{t.name}</div>
                        <div className="text-xs" style={{ color: "var(--text-muted)" }}>{t.description}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {t.actions.map(a => (
                      <span key={a} className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: t.color + "22", color: t.color }}>
                        {ACTIONS.find(x => x.value === a)?.label ?? a}
                      </span>
                    ))}
                  </div>
                  <button onClick={() => createFromTemplate(t)}
                    className="mt-3 w-full py-1.5 rounded-lg text-sm font-medium transition hover:opacity-80"
                    style={{ background: t.color, color: "#fff" }}>
                    Usar plantilla
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rules list */}
        <div className="space-y-3">
          {rules.length > 0 && (
            <h3 className="font-bold mb-4" style={{ color: "var(--text)" }}>Mis automatizaciones</h3>
          )}
          {rules.map(rule => {
            const trigger = TRIGGERS.find(t => t.value === rule.trigger);
            let actionsArr: string[] = [];
            try { actionsArr = JSON.parse(rule.actions); } catch { actionsArr = [rule.actions]; }
            return (
              <div key={rule.id} className="rounded-xl p-4"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Toggle */}
                    <button onClick={() => toggleRule(rule.id, rule.active)}
                      className="relative w-10 h-5 rounded-full transition-colors"
                      style={{ background: rule.active ? "var(--brand)" : "var(--border)" }}>
                      <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                        style={{ transform: rule.active ? "translateX(20px)" : "translateX(0)" }} />
                    </button>
                    <div>
                      <div className="font-medium" style={{ color: "var(--text)" }}>{rule.name}</div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                        Disparador: <span style={{ color: "var(--brand)" }}>{trigger?.label ?? rule.trigger}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-bold" style={{ color: "var(--text)" }}>{rule.executions}</div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>ejecuciones</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${rule.active ? "text-green-600" : ""}`}
                      style={{ background: rule.active ? "rgba(16,185,129,0.1)" : "var(--bg)", color: rule.active ? "#10b981" : "var(--text-muted)" }}>
                      {rule.active ? "Activa" : "Pausada"}
                    </span>
                    <button onClick={() => deleteRule(rule.id)} className="text-xs hover:opacity-70" style={{ color: "#ef4444" }}>✕</button>
                  </div>
                </div>
                {/* Actions */}
                <div className="flex gap-2 mt-3">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>Acciones:</span>
                  {actionsArr.map(a => {
                    const actionDef = ACTIONS.find(x => x.value === a);
                    return (
                      <span key={a} className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1" }}>
                        {actionDef?.label ?? a}
                      </span>
                    );
                  })}
                </div>
                {rule.lastRun && (
                  <div className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                    Última ejecución: {new Date(rule.lastRun).toLocaleString("es-DO")}
                  </div>
                )}
              </div>
            );
          })}
          {rules.length === 0 && (
            <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>
              Sin automatizaciones. Usa una plantilla arriba o crea una nueva.
            </div>
          )}
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="rounded-2xl p-6 w-full max-w-md" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg" style={{ color: "var(--text)" }}>Nueva automatización</h3>
              <button onClick={() => setShowForm(false)} style={{ color: "var(--text-muted)" }}>✕</button>
            </div>
            <div className="space-y-3">
              <Input label="Nombre de la regla" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Bienvenida nuevo lead" />
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>SI... (disparador)</label>
                <select value={form.trigger} onChange={e => setForm(f => ({ ...f, trigger: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}>
                  {TRIGGERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>ENTONCES... (acción)</label>
                <select value={form.actions} onChange={e => setForm(f => ({ ...f, actions: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}>
                  {ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
            </div>
            {/* Visual preview */}
            <div className="mt-4 p-3 rounded-xl" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>Vista previa de la regla</div>
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <span className="px-2 py-1 rounded" style={{ background: "#6366f120", color: "#6366f1" }}>
                  SI: {TRIGGERS.find(t => t.value === form.trigger)?.label}
                </span>
                <span style={{ color: "var(--text-muted)" }}>→</span>
                <span className="px-2 py-1 rounded" style={{ background: "#10b98120", color: "#10b981" }}>
                  ENTONCES: {ACTIONS.find(a => a.value === form.actions)?.label}
                </span>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <Btn onClick={saveRule} disabled={saving || !form.name}>{saving ? "Guardando..." : "Crear regla"}</Btn>
              <Btn variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
