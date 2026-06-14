"use client";

import { useState } from "react";
import {
  Gauge,
  Plug,
  Ticket,
  RefreshCw,
  Wrench,
  Server,
  Database,
  MessageCircle,
  CreditCard,
  HardDrive,
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  Activity,
  Terminal,
  SlidersHorizontal,
  KeyRound,
  ChevronDown,
} from "lucide-react";

// ── Data ──────────────────────────────────────────────────────────────────────

type ServiceStatus = "ok" | "warn" | "down";
type TicketPriority = "alta" | "media" | "baja";
type TicketStatus = "abierto" | "proceso" | "resuelto";
type LogLevel = "INFO" | "OK" | "WARN" | "ERR";

interface Service {
  name: string;
  sub: string;
  status: ServiceStatus;
  latency: string;
  color: string;
  icon: React.ElementType;
}

interface TicketItem {
  title: string;
  who: string;
  priority: TicketPriority;
  status: TicketStatus;
  when: string;
}

interface Integration {
  name: string;
  sub: string;
  status: ServiceStatus;
  statusText: string;
  color: string;
  icon: React.ElementType;
  sync: string;
  volume: string;
}

interface LogLine {
  time: string;
  level: LogLevel;
  msg: string;
}

const SERVICES: Service[] = [
  { name: "API principal",     sub: "Núcleo del CRM",         status: "ok",   latency: "42 ms",  color: "#0E9384", icon: Server },
  { name: "Base de datos",     sub: "PostgreSQL · primaria",  status: "ok",   latency: "8 ms",   color: "#3B82F6", icon: Database },
  { name: "Sincronización WA", sub: "WhatsApp Business API",  status: "warn", latency: "1.2 s",  color: "#25D366", icon: MessageCircle },
  { name: "Cobros Stripe",     sub: "Pagos y facturación",    status: "ok",   latency: "120 ms", color: "#635BFF", icon: CreditCard },
  { name: "Almacenamiento",    sub: "Archivos e imágenes",    status: "ok",   latency: "31 ms",  color: "#8B5CF6", icon: HardDrive },
  { name: "Notificaciones",    sub: "Email & push",           status: "ok",   latency: "56 ms",  color: "#E8610A", icon: Bell },
];

const STATUS_TEXT: Record<ServiceStatus, string> = {
  ok: "Operativo",
  warn: "Degradado",
  down: "Caído",
};

const TICKETS: TicketItem[] = [
  { title: "WhatsApp no envía plantillas",   who: "Edrin Travel · Keybelh", priority: "alta",  status: "proceso",  when: "hace 35 min" },
  { title: "Error al generar factura PDF",   who: "Edrin Travel · Luis P.", priority: "media", status: "abierto",  when: "hace 2 h" },
  { title: "Lead duplicado desde Instagram", who: "Edrin Travel · María R.",priority: "baja",  status: "abierto",  when: "hace 5 h" },
  { title: "Solicitud: nuevo campo en lead", who: "Edrin Travel · Keybelh", priority: "baja",  status: "resuelto", when: "ayer" },
];

const INTEGRATIONS: Integration[] = [
  { name: "WhatsApp Business", sub: "Conectado · token vence en 18 días",  status: "warn", statusText: "Aviso",        color: "#25D366", icon: MessageCircle, sync: "hace 1 min",  volume: "2,140/mes" },
  { name: "Instagram",         sub: "DMs y comentarios como leads",         status: "ok",   statusText: "Operativo",    color: "#E1306C", icon: Activity,       sync: "hace 3 min",  volume: "860/mes" },
  { name: "Messenger",         sub: "Página de Facebook",                   status: "down", statusText: "Desconectado", color: "#0084FF", icon: MessageCircle,  sync: "hace 2 días", volume: "—" },
  { name: "TikTok Lead Gen",   sub: "Formularios de TikTok Ads",            status: "ok",   statusText: "Operativo",    color: "#111114", icon: Activity,       sync: "hace 12 min", volume: "320/mes" },
  { name: "Stripe",            sub: "Cobros y conciliación",                status: "ok",   statusText: "Operativo",    color: "#635BFF", icon: CreditCard,     sync: "hace 5 min",  volume: "48 pagos" },
  { name: "Google Calendar",   sub: "Itinerarios y eventos",                status: "ok",   statusText: "Operativo",    color: "#3B82F6", icon: Activity,       sync: "hace 8 min",  volume: "126 eventos" },
];

