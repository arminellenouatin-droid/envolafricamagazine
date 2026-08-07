import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { readDB, writeDB } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const articleId = searchParams.get("articleId");
  const db = readDB();
  let comments = db.comments;
  if (articleId) comments = comments.filter(c=>c.articleId===articleId);
  comments = comments.sort((a,b)=> new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return NextResponse.json({ comments });
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: "Token invalide" }, { status: 401 });
  const db = readDB();
  const user = db.users.find(u=>u.id===decoded.id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { articleId, content } = await req.json();
  if (!articleId || !content) return NextResponse.json({ error: "articleId et content requis" }, { status: 400 });

  const comment = {
    id: uuidv4(),
    articleId,
    userId: user.id,
    content,
    createdAt: new Date().toISOString(),
    likes: 0,
    isModerated: false,
  };
  db.comments.push(comment);
  writeDB(db);
  return NextResponse.json({ success: true, comment });
}

export async function PUT(req: NextRequest) {
  // Modération (gerant+)
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: "Token invalide" }, { status: 401 });
  const db = readDB();
  const user = db.users.find(u=>u.id===decoded.id);
  if (!user || !['gerant','admin'].includes(user.role)) return NextResponse.json({ error: "Rôle gerant/admin requis pour modération (MATRICE_PERMISSIONS §1.1)" }, { status: 403 });

  const { id, isModerated } = await req.json();
  const comment = db.comments.find(c=>c.id===id);
  if (!comment) return NextResponse.json({ error: "Commentaire introuvable" }, { status: 404 });
  comment.isModerated = isModerated;
  writeDB(db);
  return NextResponse.json({ success: true, comment });
}
