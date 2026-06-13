import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAgencySession, unauthorizedResponse } from "@/lib/agency";

export async function GET(req: Request) {
  const s = await getAgencySession();
  if (!s) return unauthorizedResponse();
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  const prefix = searchParams.get("prefix");

  if (key) {
    const cfg = await prisma.appConfig.findFirst({ where: { agencyId: s.agencyId || null, key } });
    return NextResponse.json(cfg);
  }
  if (prefix) {
    const all = await prisma.appConfig.findMany({
      where: { agencyId: s.agencyId || null, key: { startsWith: prefix } },
    });
    return NextResponse.json(all);
  }
  const all = await prisma.appConfig.findMany({ where: { agencyId: s.agencyId || null } });
  return NextResponse.json(all);
}

export async function POST(req: Request) {
  const s = await getAgencySession();
  if (!s) return unauthorizedResponse();
  const { key, value } = await req.json();
  const cfg = await prisma.appConfig.upsert({
    where: { agencyId_key: { agencyId: s.agencyId || "", key } },
    update: { value },
    create: { agencyId: s.agencyId || null, key, value },
  });
  return NextResponse.json(cfg);
}
