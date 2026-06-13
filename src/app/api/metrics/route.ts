import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAgencySession, agencyWhere, unauthorizedResponse } from "@/lib/agency";

export async function GET(req: Request) {
  const s = await getAgencySession();
  if (!s) return unauthorizedResponse();
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // YYYY-MM

  let dateFrom: Date | undefined;
  let dateTo: Date | undefined;
  if (month) {
    const [y, m] = month.split("-").map(Number);
    dateFrom = new Date(y, m - 1, 1);
    dateTo = new Date(y, m, 0, 23, 59, 59);
  }

  const users = await prisma.user.findMany({
    where: { ...agencyWhere(s), active: true, role: { in: ["VENTAS", "ADMIN"] } },
    include: { commissionRate: true },
    orderBy: { name: "asc" },
  });

  const scorecard = await Promise.all(
    users.map(async (user) => {
      const dateFilter = dateFrom && dateTo ? { createdAt: { gte: dateFrom, lte: dateTo } } : {};
      const [leads, opps, invoices] = await Promise.all([
        prisma.contact.count({ where: { ...agencyWhere(s), agentId: user.id, ...dateFilter } }),
        prisma.opportunity.findMany({
          where: { ...agencyWhere(s), agentId: user.id, ...dateFilter },
          include: { stage: { select: { name: true } } },
        }),
        prisma.invoice.findMany({
          where: { ...agencyWhere(s), agentId: user.id, status: { in: ["PAGADO", "PARCIAL"] }, ...dateFilter },
          select: { total: true, currency: true },
        }),
      ]);

      const revenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
      const rate = user.commissionRate?.rate ?? 5;
      const closed = opps.filter((o) => o.stage.name.toLowerCase().includes("confirm") || o.stage.name.toLowerCase().includes("reserv")).length;

      return {
        user: { id: user.id, name: user.name, role: user.role },
        leads,
        opportunities: opps.length,
        closed,
        conversionRate: opps.length > 0 ? Math.round((closed / opps.length) * 100) : 0,
        revenue,
        commission: (revenue * rate) / 100,
        commissionRate: rate,
      };
    })
  );

  // Marketing metrics
  const [totalLeads, campaigns] = await Promise.all([
    prisma.contact.count({ where: agencyWhere(s) }),
    prisma.campaign.findMany({
      where: agencyWhere(s),
      select: { leads: true, spent: true, revenue: true, name: true, platform: true },
    }),
  ]);

  const totalCampaignLeads = campaigns.reduce((s, c) => s + c.leads, 0);
  const totalSpent = campaigns.reduce((s, c) => s + c.spent, 0);
  const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0);

  return NextResponse.json({
    scorecard,
    marketing: {
      totalLeads,
      campaignLeads: totalCampaignLeads,
      cpl: totalCampaignLeads > 0 ? totalSpent / totalCampaignLeads : 0,
      roi: totalSpent > 0 ? ((totalRevenue - totalSpent) / totalSpent) * 100 : 0,
      totalSpent,
      campaigns,
    },
  });
}
