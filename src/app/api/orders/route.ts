import { NextRequest, NextResponse } from "next/server";
import { readDB } from "@/lib/db";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { canViewOrders } from "@/lib/rbac";

export async function GET(req: NextRequest){
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  let currentUser: any = null;
  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      const db = readDB();
      currentUser = db.users.find(u=>u.id===decoded.id) || null;
    }
  }
  const userId = req.nextUrl.searchParams.get("userId");
  const db = readDB();
  let orders = db.orders;

  if (userId) {
    // RBAC: user can only view own orders unless gerant+
    if (!currentUser || !canViewOrders(currentUser, userId)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    orders = orders.filter(o=>o.userId===userId);
  } else {
    // Sans userId, seul gerant+ peut voir toutes les commandes
    if (!currentUser || !canViewOrders(currentUser, currentUser.id) || currentUser.role==='user') {
      // en réalité canViewOrders check deja, mais on veut bloquer list all pour user simple
      const { hasRole } = await import("@/lib/rbac");
      if (!currentUser || !hasRole(currentUser, 'gerant')) {
        return NextResponse.json({ error: "Accès refusé - gerant requis pour list all" }, { status: 403 });
      }
    }
  }
  orders = orders.sort((a,b)=> new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return NextResponse.json({ orders });
}
