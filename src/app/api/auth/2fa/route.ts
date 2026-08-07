import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { readDB, writeDB } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Token invalide" }, { status: 401 });
    const db = readDB();
    const user = db.users.find(u=>u.id===decoded.id);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { action, code } = await req.json();
    if (action==="enable") {
      user.twoFactorEnabled = true;
      writeDB(db);
      return NextResponse.json({ success: true, secret: `EAM-${user.id.slice(0,8)}-SECRET` });
    }
    if (action==="verify") {
      // Mock verify - accept 123456
      if (code==="123456" || code==="000000") {
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: "Code invalide" }, { status: 400 });
    }
    return NextResponse.json({ error: "Action invalide" }, { status: 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
