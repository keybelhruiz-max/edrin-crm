import { PrismaClient } from "../node_modules/@prisma/client/index.js";
import { PrismaPg } from "../node_modules/@prisma/adapter-pg/dist/index.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const p = new PrismaClient({ adapter });

const AGENCY_ID = "agency_default";
const agency = { connect: { id: AGENCY_ID } };

// Limpiar registros huérfanos de intentos anteriores (facturas por número)
await p.invoice.deleteMany({ where: { number: { in: ["EDR-2026-0101", "EDR-2026-0102"] } } });
const existingC1 = await p.contact.findFirst({ where: { email: "maria.gonzalez@gmail.com", agencyId: AGENCY_ID } });
const existingC2 = await p.contact.findFirst({ where: { email: "carlos.ramirez@empresa.com", agencyId: AGENCY_ID } });
if (existingC1) {
  const opps = await p.opportunity.findMany({ where: { contactId: existingC1.id } });
  for (const opp of opps) {
    await p.invoice.deleteMany({ where: { opportunityId: opp.id } });
  }
  await p.opportunity.deleteMany({ where: { contactId: existingC1.id } });
  await p.contact.delete({ where: { id: existingC1.id } });
  console.log("🧹 Limpiado lead nacional huérfano");
}
if (existingC2) {
  const opps = await p.opportunity.findMany({ where: { contactId: existingC2.id } });
  for (const opp of opps) {
    await p.invoice.deleteMany({ where: { opportunityId: opp.id } });
  }
  await p.opportunity.deleteMany({ where: { contactId: existingC2.id } });
  await p.contact.delete({ where: { id: existingC2.id } });
  console.log("🧹 Limpiado lead internacional huérfano");
}

const admin = await p.user.findFirst({ where: { agencyId: AGENCY_ID } });
const stages = await p.pipelineStage.findMany({ where: { agencyId: AGENCY_ID }, orderBy: { order: "asc" } });
const closedStage = stages.find(s => s.name.toLowerCase().includes("reserva")) ?? stages[2] ?? stages[0];

console.log("Agente:", admin?.name, "| Etapa:", closedStage?.name);

// ══════════════════════════════════════════════════════════════════
// LEAD 1: NACIONAL — María González — Punta Cana
// ══════════════════════════════════════════════════════════════════
console.log("\n📍 Creando lead NACIONAL...");

const c1 = await p.contact.create({
  data: {
    agencyId: AGENCY_ID,
    name: "María González Pérez",
    phone: "+1-809-555-0142",
    email: "maria.gonzalez@gmail.com",
    channel: "WHATSAPP",
    socialHandle: "@mariagonzalez",
    tags: JSON.stringify(["nacional", "familia", "punta-cana"]),
    notes: "Familia de 4 personas. All-inclusive Punta Cana. Viaje de verano.",
    agentId: admin?.id ?? null,
  },
});

const opp1 = await p.opportunity.create({
  data: {
    agencyId: AGENCY_ID,
    contactId: c1.id,
    stageId: closedStage.id,
    agentId: admin?.id ?? null,
    destination: "Punta Cana, República Dominicana",
    mayorista: "Karibo Turismo",
    travelStart: new Date("2026-07-20"),
    travelEnd: new Date("2026-07-24"),
    checkIn: new Date("2026-07-20"),
    checkOut: new Date("2026-07-24"),
    estimatedValue: 85000,
    currency: "DOP",
    isInternational: false,
    notes: "4 noches, Junior Suite All-Inclusive, Hard Rock Punta Cana. 2 adultos + 2 menores.",
  },
});

// Factura CLIENTE — relaciones con connect
const inv1 = await p.invoice.create({
  data: {
    agency,
    opportunity: { connect: { id: opp1.id } },
    agent: admin?.id ? { connect: { id: admin.id } } : undefined,
    number: "EDR-2026-0101",
    type: "PROFORMA",
    clientName: "María González Pérez",
    clientEmail: "maria.gonzalez@gmail.com",
    clientPhone: "+1-809-555-0142",
    currency: "DOP",
    exchangeRate: 1,
    subtotal: 80000,
    itbis: 5000,
    total: 85000,
    status: "PAGADO",
    paidAt: new Date("2026-06-20"),
    notes: "Paquete Punta Cana All-Inclusive — 4 noches · 2 adultos + 2 menores",
    items: {
      create: [
        { description: "Junior Suite All-Inclusive — 4 noches (Hard Rock PUJ)", quantity: 1, unitPrice: 68000, total: 68000 },
        { description: "Traslado aeropuerto ida y vuelta — 4 personas", quantity: 4, unitPrice: 1800, total: 7200 },
        { description: "Seguro de viaje familiar", quantity: 1, unitPrice: 4800, total: 4800 },
      ],
    },
  },
});

