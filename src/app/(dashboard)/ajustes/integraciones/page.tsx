"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui";

interface Integration {
  key: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  fields: { key: string; label: string; placeholder: string; type?: string }[];
}

const INTEGRATIONS: Integration[] = [
  {
    key: "whatsapp",
    label: "WhatsApp Business",
    description: "Envía y recibe mensajes de WhatsApp directamente desde el CRM.",
    icon: "💬",
    color: "#25D366",
    fields: [
      { key: "phone_id", label: "Phone Number ID", placeholder: "1234567890" },
      { key: "access_token", label: "Access Token", placeholder: "EAABwzLixnjY...", type: "password" },
      { key: "webhook_verify_token", label: "Webhook Verify Token", placeholder: "mi_token_secreto" },
    ],
  },
  {
    key: "instagram",
    label: "Instagram",
    description: "Conecta tu cuenta de Instagram para gestionar DMs y comentarios.",
    icon: "📸",
    color: "#E1306C",
    fields: [
      { key: "page_id", label: "Instagram Page ID", placeholder: "17841400..." },
      { key: "access_token", label: "Access Token (long-lived)", placeholder: "EAABwzLixnjY...", type: "password" },
    ],
  },
  {
    key: "facebook",
    label: "Facebook",
    description: "Integra tu página de Facebook para gestionar leads y mensajes.",
    icon: "📘",
    color: "#1877F2",
    fields: [
      { key: "page_id", label: "Page ID", placeholder: "106498..." },
      { key: "access_token", label: "Page Access Token", placeholder: "EAABwzLixnjY...", type: "password" },
    ],
  },
  {
    key: "messenger",
    label: "Messenger",
    description: "Responde a mensajes de Messenger desde el CRM.",
    icon: "🟣",
    color: "#0084FF",
    fields: [
      { key: "app_id", label: "App ID", placeholder: "123456789" },
      { key: "app_secret", label: "App Secret", placeholder: "abc123...", type: "password" },
      { key: "page_access_token", label: "Page Access Token", placeholder: "EAABwzLixnjY...", type: "password" },
    ],
  },
  {
    key: "tiktok",
    label: "TikTok Business",
    description: "Conecta TikTok para gestionar campañas y leads desde la plataforma.",
    icon: "🎵",
    color: "#010101",
    fields: [
      { key: "app_id", label: "App ID", placeholder: "7xxx" },
      { key: "access_token", label: "Access Token", placeholder: "...", type: "password" },
    ],
  },
  {
    key: "meta_ads",
    label: "Meta Ads",
    description: "Sincroniza campañas de Facebook e Instagram Ads automáticamente.",
    icon: "📊",
    color: "#0866FF",
    fields: [
      { key: "ad_account_id", label: "Ad Account ID", placeholder: "act_123456" },
      { key: "access_token", label: "Marketing API Token", placeholder: "EAABwzLixnjY...", type: "password" },
    ],
  },
];

export default function IntegracionesPage() {
  const [configs, setConfigs] = useState<Record<string, Record<string, string>>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [connected, setConnected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Load saved configs from AppConfig
    fetch("/api/config?prefix=integration_")
      .then(r => r.ok ? r.json() : [])
      .then((data: { key: string; value: string }[]) => {
        const parsed: Record<string, Record<string, string>> = {};
        const conn: Record<string, boolean> = {};
        data.forEach(({ key, value }) => {
          const parts = key.replace("integration_", "").split("_");
          const platform = parts[0];
          const field = parts.slice(1).join("_");
          if (!parsed[platform]) parsed[platform] = {};
          try { parsed[platform][field] = JSON.parse(value); } catch { parsed[platform][field] = value; }
          conn[platform] = true;
        });
        setConfigs(parsed);
        setConnected(conn);
      });
  }, []);

  function updateField(platform: string, field: string, value: string) {
    setConfigs(prev => ({
      ...prev,
      [platform]: { ...prev[platform], [field]: value },
    }));
  }

  async function saveIntegration(integration: Integration) {
    const data = configs[integration.key] ?? {};
    await Promise.all(
      integration.fields.map(f =>
        fetch("/api/config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: `integration_${integration.key}_${f.key}`,
            value: data[f.key] ?? "",
          }),
        })
      )
    );
    setSaved(s => ({ ...s, [integration.key]: true }));
    setConnected(c => ({ ...c, [integration.key]: true }));
    setTimeout(() => setSaved(s => ({ ...s, [integration.key]: false })), 2000);
  }

  async function disconnect(integration: Integration) {
    await Promise.all(
      integration.fields.map(f =>
        fetch("/api/config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: `integration_${integration.key}_${f.key}`, value: "" }),
        })
      )
    );
    setConfigs(prev => ({ ...prev, [integration.key]: {} }));
    setConnected(c => ({ ...c, [integration.key]: false }));
  }

  return (
    <div>
      <PageHeader
        title="Integraciones"
        subtitle="Conecta tus redes sociales y plataformas de mensajería"
      />

      <div className="p-6 grid gap-4 md:grid-cols-2">
        {INTEGRATIONS.map((integration) => {
          const isConnected = connected[integration.key];
          const data = configs[integration.key] ?? {};
          const isSaved = saved[integration.key];

          return (
            <div
              key={integration.key}
              className="rounded-2xl border overflow-hidden"
              style={{ borderColor: "var(--border)", background: "var(--surface)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: integration.color + "18" }}
                  >
                    {integration.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-sm" style={{ color: "var(--text)" }}>{integration.label}</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>{integration.description}</div>
                  </div>
                </div>
                <div
                  className="px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: isConnected ? "#ECFDF5" : "var(--bg)",
                    color: isConnected ? "#059669" : "var(--text-muted)",
                  }}
                >
                  {isConnected ? "● Conectado" : "○ Desconectado"}
                </div>
              </div>

              {/* Fields */}
              <div className="px-5 py-4 space-y-3">
                {integration.fields.map(field => (
                  <div key={field.key}>
                    <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
                      {field.label}
                    </label>
                    <input
                      type={field.type ?? "text"}
                      value={data[field.key] ?? ""}
                      onChange={e => updateField(integration.key, field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full border rounded-lg px-3 py-2 text-sm font-mono"
                      style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }}
                    />
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="px-5 pb-4 flex gap-2">
                <button
                  onClick={() => saveIntegration(integration)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition"
                  style={{ background: isSaved ? "#10B981" : integration.color }}
                >
                  {isSaved ? "✓ Guardado" : "Guardar"}
                </button>
                {isConnected && (
                  <button
                    onClick={() => disconnect(integration)}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium border transition"
                    style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                  >
                    Desconectar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info box */}
      <div className="mx-6 mb-6 p-4 rounded-xl border" style={{ borderColor: "#FDE68A", background: "#FFFBEB" }}>
        <p className="text-sm font-medium" style={{ color: "#92400E" }}>📋 ¿Cómo obtener las claves API?</p>
        <ul className="mt-2 space-y-1 text-xs" style={{ color: "#92400E" }}>
          <li>• <strong>WhatsApp/Instagram/Facebook/Messenger:</strong> Crea una app en <strong>developers.facebook.com</strong></li>
          <li>• <strong>Meta Ads:</strong> Obtén el token en <strong>business.facebook.com → Ajustes → Integraciones</strong></li>
          <li>• <strong>TikTok:</strong> Regístrate en <strong>business-api.tiktok.com</strong></li>
        </ul>
      </div>
    </div>
  );
}
