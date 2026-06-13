import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAgencySession, agencyWhere, unauthorizedResponse } from "@/lib/agency";

export async function GET() {
  const s = await getAgencySession();
  if (!s) return unauthorizedResponse();
  const accounts = await prisma.socialAccount.findMany({
    where: agencyWhere(s),
    orderBy: { platform: "asc" },
  });
  return NextResponse.json(accounts);
}

export async function POST(req: Request) {
  const s = await getAgencySession();
  if (!s) return unauthorizedResponse();
  const body = await req.json();
  const account = await prisma.socialAccount.upsert({
    where: { id: body.id || "new-id-that-wont-match" },
    update: { accountName: body.accountName, status: body.status, followers: body.followers },
    create: {
      agencyId: s.agencyId || null,
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
