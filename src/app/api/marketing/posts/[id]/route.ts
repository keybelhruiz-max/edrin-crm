import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.caption !== undefined) data.caption = body.caption;
  if (body.platform !== undefined) data.platform = body.platform;
  if (body.postType !== undefined) data.postType = body.postType;
  if (body.status !== undefined) data.status = body.status;
  if (body.scheduledAt !== undefined) data.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
  if (body.hashtags !== undefined) data.hashtags = body.hashtags;
  if (body.mediaUrls !== undefined) data.mediaUrls = JSON.stringify(body.mediaUrls);
  if (body.collaborators !== undefined) data.collaborators = JSON.stringify(body.collaborators);
  if (body.reach !== undefined) data.reach = body.reach;
  if (body.impressions !== undefined) data.impressions = body.impressions;
  if (body.likes !== undefined) data.likes = body.likes;
  if (body.comments !== undefined) data.comments = body.comments;
  const post = await prisma.postDraft.update({ where: { id }, data });
  return NextResponse.json(post);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.postDraft.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
