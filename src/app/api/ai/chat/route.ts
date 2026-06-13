import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id ?? "system";

  const { message, conversationId } = await req.json();
  if (!message) return NextResponse.json({ error: "No message" }, { status: 400 });

  // Gather live business context from the DB
  const [invoices, contacts, opps, campaigns, agents] = await Promise.all([
    prisma.invoice.findMany({ take: 200, orderBy: { createdAt: "desc" }, include: { agent: { select: { name: true } } } }),
    prisma.contact.findMany({ take: 500, orderBy: { createdAt: "desc" }, select: { id: true, name: true, channel: true, createdAt: true } }),
    prisma.opportunity.findMany({ take: 500, include: { stage: { select: { name: true } }, quotes: { where: { isSelected: true } } } }),
    prisma.campaign.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.user.findMany({ select: { id: true, name: true, role: true } }),
  ]);

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthlyInvoices = invoices.filter(i => i.createdAt.toISOString().startsWith(thisMonth));
  const monthlyTotal = monthlyInvoices.filter(i => ["PAGADO","PARCIAL"].includes(i.status)).reduce((s,i)=>s+i.total,0);
  const totalBilled = invoices.filter(i => ["PAGADO","PARCIAL"].includes(i.status)).reduce((s,i)=>s+i.total,0);

  const byStage: Record<string, number> = {};
  for (const o of opps) {
    const s = o.stage?.name ?? "Sin etapa";
    byStage[s] = (byStage[s] ?? 0) + 1;
  }

  const byChannel: Record<string, number> = {};
  for (const c of contacts) {
    byChannel[c.channel] = (byChannel[c.channel] ?? 0) + 1;
  }

  const context = `
CONTEXTO DEL NEGOCIO — Edrin Travel CRM (datos en tiempo real)
Fecha actual: ${now.toLocaleDateString("es-DO", { year: "numeric", month: "long", day: "numeric" })}

RESUMEN FINANCIERO:
- Total facturado (histórico): $${totalBilled.toFixed(2)} USD
- Facturado este mes (${thisMonth}): $${monthlyTotal.toFixed(2)} USD
- Total facturas: ${invoices.length} | Este mes: ${monthlyInvoices.length}
- Pendientes de pago: ${invoices.filter(i=>i.status==="PENDIENTE").length}

LEADS Y PIPELINE:
- Total contactos: ${contacts.length}
- Contactos este mes: ${contacts.filter(c=>c.createdAt.toISOString().startsWith(thisMonth)).length}
- Canales de adquisición: ${JSON.stringify(byChannel)}
- Oportunidades por etapa: ${JSON.stringify(byStage)}

MARKETING Y CAMPAÑAS:
- Campañas activas: ${campaigns.filter(c=>c.status==="ACTIVE").length}
- Total invertido en campañas: $${campaigns.reduce((s,c)=>s+c.spent,0).toFixed(2)}
- Leads generados por campañas: ${campaigns.reduce((s,c)=>s+c.leads,0)}
- ROI general campañas: ${(() => { const sp=campaigns.reduce((s,c)=>s+c.spent,0); const rv=campaigns.reduce((s,c)=>s+c.revenue,0); return sp>0?`${(((rv-sp)/sp)*100).toFixed(1)}%`:"N/A" })()}

EQUIPO:
- Agentes: ${agents.filter(a=>a.role==="VENTAS").map(a=>a.name).join(", ")||"Ninguno registrado"}
`.trim();

  // Load or create conversation
  let conv = conversationId
    ? await prisma.aiConversation.findUnique({ where: { id: conversationId } })
    : null;

  const history: { role: "user" | "assistant"; content: string }[] = conv
    ? JSON.parse(conv.messages as string)
    : [];

  history.push({ role: "user", content: message });

  // Call Claude
  const response = await anthropic.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 2048,
    system: `Eres Edrin AI, el analista de negocios inteligente de Edrin Travel, una agencia de viajes dominicana.
Tu misión es analizar los datos del negocio, detectar oportunidades, tendencias, y dar recomendaciones estratégicas.
Responde siempre en español. Sé conciso pero profundo. Usa emojis con moderación.
Cuando cites números, sé preciso y usa el contexto de datos que tienes.
Si no tienes suficiente información, dilo claramente y sugiere qué datos necesitarías.

${context}`,
    messages: history.map(m => ({ role: m.role, content: m.content })),
  });

  const assistantText = response.content.find(b => b.type === "text")?.text ?? "";
  history.push({ role: "assistant", content: assistantText });

  // Save conversation
  if (conv) {
    conv = await prisma.aiConversation.update({
      where: { id: conv.id },
      data: { messages: JSON.stringify(history) },
    });
  } else {
    conv = await prisma.aiConversation.create({
      data: {
        userId,
        title: message.slice(0, 60),
        messages: JSON.stringify(history),
      },
    });
  }

  return NextResponse.json({
    reply: assistantText,
    conversationId: conv.id,
    usage: response.usage,
  });
}

export async function GET(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  const convs = await prisma.aiConversation.findMany({
    where: userId ? { userId } : undefined,
    orderBy: { updatedAt: "desc" },
    take: 20,
    select: { id: true, title: true, updatedAt: true },
  });
  return NextResponse.json(convs);
}
