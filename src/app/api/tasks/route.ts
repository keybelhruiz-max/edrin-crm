import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const assignedTo = searchParams.get("assignedTo");
  const contactId = searchParams.get("contactId");
  const opportunityId = searchParams.get("opportunityId");

  const tasks = await prisma.task.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(assignedTo ? { assignedTo } : {}),
      ...(contactId ? { contactId } : {}),
      ...(opportunityId ? { opportunityId } : {}),
    },
    include: {
      assignee: { select: { id: true, name: true } },
      creator: { select: { id: true, name: true } },
      contact: { select: { id: true, name: true } },
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  const session = await auth();
  const body = await req.json();
  const task = await prisma.task.create({
    data: {
      title: body.title,
      description: body.description ?? null,
      contactId: body.contactId ?? null,
      opportunityId: body.opportunityId ?? null,
      assignedTo: body.assignedTo || null,
      createdBy: (session?.user as { id?: string })?.id ?? null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      reminderAt: body.reminderAt ? new Date(body.reminderAt) : null,
      priority: body.priority ?? "NORMAL",
      status: "PENDIENTE",
    },
    include: {
      assignee: { select: { id: true, name: true } },
      creator: { select: { id: true, name: true } },
      contact: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json(task, { status: 201 });
}
