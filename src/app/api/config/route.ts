import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  if (key) {
    const cfg = await prisma.appConfig.findUnique({ where: { key } });
    return NextResponse.json(cfg);
  }
  const all = await prisma.appConfig.findMany();
  return NextResponse.json(all);
}

export async function POST(req: Request) {
  const { key, value } = await req.json();
  const cfg = await prisma.appConfig.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  return NextResponse.json(cfg);
}
