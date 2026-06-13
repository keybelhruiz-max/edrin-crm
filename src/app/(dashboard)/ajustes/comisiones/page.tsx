"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card, Btn, Input, Select } from "@/components/ui";

type User = { id: string; name: string; email: string; role: string; commissionRate?: { rate: number; type: string } | null };

export default function ComisionesConfigPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [rates, setRates] = useState<Record<string, { rate: number; type: string }>>({});
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "VENTAS" });
  const [addingUser, setAddingUser] = useState(false);

  useEffect(() => {
    fetch("/api/users").then((r) => r.json()).then((data: User[]) => {
      setUsers(data);
      const init: Record<string, { rate: number; type: string }> = {};
      data.forEach((u) => {
        init[u.id] = { rate: u.commissionRate?.rate ?? 5, type: u.commissionRate?.type ?? "AGENTE" };
      });
      setRates(init);
    });
  }, []);

  async function saveRate(userId: string) {
    setSaving((s) => ({ ...s, [userId]: true }));
    await fetch("/api/commissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...rates[userId] }),
    });
    setSaving((s) => ({ ...s, [userId]: false }));
  }

  async function createUser() {
    setAddingUser(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });
    const user: User = await res.json();
    setUsers((prev) => [...prev, user]);
    setRates((prev) => ({ ...prev, [user.id]: { rate: 5, type: "AGENTE" } }));
    setNewUser({ name: "", email: "", password: "", role: "VENTAS" });
    setAddingUser(false);
  }

  return (
    <div className="flex flex-col min-h-screen overflow-auto" style={{ background: "var(--bg)" }}>
      <PageHeader
        title="Configuración de comisiones"
        subtitle="Define el % de comisión por vendedor o revendedor"
      />

      <div className="p-6 max-w-3xl space-y-6">
        {/* Users with commission rates */}
        <div className="space-y-3">
          {users.map((user) => (
            <Card key={user.id}>
              <div className="flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                  style={{ background: "var(--brand)" }}
                >
                  {user.name?.[0] ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm" style={{ color: "var(--text)" }}>{user.name}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>{user.email} · {user.role}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32">
                    <Select
                      value={rates[user.id]?.type ?? "AGENTE"}
                      onChange={(e) => setRates((r) => ({ ...r, [user.id]: { ...r[user.id], type: e.target.value } }))}
                    >
                      <option value="AGENTE">Agente</option>
                      <option value="REVENDEDOR">Revendedor</option>
                    </Select>
                  </div>
                  <div className="w-28 relative">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={rates[user.id]?.rate ?? 5}
                      onChange={(e) =>
                        setRates((r) => ({ ...r, [user.id]: { ...r[user.id], rate: parseFloat(e.target.value) || 0 } }))
                      }
                      className="w-full border rounded-lg px-3 py-2 text-sm pr-7 outline-none"
                      style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs" style={{ color: "var(--text-muted)" }}>%</span>
                  </div>
                  <Btn
                    onClick={() => saveRate(user.id)}
                    disabled={saving[user.id]}
                    variant="primary"
                    className="whitespace-nowrap"
                  >
                    {saving[user.id] ? "..." : "Guardar"}
                  </Btn>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Add new user */}
        <Card className="border-dashed">
          <div className="text-sm font-semibold mb-4" style={{ color: "var(--text)" }}>Agregar nuevo usuario</div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nombre"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              placeholder="Nombre completo"
            />
            <Input
              label="Email"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              placeholder="correo@ejemplo.com"
            />
            <Input
              label="Contraseña"
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              placeholder="••••••••"
            />
            <Select
              label="Rol"
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            >
              <option value="VENTAS">Ventas</option>
              <option value="CONTENIDO">Contenido</option>
              <option value="CONTABLE">Contable</option>
              <option value="ADMIN">Admin</option>
            </Select>
          </div>
          <div className="mt-4">
            <Btn
              onClick={createUser}
              disabled={addingUser || !newUser.name || !newUser.email || !newUser.password}
              variant="primary"
            >
              {addingUser ? "Creando..." : "+ Crear usuario"}
            </Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}
