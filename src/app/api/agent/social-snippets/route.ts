import { NextRequest, NextResponse } from "next/server";
import { authenticateAgentRequest } from "@/lib/agent-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { readDB } from "@/lib/db";

export const dynamic = "force-dynamic";

function extractPunchline(content: string, title: string): string {
  // Trouver la phrase la plus marquante (entre 50 et 160 caractères se terminant par un point ou point d'exclamation)
  const sentences = content
    .replace(/<[^>]+>/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 40 && s.length <= 180 && !s.includes("http"));

  return sentences[0] || `L'Afrique avance à grands pas : découvrez les clés de « ${title} » dans Envol Africa Magazine.`;
}

function extractKeyTakeaways(content: string): string[] {
  const paragraphs = content
    .replace(/<[^>]+>/g, "\n")
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length >= 60);

  return paragraphs.slice(0, 3).map((p) => (p.length > 120 ? p.slice(0, 117) + "..." : p));
}

export async function GET(req: NextRequest) {
  const auth = await authenticateAgentRequest(req, "social:read");
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  const { searchParams } = new URL(req.url);
  const articleSlug = searchParams.get("slug");
  const articleId = searchParams.get("id");
  const limit = Math.min(10, Math.max(1, parseInt(searchParams.get("limit") || "3")));

  let targetArticles: any[] = [];
  const client = getSupabaseAdmin();

  if (client) {
    if (articleSlug) {
      const { data } = await client.from("articles").select("*").eq("slug", articleSlug).maybeSingle();
      if (data) targetArticles = [data];
    } else if (articleId) {
      const { data } = await client.from("articles").select("*").eq("id", articleId).maybeSingle();
      if (data) targetArticles = [data];
    } else {
      const { data } = await client
        .from("articles")
        .select("*")
        .eq("is_published", true)
        .order("views", { ascending: false })
        .limit(limit);
      targetArticles = data || [];
    }
  } else {
    const db = readDB();
    if (articleSlug) {
      const a = db.articles.find((item) => item.slug === articleSlug);
      if (a) targetArticles = [a];
    } else if (articleId) {
      const a = db.articles.find((item) => item.id === articleId);
      if (a) targetArticles = [a];
    } else {
      targetArticles = db.articles
        .filter((a) => a.isPublished)
        .sort((a, b) => b.views - a.views)
        .slice(0, limit);
    }
  }

  if (targetArticles.length === 0) {
    return NextResponse.json({ error: "Aucun article trouvé pour générer des contenus sociaux" }, { status: 404 });
  }

  const host = req.headers.get("host") || "envolafrica.site";
  const protocol = host.includes("localhost") ? "http" : "https";

  const snippets = targetArticles.map((article) => {
    const punchline = extractPunchline(article.content || "", article.title);
    const takeaways = extractKeyTakeaways(article.content || "");
    const articleUrl = `${protocol}://${host}/article/${article.slug}`;
    const hashtags = [
      "#EnvolAfrica",
      "#AfriqueEconomie",
      `#${(article.category || "Business").replace(/[^a-zA-Z0-9]/g, "")}`,
      "#OpportunitesAfrique",
      "#Entrepreneuriat",
    ].join(" ");

    return {
      articleId: article.id,
      title: article.title,
      category: article.category,
      punchline,
      takeaways,
      url: articleUrl,
      socialTemplates: {
        linkedin: `💡 ${article.title.toUpperCase()}\n\n« ${punchline} »\n\n📌 Ce qu'il faut retenir de cette analyse :\n${takeaways.map((t: string) => `• ${t}`).join("\n")}\n\n👉 Lisez l'analyse complète des experts sur Envol Africa Magazine :\n🔗 ${articleUrl}\n\n${hashtags}`,
        
        twitter_x: `🚀 ${article.title}\n\n« ${punchline.slice(0, 140)} »\n\nDécryptage complet sur @EnvolAfrica :\n👉 ${articleUrl}\n\n#Afrique #Economie #Business`,
        
        facebook_wab: `🌍 À LA UNE D'ENVOL AFRICA\n\n${article.title}\n\n${punchline}\n\nQue pensez-vous de cette évolution sur le continent ? Donnez votre avis en commentaire ou lisez notre dossier exclusif :\n👇\n${articleUrl}\n\n${hashtags}`,
        
        instagram_caption: `✨ DÉCRYPTAGE ÉCONOMIQUE | ${article.title}\n\n${punchline}\n\nSwipez pour découvrir les 3 points clés identifiés par la rédaction d'Envol Africa Magazine ➡️\n\n🔗 Lien complet dans la bio !\n\n${hashtags}`,
      },
    };
  });

  return NextResponse.json({
    success: true,
    count: snippets.length,
    data: snippets,
  });
}
