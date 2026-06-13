import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "commercial";
  const month = searchParams.get("month") || new Date().toISOString().slice(0, 7);

  const [y, m] = month.split("-").map(Number);
  const from = new Date(y, m - 1, 1);
  const to = new Date(y, m, 0, 23, 59, 59);
  const prevFrom = new Date(y, m - 2, 1);
  const prevTo = new Date(y, m - 1, 0, 23, 59, 59);

  if (type === "commercial") {
    const [invoices, prevInvoices, byAgent, goal] = await Promise.all([
      prisma.invoice.findMany({
        where: { createdAt: { gte: from, lte: to } },
        include: { agent: { select: { id: true, name: true } } },
      }),
      prisma.invoice.findMany({ where: { createdAt: { gte: prevFrom, lte: prevTo } } }),
      prisma.invoice.groupBy({
        by: ["agentId"],
        where: { createdAt: { gte: from, lte: to }, status: { in: ["PAGADO", "PARCIAL"] } },
        _sum: { total: true },
        _count: { id: true },
      }),
      prisma.salesGoal.findFirst({ where: { month, userId: null } }),
    ]);

    const totalThisMonth = invoices.filter(i => ["PAGADO","PARCIAL"].includes(i.status)).reduce((s, i) => s + i.total, 0);
    const totalPrevMonth = prevInvoices.filter(i => ["PAGADO","PARCIAL"].includes(i.status)).reduce((s, i) => s + i.total, 0);

    // Leads this month
    const leadsThisMonth = await prisma.contact.count({ where: { createdAt: { gte: from, lte: to } } });
    const oppsWon = await prisma.opportunity.count({
      where: {
        updatedAt: { gte: from, lte: to },
        stage: { name: { contains: "confirmada" } },
      },
    });

    const agentIdsComm = byAgent.map(a => a.agentId).filter(Boolean) as string[];
    const agentUsersComm = await prisma.user.findMany({ where: { id: { in: agentIdsComm } }, select: { id: true, name: true } });
    const byAgentFormatted = byAgent.map(a => ({
      agentName: agentUsersComm.find(u => u.id === a.agentId)?.name ?? "Sin agente",
      total: a._sum.total ?? 0,
      count: a._count.id,
    }));

    return NextResponse.json({
      type: "commercial",
      month,
      totalThisMonth,
      totalPrevMonth,
      growth: totalPrevMonth > 0 ? ((totalThisMonth - totalPrevMonth) / totalPrevMonth) * 100 : 0,
      goal: goal?.target ?? 0,
      goalCurrency: goal?.currency ?? "USD",
      fulfillment: goal?.target ? (totalThisMonth / goal.target) * 100 : 0,
      leadsThisMonth,
      oppsWon,
      conversionRate: leadsThisMonth > 0 ? (oppsWon / leadsThisMonth) * 100 : 0,
      invoiceCount: invoices.length,
      byAgent: byAgentFormatted,
    });
  }

  if (type === "financial") {
    const [allInvoices, supplierOrders] = await Promise.all([
      prisma.invoice.findMany({ where: { createdAt: { gte: from, lte: to } } }),
      prisma.supplierOrder.findMany({ where: { createdAt: { gte: from, lte: to } } }),
    ]);
    const billed = allInvoices.reduce((s, i) => s + i.total, 0);
    const paid = allInvoices.filter(i => i.status === "PAGADO").reduce((s, i) => s + i.total, 0);
    const pending = allInvoices.filter(i => i.status === "PENDIENTE").reduce((s, i) => s + i.total, 0);
    const costs = supplierOrders.reduce((s, o) => s + o.amount, 0);
    const grossMargin = billed - costs;

    // Annual
    const yearFrom = new Date(y, 0, 1);
    const yearTo = new Date(y, 11, 31, 23, 59, 59);
    const annualInvoices = await prisma.invoice.findMany({ where: { createdAt: { gte: yearFrom, lte: yearTo } } });
    const annualBilled = annualInvoices.reduce((s, i) => s + i.total, 0);

    const byAgentFin = await prisma.invoice.groupBy({
      by: ["agentId"],
      where: { createdAt: { gte: from, lte: to } },
      _sum: { total: true },
      _count: { id: true },
    });
    const agentIds = byAgentFin.map(a => a.agentId).filter(Boolean) as string[];
    const agentUsers = await prisma.user.findMany({ where: { id: { in: agentIds } }, select: { id: true, name: true } });
    const byAgentFormatted = byAgentFin.map(a => ({
      agentName: agentUsers.find(u => u.id === a.agentId)?.name ?? "Sin agente",
      total: a._sum.total ?? 0,
      count: a._count.id,
    }));

    return NextResponse.json({
      type: "financial", month,
      totalBilled: billed, totalPaid: paid, totalPending: pending,
      totalOverdue: allInvoices.filter(i => i.status === "VENCIDO").reduce((s, i) => s + i.total, 0),
      costs, grossMargin, annualBilled,
      byAgent: byAgentFormatted,
    });
  }

  if (type === "leads") {
    const contacts = await prisma.contact.findMany({ where: { createdAt: { gte: from, lte: to } } });
    const leadsThisMonth = contacts.length;
    const oppsWon = await prisma.opportunity.count({
      where: { updatedAt: { gte: from, lte: to }, stage: { name: { contains: "confirmada" } } },
    });
    const byChannelMap: Record<string, number> = {};
    for (const c of contacts) { byChannelMap[c.channel] = (byChannelMap[c.channel] ?? 0) + 1; }
    const total = contacts.length || 1;
    const byChannel = Object.entries(byChannelMap)
      .sort((a, b) => b[1] - a[1])
      .map(([channel, count]) => ({ channel, count, percentage: (count / total) * 100 }));
    return NextResponse.json({
      type: "leads", month, leadsThisMonth, oppsWon,
      conversionRate: leadsThisMonth > 0 ? (oppsWon / leadsThisMonth) * 100 : 0,
      byChannel,
    });
  }

  if (type === "campaigns") {
    const campaigns = await prisma.campaign.findMany({ orderBy: { createdAt: "desc" } });
    const totalSpent = campaigns.reduce((s, c) => s + c.spent, 0);
    const totalLeads = campaigns.reduce((s, c) => s + c.leads, 0);
    const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0);
    const roiPercent = totalSpent > 0 ? ((totalRevenue - totalSpent) / totalSpent) * 100 : 0;
    const platformMap: Record<string, { leads: number; spent: number; revenue: number }> = {};
    for (const c of campaigns) {
      if (!platformMap[c.platform]) platformMap[c.platform] = { leads: 0, spent: 0, revenue: 0 };
      platformMap[c.platform].leads += c.leads;
      platformMap[c.platform].spent += c.spent;
      platformMap[c.platform].revenue += c.revenue;
    }
    const byPlatform = Object.entries(platformMap).map(([platform, d]) => ({ platform, ...d }));
    return NextResponse.json({ type: "campaigns", month, totalSpent, totalLeads, totalRevenue, roiPercent, byPlatform });
  }

  if (type === "marketing") {
    const campaigns = await prisma.campaign.findMany({ orderBy: { createdAt: "desc" } });
    const totalSpent = campaigns.reduce((s, c) => s + c.spent, 0);
    const totalLeads = campaigns.reduce((s, c) => s + c.leads, 0);
    const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0);
    const cpl = totalLeads > 0 ? totalSpent / totalLeads : 0;
    const roi = totalSpent > 0 ? ((totalRevenue - totalSpent) / totalSpent) * 100 : 0;
    const roas = totalSpent > 0 ? totalRevenue / totalSpent : 0;
    return NextResponse.json({ type: "marketing", campaigns, totalSpent, totalLeads, totalRevenue, cpl, roi, roas });
  }

  if (type === "by_destination") {
    const opps = await prisma.opportunity.findMany({
      include: { invoices: true, quotes: true },
      where: { destination: { not: null } },
    });
    const destMap: Record<string, { leads: number; invoiced: number; margin: number }> = {};
    for (const opp of opps) {
      const dest = opp.destination ?? "Sin destino";
      if (!destMap[dest]) destMap[dest] = { leads: 0, invoiced: 0, margin: 0 };
      destMap[dest].leads++;
      const inv = opp.invoices.reduce((s, i) => s + i.total, 0);
      const cost = opp.quotes.find(q => q.isSelected)?.costPrice ?? 0;
      destMap[dest].invoiced += inv;
      destMap[dest].margin += inv - cost;
    }
    return NextResponse.json({ type: "by_destination", destinations: Object.entries(destMap).map(([dest, d]) => ({ dest, ...d })) });
  }

  if (type === "by_mayorista") {
    const orders = await prisma.supplierOrder.findMany();
    const invItems = await prisma.invoice.findMany({ include: { items: true } });
    const map: Record<string, { sales: number; costs: number }> = {};
    for (const o of orders) {
      if (!map[o.mayorista]) map[o.mayorista] = { sales: 0, costs: 0 };
      map[o.mayorista].costs += o.amount;
    }
    return NextResponse.json({ type: "by_mayorista", data: Object.entries(map).map(([m, d]) => ({ mayorista: m, ...d, margin: d.sales - d.costs })) });
  }

  return NextResponse.json({ error: "Unknown report type" }, { status: 400 });
}
