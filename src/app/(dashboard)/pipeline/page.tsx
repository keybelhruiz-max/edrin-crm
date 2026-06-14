"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MapPin, Building2, Users, Moon, Settings, Plus, TrendingUp, Layers, CircleDollarSign, Trophy } from "lucide-react";

type Stage = { id: string; name: string; color: string; order: number };
type Opp = {
  id: string;
  stageId: string;
  destination?: string;
  mayorista?: string;
  estimatedValue?: number;
  currency: string;
  notes?: string;
  pax?: number;
  nights?: number;
  contact: { id: string; name: string; channel: string };
  stage: Stage;
  agent?: { id: string; name: string } | null;
};

const CHANNEL_COLORS: Record<string, string> = {
  WHATSAPP: "var(--c-wa)",
  INSTAGRAM: "var(--c-ig)",
  TIKTOK: "var(--c-tt)",
  MESSENGER: "var(--c-msg)",
  DIRECTO: "var(--c-dir)",
  OTRO: "#9CA3AF",
};

function fmtMoney(v?: number, currency = "USD") {
  if (!v) return null;
  return `${currency} ${v.toLocaleString()}`;
}

function KanbanCard({ opp, isDragging, onClick }: { opp: Opp; isDragging?: boolean; onClick?: () => void }) {
  const channelColor = CHANNEL_COLORS[opp.contact.channel] ?? "#9CA3AF";
  return (
    <div
      onClick={onClick}
      className="rounded-[10px] p-3 cursor-pointer transition-all duration-150"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow: isDragging ? "var(--shadow-lg)" : "var(--shadow-sm)",
        transform: isDragging ? "rotate(1deg)" : undefined,
        opacity: isDragging ? 0.9 : 1,
      }}
      onMouseEnter={(e) => {
        if (isDragging) return;
        const el = e.currentTarget as HTMLElement;
        el.style.boxShadow = "var(--shadow)";
        el.style.transform = "translateY(-2px)";
        el.style.borderColor = "var(--brand-100)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.boxShadow = "var(--shadow-sm)";
        el.style.transform = "";
        el.style.borderColor = "var(--border)";
      }}
    >
      <div className="flex items-center gap-2 text-[13.5px] font-bold" style={{ color: "var(--text)" }}>
        <span className="w-1.5 h-1.5 rounded-full flex-none" style={{ background: channelColor }} />
        {opp.contact.name}
      </div>
      {opp.destination && (
        <div className="flex items-center gap-1.5 text-[11.5px] mt-1.5" style={{ color: "var(--muted)" }}>
          <MapPin className="w-3 h-3" style={{ color: "var(--subtle)" }} /> {opp.destination}
        </div>
      )}
      {opp.mayorista && (
        <div className="flex items-center gap-1.5 text-[11.5px] mt-1" style={{ color: "var(--muted)" }}>
          <Building2 className="w-3 h-3" style={{ color: "var(--subtle)" }} /> {opp.mayorista}
        </div>
      )}
      {opp.estimatedValue ? (
        <div className="text-[13px] font-extrabold mt-2" style={{ color: "var(--brand)" }}>
          {fmtMoney(opp.estimatedValue, opp.currency)}
        </div>
      ) : null}
      {(opp.pax || opp.nights) && (
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {opp.pax ? (
            <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold rounded-md px-1.5 py-0.5"
              style={{ color: "var(--muted)", background: "var(--bg)", border: "1px solid var(--border-light)" }}>
              <Users className="w-3 h-3" style={{ color: "var(--subtle)" }} /> {opp.pax} pax
            </span>
          ) : null}
          {opp.nights ? (
            <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold rounded-md px-1.5 py-0.5"
              style={{ color: "var(--muted)", background: "var(--bg)", border: "1px solid var(--border-light)" }}>
              <Moon className="w-3 h-3" style={{ color: "var(--subtle)" }} /> {opp.nights}N
            </span>
          ) : null}
        </div>
      )}
      <div className="flex items-center justify-between mt-2.5 pt-2.5" style={{ borderTop: "1px solid var(--border-light)" }}>
        <span className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: "var(--muted)" }}>
          <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
            style={{ background: "var(--cool)" }}>
            {(opp.agent?.name ?? opp.contact.name)[0]?.toUpperCase()}
          </span>
          {opp.agent?.name ?? "Sin asignar"}
        </span>
        <span className="inline-flex items-center text-[10.5px] font-semibold rounded-md px-2 py-0.5 text-white"
          style={{ background: channelColor }}>
          {opp.contact.channel}
        </span>
      </div>
    </div>
  );
}

function SortableCard({ opp, onOpen }: { opp: Opp; onOpen: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: opp.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <KanbanCard opp={opp} onClick={() => !isDragging && onOpen(opp.id)} />
    </div>
  );
}

