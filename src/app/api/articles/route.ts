import { NextResponse } from "next/server";
import { readDB } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const featuredOnly = searchParams.get("featured");
  const db = readDB();
  let articles = db.articles.filter(a=>a.isPublished);
  if (category) articles = articles.filter(a=>a.category===category);
  if (featuredOnly) articles = articles.filter(a=>a.isFeatured);
  articles = articles.sort((a,b)=> new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime());
  // return without full content for list? But keep preview
  const sanitized = articles.map(a=> ({
    ...a,
    content: undefined, // hide full for list, will be fetched via detail with auth check
    preview: a.content.split(' ').slice(0, 12*14).join(' '),
  }));
  return NextResponse.json({ articles: sanitized });
}
