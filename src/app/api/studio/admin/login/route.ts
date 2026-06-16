import { NextResponse } from "next/server";
import { safeEqual, setStudioAdminSession } from "@/lib/studio-auth";

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    const expected = process.env.STUDIO_ADMIN_PASSWORD;
    if (!expected) {
      return NextResponse.json({ error: "STUDIO_ADMIN_PASSWORD no está configurado" }, { status: 500 });
    }
    if (typeof password !== "string" || !safeEqual(password, expected)) {
      return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
    }
    await setStudioAdminSession();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
