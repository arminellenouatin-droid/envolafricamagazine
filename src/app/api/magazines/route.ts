import { NextRequest, NextResponse } from "next/server";
import { readDB } from "@/lib/db";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const db = readDB();
  if (id) {
    const magazine = db.magazines.find(m=>m.id===id);
    if (!magazine) return NextResponse.json({ error:"Not found" }, { status:404 });
    return NextResponse.json({ magazine });
  }
  return NextResponse.json({ magazines: db.magazines.sort((a,b)=>b.numero-a.numero) });
}
