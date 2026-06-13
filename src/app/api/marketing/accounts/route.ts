import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const accounts = await prisma.socialAccount.findMany({ orderBy: { platform: "asc" } });
  return NextResponse.json(accounts);
}

export async function POST(req: Request) {
  const body = await req.json();
  const account = await prisma.socialAccount.upsert({
    where: { id: body.id || "new-id-that-wont-match" },
    update: { accountName: body.accountName, status: body.status, followers: body.followers },
    create: {
      platform: body.platform,
      accountName: body.accountName,
      accountId: body.accountId,
      status: body.status || "PENDING",
      avatarUrl: body.avatarUrl,
      followers: body.followers || 0,
    },
  });
  return NextResponse.json(account);
}
