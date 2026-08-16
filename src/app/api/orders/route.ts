import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { listOrders, ProductionDatabaseNotConfiguredError } from "@/lib/core-db";
import { canViewOrders, hasRole } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromCookie();
    const userId = req.nextUrl.searchParams.get("userId");

    if (userId) {
      if (!currentUser || !canViewOrders(currentUser, userId)) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
      return NextResponse.json({ orders: await listOrders(userId) });
    }

    if (!currentUser || !hasRole(currentUser, "gerant")) return NextResponse.json({ error: "Accès refusé - gerant requis pour list all" }, { status: 403 });
    return NextResponse.json({ orders: await listOrders() });
  } catch (error) {
    console.error(error);
    if (error instanceof ProductionDatabaseNotConfiguredError) return NextResponse.json({ error: "Base de données temporairement indisponible" }, { status: 503 });
    return NextResponse.json({ error: "Commandes temporairement indisponibles" }, { status: 503 });
  }
}
