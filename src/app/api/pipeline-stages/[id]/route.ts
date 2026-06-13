import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const stage = await prisma.pipelineStage.update({
    where: { id },
    data: { name: body.name, color: body.color },
  });
  return NextResponse.json(stage);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Move opportunities to the first stage before deleting
  const first = await prisma.pipelineStage.findFirst({
    where: { id: { not: id } },
    orderBy: { order: "asc" },
  });
  if (first) {
    await prisma.opportunity.updateMany({
      where: { stageId: id },
      data: { stageId: first.id },
    });
  }
  await prisma.pipelineStage.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
