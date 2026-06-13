"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card, Btn } from "@/components/ui";

const DEFAULT_TERMS = `Condiciones de Reserva:
La reserva se garantiza con un depósito de RD$2,000 por persona (NO reembolsable).
El balance restante puede completarse mediante pagos mensuales o quincenales.
Si transcurren 60 días desde la reserva sin recibir pagos, la misma será cancelada automáticamente.
30 días antes de la llegada para viajes internacionales y 14 días antes para reservas nacionales, el pago debe estar completado al 100%.
En reservas realizadas entre 24 y 72 horas antes de la llegada, el pago debe efectuarse de forma inmediata.
Para precios cotizados en dólares, se aplicará la tasa de cambio vigente al momento de cada pago.

Horarios del Hotel:
Check-in: 3:00 p. m.
Check-out: 12:00 p. m.

Políticas de Cancelación y Penalidades:
Las cancelaciones están sujetas a las políticas del hotel o proveedor.
El depósito inicial no es reembolsable.
Se cobrará el 100% del total si la cancelación se realiza 30 días antes de la llegada.
Se cobrará el 100% del costo en caso de No Show.
Los servicios confirmados y comprados NO son reembolsables, cancelables ni modificables.
Las reservas realizadas un día antes y las tarifas no reembolsables no aplican para reembolsos, cancelaciones ni cambios de nombre.

Edrin Travel no se hace responsable por cancelaciones, expulsiones o decisiones tomadas por el hotel debido a conducta inapropiada de los huéspedes.

Cualquier reclamación o compensación relacionada con el servicio durante la estadía queda a disposición del hotel o proveedor correspondiente.

No nos hacemos responsables por faltas o incumplimientos de hoteles u otros proveedores.`;

export default function TerminosPage() {
  const [terms, setTerms] = useState(DEFAULT_TERMS);
  const [notes, setNotes] = useState("Gracias por su confianza.");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/config?key=invoice_terms")
      .then((r) => r.json())
      .then((d) => { if (d?.value) setTerms(d.value); });
    fetch("/api/config?key=invoice_notes")
      .then((r) => r.json())
      .then((d) => { if (d?.value) setNotes(d.value); });
  }, []);

  async function save() {
    setSaving(true);
    await Promise.all([
      fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "invoice_terms", value: terms }),
      }),
      fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "invoice_notes", value: notes }),
      }),
    ]);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex flex-col min-h-screen overflow-auto" style={{ background: "var(--bg)" }}>
      <PageHeader
        title="Términos y Condiciones"
        subtitle="Texto que aparece en la página 2 de todas las facturas"
      >
        <Btn onClick={save} disabled={saving} variant="primary">
          {saving ? "Guardando..." : saved ? "✓ Guardado" : "Guardar cambios"}
        </Btn>
      </PageHeader>

      <div className="p-6 max-w-3xl space-y-5">
        <Card>
          <div className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>
            Nota en factura <span className="font-normal text-xs ml-1" style={{ color: "var(--text-muted)" }}>(aparece debajo de los totales)</span>
          </div>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
            placeholder="Gracias por su confianza."
          />
        </Card>

        <Card>
          <div className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>
            Términos y condiciones completos <span className="font-normal text-xs ml-1" style={{ color: "var(--text-muted)" }}>(página 2 de la factura)</span>
          </div>
          <textarea
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            rows={22}
            className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none resize-y font-mono leading-relaxed"
            style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
          />
          <div className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
            {terms.split("\n").length} líneas · {terms.length} caracteres
          </div>
        </Card>

        {/* Preview */}
        <Card>
          <div className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>Vista previa</div>
          <div
            className="rounded-lg p-4 text-xs leading-relaxed whitespace-pre-wrap font-mono"
            style={{ background: "var(--bg)", color: "var(--text-muted)" }}
          >
            {terms}
          </div>
        </Card>
      </div>
    </div>
  );
}
