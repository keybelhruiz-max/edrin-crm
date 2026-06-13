"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader, Card } from "@/components/ui";

interface AccountMetric {
  platform: string;
  color: string;
  emoji: string;
  followers?: number;
  connected: boolean;
}

interface ReportData {
  totalThisMonth?: number;
  totalPrevMonth?: number;
  growth?: number;
  leadsThisMonth?: number;
  oppsWon?: number;
  conversionRate?: number;
}

interface Campaign {
  id: string;
  name: string;
  platform: string;
  status: string;
  spent: number;
  leads: number;
  revenue: number;
}

const PLATFORMS: AccountMetric[] = [
  { platform: "Instagram", color: "#E1306C", emoji: "📸", connected: false },
  { platform: "Facebook", color: "#1877F2", emoji: "👥", connected: false },
  { platform: "TikTok", color: "#000", emoji: "🎵", connected: false },
  { platform: "WhatsApp", color: "#25D366", emoji: "💬", connected: false },
  { platform: "YouTube", color: "#FF0000", emoji: "▶️", connected: false },
];

const QUICK_LINKS = [
  { href: "/marketing/calendario", label: "Calendario de contenido", icon: "📅", desc: "Planifica y programa posts" },
  { href: "/marketing/biblioteca", label: "Biblioteca de medios", icon: "🖼️", desc: "Imágenes, videos y plantillas" },
  { href: "/marketing/automatizaciones", label: "Automatizaciones", icon: "⚡", desc: "Flujos automáticos if/then" },
  { href: "/marketing/campanas", label: "Campañas", icon: "📊", desc: "Meta Ads, TikTok Ads y ROI" },
  { href: "/marketing/reportes", label: "Reportes", icon: "📈", desc: "Análisis completo del negocio" },
  { href: "/ai", label: "Edrin AI", icon: "✧", desc: "Análisis inteligente con IA" },
];

export default function MarketingPage() {
  const [report, setReport] = useState<ReportData>({});
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const month = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    fetch(`/api/marketing/reports?type=commercial&month=${month}`)
      .then(r => r.json()).then(setReport).catch(() => {});
    fetch("/api/marketing/campaigns")
      .then(r => r.json()).then(setCampaigns).catch(() => {});
  }, [month]);

  const totalSpent = campaigns.reduce((s, c) => s + c.spent, 0);
  const totalLeads = campaigns.reduce((s, c) => s + c.leads, 0);
  const totalRev = campaigns.reduce((s, c) => s + c.revenue, 0);
  const roi = totalSpent > 0 ? ((totalRev - totalSpent) / totalSpent) * 100 : 0;

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-5 md:py-8">
        <PageHeader
          title="Marketing & Growth Hub"
          subtitle="Central de marketing integrado con el CRM"
          action={
            <Link href="/marketing/calendario"
              className="px-4 py-2 rounded-lg text-sm text-white font-medium"
              style={{ background: "var(--brand)" }}>
              + Nuevo post
            </Link>
          }
        />

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          {[
            { label: "Facturado este mes", value: `$${(report.totalThisMonth ?? 0).toLocaleString("es-DO", { minimumFractionDigits: 2 })}`, sub: report.growth !== undefined ? `${report.growth >= 0 ? "+" : ""}${report.growth.toFixed(1)}% vs mes anterior` : "—", color: "var(--brand)" },
            { label: "Leads este mes", value: report.leadsThisMonth ?? "—", sub: `${report.oppsWon ?? 0} cerrados`, color: "#10b981" },
            { label: "Conversión", value: `${(report.conversionRate ?? 0).toFixed(1)}%`, sub: "Leads → Ventas", color: "#6366f1" },
            { label: "ROI Campañas", value: `${roi.toFixed(1)}%`, sub: `$${totalSpent.toFixed(0)} invertidos`, color: roi >= 0 ? "#10b981" : "#ef4444" },
          ].map(k => (
            <Card key={k.label} className="text-center p-3 md:p-5">
              <div className="text-xl md:text-2xl font-black mb-1" style={{ color: k.color }}>{k.value}</div>
              <div className="text-xs md:text-sm font-medium" style={{ color: "var(--text)" }}>{k.label}</div>
              <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{k.sub}</div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          {/* Social accounts */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold" style={{ color: "var(--text)" }}>Redes sociales</h3>
              <span className="text-xs px-2 py-1 rounded-full" style={{ background: "var(--bg)", color: "var(--text-muted)" }}>
                {PLATFORMS.filter(p => p.connected).length}/{PLATFORMS.length} conectadas
              </span>
            </div>
            <div className="space-y-2">
              {PLATFORMS.map(p => (
                <div key={p.platform} className="flex items-center justify-between py-2 px-3 rounded-lg"
                  style={{ background: "var(--bg)" }}>
                  <div className="flex items-center gap-2">
                    <span>{p.emoji}</span>
                    <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{p.platform}</span>
                  </div>
                  <button className="text-xs px-2 py-1 rounded font-medium transition hover:opacity-80"
                    style={{
                      background: p.connected ? "rgba(16,185,129,0.1)" : "var(--brand)",
                      color: p.connected ? "#10b981" : "#fff",
                    }}>
                    {p.connected ? "✓ Conectado" : "Conectar"}
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {/* Campaign overview */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold" style={{ color: "var(--text)" }}>Campañas activas</h3>
              <Link href="/marketing/campanas" className="text-xs hover:underline" style={{ color: "var(--brand)" }}>Ver todas</Link>
            </div>
            {campaigns.filter(c => c.status === "ACTIVE").slice(0, 4).map(c => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                <div>
                  <div className="text-sm font-medium" style={{ color: "var(--text)" }}>{c.name}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>{c.platform} · {c.leads} leads</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold" style={{ color: "var(--text)" }}>${c.spent.toFixed(0)}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>invertido</div>
                </div>
              </div>
            ))}
            {campaigns.filter(c => c.status === "ACTIVE").length === 0 && (
              <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>Sin campañas activas</p>
            )}
          </Card>

          {/* Quick links */}
          <Card>
            <h3 className="font-bold mb-4" style={{ color: "var(--text)" }}>Accesos rápidos</h3>
            <div className="space-y-2">
              {QUICK_LINKS.map(l => (
                <Link key={l.href} href={l.href}
                  className="flex items-center gap-3 p-3 rounded-lg transition hover:opacity-80"
                  style={{ background: "var(--bg)" }}>
                  <span className="text-lg w-8 text-center">{l.icon}</span>
                  <div>
                    <div className="text-sm font-medium" style={{ color: "var(--text)" }}>{l.label}</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>{l.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <Card className="text-center">
            <div className="text-3xl font-black mb-1" style={{ color: "var(--brand)" }}>{totalLeads}</div>
            <div className="text-sm" style={{ color: "var(--text)" }}>Leads de campañas</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-black mb-1" style={{ color: "#6366f1" }}>${totalRev.toLocaleString()}</div>
            <div className="text-sm" style={{ color: "var(--text)" }}>Revenue atribuido</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-black mb-1" style={{ color: roi >= 0 ? "#10b981" : "#ef4444" }}>
              {roi >= 0 ? "+" : ""}{roi.toFixed(0)}%
            </div>
            <div className="text-sm" style={{ color: "var(--text)" }}>ROI total de campañas</div>
          </Card>
        </div>
      </div>
    </div>
  );
}
