import { NextRequest, NextResponse } from "next/server";
import { readDB } from "@/lib/db";

export async function GET(req: NextRequest){
  const userId = req.nextUrl.searchParams.get("userId");
  const db = readDB();
  let donations = db.donations;
  if (userId) donations = donations.filter(d=>d.userId===userId);
  donations = donations.sort((a,b)=> new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return NextResponse.json({ donations });
}
