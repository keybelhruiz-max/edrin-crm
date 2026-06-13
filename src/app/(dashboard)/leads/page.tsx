"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, Card, Input, Select, Btn, Badge } from "@/components/ui";

type Contact = {
  id: string;
  name: string;
  phone: string;
  email: string;
  channel: string;
  notes: string;
  createdAt: string;
  agent: { id: string; name: string } | null;
};
type Agent = { id: string; name: string; role: string };

const CHANNELS = ["WHATSAPP", "INSTAGRAM", "TIKTOK", "MESSENGER", "DIRECTO", "OTRO"];
const CHANNEL_COLORS: Record<string, string> = {
  WHATSAPP: "#25D366", INSTAGRAM: "#E1306C", TIKTOK: "#010101",
  MESSENGER: "#0084FF", DIRECTO: "#6B7280", OTRO: "#9CA3AF",
};

export default function LeadsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterChannel, setFilterChannel] = useState("");

  const [form, setForm] = useState({
    name: "", phone: "", email: "", socialHandle: "",
    channel: "WHATSAPP", notes: "", agentId: "",
    destination: "", isInternational: false, createOpportunity: true,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/contacts").then((r) => r.json()).then(setContacts);
    fetch("/api/users").then((r) => r.json()).then(setAgents);
  }, []);

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.phone?.includes(q) || c.email?.toLowerCase().includes(q);
    const matchChannel = !filterChannel || c.channel === filterChannel;
    return matchSearch && matchChannel;
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const contact = await res.json();
    setContacts((prev) => [contact, ...prev]);
    setShowForm(false);
    setForm({ name: "", phone: "", email: "", socialHandle: "", channel: "WHATSAPP", notes: "", agentId: "", destination: "", isInternational: false, createOpportunity: true });
    setSubmitting(false);

    // Navigate to opportunity if created
    if (form.createOpportunity) router.push("/pipeline");
  }

  return (
    <div className="flex flex-col h-screen overflow-auto" style={{ background: "var(--bg)" }}>
      <PageHeader title="Leads" subtitle={`${contacts.length} contactos registrados`}>
        <Btn variant="primary" onClick={() => setShowForm(true)}>+ Nuevo lead</Btn>
      </PageHeader>

      {/* New lead drawer */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div
            className="w-full max-w-lg overflow-auto p-6 shadow-2xl"
            style={{ background: "var(--surface)" }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Nuevo lead</h2>
              <button onClick={() => setShowForm(false)} style={{ color: "var(--text-muted)" }}>✕</button>
            </div>

            <form onSubmit={submit} className="space-y-4">
              {/* Canal */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Canal de origen</label>
                <div className="flex gap-2 flex-wrap">
                  {CHANNELS.map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setForm({ ...form, channel: ch })}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border transition"
                      style={{
                        background: form.channel === ch ? CHANNEL_COLORS[ch] : "var(--bg)",
                        borderColor: form.channel === ch ? CHANNEL_COLORS[ch] : "var(--border)",
                        color: form.channel === ch ? "#fff" : "var(--text-muted)",
                      }}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Input label="Nombre completo *" value={form.name} required
                    onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej. María González" />
                </div>
                <Input label="Teléfono / WhatsApp" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 809 000 0000" />
                <Input label="Usuario / handle" value={form.socialHandle}
                  onChange={(e) => setForm({ ...form, socialHandle: e.target.value })} placeholder="@usuario" />
                <div className="col-span-2">
                  <Input label="Email (opcional)" type="email" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="correo@ejemplo.com" />
                </div>
              </div>

              {/* Vendedor asignado */}
              <Select
                label="Vendedor asignado"
                value={form.agentId}
                onChange={(e) => setForm({ ...form, agentId: e.target.value })}
              >
                <option value="">— Sin asignar —</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
                ))}
              </Select>

              {/* Destino */}
              <div className="grid grid-cols-2 gap-3">
                <Input label="Destino de interés" value={form.destination}
                  onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder="Ej. Punta Cana" />
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isInternational}
                      onChange={(e) => setForm({ ...form, isInternational: e.target.checked })}
                      className="w-4 h-4 accent-[#E8610A]" />
                    <span className="text-sm" style={{ color: "var(--text)" }}>¿Internacional?</span>
                  </label>
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Notas iniciales</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Interés, presupuesto, fechas aproximadas..."
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none resize-none"
                  style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
                />
              </div>

              {/* Create opportunity */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.createOpportunity}
                  onChange={(e) => setForm({ ...form, createOpportunity: e.target.checked })}
                  className="w-4 h-4 accent-[#E8610A]" />
                <span className="text-sm" style={{ color: "var(--text)" }}>Agregar al pipeline automáticamente</span>
              </label>

              <div className="flex gap-3 pt-2">
                <Btn type="submit" variant="primary" disabled={submitting} className="flex-1">
                  {submitting ? "Guardando..." : "Crear lead"}
                </Btn>
                <Btn type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Btn>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="px-6 py-3 flex gap-3 border-b" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <input
          type="search"
          placeholder="Buscar por nombre, teléfono o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border rounded-lg px-3 py-1.5 text-sm outline-none"
          style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
        />
        <select
          value={filterChannel}
          onChange={(e) => setFilterChannel(e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm outline-none"
          style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
        >
          <option value="">Todos los canales</option>
          {CHANNELS.map((ch) => <option key={ch} value={ch}>{ch}</option>)}
        </select>
      </div>

      {/* Leads list */}
      <div className="flex-1 p-6">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">◎</div>
            <div className="text-sm" style={{ color: "var(--text-muted)" }}>Sin leads. Haz clic en &ldquo;+ Nuevo lead&rdquo; para comenzar.</div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => (
              <Card key={c.id} className="hover:border-[#E8610A]/40 transition cursor-pointer group">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ background: CHANNEL_COLORS[c.channel] ?? "#6B7280" }}
                    >
                      {c.name[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-sm" style={{ color: "var(--text)" }}>{c.name}</div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {c.phone || c.email || c.agent?.name || "—"}
                      </div>
                    </div>
                  </div>
                  <Badge color={CHANNEL_COLORS[c.channel]}>{c.channel}</Badge>
                </div>
                {c.notes && (
                  <div className="mt-3 text-xs line-clamp-2" style={{ color: "var(--text-muted)" }}>{c.notes}</div>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {c.agent ? `👤 ${c.agent.name}` : "Sin asignar"}
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {new Date(c.createdAt).toLocaleDateString("es-DO")}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