const LOGS: LogLine[] = [
  { time: "09:42:11", level: "OK",   msg: 'WhatsApp Business: plantilla "bienvenida" enviada a +1 849 555 0190' },
  { time: "09:41:03", level: "WARN", msg: "WhatsApp API: latencia elevada (1.2s) en cola de envío" },
  { time: "09:38:55", level: "INFO", msg: "Lead #2041 asignado automáticamente a Keybelh" },
  { time: "09:35:20", level: "OK",   msg: "Stripe: pago USD 3,200 conciliado · factura INV-2041" },
  { time: "09:30:02", level: "INFO", msg: "Sincronización Instagram: 4 nuevos DMs importados" },
  { time: "09:22:47", level: "ERR",  msg: "Messenger: token inválido — integración desconectada" },
  { time: "09:18:10", level: "OK",   msg: "Respaldo incremental completado (1.2 GB)" },
  { time: "09:05:33", level: "INFO", msg: "Usuario Luis P. inició sesión desde 190.80.x.x" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const LOG_LEVEL_COLOR: Record<LogLevel, string> = {
  INFO: "#4FB6E8",
  OK:   "#3FCF8E",
  WARN: "#F5B544",
  ERR:  "#F2706B",
};

const STATUS_PILL: Record<ServiceStatus, { color: string; bg: string }> = {
  ok:   { color: "#067647", bg: "#ECFDF3" },
  warn: { color: "#B54708", bg: "#FFFAEB" },
  down: { color: "#B42318", bg: "#FEF3F2" },
};

const PRIORITY_COLOR: Record<TicketPriority, string> = {
  alta:  "#EF4444",
  media: "#F59E0B",
  baja:  "#0E9384",
};

const TICKET_TAG: Record<TicketStatus, { color: string; bg: string; label: string }> = {
  abierto:  { color: "#3B82F6", bg: "#EFF8FF", label: "Abierto" },
  proceso:  { color: "#B54708", bg: "#FFFAEB", label: "En proceso" },
  resuelto: { color: "#067647", bg: "#ECFDF3", label: "Resuelto" },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function ServiceRow({ svc }: { svc: Service }) {
  const pill = STATUS_PILL[svc.status];
  const Icon = svc.icon;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "13px 18px",
      borderBottom: "1px solid var(--border-light)",
    }}>
      <span style={{
        width: 34, height: 34, borderRadius: 9,
        background: svc.color,
        display: "grid", placeItems: "center",
        flexShrink: 0, color: "#fff",
      }}>
        <Icon size={16} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <b style={{ fontSize: 13, fontWeight: 700, display: "block" }}>{svc.name}</b>
        <small style={{ fontSize: 11.5, color: "var(--subtle)" }}>{svc.sub}</small>
      </div>
      <span style={{
        fontSize: 11.5, fontWeight: 700,
        color: "var(--muted)", width: 62, textAlign: "right",
        fontVariantNumeric: "tabular-nums",
        marginRight: 4,
      }}>{svc.latency}</span>
      <span style={{
        fontSize: 11.5, fontWeight: 700,
        padding: "4px 10px", borderRadius: 20,
        display: "inline-flex", alignItems: "center", gap: 6,
        color: pill.color, background: pill.bg,
      }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "currentColor", flexShrink: 0 }} />
        {STATUS_TEXT[svc.status]}
      </span>
    </div>
  );
}

