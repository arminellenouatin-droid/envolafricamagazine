import { NextRequest, NextResponse } from "next/server";
import { readDB } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.toLowerCase() || "";
  const category = searchParams.get("category");
  const db = readDB();
  if (!q && !category) return NextResponse.json({ articles: [], magazines: [] });

  let articles = db.articles.filter(a=>a.isPublished);
  if (q) {
    articles = articles.filter(a=> 
      a.title.toLowerCase().includes(q) || 
      a.summary.toLowerCase().includes(q) || 
      a.content.toLowerCase().includes(q) ||
      a.tags.some(t=>t.toLowerCase().includes(q))
    );
  }
  if (category) articles = articles.filter(a=>a.category===category);
  articles = articles.sort((a,b)=> b.views - a.views).slice(0,20);

  let magazines = db.magazines;
  if (q) {
    magazines = magazines.filter(m=> m.title.toLowerCase().includes(q) || m.description.toLowerCase().includes(q));
  }
  magazines = magazines.slice(0,10);

  return NextResponse.json({ articles, magazines, query: q });
}
