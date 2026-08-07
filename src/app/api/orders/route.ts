import { NextRequest, NextResponse } from "next/server";
import { readDB } from "@/lib/db";

export async function GET(req: NextRequest){
  const userId = req.nextUrl.searchParams.get("userId");
  const db = readDB();
  let orders = db.orders;
  if (userId) orders = orders.filter(o=>o.userId===userId);
  orders = orders.sort((a,b)=> new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return NextResponse.json({ orders });
}