export default function PipelinePage() {
  const router = useRouter();
  const [stages, setStages] = useState<Stage[]>([]);
  const [opportunities, setOpportunities] = useState<Opp[]>([]);
  const [activeOpp, setActiveOpp] = useState<Opp | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    fetch("/api/pipeline-stages").then((r) => r.json()).then((d) => setStages(Array.isArray(d) ? d : []));
    fetch("/api/opportunities").then((r) => r.json()).then((d) => setOpportunities(Array.isArray(d) ? d : []));
  }, []);

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeOppId = active.id as string;
    const overId = over.id as string;
    const overStage = stages.find((s) => s.id === overId);
    const overOpp = opportunities.find((o) => o.id === overId);
    const targetStageId = overStage?.id ?? overOpp?.stageId;
    if (!targetStageId) return;
    setOpportunities((prev) =>
      prev.map((o) => (o.id === activeOppId ? { ...o, stageId: targetStageId } : o))
    );
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active } = event;
    setActiveOpp(null);
    const opp = opportunities.find((o) => o.id === active.id);
    if (!opp) return;
    await fetch(`/api/opportunities/${opp.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stageId: opp.stageId }),
    });
  }

  const oppsByStage = (stageId: string) => opportunities.filter((o) => o.stageId === stageId);
  const stageTotal = (stageId: string) =>
    oppsByStage(stageId).reduce((sum, o) => sum + (o.estimatedValue ?? 0), 0);

  // Summary KPIs
  const totalValue = opportunities.reduce((s, o) => s + (o.estimatedValue ?? 0), 0);
  const totalOpps = opportunities.length;
  const wonStage = stages.find((s) => /complet|gan|cerrad|lover/i.test(s.name));
  const wonValue = wonStage ? stageTotal(wonStage.id) : 0;
  const avgTicket = totalOpps ? Math.round(totalValue / totalOpps) : 0;

  const SUMMARY = [
    { label: "Oportunidades", value: totalOpps.toString(), meta: "en el pipeline", icon: Layers, accent: false },
    { label: "Valor total", value: `USD ${totalValue.toLocaleString()}`, meta: "potencial", icon: CircleDollarSign, accent: false },
    { label: "Ticket promedio", value: `USD ${avgTicket.toLocaleString()}`, meta: "por oportunidad", icon: TrendingUp, accent: false },
    { label: "Cerrado", value: `USD ${wonValue.toLocaleString()}`, meta: wonStage?.name ?? "—", icon: Trophy, accent: true },
  ];

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3.5 border-b"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div>
          <h1 className="text-lg font-bold" style={{ color: "var(--text)" }}>Pipeline de Ventas</h1>
          <div className="text-[12.5px] mt-0.5" style={{ color: "var(--muted)" }}>
            {totalOpps} oportunidades · USD {totalValue.toLocaleString()} en juego
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/ajustes/pipeline"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold rounded-[9px] px-3 py-2 transition"
            style={{ color: "var(--text)", background: "var(--surface)", border: "1px solid var(--border)" }}>
            <Settings className="w-4 h-4" /> <span className="hidden sm:inline">Configurar etapas</span>
          </Link>
          <Link href="/leads"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold rounded-[9px] px-4 py-2 text-white transition"
            style={{ background: "var(--brand)", boxShadow: "0 6px 14px -6px var(--brand)" }}>
            <Plus className="w-4 h-4" /> Nuevo lead
          </Link>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6">
        {/* Summary KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
          {SUMMARY.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="relative overflow-hidden rounded-[16px] px-4 py-3.5"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
                <span className="absolute left-0 top-0 bottom-0 w-[3px]"
                  style={{ background: s.accent ? "var(--brand)" : "var(--cool)" }} />
                <div className="flex items-center gap-1.5 text-[11.5px] font-medium" style={{ color: "var(--muted)" }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: "var(--subtle)" }} /> {s.label}
                </div>
                <div className="text-[21px] font-extrabold tracking-tight mt-1.5"
                  style={{ color: s.accent ? "var(--brand)" : "var(--cool-dark)" }}>
                  {s.value}
                </div>
                <div className="text-[11px] font-semibold mt-0.5" style={{ color: "var(--subtle)" }}>{s.meta}</div>
              </div>
            );
          })}
        </div>

        {/* Board */}
        <div className="overflow-x-auto pb-2">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={(e) => setActiveOpp(opportunities.find((o) => o.id === e.active.id) || null)}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-3.5 items-start" style={{ minWidth: stages.length * 276 + "px" }}>
              {stages.map((stage) => {
                const stageOpps = oppsByStage(stage.id);
                const total = stageTotal(stage.id);
                return (
                  <div key={stage.id} className="flex-none w-[262px]">
                    <div className="flex items-center gap-2 px-1 pb-1.5">
                      <span className="w-2.5 h-2.5 rounded-full flex-none" style={{ background: stage.color }} />
                      <b className="text-[13px] font-bold" style={{ color: "#344054" }}>{stage.name}</b>
                      <span className="ml-auto text-[11px] font-bold rounded-full px-2 py-0.5"
                        style={{ color: "var(--muted)", background: "var(--surface)", border: "1px solid var(--border)" }}>
                        {stageOpps.length}
                      </span>
                    </div>
                    <div className="text-[11px] font-bold px-1 pb-2.5 tracking-tight" style={{ color: "var(--cool-dark)" }}>
                      {total ? `USD ${total.toLocaleString()}` : "—"}
                    </div>
                    <div id={stage.id} className="rounded-[12px] p-2.5 min-h-[120px]" style={{ background: "#EFF1F5" }}>
                      <SortableContext items={stageOpps.map((o) => o.id)} strategy={verticalListSortingStrategy}>
                        <div className="flex flex-col gap-2.5">
                          {stageOpps.map((opp) => (
                            <SortableCard key={opp.id} opp={opp} onOpen={(id) => router.push(`/oportunidad/${id}`)} />
                          ))}
                          {stageOpps.length === 0 && (
                            <div className="text-center text-[12px] py-5" style={{ color: "var(--subtle)" }}>—</div>
                          )}
                        </div>
                      </SortableContext>
                    </div>
                  </div>
                );
              })}
            </div>

            <DragOverlay>
              {activeOpp ? <KanbanCard opp={activeOpp} isDragging /> : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
    </div>
  );
}
