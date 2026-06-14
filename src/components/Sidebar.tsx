"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "./ThemeProvider";
import {
  LayoutDashboard,
  Kanban,
  UserPlus,
  ReceiptText,
  ListChecks,
  BadgePercent,
  Megaphone,
  CalendarDays,
  Library,
  Zap,
  Send,
  BarChart3,
  Sparkles,
  Wallet,
  TrendingUp,
  GitBranch,
  Shield,
  Building2,
  UsersRound,
  Layers,
  CreditCard,
  FileText,
  Plug,
  Upload,
  Globe,
  Wrench,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";

type NavItemDef = { href: string; label: string; icon: React.ReactNode; exact?: boolean };

const icon = (Icon: React.ElementType) => <Icon className="w-4 h-4 flex-none" />;

const nav: NavItemDef[] = [
  { href: "/dashboard", label: "Dashboard", icon: icon(LayoutDashboard), exact: true },
  { href: "/pipeline", label: "Pipeline", icon: icon(Kanban) },
  { href: "/leads", label: "Leads", icon: icon(UserPlus) },
  { href: "/facturas", label: "Facturas", icon: icon(ReceiptText) },
  { href: "/tareas", label: "Tareas", icon: icon(ListChecks) },
  { href: "/comisiones", label: "Comisiones", icon: icon(BadgePercent) },
];

const mobileNav: NavItemDef[] = [
  { href: "/pipeline", label: "Pipeline", icon: icon(Kanban) },
  { href: "/leads", label: "Leads", icon: icon(UserPlus) },
  { href: "/facturas", label: "Facturas", icon: icon(ReceiptText) },
  { href: "/tareas", label: "Tareas", icon: icon(ListChecks) },
];

const adminNav: NavItemDef[] = [
  { href: "/ajustes/agencia", label: "Mi Agencia", icon: icon(Building2) },
  { href: "/ajustes/usuarios", label: "Usuarios", icon: icon(UsersRound) },
  { href: "/ajustes/pipeline", label: "Etapas pipeline", icon: icon(Layers) },
  { href: "/ajustes/metodos-pago", label: "Métodos de pago", icon: icon(CreditCard) },
  { href: "/ajustes/comisiones", label: "Comisiones", icon: icon(BadgePercent) },
  { href: "/ajustes/terminos", label: "Términos", icon: icon(FileText) },
  { href: "/ajustes/integraciones", label: "Integraciones", icon: icon(Plug) },
];

function NavItem({
  href,
  label,
  icon,
  exact = false,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const active = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className="flex items-center gap-[11px] px-3 py-2 rounded-[9px] text-sm font-medium transition-all duration-150"
      style={{
        color: active ? "var(--brand)" : "var(--muted)",
        background: active ? "var(--brand-light)" : "transparent",
        fontWeight: active ? 600 : 400,
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      {icon}
      <span className="truncate">{label}</span>
    </Link>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div
      className="px-3 pt-4 pb-1.5 text-[10.5px] font-bold uppercase tracking-wider"
      style={{ color: "#C4C4C4" }}
    >
      {label}
    </div>
  );
}

type Agency = { name: string; logoUrl?: string | null; primaryColor: string } | null;

export default function Sidebar({ agency }: { agency?: Agency }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, toggle } = useTheme();
  const userRole = (session?.user as { role?: string })?.role;
  const isAdmin = userRole === "ADMIN" || userRole === "SUPERADMIN";
  const isSuperAdmin = userRole === "SUPERADMIN";
  const userName = session?.user?.name ?? "Usuario";
  const agencyName = agency?.name ?? "CRM";
  const agencyInitial = agencyName[0]?.toUpperCase() ?? "A";

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
        {/* Agency logo/name */}
        <div className="px-4 pt-5 pb-4 border-b" style={{ borderColor: "var(--sidebar-border)" }}>
          <div className="flex items-center gap-2.5">
            {agency?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={agency.logoUrl} alt={agencyName} className="w-8 h-8 rounded-lg object-contain" />
            ) : (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm shrink-0"
                style={{ background: "var(--brand)" }}
              >
                {agencyInitial}
              </div>
            )}
            <div>
              <div className="font-bold text-sm leading-tight" style={{ color: "var(--text)" }}>{agencyName}</div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>CRM</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-0.5">
          <div
            className="px-3 py-1.5 mb-1 text-[10.5px] font-bold uppercase tracking-wider"
            style={{ color: "#C4C4C4" }}
          >
            Principal
          </div>
          {nav.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}

          <SectionHeader label="Marketing & AI" />
          <NavItem href="/marketing" label="Hub Marketing" icon={icon(Megaphone)} exact />
          <NavItem href="/marketing/calendario" label="Calendario" icon={icon(CalendarDays)} />
          <NavItem href="/marketing/biblioteca" label="Biblioteca" icon={icon(Library)} />
          <NavItem href="/marketing/automatizaciones" label="Automatizaciones" icon={icon(Zap)} />
          <NavItem href="/marketing/campanas" label="Campañas" icon={icon(Send)} />
          <NavItem href="/marketing/reportes" label="Reportes" icon={icon(BarChart3)} />
          <NavItem href="/ai" label="Edrin AI" icon={icon(Sparkles)} />

          <SectionHeader label="Análisis" />
          <NavItem href="/presupuesto" label="Presupuesto" icon={icon(Wallet)} />
          <NavItem href="/metricas" label="Métricas" icon={icon(TrendingUp)} />
          <NavItem href="/workflow" label="Workflow visual" icon={icon(GitBranch)} />
          <NavItem href="/seguridad" label="Seguridad" icon={icon(Shield)} />

          {isAdmin && (
            <>
              <SectionHeader label="Admin" />
              {adminNav.map((item) => (
                <NavItem key={item.href} {...item} />
              ))}
              <NavItem href="/importar" label="Importar datos" icon={icon(Upload)} />
            </>
          )}

          {isSuperAdmin && (
            <>
              <SectionHeader label="Plataforma" />
              <NavItem href="/superadmin" label="Gestión agencias" icon={icon(Globe)} />
              <NavItem href="/tecnico" label="Panel técnico" icon={icon(Wrench)} />
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="px-2 pb-4 border-t space-y-1 pt-3" style={{ borderColor: "var(--sidebar-border)" }}>
          <button
            onClick={toggle}
            className="w-full flex items-center gap-[11px] px-3 py-2 rounded-[9px] text-sm transition-all"
            style={{ color: "var(--muted)" }}
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 flex-none" />
            ) : (
              <Moon className="w-4 h-4 flex-none" />
            )}
            <span>{theme === "dark" ? "Modo claro" : "Modo oscuro"}</span>
          </button>

          <div className="flex items-center gap-2.5 px-3 py-2 rounded-[9px]" style={{ background: "var(--surface-2)" }}>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ background: "var(--brand)" }}
            >
              {userName[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate" style={{ color: "var(--text)" }}>{userName}</div>
              <div className="text-xs truncate" style={{ color: "var(--muted)" }}>
                {userRole ?? ""}
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="transition hover:opacity-70"
              style={{ color: "var(--muted)" }}
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
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
          const active =
            item.href === "/marketing"
              ? pathname === "/marketing" || pathname.startsWith("/marketing")
              : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-medium transition-all"
              style={{ color: active ? "var(--brand)" : "var(--muted)" }}
            >
              {item.icon}
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
