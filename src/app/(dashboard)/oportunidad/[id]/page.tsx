"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage = { id: string; name: string; color: string };
type Interaction = {
  id: string; contactId: string; channel: string; content: string;
  sentBy: string | null; isInternal: boolean; agentId: string | null;
  agent: { id: string; name: string } | null;
  createdAt: string;
};
type Quote = {
  id: string;
  label: string;
  tipo: "PLATAFORMA" | "BLOQUEO";
  mayorista: string;
  hotelName: string;
  description: string;
  checkIn: string | null;
  checkOut: string | null;
  nights: number | null;
  adults: number;
  children: number;
  costPrice: number;
  salePrice: number;
  currency: "USD" | "DOP";
  exchangeRate: number;
  isSelected: boolean;
  notes: string;
};
type Invoice = {
  id: string;
  number: string;
  type: string;
  total: number;
  currency: string;
  status: string;
  createdAt: string;
};
type Opportunity = {
  id: string;
  destination: string;
  mayorista: string;
  checkIn: string | null;
  checkOut: string | null;
  estimatedValue: number | null;
  currency: "USD" | "DOP";
  isInternational: boolean;
  intlChecklist: string;
  notes: string;
  stageId: string;
  stage: Stage;
  contact: { id: string; name: string; channel: string; phone: string; email: string };
  quotes: Quote[];
  invoices: Invoice[];
};

const MAYORISTAS = ["GNIALL", "EXPERT AGENCIAS", "ATOM", "VIAJES LOGITUR", "GRUPO GONZALEZ", "FLEX RD", "SUPLITUR", "OTRO"];
const INTL_CHECKLIST_ITEMS = [
  { key: "vuelo", label: "✈️ Vuelo" },
  { key: "itinerario", label: "📋 Itinerario" },
  { key: "visa", label: "📄 Visa" },
  { key: "seguro", label: "🛡️ Seguro de viaje" },
  { key: "eticket", label: "🎫 E-ticket" },
  { key: "doc_destino", label: "📌 Documento de recomendación en el destino" },
  { key: "otros", label: "📦 Otros" },
];

const toDateInput = (d: string | null) =>
  d ? new Date(d).toISOString().split("T")[0] : "";

// ─── Quote Card Component ─────────────────────────────────────────────────────

