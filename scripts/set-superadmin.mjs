import { PrismaClient } from "../node_modules/@prisma/client/index.js";
import { PrismaPg } from "../node_modules/@prisma/adapter-pg/dist/index.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const p = new PrismaClient({ adapter });

const r = await p.user.updateMany({
  where: { email: "admin@edrintravel.com" },
  data: { role: "SUPERADMIN" },
});
console.log("Updated:", r.count, "user(s) → SUPERADMIN");
await p.$disconnect();
