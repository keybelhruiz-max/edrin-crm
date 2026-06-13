import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // YYYY-MM

  let dateFilter = {};
  if (month) {
    const [y, m] = month.split("-").map(Number);
    dateFilter = {
      OR: [
        { scheduledAt: { gte: new Date(y, m - 1, 1), lte: new Date(y, m, 0, 23, 59, 59) } },
        { publishedAt: { gte: new Date(y, m - 1, 1), lte: new Date(y, m, 0, 23, 59, 59) } },
        { createdAt: { gte: new Date(y, m - 1, 1), lte: new Date(y, m, 0, 23, 59, 59) } },
      ],
    };
  }

  const posts = await prisma.postDraft.findMany({
    where: dateFilter,
    include: { socialAccount: true },
    orderBy: { scheduledAt: "asc" },
  });
  return NextResponse.json(posts);
}

export async function POST(req: Request) {
  const body = await req.json();
  const post = await prisma.postDraft.create({
    data: {
      socialAccountId: body.socialAccountId || null,
      platform: body.platform,
      postType: body.postType || "POST",
      caption: body.caption,
      mediaUrls: JSON.stringify(body.mediaUrls || []),
      hashtags: body.hashtags,
      status: body.status || "DRAFT",
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      collaborators: JSON.stringify(body.collaborators || []),
      campaignId: body.campaignId || null,
    },
    include: { socialAccount: true },
  });
  return NextResponse.json(post);
}