function TicketRow({ tk }: { tk: TicketItem }) {
  const tag = TICKET_TAG[tk.status];
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 12,
      padding: "13px 18px",
      borderBottom: "1px solid var(--border-light)",
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: "50%",
        marginTop: 5, flexShrink: 0,
        background: PRIORITY_COLOR[tk.priority],
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <b style={{ fontSize: 13, fontWeight: 600, display: "block", color: "var(--text)" }}>{tk.title}</b>
        <small style={{ fontSize: 11.5, color: "var(--subtle)" }}>{tk.who} · {tk.when}</small>
      </div>
      <span style={{
        fontSize: 10.5, fontWeight: 700,
        padding: "3px 8px", borderRadius: 6,
        whiteSpace: "nowrap",
        color: tag.color, background: tag.bg,
      }}>{tag.label}</span>
    </div>
  );
}

function LogViewer({ lines, maxHeight = 280 }: { lines: LogLine[]; maxHeight?: number }) {
  return (
    <div style={{
      fontFamily: "'SF Mono', ui-monospace, Menlo, monospace",
      fontSize: 12, lineHeight: 1.7,
      padding: "16px 18px",
      background: "#0E1726",
      borderRadius: "0 0 var(--r-lg) var(--r-lg)",
      color: "#9FB0CE",
      maxHeight, overflowY: "auto",
    }}>
      {lines.map((l, i) => (
        <div key={i} style={{ display: "flex", gap: 12 }}>
          <span style={{ color: "#5B6B8C", flexShrink: 0 }}>{l.time}</span>
          <span style={{
            flexShrink: 0, width: 48, fontWeight: 700,
            color: LOG_LEVEL_COLOR[l.level],
          }}>{l.level}</span>
          <span style={{ color: "#C4D0E6" }}>{l.msg}</span>
        </div>
      ))}
    </div>
  );
}

function IntegrationCard({ int }: { int: Integration }) {
  const pill = STATUS_PILL[int.status];
  const Icon = int.icon;
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "var(--r-lg)",
      padding: 16,
      boxShadow: "var(--shadow-sm)",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 12 }}>
        <span style={{
          width: 40, height: 40, borderRadius: 10,
          background: int.color,
          display: "grid", placeItems: "center",
          flexShrink: 0, color: "#fff",
        }}>
          <Icon size={19} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <b style={{ fontSize: 14, fontWeight: 700, display: "block" }}>{int.name}</b>
          <small style={{ fontSize: 11.5, color: "var(--subtle)" }}>{int.sub}</small>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700,
          padding: "4px 9px", borderRadius: 20,
          display: "inline-flex", alignItems: "center", gap: 6,
          flexShrink: 0,
          color: pill.color, background: pill.bg,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />
          {int.statusText}
        </span>
      </div>

      {/* Meta */}
      <div style={{
        display: "flex", gap: 18,
        paddingTop: 12,
        borderTop: "1px solid var(--border-light)",
        marginBottom: 13,
      }}>
        <div>
          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>Última sync</div>
          <b style={{ fontSize: 13, color: "var(--text)", fontWeight: 700, display: "block", marginTop: 1 }}>{int.sync}</b>
        </div>
        <div>
          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>Volumen</div>
          <b style={{ fontSize: 13, color: "var(--text)", fontWeight: 700, display: "block", marginTop: 1 }}>{int.volume}</b>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8 }}>
        <button style={{
          flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
          border: "1px solid var(--border)", borderRadius: 9,
          fontFamily: "inherit", fontWeight: 600, fontSize: 13,
          padding: "8px 12px", cursor: "pointer",
          background: "var(--surface)", color: "var(--text)",
        }}>
          <RefreshCw size={14} /> Re-sincronizar
        </button>
        <button style={{
          flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
          border: int.status === "down" ? "0" : "1px solid var(--border)",
          borderRadius: 9,
          fontFamily: "inherit", fontWeight: 600, fontSize: 13,
          padding: "8px 12px", cursor: "pointer",
          background: int.status === "down" ? "var(--cool)" : "var(--surface)",
          color: int.status === "down" ? "#fff" : "var(--text)",
        }}>
          <Plug size={14} /> {int.status === "down" ? "Reconectar" : "Configurar"}
        </button>
      </div>
    </div>
  );
}