function QuoteCard({
  quote,
  index,
  isWon,
  onUpdate,
  onDelete,
  onSelect,
}: {
  quote: Quote;
  index: number;
  isWon: boolean;
  onUpdate: (id: string, data: Partial<Quote>) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(index === 0);

  return (
    <div className={`border rounded-xl overflow-hidden ${quote.isSelected ? "border-[#E8610A] ring-2 ring-[#E8610A]/20" : "border-gray-200"}`}>
      {/* Header */}
      <div
        className={`flex items-center justify-between px-4 py-3 cursor-pointer ${quote.isSelected ? "bg-[#E8610A]/5" : "bg-gray-50"}`}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm text-gray-800">{quote.label}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${quote.tipo === "BLOQUEO" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
            {quote.tipo === "BLOQUEO" ? "Bloqueo" : "Plataforma"}
          </span>
          {quote.isSelected && (
            <span className="text-xs bg-[#E8610A] text-white px-2 py-0.5 rounded-full">Seleccionada ✓</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {quote.salePrice > 0 && (
            <span className="text-sm font-semibold text-[#E8610A]">
              {quote.currency} {quote.salePrice.toLocaleString()}
            </span>
          )}
          <span className="text-gray-400 text-sm">{open ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* Body */}
      {open && (
        <div className="p-4 space-y-3 bg-white">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nombre de etiqueta</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
                value={quote.label}
                onChange={(e) => onUpdate(quote.id, { label: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tipo de tarifa</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
                value={quote.tipo}
                onChange={(e) => onUpdate(quote.id, { tipo: e.target.value as "PLATAFORMA" | "BLOQUEO" })}
              >
                <option value="PLATAFORMA">Plataforma (tarifa enviada)</option>
                <option value="BLOQUEO">Bloqueo</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mayorista</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
                value={quote.mayorista}
                onChange={(e) => onUpdate(quote.id, { mayorista: e.target.value })}
              >
                <option value="">— Seleccionar —</option>
                {MAYORISTAS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Hotel</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
                value={quote.hotelName}
                onChange={(e) => onUpdate(quote.id, { hotelName: e.target.value })}
                placeholder="Ej. Live Aqua Punta Cana"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Check-in</label>
              <input
                type="date"
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
                value={toDateInput(quote.checkIn)}
                onChange={(e) => onUpdate(quote.id, { checkIn: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Check-out</label>
              <input
                type="date"
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
                value={toDateInput(quote.checkOut)}
                onChange={(e) => onUpdate(quote.id, { checkOut: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Noches</label>
              <input
                type="number"
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
                value={quote.nights ?? ""}
                onChange={(e) => onUpdate(quote.id, { nights: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Adultos</label>
                <input
                  type="number"
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
                  value={quote.adults}
                  onChange={(e) => onUpdate(quote.id, { adults: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Niños</label>
                <input
                  type="number"
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
                  value={quote.children}
                  onChange={(e) => onUpdate(quote.id, { children: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Descripción (va en la factura)</label>
            <textarea
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm resize-none"
              value={quote.description}
              onChange={(e) => onUpdate(quote.id, { description: e.target.value })}
              placeholder="Ej. Cat. Aqua Junior Suite Swim-up pool view — 2 pax: Nombre y Nombre"
            />
          </div>

          {/* Prices */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 rounded-lg p-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Moneda</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white"
                value={quote.currency}
                onChange={(e) => onUpdate(quote.id, { currency: e.target.value as "USD" | "DOP" })}
              >
                <option value="USD">USD $</option>
                <option value="DOP">DOP RD$</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Costo (mayorista)</label>
              <input
                type="number"
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white"
                value={quote.costPrice || ""}
                onChange={(e) => onUpdate(quote.id, { costPrice: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1 font-semibold text-[#E8610A]">Precio venta (cliente)</label>
              <input
                type="number"
                className="w-full border border-[#E8610A]/30 rounded-lg px-3 py-1.5 text-sm bg-white font-semibold"
                value={quote.salePrice || ""}
                onChange={(e) => onUpdate(quote.id, { salePrice: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Margin preview */}
          {quote.costPrice > 0 && quote.salePrice > 0 && (
            <div className="text-xs text-gray-500 bg-green-50 rounded-lg px-3 py-2">
              Margen:{" "}
              <span className="font-semibold text-green-700">
                {quote.currency} {(quote.salePrice - quote.costPrice).toFixed(2)}{" "}
                ({(((quote.salePrice - quote.costPrice) / quote.salePrice) * 100).toFixed(1)}%)
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {!quote.isSelected && (
              <button
                onClick={() => onSelect(quote.id)}
                className="text-xs bg-[#E8610A] text-white rounded-lg px-3 py-1.5 hover:bg-[#c94f08] transition"
              >
                ✓ Usar esta cotización
              </button>
            )}
            <button
              onClick={() => onDelete(quote.id)}
              className="text-xs text-red-500 hover:text-red-700 border border-red-200 rounded-lg px-3 py-1.5 transition"
            >
              Eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [opp, setOpp] = useState<Opportunity | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sendingNote, setSendingNote] = useState(false);

  // Invoice form state (shown when stage = won)
  const [invoiceForm, setInvoiceForm] = useState({
    type: "PROFORMA" as "PROFORMA" | "NCF" | "RECIBO",
    ncfNumber: "",
    clientName: "",
    clientRnc: "",
    notes: "",
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/opportunities/${id}`).then((r) => r.json()),
      fetch("/api/pipeline-stages").then((r) => r.json()),
    ]).then(([oppData, stagesData]) => {
      setOpp(oppData);
      setQuotes(oppData.quotes ?? []);
      setInvoices(oppData.invoices ?? []);
      setStages(stagesData);
      setInvoiceForm((f) => ({ ...f, clientName: oppData.contact?.name ?? "" }));
      // Load interactions for this contact
      if (oppData.contact?.id) {
        fetch(`/api/interactions?contactId=${oppData.contact.id}`)
          .then(r => r.ok ? r.json() : [])
          .then((d) => setInteractions(Array.isArray(d) ? d : []));
      }
    });
  }, [id]);

  async function sendNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteContent.trim() || !opp) return;
    setSendingNote(true);
    const r = await fetch("/api/interactions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactId: opp.contact.id,
        channel: opp.contact.channel,
        content: noteContent.trim(),
        isInternal: isInternalNote,
      }),
    });
    if (r.ok) {
      const newNote = await r.json();
      setInteractions(prev => [...prev, newNote]);
      setNoteContent("");
    }
    setSendingNote(false);
  }

  async function deleteInteraction(interactionId: string) {
    await fetch(`/api/interactions/${interactionId}`, { method: "DELETE" });
    setInteractions(prev => prev.filter(i => i.id !== interactionId));
  }

  if (!opp) return <div className="p-8 text-gray-500">Cargando...</div>;

  const checklist = JSON.parse(opp.intlChecklist || "{}") as Record<string, boolean>;
  const selectedQuote = quotes.find((q) => q.isSelected);
  const isWon = stages.find((s) => s.id === opp.stageId)?.name?.toLowerCase().includes("confirmada") ?? false;

  // ── Opportunity save ──
  async function saveOpp(patch: Partial<Opportunity>) {
    const updated = { ...opp, ...patch } as Opportunity;
    setOpp(updated);
    await fetch(`/api/opportunities/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  }

  // ── Checklist ──
  async function toggleChecklist(key: string) {
    const next = { ...checklist, [key]: !checklist[key] };
    const intlChecklist = JSON.stringify(next);
    setOpp((o) => o ? { ...o, intlChecklist } : o);
    await fetch(`/api/opportunities/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intlChecklist }),
    });
  }

  // ── Quote ops ──
  async function addQuote() {
    const res = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opportunityId: id, mayorista: "", hotelName: "", costPrice: 0, salePrice: 0 }),
    });
    const q = await res.json();
    setQuotes((prev) => [...prev, q]);
  }

  async function updateQuote(qid: string, data: Partial<Quote>) {
    setQuotes((prev) => prev.map((q) => (q.id === qid ? { ...q, ...data } : q)));
    await fetch(`/api/quotes/${qid}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  async function deleteQuote(qid: string) {
    await fetch(`/api/quotes/${qid}`, { method: "DELETE" });
    setQuotes((prev) => prev.filter((q) => q.id !== qid));
  }

  async function selectQuote(qid: string) {
    // Deselect all, select one
    await Promise.all(quotes.map((q) =>
      fetch(`/api/quotes/${q.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSelected: q.id === qid }),
      })
    ));
    setQuotes((prev) => prev.map((q) => ({ ...q, isSelected: q.id === qid })));
    if (quotes.find((q) => q.id === qid)) {
      const q = quotes.find((q) => q.id === qid)!;
      setInvoiceForm((f) => ({ ...f, notes: f.notes || `${q.hotelName} — ${q.description || ""}` }));
    }
  }

  // ── Generate invoice ──
  async function generateInvoice() {
    if (!selectedQuote) return;
    setGenerating(true);
    const items = [{
      description: `${selectedQuote.hotelName}\n${selectedQuote.description || ""}`.trim(),
      quantity: 1,
      unitPrice: selectedQuote.salePrice,
      total: selectedQuote.salePrice,
    }];
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        opportunityId: id,
        type: invoiceForm.type,
        ncfNumber: invoiceForm.ncfNumber || null,
        clientName: invoiceForm.clientName,
        clientRnc: invoiceForm.clientRnc || null,
        currency: selectedQuote.currency,
        exchangeRate: selectedQuote.exchangeRate,
        subtotal: selectedQuote.salePrice,
        itbis: 0,
        total: selectedQuote.salePrice,
        notes: invoiceForm.notes || "Gracias por su confianza.",
        items,
      }),
    });
    const inv = await res.json();
    setInvoices((prev) => [inv, ...prev]);
    setGenerating(false);
  }

  return (
    <div className="flex flex-col h-screen overflow-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b bg-white sticky top-0 z-10 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-700 text-lg">←</button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{opp.contact.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                style={{ backgroundColor: opp.stage.color }}
              >
                {opp.stage.name}
              </span>
              <span className="text-xs text-gray-400">{opp.contact.channel}</span>
            </div>
          </div>
        </div>
        {/* Stage selector */}
        <select
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
          value={opp.stageId}
          onChange={(e) => saveOpp({ stageId: e.target.value } as Partial<Opportunity>)}
        >
          {stages.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 flex-1">
        {/* LEFT — Lead info */}
        <div className="md:col-span-2 p-4 md:p-6 space-y-6 md:border-r overflow-auto">

          {/* Basic info */}
          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Información del viaje</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Destino</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={opp.destination || ""}
                  onChange={(e) => setOpp({ ...opp, destination: e.target.value })}
                  onBlur={() => saveOpp({ destination: opp.destination })}
                  placeholder="Ej. Punta Cana"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Check-in</label>
                <input
                  type="date"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={toDateInput(opp.checkIn)}
                  onChange={(e) => setOpp({ ...opp, checkIn: e.target.value })}
                  onBlur={() => saveOpp({ checkIn: opp.checkIn })}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Check-out</label>
                <input
                  type="date"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={toDateInput(opp.checkOut)}
                  onChange={(e) => setOpp({ ...opp, checkOut: e.target.value })}
                  onBlur={() => saveOpp({ checkOut: opp.checkOut })}
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={opp.isInternational}
                    onChange={(e) => {
                      setOpp({ ...opp, isInternational: e.target.checked });
                      saveOpp({ isInternational: e.target.checked });
                    }}
                    className="w-4 h-4 accent-[#E8610A]"
                  />
                  <span className="text-sm text-gray-700">¿Viaje internacional?</span>
                </label>
              </div>
            </div>
          </section>

          {/* International checklist */}
          {opp.isInternational && (
            <section className="bg-blue-50 rounded-xl p-4">
              <h2 className="text-sm font-semibold text-blue-800 mb-3">📋 Checklist — Viaje Internacional</h2>
              <div className="space-y-2">
                {INTL_CHECKLIST_ITEMS.map((item) => (
                  <label key={item.key} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!checklist[item.key]}
                      onChange={() => toggleChecklist(item.key)}
                      className="w-4 h-4 accent-[#E8610A]"
                    />
                    <span className={`text-sm ${checklist[item.key] ? "line-through text-gray-400" : "text-gray-700"}`}>
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
              <div className="mt-3 text-xs text-blue-600">
                {Object.values(checklist).filter(Boolean).length}/{INTL_CHECKLIST_ITEMS.length} completados
              </div>
            </section>
          )}

          {/* Notes */}
          <section>
            <label className="block text-xs text-gray-500 mb-1">Notas internas</label>
            <textarea
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
              value={opp.notes || ""}
              onChange={(e) => setOpp({ ...opp, notes: e.target.value })}
              onBlur={() => saveOpp({ notes: opp.notes })}
              placeholder="Notas del agente..."
            />
          </section>

          {/* Quotes section */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">Cotizaciones</h2>
              <button
                onClick={addQuote}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-3 py-1.5 transition"
              >
                + Agregar cotización
              </button>
            </div>
            {quotes.length === 0 && (
              <div className="text-sm text-gray-400 text-center py-6 border border-dashed border-gray-200 rounded-xl">
                Sin cotizaciones aún. Haz clic en &ldquo;+ Agregar cotización&rdquo;.
              </div>
            )}
            <div className="space-y-3">
              {quotes.map((q, i) => (
                <QuoteCard
                  key={q.id}
                  quote={q}
                  index={i}
                  isWon={isWon}
                  onUpdate={updateQuote}
                  onDelete={deleteQuote}
                  onSelect={selectQuote}
                />
              ))}
            </div>
          </section>

          {/* Invoice generation — only shown when stage is "Reserva confirmada" and quote selected */}
          {isWon && (
            <section className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h2 className="text-sm font-semibold text-green-800 mb-3">🎉 Lead Ganado — Generar Factura</h2>
              {!selectedQuote ? (
                <p className="text-sm text-yellow-700 bg-yellow-50 rounded-lg px-3 py-2">
                  ⚠️ Selecciona una cotización primero (haz clic en &ldquo;Usar esta cotización&rdquo;).
                </p>
              ) : (
                <>
                  <div className="bg-white rounded-lg p-3 mb-4 text-sm">
                    <div className="text-xs text-gray-500 mb-1">Cotización seleccionada</div>
                    <div className="font-semibold">{selectedQuote.label} — {selectedQuote.hotelName}</div>
                    <div className="text-[#E8610A] font-bold">
                      {selectedQuote.currency} {selectedQuote.salePrice.toLocaleString()}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Tipo de comprobante</label>
                      <select
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                        value={invoiceForm.type}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, type: e.target.value as "PROFORMA" | "NCF" | "RECIBO" })}
                      >
                        <option value="PROFORMA">Proforma / Recibo interno</option>
                        <option value="NCF">Factura con NCF (DGII)</option>
                        <option value="RECIBO">Recibo</option>
                      </select>
                    </div>
                    {invoiceForm.type === "NCF" && (
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Número NCF</label>
                        <input
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                          value={invoiceForm.ncfNumber}
                          onChange={(e) => setInvoiceForm({ ...invoiceForm, ncfNumber: e.target.value })}
                          placeholder="Ej. B0100000001"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Facturar a</label>
                      <input
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                        value={invoiceForm.clientName}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, clientName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">RNC / Cédula (opcional)</label>
                      <input
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                        value={invoiceForm.clientRnc}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, clientRnc: e.target.value })}
                        placeholder="Ej. 001-0000000-0"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">Notas en la factura</label>
                      <input
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                        value={invoiceForm.notes}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                        placeholder="Gracias por su confianza."
                      />
                    </div>
                  </div>
                  <button
                    onClick={generateInvoice}
                    disabled={generating}
                    className="mt-4 w-full bg-[#E8610A] text-white rounded-lg py-2.5 font-semibold hover:bg-[#c94f08] transition disabled:opacity-50"
                  >
                    {generating ? "Generando..." : "🧾 Generar Factura"}
                  </button>
                </>
              )}
            </section>
          )}
        </div>

        {/* RIGHT — Contact + Invoices sidebar */}
        <div className="p-5 space-y-5 overflow-auto bg-gray-50">
          {/* Contact info */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Contacto</h3>
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
              <div className="font-semibold text-gray-900">{opp.contact.name}</div>
              {opp.contact.phone && <div className="text-sm text-gray-600">📱 {opp.contact.phone}</div>}
              {opp.contact.email && <div className="text-sm text-gray-600">✉️ {opp.contact.email}</div>}
              <div className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full inline-block">
                {opp.contact.channel}
              </div>
            </div>
          </section>

          {/* Conversation / Internal notes timeline */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Conversación / Notas</h3>
            <div className="space-y-2 mb-3 max-h-72 overflow-y-auto">
              {interactions.length === 0 && (
                <div className="text-xs text-gray-400 text-center py-4 border border-dashed rounded-xl">Sin mensajes ni notas aún</div>
              )}
              {interactions.map(msg => (
                <div key={msg.id} className={`rounded-xl p-3 text-sm relative group ${msg.isInternal ? "border-l-4" : ""}`}
                  style={{
                    background: msg.isInternal ? "#FFFBEB" : "#F0FDF4",
                    borderLeftColor: msg.isInternal ? "#D97706" : undefined,
                  }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      {msg.isInternal && (
                        <div className="text-xs font-semibold mb-1" style={{ color: "#D97706" }}>🔒 Nota interna — no visible al cliente</div>
                      )}
                      <p className="text-gray-800 text-sm">{msg.content}</p>
                    </div>
                    <button onClick={() => deleteInteraction(msg.id)}
                      className="opacity-0 group-hover:opacity-100 text-xs text-gray-400 hover:text-red-500 transition shrink-0">✕</button>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {msg.agent && <span className="text-xs font-medium" style={{ color: "#E8610A" }}>{msg.agent.name}</span>}
                    <span className="text-xs text-gray-400">{new Date(msg.createdAt).toLocaleString("es-DO", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Add note form */}
            <form onSubmit={sendNote} className="space-y-2">
              <div className="flex gap-2 mb-2">
                <button type="button" onClick={() => setIsInternalNote(false)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-medium border transition"
                  style={{ background: !isInternalNote ? "#F0FDF4" : "white", color: !isInternalNote ? "#059669" : "#6B7280", borderColor: !isInternalNote ? "#86EFAC" : "#E5E7EB" }}>
                  💬 Mensaje
                </button>
                <button type="button" onClick={() => setIsInternalNote(true)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-medium border transition"
                  style={{ background: isInternalNote ? "#FFFBEB" : "white", color: isInternalNote ? "#D97706" : "#6B7280", borderColor: isInternalNote ? "#FCD34D" : "#E5E7EB" }}>
                  🔒 Nota interna
                </button>
              </div>
              <textarea
                value={noteContent} onChange={e => setNoteContent(e.target.value)}
                rows={2} placeholder={isInternalNote ? "Nota solo visible para el equipo..." : "Mensaje o registro de interacción..."}
                className="w-full border rounded-xl px-3 py-2 text-sm resize-none"
                style={{ borderColor: isInternalNote ? "#FCD34D" : "#E5E7EB", background: isInternalNote ? "#FFFBEB" : "white" }}
              />
              <button type="submit" disabled={sendingNote || !noteContent.trim()}
                className="w-full py-2 rounded-xl text-xs font-semibold text-white transition disabled:opacity-50"
                style={{ background: isInternalNote ? "#D97706" : "#059669" }}>
                {sendingNote ? "Guardando..." : isInternalNote ? "🔒 Guardar nota interna" : "💬 Guardar mensaje"}
              </button>
            </form>
          </section>

          {/* Invoices */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Facturas</h3>
            {invoices.length === 0 ? (
              <div className="text-xs text-gray-400 text-center py-4 border border-dashed rounded-xl">
                Sin facturas aún
              </div>
            ) : (
              <div className="space-y-2">
                {invoices.map((inv) => (
                  <div key={inv.id} className="bg-white rounded-xl border border-gray-200 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-800">{inv.number}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        inv.status === "PAGADO" ? "bg-green-100 text-green-700" :
                        inv.status === "PARCIAL" ? "bg-yellow-100 text-yellow-700" :
                        "bg-gray-100 text-gray-500"
                      }`}>{inv.status}</span>
                    </div>
                    <div className="text-sm font-bold text-[#E8610A]">
                      {inv.currency} {inv.total.toLocaleString()}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <a
                        href={`/api/invoices/${inv.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[#E8610A] hover:underline"
                      >
                        ↓ Descargar PDF
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
