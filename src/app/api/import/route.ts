import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAgencySession, agencyWhere, unauthorizedResponse } from "@/lib/agency";
import * as XLSX from "xlsx";

// ─── Column name normalization ─────────────────────────────────────────────────
const FIELD_MAP: Record<string, string> = {
  // Name
  nombre: "name", name: "name", cliente: "name", contacto: "name",
  "nombre completo": "name", "full name": "name", "nombre del cliente": "name",
  // Phone
  telefono: "phone", teléfono: "phone", phone: "phone", tel: "phone",
  movil: "phone", móvil: "phone", celular: "phone", whatsapp: "phone",
  "numero de telefono": "phone", "phone number": "phone",
  // Email
  email: "email", correo: "email", mail: "email", "correo electronico": "email",
  "correo electrónico": "email",
  // Channel / source
  canal: "channel", channel: "channel", origen: "channel", source: "channel",
  "canal de origen": "channel", "fuente": "channel",
  // Social handle
  handle: "socialHandle", "@": "socialHandle", usuario: "socialHandle",
  instagram: "socialHandle", tiktok: "socialHandle", "redes sociales": "socialHandle",
  "social handle": "socialHandle", "@usuario": "socialHandle",
  // Notes
  notas: "notes", notes: "notes", comentarios: "notes", comments: "notes",
  observaciones: "notes", descripcion: "notes", descripción: "notes",
  // Destination
  destino: "destination", destination: "destination", viaje: "destination",
  "destino de viaje": "destination", "lugar de viaje": "destination",
  // International
  internacional: "isInternational", international: "isInternational",
  "viaje internacional": "isInternational",
  // Estimated value
  valor: "estimatedValue", value: "estimatedValue", presupuesto: "estimatedValue",
  budget: "estimatedValue", monto: "estimatedValue", amount: "estimatedValue",
  "valor estimado": "estimatedValue", "estimated value": "estimatedValue",
  // Currency
  moneda: "currency", currency: "currency",
  // Mayorista
  mayorista: "mayorista", proveedor: "mayorista", supplier: "mayorista",
  hotel: "mayorista", operador: "mayorista",
  // Agent
  agente: "agentEmail", agent: "agentEmail", vendedor: "agentEmail",
  seller: "agentEmail", "asignado a": "agentEmail", "assigned to": "agentEmail",
};

const CHANNEL_MAP: Record<string, string> = {
  whatsapp: "WHATSAPP", instagram: "INSTAGRAM", ig: "INSTAGRAM",
  tiktok: "TIKTOK", messenger: "MESSENGER", facebook: "MESSENGER",
  directo: "DIRECTO", direct: "DIRECTO", referido: "DIRECTO",
  otro: "OTRO", other: "OTRO", email: "OTRO", correo: "OTRO",
};

function normalizeKey(k: string) {
  return k.toLowerCase().trim().replace(/[_\-\.]/g, " ").replace(/\s+/g, " ");
}

function mapRow(row: Record<string, string>, headers: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const h of headers) {
    const normalized = normalizeKey(h);
    const field = FIELD_MAP[normalized];
    if (field && row[h] !== undefined && row[h] !== "") {
      result[field] = String(row[h]).trim();
    }
  }
  return result;
}

function parseChannel(val: string): string {
  return CHANNEL_MAP[val.toLowerCase().trim()] ?? "OTRO";
}

function parseBool(val: string): boolean {
  return ["si", "sí", "yes", "true", "1", "x", "✓"].includes(val.toLowerCase().trim());
}

