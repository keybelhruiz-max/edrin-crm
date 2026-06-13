import { PrismaClient } from "../node_modules/@prisma/client/index.js";
import { PrismaPg } from "../node_modules/@prisma/adapter-pg/dist/index.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const p = new PrismaClient({ adapter });

const user = await p.user.findUnique({
  where: { email: "admin@edrintravel.com" },
  select: { id: true, email: true, name: true, role: true, active: true, passwordHash: true, agencyId: true },
});

console.log("User:", JSON.stringify({
  ...user,
  passwordHash: user?.passwordHash ? `[HASH SET - ${user.passwordHash.length} chars]` : "NULL ❌",
}, null, 2));

await p.$disconnect();