// ── Tab views ─────────────────────────────────────────────────────────────────

function ViewEstado() {
  return (
    <div>
      {/* KPI Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 14,
        marginBottom: 18,
      }} className="kpi-grid">
        {/* Uptime */}
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "var(--r-lg)", padding: 16, boxShadow: "var(--shadow-sm)",
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#ECFDF3", color: "#10B981", display: "grid", placeItems: "center", marginBottom: 12 }}>
            <Gauge size={18} />
          </div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", fontWeight: 500 }}>Uptime (30d)</div>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", margin: "3px 0 5px" }}>99.98%</div>
          <div style={{ fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4, color: "#10B981" }}>
            <CheckCircle2 size={13} /> Estable
          </div>
        </div>

        {/* Integraciones */}
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "var(--r-lg)", padding: 16, boxShadow: "var(--shadow-sm)",
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--cool-light)", color: "var(--cool-dark)", display: "grid", placeItems: "center", marginBottom: 12 }}>
            <Plug size={18} />
          </div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", fontWeight: 500 }}>Integraciones OK</div>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", margin: "3px 0 5px" }}>5 / 6</div>
          <div style={{ fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4, color: "var(--muted)" }}>
            <AlertCircle size={13} /> 1 con aviso
          </div>
        </div>

        {/* Tickets */}
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "var(--r-lg)", padding: 16, boxShadow: "var(--shadow-sm)",
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#EFF8FF", color: "#3B82F6", display: "grid", placeItems: "center", marginBottom: 12 }}>
            <Ticket size={18} />
          </div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", fontWeight: 500 }}>Tickets abiertos</div>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", margin: "3px 0 5px" }}>4</div>
          <div style={{ fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4, color: "var(--muted)" }}>
            <Clock size={13} /> 1 prioritario
          </div>
        </div>

        {/* Última sync */}
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "var(--r-lg)", padding: 16, boxShadow: "var(--shadow-sm)",
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#FFFAEB", color: "#F59E0B", display: "grid", placeItems: "center", marginBottom: 12 }}>
            <RefreshCw size={18} />
          </div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", fontWeight: 500 }}>Última sync</div>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", margin: "3px 0 5px" }}>2 min</div>
          <div style={{ fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4, color: "#10B981" }}>
            <CheckCircle2 size={13} /> Al día
          </div>
        </div>
      </div>

      {/* Two-column panel */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18,
      }} className="two-col-grid">
        {/* Services */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "15px 18px", borderBottom: "1px solid var(--border-light)" }}>
            <h3 style={{ fontSize: 14.5, fontWeight: 700, flex: 1 }}>Servicios</h3>
            <span style={{ fontSize: 12, color: "var(--subtle)", fontWeight: 500 }}>en vivo</span>
          </div>
          {SERVICES.map((svc, i) => (
            <div key={i} style={i === SERVICES.length - 1 ? { borderBottom: "none" } : {}}>
              <ServiceRow svc={svc} />
            </div>
          ))}
        </div>

        {/* Tickets */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "15px 18px", borderBottom: "1px solid var(--border-light)" }}>
            <h3 style={{ fontSize: 14.5, fontWeight: 700 }}>Tickets recientes</h3>
          </div>
          {TICKETS.map((tk, i) => (
            <div key={i} style={i === TICKETS.length - 1 ? { borderBottom: "none" } : {}}>
              <TicketRow tk={tk} />
            </div>
          ))}
        </div>
      </div>

      {/* Log viewer */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-sm)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "15px 18px", borderBottom: "1px solid var(--border-light)" }}>
          <h3 style={{ fontSize: 14.5, fontWeight: 700, flex: 1 }}>Actividad del sistema</h3>
          <span style={{ fontSize: 12, color: "var(--subtle)", fontWeight: 500 }}>stream</span>
        </div>
        <LogViewer lines={LOGS.slice(0, 6)} maxHeight={280} />
      </div>
    </div>
  );
}

