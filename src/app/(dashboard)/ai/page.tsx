"use client";

import { useState, useRef, useEffect } from "react";
import { PageHeader } from "@/components/ui";

interface Msg { role: "user" | "assistant"; content: string }
interface Conv { id: string; title: string; updatedAt: string }

const SUGGESTIONS = [
  "¿Cuál es el canal con más leads este mes?",
  "¿Qué etapa del pipeline tiene más oportunidades atascadas?",
  "¿Cómo está el ROI de nuestras campañas publicitarias?",
  "Dame un resumen ejecutivo del negocio",
  "¿Qué tendencias ves en las ventas?",
  "¿Cuáles son los agentes con mejor desempeño?",
];

export default function AIPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);
  const [history, setHistory] = useState<Conv[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    fetch("/api/ai/chat").then(r => r.json()).then(setHistory).catch(() => {});
  }, []);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: msg }]);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, conversationId: convId }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      setConvId(data.conversationId);
      // refresh history
      fetch("/api/ai/chat").then(r => r.json()).then(setHistory).catch(() => {});
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Error al conectar con Edrin AI. Verifica la configuración de API." }]);
    } finally {
      setLoading(false);
    }
  }

  async function loadConversation(id: string) {
    try {
      const res = await fetch(`/api/ai/chat?id=${id}`);
      const data = await res.json();
      setMessages(data.messages ?? []);
      setConvId(id);
      setHistoryOpen(false);
    } catch { /* ignore */ }
  }

  function newChat() {
    setMessages([]);
    setConvId(null);
    setHistoryOpen(false);
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "var(--bg)" }}>
      <div className="px-8 pt-6 pb-0">
        <PageHeader
          title="Edrin AI Business Analyst"
          subtitle="Consulta datos del negocio, detecta tendencias y obtén insights estratégicos"
          action={
            <div className="flex gap-2">
              <button
                onClick={() => setHistoryOpen(!historyOpen)}
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
                className="px-3 py-2 rounded-lg text-sm transition hover:opacity-80"
              >
                🕐 Historial
              </button>
              <button
                onClick={newChat}
                style={{ background: "var(--brand)" }}
                className="px-3 py-2 rounded-lg text-sm text-white transition hover:opacity-90"
              >
                + Nueva conversación
              </button>
            </div>
          }
        />
      </div>

      <div className="flex flex-1 min-h-0 px-8 pb-6 gap-4 mt-4">
        {/* History panel */}
        {historyOpen && (
          <div className="w-64 rounded-xl overflow-y-auto flex-shrink-0 p-3 space-y-1"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider px-2 py-1" style={{ color: "var(--text-muted)" }}>Conversaciones</p>
            {history.map(c => (
              <button
                key={c.id}
                onClick={() => loadConversation(c.id)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm transition hover:opacity-80"
                style={{ background: c.id === convId ? "var(--brand)" : "transparent", color: c.id === convId ? "#fff" : "var(--text)" }}
              >
                <div className="truncate font-medium">{c.title}</div>
                <div className="text-xs opacity-60">{new Date(c.updatedAt).toLocaleDateString("es-DO")}</div>
              </button>
            ))}
            {history.length === 0 && <p className="text-xs px-2 py-1" style={{ color: "var(--text-muted)" }}>Sin conversaciones aún</p>}
          </div>
        )}

        {/* Chat */}
        <div className="flex-1 flex flex-col rounded-xl overflow-hidden"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-6">
                <div>
                  <div className="text-5xl mb-3">✧</div>
                  <h3 className="text-lg font-bold mb-1" style={{ color: "var(--text)" }}>Edrin AI Business Analyst</h3>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Conectado en tiempo real con los datos de tu CRM.<br />
                    Pregúntame sobre ventas, leads, campañas, o el estado del negocio.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 max-w-lg w-full">
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-left px-4 py-3 rounded-lg text-sm transition hover:opacity-80"
                      style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 flex-shrink-0"
                    style={{ background: "var(--brand)" }}>✧</div>
                )}
                <div
                  className="max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                  style={{
                    background: m.role === "user" ? "var(--brand)" : "var(--bg)",
                    color: m.role === "user" ? "#fff" : "var(--text)",
                    border: m.role === "assistant" ? "1px solid var(--border)" : "none",
                    borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  }}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 flex-shrink-0"
                  style={{ background: "var(--brand)" }}>✧</div>
                <div className="px-4 py-3 rounded-2xl text-sm" style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                  <span className="animate-pulse">Analizando datos...</span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t" style={{ borderColor: "var(--border)" }}>
            <div className="flex gap-3">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Pregunta algo sobre el negocio... (Enter para enviar)"
                rows={1}
                className="flex-1 resize-none px-4 py-3 rounded-xl text-sm outline-none"
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                  minHeight: "48px",
                  maxHeight: "120px",
                }}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className="px-5 py-3 rounded-xl text-white text-sm font-medium transition disabled:opacity-40"
                style={{ background: "var(--brand)" }}
              >
                ↑
              </button>
            </div>
            <p className="text-xs mt-2 text-center" style={{ color: "var(--text-muted)" }}>
              Edrin AI tiene acceso a todos los datos del CRM en tiempo real • Powered by Claude Opus 4.8
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