// ─── GET: preview / detect columns ────────────────────────────────────────────
export async function GET(req: Request) {
  const s = await getAgencySession();
  if (!s) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const dataUrl = searchParams.get("dataUrl");
  if (!dataUrl) return NextResponse.json({ error: "No dataUrl" }, { status: 400 });

  try {
    const base64 = dataUrl.split(",")[1];
    const buf = Buffer.from(base64, "base64");
    const wb = XLSX.read(buf, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" });

    const rawHeaders = rows.length > 0 ? Object.keys(rows[0]) : [];
    const detected: Record<string, string> = {};
    for (const h of rawHeaders) {
      const normalized = normalizeKey(h);
      if (FIELD_MAP[normalized]) detected[h] = FIELD_MAP[normalized];
    }

    return NextResponse.json({
      headers: rawHeaders,
      detected,
      preview: rows.slice(0, 5),
      totalRows: rows.length,
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}

// ─── POST: actual import ───────────────────────────────────────────────────────
export async function POST(req: Request) {
  const s = await getAgencySession();
  if (!s) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { dataUrl, mapping, options } = body as {
      dataUrl: string;
      mapping: Record<string, string>; // header → field
      options: {
        createOpportunity: boolean;
        skipDuplicates: boolean;
        defaultChannel: string;
      };
    };

    const base64 = dataUrl.split(",")[1];
    const buf = Buffer.from(base64, "base64");
    const wb = XLSX.read(buf, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" });

    const agents = await prisma.user.findMany({
      where: { agencyId: s.agencyId || undefined },
      select: { id: true, email: true, name: true },
    });
    const firstStage = await prisma.pipelineStage.findFirst({
      where: agencyWhere(s),
      orderBy: { order: "asc" },
    });

    let imported = 0;
    let skipped = 0;
    let errors = 0;
    const errorDetails: string[] = [];

    for (const rawRow of rows) {
      try {
        // Apply mapping: use user-configured mapping
        const row: Record<string, string> = {};
        for (const [header, field] of Object.entries(mapping)) {
          if (rawRow[header] !== undefined && String(rawRow[header]).trim() !== "") {
            row[field] = String(rawRow[header]).trim();
          }
        }

        const name = row.name;
        if (!name) { skipped++; continue; }

        // Duplicate check by phone or email
        if (options.skipDuplicates) {
          const where: Record<string, unknown>[] = [{ name }];
          if (row.phone) where.push({ phone: row.phone });
          if (row.email) where.push({ email: row.email });
          const existing = await prisma.contact.findFirst({
            where: { agencyId: s.agencyId || undefined, OR: where },
          });
          if (existing) { skipped++; continue; }
        }

        // Resolve agent
        let agentId: string | null = null;
        if (row.agentEmail) {
          const agent = agents.find(
            (a) => a.email === row.agentEmail || (a.name?.toLowerCase() === row.agentEmail.toLowerCase())
          );
          agentId = agent?.id ?? null;
        }

        const contact = await prisma.contact.create({
          data: {
            agencyId: s.agencyId || null,
            name,
            phone: row.phone || null,
            email: row.email || null,
            socialHandle: row.socialHandle || null,
            channel: (row.channel ? parseChannel(row.channel) : options.defaultChannel || "OTRO") as import("@prisma/client").Channel,
            notes: row.notes || null,
            tags: "[]",
            agentId,
          },
        });

        if (options.createOpportunity && firstStage && (row.destination || row.estimatedValue || row.mayorista)) {
          await prisma.opportunity.create({
            data: {
              agencyId: s.agencyId || null,
              contactId: contact.id,
              stageId: firstStage.id,
              destination: row.destination || null,
              mayorista: row.mayorista || null,
              estimatedValue: row.estimatedValue ? parseFloat(row.estimatedValue.replace(/[^0-9.]/g, "")) || null : null,
              currency: (row.currency?.toUpperCase() === "USD" ? "USD" : "DOP") as "USD" | "DOP",
              isInternational: row.isInternational ? parseBool(row.isInternational) : false,
              agentId,
            },
          });
        }

        imported++;
      } catch (rowErr: unknown) {
        errors++;
        const msg = rowErr instanceof Error ? rowErr.message : String(rowErr);
        if (errorDetails.length < 5) errorDetails.push(`Fila ${imported + skipped + errors}: ${msg}`);
      }
    }

    return NextResponse.json({ imported, skipped, errors, errorDetails, total: rows.length });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
