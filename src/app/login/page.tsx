"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Compass,
  Kanban,
  MessageCircle,
  ReceiptText,
  Sparkles,
} from "lucide-react";

const FEATURES = [
  {
    icon: Kanban,
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    title: "Pipeline visual",
    desc: "Seguimiento de leads en tiempo real",
  },
  {
    icon: MessageCircle,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    title: "Multicanal",
    desc: "WA, IG, Email y más en un lugar",
  },
  {
    icon: ReceiptText,
    color: "text-sky-400",
    bg: "bg-sky-400/10",
    title: "Cotiza y factura",
    desc: "Presupuestos y cobros automáticos",
  },
  {
    icon: Sparkles,
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    title: "Edrin AI",
    desc: "Automatiza con inteligencia artificial",
  },
];

const ROLES = [
  { label: "Agencia / Admin", desc: "Acceso completo a la plataforma", email: "admin@edrin.app", icon: Compass },
  { label: "Técnico / Asesor", desc: "Pipeline, clientes y tareas", email: "tecnico@edrin.app", icon: Kanban },
  { label: "Superadmin", desc: "Configuración y multi-cuenta", email: "super@edrin.app", icon: Sparkles },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"login" | "roles">("login");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Email o contraseña incorrectos");
    } else {
      router.push("/pipeline");
    }
  }

  async function handleRoleLogin(roleEmail: string) {
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { email: roleEmail, password: "demo1234", redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("No se pudo iniciar sesión con este rol");
    } else {
      router.push("/pipeline");
    }
  }

  return (
    <div className="min-h-screen flex bg-[#F5F6FA]">
      {/* ── LEFT PROMO PANEL ── */}
      <div
        className="hidden lg:flex flex-col w-[52%] relative overflow-hidden"
        style={{
          background:
            "radial-gradient(900px 500px at 110% -10%, rgba(232,97,10,.34) 0%, rgba(232,97,10,0) 55%), radial-gradient(700px 500px at -20% 120%, rgba(14,147,132,.30) 0%, rgba(14,147,132,0) 55%), linear-gradient(160deg,#161E32 0%, #0F1424 100%)",
        }}
      >
        {/* Grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px)",
            backgroundSize: "34px 34px",
            mask: "radial-gradient(600px 400px at 70% 30%,#000,transparent)",
          }}
        />

        <div className="relative z-10 flex flex-col h-full px-12 py-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Compass className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">Edrin Travel CRM</span>
          </div>

          {/* Headline */}
          <div className="mt-auto mb-auto pt-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/8 border border-white/10 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-white/70 text-xs font-medium">Plataforma todo-en-uno para agencias</span>
            </div>
            <h1 className="text-white text-[2.35rem] font-bold leading-[1.18] mb-5">
              Vende más viajes,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
                sin perder ni un lead
              </span>
            </h1>
            <p className="text-white/55 text-base leading-relaxed max-w-sm">
              Pipeline visual, comunicación multicanal, cotizaciones y facturación — todo integrado en un solo lugar.
            </p>

            {/* Feature grid */}
            <div className="grid grid-cols-2 gap-3 mt-10">
              {FEATURES.map(({ icon: Icon, color, bg, title, desc }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-white/8 bg-white/5 p-4 backdrop-blur-sm hover:bg-white/8 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                  <div className="text-white text-sm font-semibold">{title}</div>
                  <div className="text-white/45 text-xs mt-0.5 leading-snug">{desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-auto pt-8 border-t border-white/8">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-orange-400 font-bold text-lg">+38%</div>
                <div className="text-white/45 text-xs">más conversiones</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <div className="text-emerald-400 font-bold text-lg">12 min</div>
                <div className="text-white/45 text-xs">respuesta promedio</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  <span className="text-white/45 text-xs">WA</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-pink-400 inline-block" />
                  <span className="text-white/45 text-xs">IG</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
                  <span className="text-white/45 text-xs">TikTok</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT AUTH PANEL ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center">
              <Compass className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">Edrin Travel CRM</span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setTab("login")}
                className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                  tab === "login"
                    ? "text-orange-500 border-b-2 border-orange-500 bg-orange-500/3"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                Iniciar sesión
              </button>
              <button
                onClick={() => setTab("roles")}
                className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                  tab === "roles"
                    ? "text-orange-500 border-b-2 border-orange-500 bg-orange-500/3"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                Entrar como…
              </button>
            </div>

            <div className="p-7">
              {tab === "login" ? (
                <>
                  <h2 className="text-xl font-bold text-gray-900 mb-0.5">Bienvenido de nuevo</h2>
                  <p className="text-sm text-gray-400 mb-6">Ingresa tus credenciales para continuar</p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Correo electrónico
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 transition-all outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-400/15"
                          placeholder="correo@agencia.com"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Contraseña
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="w-full rounded-xl pl-10 pr-11 py-2.5 text-sm border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 transition-all outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-400/15"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Remember me */}
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-orange-500 accent-orange-500"
                        />
                        <span className="text-sm text-gray-500">Recordarme</span>
                      </label>
                      <button type="button" className="text-sm text-orange-500 hover:text-orange-600 font-medium transition-colors">
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>

                    {/* Error */}
                    {error && (
                      <div className="rounded-xl px-4 py-3 text-sm bg-red-50 text-red-600 border border-red-100">
                        {error}
                      </div>
                    )}

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-60 transition-colors shadow-sm shadow-orange-500/30 mt-1"
                    >
                      {loading ? (
                        "Iniciando sesión…"
                      ) : (
                        <>
                          <LogIn className="w-4 h-4" />
                          Iniciar sesión
                        </>
                      )}
                    </button>
                  </form>

                  {/* Divider */}
                  <div className="flex items-center gap-3 my-5">
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-xs text-gray-400">o continúa con</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>

                  {/* OAuth buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => signIn("google", { callbackUrl: "/pipeline" })}
                      className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Google
                    </button>
                    <button
                      type="button"
                      onClick={() => signIn("facebook", { callbackUrl: "/pipeline" })}
                      className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      Facebook
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-gray-900 mb-0.5">Acceso rápido</h2>
                  <p className="text-sm text-gray-400 mb-5">Selecciona tu rol para entrar con credenciales de demo</p>

                  {error && (
                    <div className="rounded-xl px-4 py-3 text-sm bg-red-50 text-red-600 border border-red-100 mb-4">
                      {error}
                    </div>
                  )}

                  <div className="space-y-3">
                    {ROLES.map(({ label, desc, email: roleEmail, icon: Icon }) => (
                      <button
                        key={label}
                        type="button"
                        disabled={loading}
                        onClick={() => handleRoleLogin(roleEmail)}
                        className="w-full flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-orange-50 hover:border-orange-200 px-4 py-3.5 text-left transition-all group disabled:opacity-60"
                      >
                        <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 group-hover:border-orange-200 group-hover:bg-orange-50 flex items-center justify-center shrink-0 transition-colors">
                          <Icon className="w-4.5 h-4.5 text-gray-500 group-hover:text-orange-500 transition-colors" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-gray-800 group-hover:text-orange-600 transition-colors">
                            {label}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">{desc}</div>
                        </div>
                        <LogIn className="w-4 h-4 text-gray-300 group-hover:text-orange-400 ml-auto shrink-0 transition-colors" />
                      </button>
                    ))}
                  </div>

                  <p className="text-xs text-gray-400 mt-5 text-center">
                    Solo para demostración · contraseña:{" "}
                    <span className="font-mono text-gray-500">demo1234</span>
                  </p>
                </>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-5">
            Acceso solo para miembros del equipo · © 2026 Edrin Travel CRM
          </p>
        </div>
      </div>
    </div>
  );
}
