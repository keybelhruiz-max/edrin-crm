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

type Stage = { id: string; name: string; color: string; order: number };
type Opp = {
  id: string;
  stageId: string;
  destination?: string;
  mayorista?: string;
  estimatedValue?: number;
  currency: string;
  notes?: string;
  contact: { id: string; name: string; channel: string };
  stage: Stage;
};

function KanbanCard({ opp, isDragging, onClick }: { opp: Opp; isDragging?: boolean; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg border border-gray-200 p-3 shadow-sm cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-50 rotate-1 shadow-lg" : "hover:border-[#E8610A]/40 hover:shadow-md transition"
      }`}
    >
      <div className="font-medium text-sm text-gray-900">{opp.contact.name}</div>
      {opp.destination && (
        <div className="text-xs text-gray-500 mt-0.5">📍 {opp.destination}</div>
      )}
      {opp.mayorista && (
        <div className="text-xs text-gray-400 mt-0.5">🏨 {opp.mayorista}</div>
      )}
      {opp.estimatedValue && (
        <div className="text-xs font-semibold text-[#E8610A] mt-1">
          {opp.currency} {opp.estimatedValue.toLocaleString()}
        </div>
      )}
      <div className="flex items-center gap-1 mt-2">
        <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
          {opp.contact.channel}
        </span>
      </div>
    </div>
  );
}

function SortableCard({ opp, onOpen }: { opp: Opp; onOpen: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: opp.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <KanbanCard opp={opp} isDragging={isDragging} onClick={() => !isDragging && onOpen(opp.id)} />
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
    fetch("/api/pipeline-stages").then((r) => r.json()).then(setStages);
    fetch("/api/opportunities").then((r) => r.json()).then(setOpportunities);
  }, []);

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeOppId = active.id as string;
    const overId = over.id as string;

    // overId can be a stageId or another oppId
    const overStage = stages.find((s) => s.id === overId);
    const overOpp = opportunities.find((o) => o.id === overId);
    const targetStageId = overStage?.id ?? overOpp?.stageId;

    if (!targetStageId) return;

    setOpportunities((prev) =>
      prev.map((o) =>
        o.id === activeOppId ? { ...o, stageId: targetStageId } : o
      )
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

  const oppsByStage = (stageId: string) =>
    opportunities.filter((o) => o.stageId === stageId);

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
        <h1 className="text-xl font-bold text-gray-900">Pipeline de Ventas</h1>
        <div className="flex gap-2">
          <Link
            href="/ajustes/pipeline"
            className="text-sm text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 transition"
          >
            ⚙️ Configurar etapas
          </Link>
          <Link
            href="/leads/nuevo"
            className="text-sm bg-[#E8610A] text-white rounded-lg px-4 py-1.5 hover:bg-[#c94f08] transition"
          >
            + Nuevo lead
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={(e) => setActiveOpp(opportunities.find((o) => o.id === e.active.id) || null)}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4" style={{ minWidth: stages.length * 272 + "px" }}>
            {stages.map((stage) => {
              const stageOpps = oppsByStage(stage.id);
              return (
                <div key={stage.id} className="flex-shrink-0 w-64">
                  <div
                    className="flex items-center gap-2 mb-3 px-1"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <span className="font-semibold text-sm text-gray-700">
                      {stage.name}
                    </span>
                    <span className="ml-auto text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                      {stageOpps.length}
                    </span>
                  </div>
                  <div
                    id={stage.id}
                    className="bg-gray-100 rounded-xl p-2 min-h-[400px]"
                  >
                    <SortableContext
                      items={stageOpps.map((o) => o.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {stageOpps.map((opp) => (
                          <SortableCard key={opp.id} opp={opp} onOpen={(id) => router.push(`/oportunidad/${id}`)} />
                        ))}
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
  );
}
