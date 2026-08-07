import { NextRequest, NextResponse } from "next/server";
import { readDB } from "@/lib/db";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ earnings: [] });
  const db = readDB();
  const earnings = db.affiliateEarnings.filter(e=>e.affiliateId===userId).sort((a,b)=> new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return NextResponse.json({ earnings });
}

export async function POST(req: NextRequest) {
  // track click
  try {
    const { code } = await req.json();
    // could log affiliate click, but for demo just return ok
    return NextResponse.json({ ok:true });
  } catch {
    return NextResponse.json({ ok:false });
  }
}
