import { NextRequest, NextResponse } from "next/server";
import { authenticateAgentRequest } from "@/lib/agent-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { ensureWabPage, getWabProfileByUserId, upsertWabProfile } from "@/lib/wab-supabase";
import { linkifyHashtagsAndMentions } from "@/lib/rich-text";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await authenticateAgentRequest(req, "wab:publish");
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  try {
    const body = await req.json();
    const {
      content,
      media = [],
      sourceUrl,
      sourceTitle,
      visibility = "public",
    } = body;

    if (!content || typeof content !== "string" || content.trim().length < 5) {
      return NextResponse.json({ error: "Le contenu du post WAB est requis (minimum 5 caractères)." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({
        success: true,
        mock: true,
        message: "Publication WAB simulée avec succès (Supabase en attente de configuration).",
        content,
      });
    }

    const authorUserId = auth.agentId || "admin-system";
    let profile = (await getWabProfileByUserId(authorUserId)).profile;
    if (!profile) {
      const created = await upsertWabProfile(authorUserId, {
        headline: "Rédaction Envol Africa",
        about: "Compte officiel de la rédaction et des agents d’Envol Africa.",
        companyName: "Envol Africa Magazine",
        countryCode: "BJ",
      });
      profile = created.profile;
    }

    if (!profile) {
      return NextResponse.json({ error: "Impossible de créer le profil WAB de publication." }, { status: 500 });
    }

    const pageResult = await ensureWabPage(authorUserId, {
      name: "ENVOL AFRICA",
      slug: "envol-africa",
      logoUrl: "/envol-africa-page-logo.png",
      avatarUrl: "/envol-africa-page-logo.png",
      description: "La page officielle d’Envol Africa dans le réseau WAB.",
    });

    const enrichedContent = linkifyHashtagsAndMentions(content.trim());

    const { data: createdPost, error } = await supabase
      .from("wab_posts")
      .insert({
        author_id: profile.id,
        page_id: pageResult.page?.id ?? null,
        content: enrichedContent,
        content_type: media.length > 0 ? "media" : "text",
        media: Array.isArray(media) ? media : [],
        moderation_status: "published",
        is_boosted: false,
        visibility,
        source_type: "agent_publication",
        source_id: null,
        source_url: sourceUrl || null,
        source_title: sourceTitle || "Publication officielle Envol Africa",
      })
      .select("*")
      .single();

    if (error) {
      console.error("[agent/wab] Erreur insertion Supabase:", error);
      return NextResponse.json({ error: "Impossible de publier sur le fil WAB" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Publication diffusée sur le fil WAB officiel avec succès !",
      post: createdPost,
    }, { status: 201 });
  } catch (err: any) {
    console.error("[agent/wab] Erreur interne:", err);
    return NextResponse.json({ error: "Erreur interne lors de la publication sur WAB" }, { status: 500 });
  }
}
