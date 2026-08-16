import { NextRequest, NextResponse } from "next/server";
import { findMagazineById, listMagazines } from "@/lib/core-db";

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (id) {
      const magazine = await findMagazineById(id);
      if (!magazine) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ magazine });
    }
    return NextResponse.json({ magazines: await listMagazines() });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Magazines temporairement indisponibles" }, { status: 503 });
  }
}
