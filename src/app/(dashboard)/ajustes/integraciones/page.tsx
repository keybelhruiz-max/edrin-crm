"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui";

// ── Real brand SVG logos ───────────────────────────────────────────────────────
function WhatsAppLogo() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7">
      <circle cx="24" cy="24" r="24" fill="#25D366"/>
      <path d="M34.5 13.5C31.9 10.9 28.4 9.5 24.7 9.5C17.1 9.5 10.9 15.7 10.9 23.3C10.9 25.8 11.6 28.2 12.8 30.3L10.8 38.5L19.2 36.5C21.2 37.6 23.4 38.2 25.7 38.2H25.7C33.3 38.2 39.5 32 39.5 24.4C39.5 20.7 38.1 17.1 35.5 14.5L34.5 13.5Z" fill="white" fillOpacity="0.1"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M24.7 10.9C17.9 10.9 12.3 16.5 12.3 23.3C12.3 25.6 12.9 27.8 14 29.7L12.4 36.1L19 34.6C20.8 35.6 22.7 36.1 24.7 36.1H24.7C31.5 36.1 37.1 30.5 37.1 23.7C37.1 20.4 35.8 17.3 33.5 15L33.4 14.9C31.1 12.6 28.0 10.9 24.7 10.9ZM20.0 16.9C20.3 16.9 20.6 16.9 20.9 16.9C21.2 16.9 21.6 17.0 21.9 17.8C22.3 18.7 23.1 20.9 23.2 21.1C23.3 21.3 23.4 21.5 23.2 21.8C23.1 22.0 23.0 22.2 22.8 22.5C22.6 22.7 22.4 23.0 22.2 23.2C22.0 23.4 21.8 23.7 22.0 24.0C22.3 24.4 23.1 25.7 24.3 26.8C25.8 28.1 27.1 28.5 27.5 28.7C27.8 28.9 28.1 28.8 28.3 28.6C28.6 28.3 29.2 27.6 29.5 27.3C29.8 27.0 30.1 27.0 30.4 27.1C30.8 27.2 33.0 28.3 33.4 28.5C33.7 28.7 33.9 28.8 34.0 28.9C34.0 29.5 33.7 30.6 33.2 31.1C32.6 31.7 31.4 32.3 30.0 32.3C28.7 32.3 27.0 31.8 24.7 30.6C22.4 29.5 20.3 27.5 19.1 25.8C17.9 24.2 17.3 22.6 17.3 21.1C17.3 19.6 17.9 18.5 18.5 17.9C19.1 17.3 19.6 16.9 20.0 16.9Z" fill="white"/>
    </svg>
  );
}

function InstagramLogo() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7">
      <defs>
        <radialGradient id="ig1" cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#fdf497"/>
          <stop offset="5%" stopColor="#fdf497"/>
          <stop offset="45%" stopColor="#fd5949"/>
          <stop offset="60%" stopColor="#d6249f"/>
          <stop offset="90%" stopColor="#285AEB"/>
        </radialGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#ig1)"/>
      <rect x="13" y="13" width="22" height="22" rx="6" stroke="white" strokeWidth="2.5" fill="none"/>
      <circle cx="24" cy="24" r="5.5" stroke="white" strokeWidth="2.5" fill="none"/>
      <circle cx="32" cy="16" r="1.5" fill="white"/>
    </svg>
  );
}

function FacebookLogo() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7">
      <rect width="48" height="48" rx="12" fill="#1877F2"/>
      <path d="M33 24H28V20C28 18.9 28.9 18 30 18H32V13H28C24.7 13 22 15.7 22 19V24H18V30H22V42H28V30H33L33 24Z" fill="white"/>
    </svg>
  );
}

function MessengerLogo() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7">
      <defs>
        <linearGradient id="msg1" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#E946F5"/>
          <stop offset="100%" stopColor="#0078FF"/>
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#msg1)"/>
      <path d="M24 10C16.3 10 10 16.0 10 23.4C10 27.5 11.9 31.2 14.9 33.7V39L20.6 35.9C21.7 36.2 22.8 36.4 24 36.4C31.7 36.4 38 30.4 38 23.0C38 15.6 31.7 10 24 10ZM25.4 28L21.8 24.2L14.8 28L22.6 19.7L26.2 23.4L33.2 19.7L25.4 28Z" fill="white"/>
    </svg>
  );
}

