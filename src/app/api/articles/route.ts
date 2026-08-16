import { NextResponse } from "next/server";
import { listPublishedArticles } from "@/lib/core-db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const featuredOnly = searchParams.get("featured");
    let articles = await listPublishedArticles();
    if (category) articles = articles.filter((article) => article.category === category);
    if (featuredOnly) articles = articles.filter((article) => article.isFeatured);
    const sanitized = articles.map((article) => ({
      ...article,
      content: undefined,
      preview: article.content.split(" ").slice(0, 12 * 14).join(" "),
    }));
    return NextResponse.json({ articles: sanitized });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Contenus temporairement indisponibles" }, { status: 503 });
  }
}
