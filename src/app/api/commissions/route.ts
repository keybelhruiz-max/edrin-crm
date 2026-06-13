import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/commissions?userId=...&month=2026-06
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const month = searchParams.get("month"); // format: YYYY-MM

  // Build date range
  let dateFrom: Date | undefined;
  let dateTo: Date | undefined;
  if (month) {
    const [y, m] = month.split("-").map(Number);
    dateFrom = new Date(y, m - 1, 1);
    dateTo = new Date(y, m, 0, 23, 59, 59);
  }

  // Get all agents with their commission rates
  const users = await prisma.user.findMany({
    where: {
      role: { in: ["VENTAS", "ADMIN", "CONTENIDO"] },
      active: true,
      ...(userId ? { id: userId } : {}),
    },
    include: { commissionRate: true },
    orderBy: { name: "asc" },
  });

  // For each user, get their invoices in the period
  const result = await Promise.all(
    users.map(async (user) => {
      const invoices = await prisma.invoice.findMany({
        where: {
          agentId: user.id,
          status: { in: ["PAGADO", "PARCIAL"] },
          ...(dateFrom && dateTo
            ? { createdAt: { gte: dateFrom, lte: dateTo } }
            : {}),
        },
        select: { id: true, number: true, total: true, currency: true, status: true, createdAt: true },
      });

      const totalBilled = invoices.reduce((s, inv) => s + inv.total, 0);
      const rate = user.commissionRate?.rate ?? 5;
      const commission = (totalBilled * rate) / 100;

      return {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        commissionRate: user.commissionRate ?? { rate: 5, type: "AGENTE" },
        invoices,
        totalBilled,
        commission,
      };
    })
  );

  return NextResponse.json(result);
}

// POST /api/commissions — set rate for a user
export async function POST(req: Request) {
  const { userId, rate, type } = await req.json();
  const cr = await prisma.commissionRate.upsert({
    where: { userId },
    update: { rate, type },
    create: { userId, rate, type },
  });
  return NextResponse.json(cr);
}
