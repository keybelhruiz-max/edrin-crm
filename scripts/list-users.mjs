import { PrismaClient } from "../node_modules/@prisma/client/index.js";
import { PrismaPg } from "../node_modules/@prisma/adapter-pg/dist/index.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const p = new PrismaClient({ adapter });

const users = await p.user.findMany({ select: { id: true, email: true, name: true, role: true } });
console.log("Users in DB:", JSON.stringify(users, null, 2));
await p.$disconnect();
