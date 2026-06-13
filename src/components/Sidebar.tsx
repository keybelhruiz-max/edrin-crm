"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "./ThemeProvider";

const nav = [
  { href: "/pipeline", label: "Pipeline", icon: "⬡" },
  { href: "/leads", label: "Leads", icon: "◎" },
  { href: "/facturas", label: "Facturas", icon: "≡" },
  { href: "/tareas", label: "Tareas", icon: "☑" },
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
  { href: "/ajustes/pipeline", label: "Etapas pipeline", icon: "◧" },
  { href: "/ajustes/metodos-pago", label: "Métodos de pago", icon: "💳" },
  { href: "/ajustes/comisiones", label: "Comisiones", icon: "◩" },
  { href: "/ajustes/terminos", label: "Términos", icon: "◪" },
  { href: "/ajustes/integraciones", label: "Integraciones", icon: "⟴" },
];

/* Mobile bottom nav — only 5 most used items */
const mobileNav = [
  { href: "/pipeline", label: "Pipeline", icon: "⬡" },
  { href: "/leads", label: "Leads", icon: "◎" },
  { href: "/facturas", label: "Facturas", icon: "≡" },
  { href: "/tareas", label: "Tareas", icon: "☑" },
  { href: "/ai", label: "AI", icon: "✧" },
];

function NavItem({ href, label, icon, exact = false }: { href: string; label: string; icon: string; exact?: boolean }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : (pathname === href || pathname.startsWith(href + "/"));
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150"
      style={{
        color: active ? "#E8610A" : "var(--sidebar-text)",
        background: active ? "#FFF4EE" : "transparent",
        fontWeight: active ? 600 : 400,
      }}
    >
      <span className="text-base leading-none w-5 text-center">{icon}</span>
      <span className="truncate">{label}</span>
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, toggle } = useTheme();
  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";
  const userName = session?.user?.name ?? "Usuario";

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────── */}
      <aside
        className="hidden md:flex w-56 min-h-screen flex-col border-r shrink-0"
        style={{
          background: "var(--sidebar-bg)",
          borderColor: "var(--sidebar-border)",
        }}
      >
        {/* Logo */}
        <div className="px-4 pt-5 pb-4 border-b" style={{ borderColor: "var(--sidebar-border)" }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm shrink-0"
              style={{ background: "#E8610A" }}
            >
              E
            </div>
            <div>
              <div className="font-bold text-sm leading-tight" style={{ color: "var(--text)" }}>Edrin Travel</div>
              <div className="text-xs" style={{ color: "var(--sidebar-text)" }}>CRM</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-0.5">
          <div className="text-xs font-semibold uppercase tracking-wider px-3 py-1.5 mb-1" style={{ color: "#C4C4C4" }}>
            Principal
          </div>
          {nav.map((item) => <NavItem key={item.href} {...item} />)}

          <div className="text-xs font-semibold uppercase tracking-wider px-3 pt-4 pb-1.5" style={{ color: "#C4C4C4" }}>
            Marketing & AI
          </div>
          <NavItem href="/marketing" label="Hub Marketing" icon="✦" exact />
          <NavItem href="/marketing/calendario" label="Calendario" icon="▦" />
          <NavItem href="/marketing/biblioteca" label="Biblioteca" icon="▣" />
          <NavItem href="/marketing/automatizaciones" label="Automatizaciones" icon="⟳" />
          <NavItem href="/marketing/campanas" label="Campañas" icon="◉" />
          <NavItem href="/marketing/reportes" label="Reportes" icon="◳" />
          <NavItem href="/ai" label="Edrin AI" icon="✧" />

          {isAdmin && (
            <>
              <div className="text-xs font-semibold uppercase tracking-wider px-3 pt-4 pb-1.5" style={{ color: "#C4C4C4" }}>
                Admin
              </div>
              {adminNav.map((item) => <NavItem key={item.href} {...item} />)}
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="px-2 pb-4 border-t space-y-1 pt-3" style={{ borderColor: "var(--sidebar-border)" }}>
          <button
            onClick={toggle}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all"
            style={{ color: "var(--sidebar-text)" }}
          >
            <span>{theme === "dark" ? "☀️" : "🌙"}</span>
            <span>{theme === "dark" ? "Modo claro" : "Modo oscuro"}</span>
          </button>

          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg" style={{ background: "var(--bg)" }}>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ background: "#E8610A" }}
            >
              {userName[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate" style={{ color: "var(--text)" }}>{userName}</div>
              <div className="text-xs truncate" style={{ color: "var(--sidebar-text)" }}>
                {(session?.user as { role?: string })?.role ?? ""}
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-sm transition hover:opacity-70"
              style={{ color: "var(--sidebar-text)" }}
              title="Cerrar sesión"
            >
              ⏻
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile bottom nav ───────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t"
        style={{
          background: "var(--sidebar-bg)",
          borderColor: "var(--sidebar-border)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {mobileNav.map((item) => {
          const active = item.href === "/marketing"
            ? pathname === "/marketing" || pathname.startsWith("/marketing")
            : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-medium transition-all"
              style={{ color: active ? "#E8610A" : "var(--sidebar-text)" }}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
