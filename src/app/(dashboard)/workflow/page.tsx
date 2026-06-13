"use client";
import { useEffect, useState, useRef } from "react";

type NodeType = "TRIGGER" | "ASSIGN_AGENT" | "SEND_MESSAGE" | "CREATE_TASK" | "WAIT" | "CHANGE_STAGE" | "CONDITION" | "END";
type WFNode = { id: string; type: NodeType; label: string; x: number; y: number; config: Record<string, string> };
type WFEdge = { from: string; to: string };
type WFDef = { id: string; name: string; trigger: string; isActive: boolean; nodes: string; edges: string; createdAt: string };

const NODE_TYPES: { type: NodeType; label: string; icon: string; color: string; description: string }[] = [
  { type: "TRIGGER", label: "Lead entra", icon: "⚡", color: "#7c3aed", description: "Punto de entrada del workflow" },
  { type: "ASSIGN_AGENT", label: "Asignar vendedor", icon: "👤", color: "#2563eb", description: "Asigna un agente al lead" },
  { type: "SEND_MESSAGE", label: "Enviar mensaje", icon: "💬", color: "#16a34a", description: "Envía un mensaje automático" },
  { type: "CREATE_TASK", label: "Crear tarea", icon: "☑", color: "#d97706", description: "Crea una tarea en el CRM" },
  { type: "WAIT", label: "Esperar", icon: "⏳", color: "#64748b", description: "Pausa el workflow por X días" },
  { type: "CHANGE_STAGE", label: "Cambiar etapa", icon: "→", color: "#0891b2", description: "Mueve el lead a otra etapa" },
  { type: "CONDITION", label: "Condición", icon: "◇", color: "#e11d48", description: "Bifurcación condicional" },
  { type: "END", label: "Fin", icon: "⏹", color: "#374151", description: "Fin del workflow" },
];

let nodeCounter = 1;
function newId() { return `n_${nodeCounter++}_${Date.now()}`; }

function NodeCard({ node, selected, onSelect, onMove }: {
  node: WFNode; selected: boolean;
  onSelect: () => void;
  onMove: (dx: number, dy: number) => void;
}) {
  const def = NODE_TYPES.find((t) => t.type === node.type)!;
  const drag = useRef<{ startX: number; startY: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    drag.current = { startX: e.clientX, startY: e.clientY };
    const move = (ev: MouseEvent) => {
      if (!drag.current) return;
      onMove(ev.clientX - drag.current.startX, ev.clientY - drag.current.startY);
      drag.current = { startX: ev.clientX, startY: ev.clientY };
    };
    const up = () => { drag.current = null; window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        position: "absolute",
        left: node.x,
        top: node.y,
        width: 160,
        cursor: "grab",
        userSelect: "none",
        zIndex: selected ? 10 : 1,
      }}
    >
      <div
        className="rounded-xl shadow-lg border-2 overflow-hidden"
        style={{
          borderColor: selected ? def.color : "transparent",
          background: "var(--surface)",
          boxShadow: selected ? `0 0 0 3px ${def.color}33` : "var(--shadow)",
        }}
      >
        <div className="px-3 py-2 flex items-center gap-2" style={{ background: def.color }}>
          <span className="text-white text-sm">{def.icon}</span>
          <span className="text-white text-xs font-semibold truncate">{node.label}</span>
        </div>
        <div className="px-3 py-1.5">
          <p className="text-xs" style={{ color: "var(--text-subtle)" }}>{def.description}</p>
        </div>
      </div>
    </div>
  );
}

