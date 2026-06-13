"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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

  return (
    <div className="min-h-screen flex" style={{ background: "#F5F6FA" }}>
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex flex-col justify-between w-[45%] p-12"
        style={{ background: "linear-gradient(135deg, #E8610A 0%, #f59340 100%)" }}
      >
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white font-black text-lg">
              E
            </div>
            <span className="text-white font-bold text-xl tracking-tight">Edrin Travel CRM</span>
          </div>
        </div>

        <div className="space-y-6">
          <h1 className="text-white text-4xl font-bold leading-tight">
            Gestiona tu agencia<br />de viajes sin esfuerzo
          </h1>
          <p className="text-white/80 text-lg">
            Pipeline de ventas, facturación, marketing y más — todo en un solo lugar.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            {[
              { n: "Pipeline", d: "Seguimiento de leads" },
              { n: "Facturación", d: "Facturas y cobros" },
              { n: "Marketing", d: "Redes sociales y campañas" },
              { n: "AI Asistente", d: "Automatiza con inteligencia" },
            ].map((f) => (
              <div key={f.n} className="bg-white/15 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-white font-semibold text-sm">{f.n}</div>
                <div className="text-white/70 text-xs mt-0.5">{f.d}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/50 text-xs">© 2026 Edrin Travel CRM</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black" style={{ background: "#E8610A" }}>
              E
            </div>
            <span className="font-bold text-xl" style={{ color: "#111827" }}>Edrin Travel CRM</span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold mb-1" style={{ color: "#111827" }}>Bienvenido</h2>
            <p className="text-sm mb-6" style={{ color: "#6B7280" }}>Inicia sesión para continuar</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl px-4 py-3 text-sm border transition-all"
                  style={{ borderColor: "#E5E7EB", background: "#F9FAFB", color: "#111827" }}
                  placeholder="correo@agencia.com"
                  onFocus={(e) => { e.target.style.borderColor = "#E8610A"; e.target.style.background = "#fff"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#E5E7EB"; e.target.style.background = "#F9FAFB"; }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl px-4 py-3 text-sm border transition-all"
                  style={{ borderColor: "#E5E7EB", background: "#F9FAFB", color: "#111827" }}
                  placeholder="••••••••"
                  onFocus={(e) => { e.target.style.borderColor = "#E8610A"; e.target.style.background = "#fff"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#E5E7EB"; e.target.style.background = "#F9FAFB"; }}
                />
              </div>

              {error && (
                <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "#FEF2F2", color: "#DC2626" }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-all mt-2"
                style={{ background: loading ? "#f59340" : "#E8610A" }}
              >
                {loading ? "Iniciando sesión..." : "Iniciar sesión →"}
              </button>
            </form>
          </div>

          <p className="text-center text-xs mt-6" style={{ color: "#9CA3AF" }}>
            Acceso solo para miembros del equipo
          </p>
        </div>
      </div>
    </div>
  );
}