function TikTokLogo() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7">
      <rect width="48" height="48" rx="12" fill="#010101"/>
      <path d="M34.3 19.1C32.5 19.1 30.8 18.5 29.5 17.4V26.5C29.5 30.6 26.2 34 22.1 34C18.0 34 14.7 30.6 14.7 26.5C14.7 22.4 18.0 19 22.1 19C22.5 19 22.9 19.1 23.3 19.1V23.2C22.9 23.1 22.5 23.0 22.1 23.0C20.2 23.0 18.7 24.6 18.7 26.5C18.7 28.4 20.2 30.0 22.1 30.0C24.0 30.0 25.5 28.4 25.5 26.5V10H29.5C29.5 14.9 33.4 19.1 38 19.1V19.1" fill="#EE1D52"/>
      <path d="M33.3 18.1C31.5 18.1 29.8 17.5 28.5 16.4V25.5C28.5 29.6 25.2 33 21.1 33C17.0 33 13.7 29.6 13.7 25.5C13.7 21.4 17.0 18 21.1 18C21.5 18 21.9 18.1 22.3 18.1V22.2C21.9 22.1 21.5 22.0 21.1 22.0C19.2 22.0 17.7 23.6 17.7 25.5C17.7 27.4 19.2 29.0 21.1 29.0C23.0 29.0 24.5 27.4 24.5 25.5V9H28.5C28.5 13.9 32.4 18.1 37 18.1V18.1" fill="#69C9D0"/>
      <path d="M34.3 19.1C32.5 19.1 30.8 18.5 29.5 17.4V26.5C29.5 30.6 26.2 34 22.1 34C18.0 34 14.7 30.6 14.7 26.5C14.7 22.4 18.0 19 22.1 19C22.5 19 22.9 19.1 23.3 19.1V23.2C22.9 23.1 22.5 23.0 22.1 23.0C20.2 23.0 18.7 24.6 18.7 26.5C18.7 28.4 20.2 30.0 22.1 30.0C24.0 30.0 25.5 28.4 25.5 26.5V10H29.5C29.5 14.9 33.4 19.1 38 19.1V19.1" fill="black" fillOpacity="0"/>
    </svg>
  );
}

function MetaAdsLogo() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7">
      <rect width="48" height="48" rx="12" fill="#0866FF"/>
      <path d="M9 24C9 18 13 14 18 14C21 14 23.5 15.5 24 18C24.5 15.5 27 14 30 14C35 14 39 18 39 24C39 30 35.5 34 30 34C27 34 24.8 32 24 30C23.2 32 21 34 18 34C12.5 34 9 30 9 24ZM18 30C20.8 30 23 27.3 23 24C23 20.7 20.8 18 18 18C15.2 18 13 20.7 13 24C13 27.3 15.2 30 18 30ZM30 30C32.8 30 35 27.3 35 24C35 20.7 32.8 18 30 18C27.2 18 25 20.7 25 24C25 27.3 27.2 30 30 30Z" fill="white"/>
    </svg>
  );
}

const LOGOS: Record<string, React.ReactNode> = {
  whatsapp: <WhatsAppLogo />,
  instagram: <InstagramLogo />,
  facebook: <FacebookLogo />,
  messenger: <MessengerLogo />,
  tiktok: <TikTokLogo />,
  meta_ads: <MetaAdsLogo />,
};

interface Integration {
  key: string;
  label: string;
  description: string;
  fields: { key: string; label: string; placeholder: string; type?: string }[];
  accentColor: string;
}

