"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Stage = { id: string; name: string; color: string; order: number };

function StageRow({
  stage,
  onRename,
  onColorChange,
  onDelete,
}: {
  stage: Stage;
  onRename: (id: string, name: string) => void;
  onColorChange: (id: string, color: string) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3 mb-2"
    >
      <button
        {...attributes}
        {...listeners}
        className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing text-lg"
        title="Arrastrar para reordenar"
      >
        ⠿
      </button>
      <input
        type="color"
        value={stage.color}
        onChange={(e) => onColorChange(stage.id, e.target.value)}
        className="w-8 h-8 rounded cursor-pointer border-0"
        title="Color de la etapa"
      />
      <input
        type="text"
        value={stage.name}
        onChange={(e) => onRename(stage.id, e.target.value)}
        className="flex-1 text-sm border-b border-transparent hover:border-gray-300 focus:border-[#E8610A] focus:outline-none px-1 py-0.5"
      />
      <button
        onClick={() => onDelete(stage.id)}
        className="text-gray-400 hover:text-red-500 text-sm transition"
        title="Eliminar etapa"
      >
        🗑️
      </button>
    </div>
  );
}

export default function PipelineSettingsPage() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState("");

  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    fetch("/api/pipeline-stages")
      .then((r) => r.json())
      .then((d) => setStages(Array.isArray(d) ? d : []));
  }, []);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = stages.findIndex((s) => s.id === active.id);
    const newIdx = stages.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(stages, oldIdx, newIdx);
    setStages(reordered);
  }

  function handleRename(id: string, name: string) {
    setStages((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
  }

  function handleColorChange(id: string, color: string) {
    setStages((prev) => prev.map((s) => (s.id === id ? { ...s, color } : s)));
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta etapa? Los leads serán movidos a la primera etapa.")) return;
    await fetch(`/api/pipeline-stages/${id}`, { method: "DELETE" });
    setStages((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleAddStage() {
    if (!newName.trim()) return;
    const res = await fetch("/api/pipeline-stages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    const created = await res.json();
    setStages((prev) => [...prev, created]);
    setNewName("");
  }

  async function handleSave() {
    setSaving(true);
    // Save names + colors
    await Promise.all(
      stages.map((s) =>
        fetch(`/api/pipeline-stages/${s.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: s.name, color: s.color }),
        })
      )
    );
    // Save order
    await fetch("/api/pipeline-stages/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: stages.map((s) => s.id) }),
    });
    setSaving(false);
  }

  return (
    <div className="p-8 max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Etapas del Pipeline</h1>
        <p className="text-gray-500 text-sm mt-1">
          Arrastra para reordenar · Haz clic en el nombre para renombrar · Cambia el color con el selector
        </p>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={stages.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          {stages.map((stage) => (
            <StageRow
              key={stage.id}
              stage={stage}
              onRename={handleRename}
              onColorChange={handleColorChange}
              onDelete={handleDelete}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Add new stage */}
      <div className="flex gap-2 mt-4">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddStage()}
          placeholder="Nueva etapa..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8610A]"
        />
        <button
          onClick={handleAddStage}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium transition"
        >
          + Agregar
        </button>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-6 w-full bg-[#E8610A] text-white rounded-lg py-2.5 font-medium hover:bg-[#c94f08] transition disabled:opacity-50"
      >
        {saving ? "Guardando..." : "Guardar cambios"}
      </button>
    </div>
  );
}
