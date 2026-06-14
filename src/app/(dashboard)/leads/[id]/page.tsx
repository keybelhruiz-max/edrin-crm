"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const CHANNEL_COLORS: Record<string, string> = {
  WHATSAPP: "#25D366", INSTAGRAM: "#E1306C", TIKTOK: "#010101",
  MESSENGER: "#0084FF", DIRECTO: "#6B7280", OTRO: "#9CA3AF",
};

type Contact = {
  id: string; name: string; phone: string; email: string;
  socialHandle: string; channel: string; notes: string;
  createdAt: string; agentId: string | null;
  agent: { id: string; name: string } | null;
  interactions: { id: string; type: string; notes: string; createdAt: string; agent: { name: string } | null }[];
  opportunities: { id: string; destination?: string; estimatedValue?: number; currency: string; stage: { name: string; color: string } }[];
  tasks: { id: string; title: string; dueDate?: string; done: boolean }[];
};

const INTERACTION_ICONS: Record<string, string> = {
  CALL: "📞", EMAIL: "📧", WHATSAPP: "💬", MEETING: "🤝", NOTE: "📝", OTHER: "◎",
};

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    fetch(`/api/contacts/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setContact(d); setLoading(false); });
  }, [id]);

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    setAddingNote(true);
    await fetch("/api/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId: id, type: "NOTE", notes: noteText }),
    });
    const res = await fetch(`/api/contacts/${id}`);
    setContact(await res.json());
    setNoteText("");
    setAddingNote(false);
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ color: "var(--text-muted)" }}>
      Cargando contacto...
    </div>
  );

  if (!contact) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="text-4xl">◎</div>
      <p style={{ color: "var(--text-muted)" }}>Contacto no encontrado</p>
      <Link href="/leads" className="text-sm px-4 py-2 rounded-lg text-white" style={{ background: "var(--brand)" }}>
        Volver a leads
      </Link>
    </div>
  );

  const channelColor = CHANNEL_COLORS[contact.channel] ?? "#6B7280";

  return (
    <div className="min-h-screen pb-24 md:pb-6" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b px-4 md:px-6 py-3 flex items-center gap-3"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <button onClick={() => router.back()} className="text-sm p-1.5 rounded-lg transition hover:opacity-70"
          style={{ color: "var(--text-muted)" }}>← Volver</button>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
          style={{ background: channelColor }}>{contact.name[0]}</div>
        <div className="flex-1 min-w-0">
          <div className="font-bold truncate" style={{ color: "var(--text)" }}>{contact.name}</div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>{contact.channel}</div>
        </div>
        {contact.opportunities.length > 0 && (
          <Link href={`/oportunidad/${contact.opportunities[0].id}`}
            className="text-xs px-3 py-1.5 rounded-lg text-white hidden sm:block"
            style={{ background: "var(--brand)" }}>
            Ver oportunidad
          </Link>
        )}
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-6 grid md:grid-cols-3 gap-4">
        {/* Left column - contact info */}
        <div className="space-y-4">
          {/* Info card */}
          <div className="rounded-2xl border p-4 space-y-3" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Información</div>
            {[
              { label: "Teléfono", value: contact.phone, icon: "📞" },
              { label: "Email", value: contact.email, icon: "📧" },
              { label: "Handle", value: contact.socialHandle, icon: "@" },
              { label: "Agente", value: contact.agent?.name, icon: "👤" },
            ].filter(r => r.value).map(row => (
              <div key={row.label} className="flex items-start gap-2">
                <span className="text-base leading-none mt-0.5">{row.icon}</span>
                <div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>{row.label}</div>
                  <div className="text-sm font-medium" style={{ color: "var(--text)" }}>{row.value}</div>
                </div>
              </div>
            ))}
            <div className="text-xs pt-1" style={{ color: "var(--text-muted)" }}>
              Registrado {new Date(contact.createdAt).toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" })}
            </div>
          </div>

          {/* Notes */}
          {contact.notes && (
            <div className="rounded-2xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Notas</div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{contact.notes}</p>
            </div>
          )}

          {/* Opportunities */}
          {contact.opportunities.length > 0 && (
            <div className="rounded-2xl border p-4 space-y-2" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Oportunidades</div>
              {contact.opportunities.map(o => (
                <Link key={o.id} href={`/oportunidad/${o.id}`}
                  className="block rounded-xl p-3 border transition hover:opacity-80"
                  style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: o.stage.color }} />
                    <span className="text-xs font-medium" style={{ color: "var(--text)" }}>{o.stage.name}</span>
                  </div>
                  {o.destination && <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>📍 {o.destination}</div>}
                  {o.estimatedValue && (
                    <div className="text-xs font-semibold mt-1" style={{ color: "var(--brand)" }}>
                      {o.currency} {o.estimatedValue.toLocaleString()}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}

          {/* Tasks */}
          {contact.tasks.length > 0 && (
            <div className="rounded-2xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Tareas</div>
              <div className="space-y-1.5">
                {contact.tasks.map(t => (
                  <div key={t.id} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-xs"
                      style={{ borderColor: t.done ? "var(--brand)" : "var(--border)", background: t.done ? "var(--brand)" : "transparent", color: "#fff" }}>
                      {t.done ? "✓" : ""}
                    </div>
                    <span className="text-sm" style={{ color: t.done ? "var(--text-muted)" : "var(--text)", textDecoration: t.done ? "line-through" : "none" }}>
                      {t.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column - timeline */}
        <div className="md:col-span-2 space-y-4">
          {/* Add note */}
          <div className="rounded-2xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Agregar nota</div>
            <form onSubmit={addNote} className="flex gap-2">
              <input
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Escribe una nota sobre este contacto..."
                className="flex-1 border rounded-xl px-3 py-2 text-sm outline-none"
                style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
              />
              <button type="submit" disabled={!noteText.trim() || addingNote}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-40"
                style={{ background: "var(--brand)" }}>
                {addingNote ? "..." : "Guardar"}
              </button>
            </form>
          </div>

          {/* Timeline */}
          <div className="rounded-2xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>
              Historial de interacciones ({contact.interactions.length})
            </div>
            {contact.interactions.length === 0 ? (
              <div className="text-center py-8 text-sm" style={{ color: "var(--text-muted)" }}>
                Sin interacciones aún. Agrega una nota arriba.
              </div>
            ) : (
              <div className="space-y-3">
                {[...contact.interactions].reverse().map((i) => (
                  <div key={i.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                      style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                      {INTERACTION_ICONS[i.type] ?? "◎"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold" style={{ color: "var(--text)" }}>{i.type}</span>
                        {i.agent && <span className="text-xs" style={{ color: "var(--text-muted)" }}>por {i.agent.name}</span>}
                        <span className="text-xs ml-auto" style={{ color: "var(--text-muted)" }}>
                          {new Date(i.createdAt).toLocaleString("es-DO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      {i.notes && <p className="text-sm mt-0.5 leading-relaxed" style={{ color: "var(--text)" }}>{i.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
