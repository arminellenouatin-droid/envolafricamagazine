import { NextRequest, NextResponse } from "next/server";
import { readDB } from "@/lib/db";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

function getPreview(content: string, lines=12) {
  const words = content.split(/\s+/);
  const preview = words.slice(0, lines*14).join(' ');
  const blur = words.slice(lines*14, (lines+3)*14).join(' ');
  const rest = words.slice((lines+3)*14).join(' ');
  return { preview, blur, rest, hasMore: rest.length>0 };
}

export async function GET(req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const db = readDB();
  const article = db.articles.find(a=>a.slug===slug);
  if (!article) return NextResponse.json({ error: "Article non trouvé" }, { status: 404 });

  article.views += 1;
  try { 
    const { writeDB } = await import("@/lib/db");
    writeDB(db);
  } catch {}

  let isSubscriber = false;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        const user = db.users.find(u=>u.id===decoded.id);
        if (user?.subscription && user.subscription.status==="active") {
          const end = new Date(user.subscription.endDate);
          if (end > new Date()) isSubscriber = true;
        }
        if (user?.role==="admin" || user?.role==="gerant" || user?.role==="redacteur_chef") isSubscriber = true;
      }
    }
  } catch {}

  const { preview, blur, hasMore } = getPreview(article.content, 12);

  if (isSubscriber) {
    return NextResponse.json({ article, isSubscriber: true, fullContent: article.content });
  } else {
    return NextResponse.json({ 
      article: { ...article, content: preview + " " + blur },
      isSubscriber: false,
      preview,
      blur,
      hasMore,
      message: "Abonnez-vous pour lire la suite"
    });
  }
}