function ViewIntegraciones() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }} className="int-grid">
      {INTEGRATIONS.map((int, i) => (
        <IntegrationCard key={i} int={int} />
      ))}
    </div>
  );
}

function ViewTickets() {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-sm)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "15px 18px", borderBottom: "1px solid var(--border-light)" }}>
        <h3 style={{ fontSize: 14.5, fontWeight: 700, flex: 1 }}>Todos los tickets</h3>
        <span style={{ fontSize: 12, color: "var(--subtle)", fontWeight: 500 }}>4 abiertos</span>
      </div>
      {TICKETS.map((tk, i) => (
        <div key={i} style={i === TICKETS.length - 1 ? { borderBottom: "none" } : {}}>
          <TicketRow tk={tk} />
        </div>
      ))}
    </div>
  );
}

function ViewLogs() {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-sm)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "15px 18px", borderBottom: "1px solid var(--border-light)" }}>
        <h3 style={{ fontSize: 14.5, fontWeight: 700, flex: 1 }}>Registro completo</h3>
        <span style={{ fontSize: 12, color: "var(--subtle)", fontWeight: 500 }}>últimas 24 h</span>
      </div>
      <LogViewer lines={[...LOGS, ...LOGS]} maxHeight={560} />
    </div>
  );
}

function PlaceholderPanel({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-sm)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "15px 18px", borderBottom: "1px solid var(--border-light)" }}>
        <h3 style={{ fontSize: 14.5, fontWeight: 700 }}>{title}</h3>
      </div>
      <div style={{ color: "var(--muted)", fontSize: 13, padding: 18, lineHeight: 1.6 }}>{body}</div>
    </div>
  );
}

// ── Tab config ─────────────────────────────────────────────────────────────────

type TabId = "estado" | "integraciones" | "tickets" | "logs" | "config" | "datos" | "accesos";

interface Tab {
  id: TabId;
  label: string;
  badge?: number | string;
  badgeAlert?: boolean;
  icon: React.ElementType;
}

