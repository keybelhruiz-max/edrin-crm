import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAgencySession, agencyWhere, unauthorizedResponse } from "@/lib/agency";

export async function POST(req: Request) {
  const s = await getAgencySession();
  if (!s) return unauthorizedResponse();
  const { orderedIds } = await req.json();
  // Verify all stages belong to this agency before updating
  await Promise.all(
    (orderedIds as string[]).map((id, idx) =>
      prisma.pipelineStage.updateMany({
        where: { id, ...agencyWhere(s) },
        data: { order: idx + 1 },
      })
    )
  );
  return NextResponse.json({ ok: true });
}