// Factura PROVEEDOR
const sup1 = await p.supplierOrder.create({
  data: {
    agency,
    invoice: { connect: { id: inv1.id } },
    mayorista: "Karibo Turismo",
    description: "Junior Suite All-Inclusive Hard Rock PUJ — 4 noches\nCheck-in: 20 Jul 2026 | Check-out: 24 Jul 2026\nReserva: KT-2026-44819 | 2 adultos + 2 menores",
    amount: 62000,
    currency: "DOP",
    status: "PAGADO",
    notes: "Costo neto agencia. Margen: DOP $23,000",
  },
});

// Log de pago
await p.paymentLog.create({
  data: {
    agencyId: AGENCY_ID,
    entityType: "Invoice",
    entityId: inv1.id,
    action: "PAGO_RECIBIDO",
    fromValue: "PENDIENTE",
    toValue: "PAGADO",
    userId: admin?.id ?? null,
    notes: "Pago completo DOP $85,000 — Transferencia Banreservas · Ref: TRF-2026-88412",
  },
});

// Meta de ventas
if (admin?.id) {
  await p.salesGoal.upsert({
    where: { agencyId_month_userId: { agencyId: AGENCY_ID, month: "2026-07", userId: admin.id } },
    update: {},
    create: { agencyId: AGENCY_ID, month: "2026-07", userId: admin.id, target: 500000, currency: "DOP" },
  });
}

// Comisión de ventas
await p.expense.create({
  data: {
    agencyId: AGENCY_ID,
    category: "COMISIONES",
    description: "Comisión — María González Pérez — Factura EDR-2026-0101",
    amount: 8500,
    currency: "DOP",
    paymentMethod: "TRANSFERENCIA",
    date: new Date("2026-07-25"),
    userId: admin?.id ?? null,
    notes: "10% sobre venta neta DOP $85,000 · Agente: " + (admin?.name ?? "Admin"),
  },
});

console.log("✅ NACIONAL creado:", c1.name);
console.log("   📋 Factura cliente:", inv1.number, "— DOP $85,000 PAGADO");
console.log("   🏨 Proveedor: Karibo Turismo — DOP $62,000 | Margen: $23,000");
console.log("   💰 Comisión: DOP $8,500 (10%)");

// ══════════════════════════════════════════════════════════════════
// LEAD 2: INTERNACIONAL — Carlos Ramírez — Luna de Miel Europa
// ══════════════════════════════════════════════════════════════════
console.log("\n🌍 Creando lead INTERNACIONAL...");

const c2 = await p.contact.create({
  data: {
    agencyId: AGENCY_ID,
    name: "Carlos Ramírez Herrera",
    phone: "+1-809-555-0287",
    email: "carlos.ramirez@empresa.com",
    channel: "INSTAGRAM",
    socialHandle: "@carlosramirezrd",
    tags: JSON.stringify(["internacional", "luna-de-miel", "europa", "VIP", "premium"]),
    notes: "Pareja recién casada. Luna de miel París + Roma 12 días. Cliente VIP premium.",
    agentId: admin?.id ?? null,
  },
});

const opp2 = await p.opportunity.create({
  data: {
    agencyId: AGENCY_ID,
    contactId: c2.id,
    stageId: closedStage.id,
    agentId: admin?.id ?? null,
    destination: "París, Francia → Roma, Italia",
    mayorista: "Hotelbeds Group",
    travelStart: new Date("2026-09-10"),
    travelEnd: new Date("2026-09-22"),
    checkIn: new Date("2026-09-10"),
    checkOut: new Date("2026-09-22"),
    estimatedValue: 4800,
    currency: "USD",
    isInternational: true,
    intlChecklist: JSON.stringify({ pasaporte: true, visa: true, seguro: true, vuelos: true, hoteles: true }),
    notes: "12 días: 6 noches París 5★ + 6 noches Roma 5★. Tours privados en español, transfers de lujo.",
  },
});