const INTEGRATIONS: Integration[] = [
  {
    key: "whatsapp",
    label: "WhatsApp Business",
    description: "Envía y recibe mensajes de WhatsApp directamente desde el CRM.",
    accentColor: "#25D366",
    fields: [
      { key: "phone_id", label: "Phone Number ID", placeholder: "1234567890" },
      { key: "access_token", label: "Access Token", placeholder: "EAABwzLixnjY...", type: "password" },
      { key: "webhook_verify_token", label: "Webhook Verify Token", placeholder: "mi_token_secreto" },
    ],
  },
  {
    key: "instagram",
    label: "Instagram",
    description: "Gestiona DMs y comentarios de Instagram desde el CRM.",
    accentColor: "#E1306C",
    fields: [
      { key: "page_id", label: "Instagram Page ID", placeholder: "17841400..." },
      { key: "access_token", label: "Access Token (long-lived)", placeholder: "EAABwzLixnjY...", type: "password" },
    ],
  },
  {
    key: "facebook",
    label: "Facebook",
    description: "Integra tu página de Facebook para gestionar leads y mensajes.",
    accentColor: "#1877F2",
    fields: [
      { key: "page_id", label: "Page ID", placeholder: "106498..." },
      { key: "access_token", label: "Page Access Token", placeholder: "EAABwzLixnjY...", type: "password" },
    ],
  },
  {
    key: "messenger",
    label: "Messenger",
    description: "Responde a mensajes de Messenger desde el CRM.",
    accentColor: "#0084FF",
    fields: [
      { key: "app_id", label: "App ID", placeholder: "123456789" },
      { key: "app_secret", label: "App Secret", placeholder: "abc123...", type: "password" },
      { key: "page_access_token", label: "Page Access Token", placeholder: "EAABwzLixnjY...", type: "password" },
    ],
  },
  {
    key: "tiktok",
    label: "TikTok Business",
    description: "Conecta TikTok para gestionar campañas y leads.",
    accentColor: "#010101",
    fields: [
      { key: "app_id", label: "App ID", placeholder: "7xxx" },
      { key: "access_token", label: "Access Token", placeholder: "...", type: "password" },
    ],
  },
  {
    key: "meta_ads",
    label: "Meta Ads",
    description: "Sincroniza campañas de Facebook e Instagram Ads.",
    accentColor: "#0866FF",
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
    fetch("/api/config?prefix=integration_")
      .then(r => r.ok ? r.json() : [])
      .then((data: { key: string; value: string }[]) => {
        const parsed: Record<string, Record<string, string>> = {};
        const conn: Record<string, boolean> = {};
        data.forEach(({ key, value }) => {
          if (!value) return;
          const rest = key.replace("integration_", "");
          const firstUnderscore = rest.indexOf("_");
          const platform = rest.substring(0, firstUnderscore);
          const field = rest.substring(firstUnderscore + 1);
          if (!parsed[platform]) parsed[platform] = {};
          parsed[platform][field] = value;
          conn[platform] = true;
        });
        setConfigs(parsed);
        setConnected(conn);
      });
  }, []);

  function updateField(platform: string, field: string, value: string) {
    setConfigs(prev => ({ ...prev, [platform]: { ...prev[platform], [field]: value } }));
  }

  async function saveIntegration(integration: Integration) {
    const data = configs[integration.key] ?? {};
    await Promise.all(
      integration.fields.map(f =>
        fetch("/api/config", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: `integration_${integration.key}_${f.key}`, value: data[f.key] ?? "" }),
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
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: `integration_${integration.key}_${f.key}`, value: "" }),
        })
      )
    );
    setConfigs(prev => ({ ...prev, [integration.key]: {} }));
    setConnected(c => ({ ...c, [integration.key]: false }));
  }

  return (
    <div>
      <PageHeader title="Integraciones" subtitle="Conecta tus redes sociales y plataformas de mensajería" />

      <div className="p-6 grid gap-4 md:grid-cols-2">
        {INTEGRATIONS.map((integration) => {
          const isConnected = connected[integration.key];
          const data = configs[integration.key] ?? {};
          const isSaved = saved[integration.key];

          return (
            <div key={integration.key} className="rounded-2xl border overflow-hidden"
              style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="shrink-0">{LOGOS[integration.key]}</div>
                  <div>
                    <div className="font-semibold text-sm" style={{ color: "var(--text)" }}>{integration.label}</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>{integration.description}</div>
                  </div>
                </div>
                <div className="px-2.5 py-1 rounded-full text-xs font-semibold shrink-0"
                  style={{ background: isConnected ? "#ECFDF5" : "var(--bg)", color: isConnected ? "#059669" : "var(--text-muted)" }}>
                  {isConnected ? "● Conectado" : "○ Sin conectar"}
                </div>
              </div>

              {/* Fields */}
              <div className="px-5 py-4 space-y-3">
                {integration.fields.map(field => (
                  <div key={field.key}>
                    <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>{field.label}</label>
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
                <button onClick={() => saveIntegration(integration)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition"
                  style={{ background: isSaved ? "#10B981" : integration.accentColor }}>
                  {isSaved ? "✓ Guardado" : "Guardar configuración"}
                </button>
                {isConnected && (
                  <button onClick={() => disconnect(integration)}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium border transition"
                    style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                    Desconectar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mx-6 mb-6 p-4 rounded-xl border" style={{ borderColor: "#FDE68A", background: "#FFFBEB" }}>
        <p className="text-sm font-medium" style={{ color: "#92400E" }}>📋 ¿Cómo obtener las claves API?</p>
        <ul className="mt-2 space-y-1 text-xs" style={{ color: "#92400E" }}>
          <li>• <strong>WhatsApp / Instagram / Facebook / Messenger / Meta Ads:</strong> Crea una app en <strong>developers.facebook.com</strong> → "Mis apps"</li>
          <li>• <strong>TikTok Business:</strong> Regístrate en <strong>business-api.tiktok.com</strong> → Developer Portal</li>
        </ul>
      </div>
    </div>
  );
}
