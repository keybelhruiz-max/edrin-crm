import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const stages = [
    { id: "stage-1", name: "Nuevo contacto", order: 1, color: "#6B7280", isDefault: true },
    { id: "stage-2", name: "Cotización enviada", order: 2, color: "#3B82F6", isDefault: false },
    { id: "stage-3", name: "Negociación / dudas", order: 3, color: "#F59E0B", isDefault: false },
    { id: "stage-4", name: "Reserva confirmada", order: 4, color: "#10B981", isDefault: false },
    { id: "stage-5", name: "Viaje completado", order: 5, color: "#8B5CF6", isDefault: false },
    { id: "stage-6", name: "EdrinLover ❤️", order: 6, color: "#E8610A", isDefault: false },
  ];

  for (const stage of stages) {
    await prisma.pipelineStage.upsert({
      where: { id: stage.id },
      update: {},
      create: stage,
    });
  }

  const hash = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@edrintravel.com" },
    update: {},
    create: {
      email: "admin@edrintravel.com",
      name: "Keybelh (Admin)",
      passwordHash: hash,
      role: "ADMIN",
    },
  });

  await prisma.appConfig.upsert({
    where: { key: "exchange_rate_usd_dop" },
    update: {},
    create: { key: "exchange_rate_usd_dop", value: "62" },
  });

  console.log("✅ Seed completado");
  console.log("   Usuario: admin@edrintravel.com");
  console.log("   Contraseña: admin123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