export default function WorkflowPage() {
  const [flows, setFlows] = useState<WFDef[]>([]);
  const [selected, setSelected] = useState<WFDef | null>(null);
  const [nodes, setNodes] = useState<WFNode[]>([]);
  const [edges, setEdges] = useState<WFEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const load = () =>
    fetch("/api/workflows").then((r) => r.json()).then(setFlows);
  useEffect(() => { load(); }, []);

  const openFlow = (flow: WFDef) => {
    setSelected(flow);
    try { setNodes(JSON.parse(flow.nodes)); } catch { setNodes([]); }
    try { setEdges(JSON.parse(flow.edges)); } catch { setEdges([]); }
    setSelectedNode(null);
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    await fetch(`/api/workflows/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nodes, edges }),
    });
    setSaving(false);
    load();
  };

  const toggleActive = async (flow: WFDef) => {
    await fetch(`/api/workflows/${flow.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !flow.isActive }),
    });
    load();
    if (selected?.id === flow.id) setSelected({ ...selected, isActive: !flow.isActive });
  };

  const deleteFlow = async (id: string) => {
    await fetch(`/api/workflows/${id}`, { method: "DELETE" });
    if (selected?.id === id) setSelected(null);
    load();
  };

  const createFlow = async () => {
    if (!newName) return;
    const res = await fetch("/api/workflows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName,
        trigger: "LEAD_CREATED",
        nodes: [{ id: "trigger_0", type: "TRIGGER", label: "Lead entra", x: 80, y: 80, config: {} }],
        edges: [],
      }),
    });
    const flow: WFDef = await res.json();
    setShowCreate(false);
    setNewName("");
    load();
    openFlow(flow);
  };

  const addNode = (type: NodeType) => {
    const def = NODE_TYPES.find((t) => t.type === type)!;
    const newNode: WFNode = {
      id: newId(),
      type,
      label: def.label,
      x: 80 + Math.random() * 300,
      y: 100 + nodes.length * 120,
      config: {},
    };
    setNodes((prev) => [...prev, newNode]);
  };

  const moveNode = (id: string, dx: number, dy: number) => {
    setNodes((prev) => prev.map((n) => n.id === id ? { ...n, x: n.x + dx, y: n.y + dy } : n));
  };

  const deleteNode = (id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setEdges((prev) => prev.filter((e) => e.from !== id && e.to !== id));
    setSelectedNode(null);
  };

  const handleConnect = (id: string) => {
    if (!connectFrom) { setConnectFrom(id); return; }
    if (connectFrom === id) { setConnectFrom(null); return; }
    setEdges((prev) => [...prev.filter((e) => !(e.from === connectFrom && e.to === id)), { from: connectFrom, to: id }]);
    setConnectFrom(null);
  };

  const selNode = nodes.find((n) => n.id === selectedNode);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
      {/* Sidebar: list of workflows */}
      <div className="w-64 shrink-0 border-r flex flex-col" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <div className="px-4 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h1 className="font-bold text-base" style={{ color: "var(--text)" }}>Workflows</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-subtle)" }}>Automatizaciones visuales</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {flows.map((flow) => (
            <button
              key={flow.id}
              onClick={() => openFlow(flow)}
              className="w-full text-left px-3 py-2.5 rounded-xl transition-all"
              style={{
                background: selected?.id === flow.id ? "var(--brand-light)" : "transparent",
                border: `1px solid ${selected?.id === flow.id ? "var(--brand)" : "transparent"}`,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{flow.name}</span>
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full"
                  style={{ background: flow.isActive ? "#DCFCE7" : "var(--surface-2)", color: flow.isActive ? "#16a34a" : "var(--text-subtle)" }}
                >
                  {flow.isActive ? "ON" : "OFF"}
                </span>
              </div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-subtle)" }}>
                {flow.trigger.replace("_", " ")}
              </div>
            </button>
          ))}
          {flows.length === 0 && (
            <p className="text-xs text-center py-4" style={{ color: "var(--text-subtle)" }}>Sin workflows aún</p>
          )}
        </div>
        <div className="p-3 border-t" style={{ borderColor: "var(--border)" }}>
          <button
            onClick={() => setShowCreate(true)}
            className="w-full py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: "var(--brand)" }}
          >
            + Nuevo workflow
          </button>
        </div>
      </div>

      {/* Main canvas */}
      {!selected ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="text-5xl">🔀</div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text)" }}>Crea tu primer workflow</h2>
          <p className="text-sm" style={{ color: "var(--text-subtle)" }}>Selecciona un workflow o crea uno nuevo</p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "var(--brand)" }}
          >
            + Nuevo workflow
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-3 px-4 py-3 border-b flex-wrap" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
            <h2 className="font-semibold text-sm" style={{ color: "var(--text)" }}>{selected.name}</h2>
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              {NODE_TYPES.filter((t) => t.type !== "TRIGGER").map((t) => (
                <button
                  key={t.type}
                  onClick={() => addNode(t.type)}
                  title={`Agregar: ${t.label}`}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition hover:opacity-80"
                  style={{ borderColor: t.color, color: t.color, background: `${t.color}15` }}
                >
                  <span>{t.icon}</span>
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {connectFrom && (
                <span className="text-xs px-2 py-1 rounded-lg" style={{ background: "#FFF4EE", color: "var(--brand)" }}>
                  Haz click en otro nodo para conectar
                </span>
              )}
              <button
                onClick={() => toggleActive(selected)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border"
                style={{
                  background: selected.isActive ? "#DCFCE7" : "var(--surface-2)",
                  color: selected.isActive ? "#16a34a" : "var(--text-subtle)",
                  borderColor: "var(--border)",
                }}
              >
                {selected.isActive ? "✓ Activo" : "Activar"}
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white"
                style={{ background: "var(--brand)" }}
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
              <button
                onClick={() => { if (confirm("¿Eliminar workflow?")) deleteFlow(selected.id); }}
                className="px-3 py-1.5 rounded-lg text-xs border"
                style={{ borderColor: "#dc2626", color: "#dc2626" }}
              >
                Eliminar
              </button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Canvas */}
            <div
              ref={canvasRef}
              className="flex-1 relative overflow-auto"
              style={{ background: "var(--bg)", backgroundImage: "radial-gradient(var(--border) 1px, transparent 1px)", backgroundSize: "24px 24px" }}
              onClick={() => { setSelectedNode(null); setConnectFrom(null); }}
            >
              {/* SVG edges */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minWidth: 1000, minHeight: 700 }}>
                {edges.map((edge, i) => {
                  const from = nodes.find((n) => n.id === edge.from);
                  const to = nodes.find((n) => n.id === edge.to);
                  if (!from || !to) return null;
                  const x1 = from.x + 80, y1 = from.y + 40;
                  const x2 = to.x + 80, y2 = to.y + 20;
                  const mx = (x1 + x2) / 2;
                  return (
                    <g key={i}>
                      <path
                        d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`}
                        fill="none"
                        stroke="var(--brand)"
                        strokeWidth="2"
                        strokeDasharray="6 3"
                        markerEnd="url(#arrow)"
                      />
                    </g>
                  );
                })}
                <defs>
                  <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L8,3 z" fill="var(--brand)" />
                  </marker>
                </defs>
              </svg>

              {/* Nodes */}
              {nodes.map((node) => (
                <div key={node.id} onClick={(e) => { e.stopPropagation(); if (connectFrom) handleConnect(node.id); }}>
                  <NodeCard
                    node={node}
                    selected={selectedNode === node.id}
                    onSelect={() => { setSelectedNode(node.id); }}
                    onMove={(dx, dy) => moveNode(node.id, dx, dy)}
                  />
                </div>
              ))}

              {nodes.length <= 1 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-sm font-medium" style={{ color: "var(--text-subtle)" }}>
                      Agrega bloques desde la barra superior
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-subtle)" }}>
                      Arrastra los nodos y conéctalos entre sí
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Properties panel */}
            {selNode && (
              <div className="w-64 shrink-0 border-l overflow-y-auto" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
                  <h3 className="font-semibold text-sm" style={{ color: "var(--text)" }}>Propiedades</h3>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-subtle)" }}>Nombre del bloque</label>
                    <input
                      value={selNode.label}
                      onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selNode.id ? { ...n, label: e.target.value } : n))}
                      className="w-full px-3 py-2 rounded-xl border text-sm"
                      style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                    />
                  </div>

                  {selNode.type === "WAIT" && (
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-subtle)" }}>Días de espera</label>
                      <input
                        type="number"
                        value={selNode.config.days ?? "1"}
                        onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selNode.id ? { ...n, config: { ...n.config, days: e.target.value } } : n))}
                        className="w-full px-3 py-2 rounded-xl border text-sm"
                        style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                      />
                    </div>
                  )}

                  {selNode.type === "SEND_MESSAGE" && (
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-subtle)" }}>Mensaje</label>
                      <textarea
                        rows={4}
                        value={selNode.config.message ?? ""}
                        onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selNode.id ? { ...n, config: { ...n.config, message: e.target.value } } : n))}
                        className="w-full px-3 py-2 rounded-xl border text-sm resize-none"
                        style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                        placeholder="Hola {{nombre}}, gracias por contactarnos..."
                      />
                    </div>
                  )}

                  {selNode.type === "CREATE_TASK" && (
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-subtle)" }}>Título de la tarea</label>
                      <input
                        value={selNode.config.taskTitle ?? ""}
                        onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selNode.id ? { ...n, config: { ...n.config, taskTitle: e.target.value } } : n))}
                        className="w-full px-3 py-2 rounded-xl border text-sm"
                        style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                        placeholder="Hacer seguimiento"
                      />
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      onClick={() => handleConnect(selNode.id)}
                      className="w-full py-2 rounded-xl text-xs font-semibold border"
                      style={{ borderColor: connectFrom === selNode.id ? "var(--brand)" : "var(--border)", color: connectFrom === selNode.id ? "var(--brand)" : "var(--text-subtle)" }}
                    >
                      {connectFrom === selNode.id ? "Esperando destino…" : "🔗 Conectar con →"}
                    </button>
                    {selNode.type !== "TRIGGER" && (
                      <button
                        onClick={() => deleteNode(selNode.id)}
                        className="w-full py-2 mt-2 rounded-xl text-xs font-semibold"
                        style={{ background: "#FEE2E2", color: "#dc2626" }}
                      >
                        🗑 Eliminar bloque
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-96 rounded-2xl p-6 space-y-4 shadow-xl" style={{ background: "var(--surface)" }}>
            <h2 className="font-bold text-lg" style={{ color: "var(--text)" }}>Nuevo workflow</h2>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createFlow()}
              placeholder="Ej: Seguimiento nuevo lead"
              className="w-full px-3 py-2.5 rounded-xl border text-sm"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
            <div className="flex gap-3">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2 rounded-xl border text-sm" style={{ border: "1px solid var(--border)", color: "var(--text)" }}>Cancelar</button>
              <button onClick={createFlow} className="flex-1 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: "var(--brand)" }}>Crear</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
