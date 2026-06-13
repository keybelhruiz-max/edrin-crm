"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "./ThemeProvider";

const nav = [
  { href: "/pipeline", label: "Pipeline", icon: "⬡" },
  { href: "/leads", label: "Leads", icon: "◎" },
  { href: "/facturas", label: "Facturas", icon: "≡" },
  { href: "/comisiones", label: "Comisiones", icon: "◈" },
];

const marketingNav = [
  { href: "/marketing", label: "Hub Marketing", icon: "✦" },
  { href: "/marketing/calendario", label: "Calendario", icon: "▦" },
  { href: "/marketing/biblioteca", label: "Biblioteca", icon: "▣" },
  { href: "/marketing/automatizaciones", label: "Automatizaciones", icon: "⟳" },
  { href: "/marketing/campanas", label: "Campañas", icon: "◉" },
  { href: "/marketing/reportes", label: "Reportes", icon: "◳" },
  { href: "/ai", label: "Edrin AI", icon: "✧" },
];

const adminNav = [
  { href: "/ajustes/pipeline", label: "Etapas del pipeline", icon: "◧" },
  { href: "/ajustes/comisiones", label: "Config. comisiones", icon: "◩" },
  { href: "/ajustes/terminos", label: "Términos y condiciones", icon: "◪" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, toggle } = useTheme();
  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";

  return (
    <aside
      className="w-60 min-h-screen flex flex-col border-r"
      style={{
        background: "var(--sidebar-bg)",
        borderColor: "rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm"
            style={{ background: "var(--brand)" }}
          >
            E
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">Edrin Travel</div>
            <div className="text-xs" style={{ color: "var(--sidebar-text)" }}>CRM interno</div>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        <div className="text-xs font-semibold uppercase tracking-widest px-2 py-2" style={{ color: "var(--sidebar-text)", opacity: 0.5 }}>
          Principal
        </div>
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
              style={{
                color: active ? "#fff" : "var(--sidebar-text)",
                background: active ? "var(--brand)" : "transparent",
              }}
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Marketing Hub */}
        <>
          <div className="text-xs font-semibold uppercase tracking-widest px-2 py-2 mt-4" style={{ color: "var(--sidebar-text)", opacity: 0.5 }}>
            Marketing & AI
          </div>
          {marketingNav.map((item) => {
            const active = item.href === "/marketing"
              ? pathname === "/marketing"
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
                style={{
                  color: active ? "#fff" : "var(--sidebar-text)",
                  background: active ? "var(--brand)" : "transparent",
                }}
              >
                <span className="text-base leading-none">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </>

        {isAdmin && (
          <>
            <div className="text-xs font-semibold uppercase tracking-widest px-2 py-2 mt-4" style={{ color: "var(--sidebar-text)", opacity: 0.5 }}>
              Administración
            </div>
            {adminNav.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150"
                  style={{
                    color: active ? "#fff" : "var(--sidebar-text)",
                    background: active ? "rgba(232,97,10,0.7)" : "transparent",
                  }}
                >
                  <span className="text-base leading-none">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Bottom — user + theme toggle */}
      <div className="px-3 pb-5 space-y-2 border-t mt-2" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 mt-3"
          style={{ color: "var(--sidebar-text)" }}
        >
          <span>{theme === "dark" ? "☀️" : "🌙"}</span>
          <span>{theme === "dark" ? "Modo claro" : "Modo oscuro"}</span>
        </button>

        {/* User */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }}>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: "var(--brand)" }}
          >
            {session?.user?.name?.[0] ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-white truncate">{session?.user?.name ?? "Usuario"}</div>
            <div className="text-xs truncate" style={{ color: "var(--sidebar-text)" }}>
              {(session?.user as { role?: string })?.role ?? ""}
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-xs transition"
            style={{ color: "var(--sidebar-text)" }}
            title="Cerrar sesión"
          >
            ⏻
          </button>
        </div>
      </div>
    </aside>
  );
}