const TABS: Tab[] = [
  { id: "estado",        label: "Estado",             icon: Activity },
  { id: "integraciones", label: "Integraciones",      icon: Plug,               badge: 1, badgeAlert: true },
  { id: "tickets",       label: "Tickets",            icon: Ticket,             badge: 4 },
  { id: "logs",          label: "Logs",               icon: Terminal },
  { id: "config",        label: "Parámetros",         icon: SlidersHorizontal },
  { id: "datos",         label: "Datos & respaldos",  icon: Database },
  { id: "accesos",       label: "Accesos & API",      icon: KeyRound },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TecnicoPage() {
  const [activeTab, setActiveTab] = useState<TabId>("estado");

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      {/* Page header */}
      <header style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "14px 24px",
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        flexWrap: "wrap",
      }}>
        {/* Title block */}
        <div>
          {/* Teal "Modo técnico" ribbon */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            fontSize: 10.5, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase",
            color: "var(--cool-dark)",
            background: "var(--cool-light)",
            border: "1px solid #CDEDE8",
            padding: "5px 9px",
            borderRadius: 7,
            marginBottom: 8,
          }}>
            <Wrench size={13} />
            Modo técnico
          </div>
          <h1 style={{
            fontSize: 19, fontWeight: 700,
            display: "flex", alignItems: "center", gap: 9,
            color: "var(--text)",
          }}>
            {TABS.find(t => t.id === activeTab)?.id === "estado"
              ? "Estado del sistema"
              : TABS.find(t => t.id === activeTab)?.label}
            <span style={{
              fontSize: 10.5, fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--cool-dark)",
              background: "var(--cool-light)",
              border: "1px solid #CDEDE8",
              padding: "3px 8px", borderRadius: 6,
            }}>TÉCNICO</span>
          </h1>
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>
            Edrin Travel · última sincronización hace 2 min
          </div>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Agency selector */}
        <div style={{
          display: "flex", alignItems: "center", gap: 9,
          background: "var(--bg)", border: "1px solid var(--border)",
          borderRadius: 10, padding: "6px 10px 6px 7px",
          cursor: "pointer",
        }}>
          <span style={{
            width: 28, height: 28, borderRadius: 8,
            background: "var(--brand)", color: "#fff",
            display: "grid", placeItems: "center",
            fontWeight: 800, fontSize: 12, flexShrink: 0,
          }}>ET</span>
          <div>
            <b style={{ fontSize: 13, fontWeight: 700, display: "block", lineHeight: 1.05 }}>Edrin Travel</b>
            <small style={{ fontSize: 10.5, color: "var(--subtle)" }}>Cambiar agencia</small>
          </div>
          <ChevronDown size={15} style={{ color: "var(--subtle)" }} />
        </div>

        {/* Refresh button */}
        <button style={{
          width: 36, height: 36, borderRadius: 9,
          border: "1px solid var(--border)",
          background: "var(--surface)",
          display: "grid", placeItems: "center",
          color: "var(--muted)", cursor: "pointer",
        }}>
          <RefreshCw size={17} />
        </button>

        {/* Diagnóstico button */}
        <button style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          border: 0, borderRadius: 9,
          fontFamily: "inherit", fontWeight: 600, fontSize: 13,
          padding: "9px 15px", cursor: "pointer",
          background: "var(--cool)", color: "#fff",
          boxShadow: "0 6px 14px -6px var(--cool)",
        }}>
          <Activity size={15} /> Diagnóstico
        </button>
      </header>

      {/* Tab navigation */}
      <div style={{
        display: "flex", alignItems: "center", gap: 4,
        padding: "10px 24px",
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        overflowX: "auto",
        flexShrink: 0,
      }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "7px 12px",
                borderRadius: 8,
                border: 0,
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                cursor: "pointer",
                whiteSpace: "nowrap",
                background: isActive ? "var(--cool-light)" : "transparent",
                color: isActive ? "var(--cool-dark)" : "var(--muted)",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              <Icon size={15} />
              {tab.label}
              {tab.badge !== undefined && (
                <span style={{
                  fontSize: 10.5, fontWeight: 700,
                  borderRadius: 20, padding: "1px 7px",
                  background: tab.badgeAlert ? "#FEF3F2" : "var(--border-light)",
                  color: tab.badgeAlert ? "#B42318" : "var(--muted)",
                }}>{tab.badge}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "22px 24px", background: "var(--bg)" }}>
        {activeTab === "estado"        && <ViewEstado />}
        {activeTab === "integraciones" && <ViewIntegraciones />}
        {activeTab === "tickets"       && <ViewTickets />}
        {activeTab === "logs"          && <ViewLogs />}
        {activeTab === "config"        && (
          <PlaceholderPanel
            title="Parámetros de la agencia"
            body="Moneda, zona horaria, etapas del pipeline, plantillas de mensaje y reglas de asignación."
          />
        )}
        {activeTab === "datos"  && (
          <PlaceholderPanel
            title="Datos & respaldos"
            body="Último respaldo: hoy 03:00 · Exportar / importar datos · purga de registros."
          />
        )}
        {activeTab === "accesos" && (
          <PlaceholderPanel
            title="Accesos & API"
            body="Tokens de API, webhooks y permisos por rol dentro de la agencia."
          />
        )}
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 1080px) {
          .kpi-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .two-col-grid { grid-template-columns: 1fr !important; }
          .int-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 680px) {
          .kpi-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