// Factura CLIENTE — Internacional
const inv2 = await p.invoice.create({
  data: {
    agency,
    opportunity: { connect: { id: opp2.id } },
    agent: admin?.id ? { connect: { id: admin.id } } : undefined,
    number: "EDR-2026-0102",
    type: "PROFORMA",
    clientName: "Carlos Ramírez Herrera",
    clientEmail: "carlos.ramirez@empresa.com",
    clientPhone: "+1-809-555-0287",
    currency: "USD",
    exchangeRate: 62,
    subtotal: 4800,
    itbis: 0,
    total: 4800,
    status: "PAGADO",
    paidAt: new Date("2026-07-15"),
    notes: "Luna de Miel Premium — París & Roma 12 días · 2 personas",
    items: {
      create: [
        { description: "Hotel Le Marais París — Superior Double 6 noches B&B", quantity: 1, unitPrice: 1680, total: 1680 },
        { description: "Hotel Colosseum Roma — Deluxe Room 6 noches B&B", quantity: 1, unitPrice: 1320, total: 1320 },
        { description: "Vuelos SDQ → CDG → FCO → SDQ (2 pasajeros)", quantity: 2, unitPrice: 650, total: 1300 },
        { description: "Tour privado Louvre + Torre Eiffel (guía español)", quantity: 1, unitPrice: 220, total: 220 },
        { description: "Tour privado Vaticano + Coliseo (guía español)", quantity: 1, unitPrice: 180, total: 180 },
        { description: "Transfers VIP aeropuerto París y Roma", quantity: 4, unitPrice: 25, total: 100 },
      ],
    },
  },
});

// Proveedor Internacional
const sup2 = await p.supplierOrder.create({
  data: {
    agency,
    invoice: { connect: { id: inv2.id } },
    mayorista: "Hotelbeds Group",
    description: "PARIS: Le Marais Hotel — Conf. HB-PRS-77421\nCheck-in: 10 Sep | Check-out: 16 Sep 2026\n\nROMA: Hotel Colosseum — Conf. HB-ROM-33219\nCheck-in: 16 Sep | Check-out: 22 Sep 2026\n\nVUELOS: AA/Iberia Ref. EDRIN2026-EUR (2 pasajeros SDQ→CDG→FCO→SDQ)",
    amount: 3840,
    currency: "USD",
    status: "PAGADO",
    notes: "Costo neto USD $3,840. Margen agencia: USD $960 (20%)",
  },
});

// Pagos (2 cuotas)
await p.paymentLog.create({
  data: {
    agencyId: AGENCY_ID,
    entityType: "Invoice",
    entityId: inv2.id,
    action: "PAGO_RECIBIDO",
    fromValue: "PENDIENTE",
    toValue: "PARCIAL",
    userId: admin?.id ?? null,
    notes: "Depósito 50% — USD $2,400 · Visa ****4892 · Ref: VISA-TXN-001",
  },
});
await p.paymentLog.create({
  data: {
    agencyId: AGENCY_ID,
    entityType: "Invoice",
    entityId: inv2.id,
    action: "PAGO_RECIBIDO",
    fromValue: "PARCIAL",
    toValue: "PAGADO",
    userId: admin?.id ?? null,
    notes: "Balance 50% — USD $2,400 · Wire transfer USA · Ref: WIRE-2026-US-99214",
  },
});

// Comisión Internacional
await p.expense.create({
  data: {
    agencyId: AGENCY_ID,
    category: "COMISIONES",
    description: "Comisión — Carlos Ramírez Herrera — Factura EDR-2026-0102",
    amount: 480,
    currency: "USD",
    paymentMethod: "TRANSFERENCIA",
    date: new Date("2026-09-25"),
    userId: admin?.id ?? null,
    notes: "10% sobre venta neta USD $4,800 · Agente: " + (admin?.name ?? "Admin"),
  },
});

console.log("✅ INTERNACIONAL creado:", c2.name);
console.log("   📋 Factura cliente:", inv2.number, "— USD $4,800 PAGADO (2 cuotas)");
console.log("   ✈️  Proveedor: Hotelbeds — USD $3,840 | Margen: $960 (20%)");
console.log("   💰 Comisión: USD $480 (10%)");
console.log("\n🎉 Ambos leads creados con éxito en la base de datos.");

await p.$disconnect();
