import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Body: { orderedIds: string[] }
export async function POST(req: Request) {
  const { orderedIds } = await req.json();
  await Promise.all(
    (orderedIds as string[]).map((id, idx) =>
      prisma.pipelineStage.update({ where: { id }, data: { order: idx + 1 } })
    )
  );
  return NextResponse.json({ ok: true });
}
