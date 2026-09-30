import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { isWabPremiumUser } from "@/lib/wab-supabase";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { readWabDB, writeWabDB, WabStory } from "@/lib/wab-db";
import { getWabBackground } from "@/lib/wab-backgrounds";

export async function GET() {
  const user = await getCurrentUserFromCookie();
  const supabase = getSupabaseAdmin();
  if (supabase) {
    if (!user) return NextResponse.json({ stories: [] });
    const { data: connections } = await supabase.from("wab_connections").select("profile_id").eq("follower_user_id", user.id).limit(500);
    const profileIds = (connections ?? []).map((item) => item.profile_id);
    const { data: followedProfiles } = profileIds.length ? await supabase.from("wab_profiles").select("id,user_id,avatar_url").in("id", profileIds) : { data: [] };
    const premium = await isWabPremiumUser(user.id);
    const userIds = [user.id, ...(followedProfiles ?? []).map((item) => item.user_id)];
    let storyQuery = supabase
      .from("wab_stories")
      .select("id,user_id,author,media_url,mime_type,caption,views,likes,created_at,expires_at,visibility,story_type,text_content,background")
      .eq("moderation_status", "published")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });
    if (!premium) storyQuery = storyQuery.in("user_id", userIds);
    const { data, error } = await storyQuery;
    if (error) return NextResponse.json({ error: "Stories indisponibles." }, { status: 503 });
    const avatars = new Map((followedProfiles ?? []).map((item) => [item.user_id, item.avatar_url]));
    avatars.set(user.id, (user as { avatar?: string }).avatar ?? "");
    return NextResponse.json({
      stories: (data ?? []).map((story) => ({
        id: story.id,
        author: story.author,
        authorUserId: story.user_id,
        avatarUrl: avatars.get(story.user_id) || undefined,
        mediaUrl: story.media_url || "",
        mimeType: story.mime_type || (story.story_type === "text" ? "text/plain" : "image/jpeg"),
        caption: story.caption,
        views: story.views || 0,
        likes: story.likes || 0,
        storyType: story.story_type || (story.media_url ? "media" : "text"),
        textContent: story.text_content || "",
        background: story.background || "noir",
      })),
    });
  }
  const db = readWabDB();
  const premium = user ? await isWabPremiumUser(user.id) : false;
  const followedProfileIds = user ? db.connections.filter((item) => item.followerUserId === user.id).map((item) => item.profileId) : [];
  const followedUserIds = user ? [user.id, ...db.profiles.filter((profile) => followedProfileIds.includes(profile.id)).map((profile) => profile.userId)] : [];
  const stories = db.stories
    .filter((story) => story.moderationStatus === "published" && Date.parse(story.expiresAt) > Date.now() && (!user || premium || followedUserIds.includes(story.authorUserId ?? "")))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return NextResponse.json({
    stories: stories.map((s) => ({
      id: s.id,
      author: s.author,
      authorUserId: s.authorUserId,
      avatarUrl: s.avatarUrl,
      mediaUrl: s.mediaUrl || "",
      mimeType: s.mimeType || (s.storyType === "text" ? "text/plain" : "image/jpeg"),
      caption: s.caption,
      views: s.views || 0,
      likes: s.likes || 0,
      storyType: s.storyType || (s.mediaUrl ? "media" : "text"),
      textContent: s.textContent || "",
      background: s.background || "noir",
    })),
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise pour publier une Story." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as {
    storyType?: string;
    mediaUrl?: string;
    mimeType?: string;
    caption?: string;
    durationSeconds?: number;
    textContent?: string;
    background?: string;
  } | null;

  const isTextStory = body?.storyType === "text";
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  const supabase = getSupabaseAdmin();

  // 1. STATUT TEXTE AVEC FOND DE COULEUR
  if (isTextStory) {
    const rawText = typeof body?.textContent === "string" ? body.textContent.trim() : "";
    if (!rawText) {
      return NextResponse.json({ error: "Le texte du statut ne peut pas être vide." }, { status: 400 });
    }
    if (rawText.length > 500) {
      return NextResponse.json({ error: "Le statut texte est limité à 500 caractères." }, { status: 400 });
    }
    const bgPreset = getWabBackground(body?.background);
    const bgKey = bgPreset ? bgPreset.id : "noir";

    if (supabase) {
      const premium = await isWabPremiumUser(user.id);
      const { data, error } = await supabase
        .from("wab_stories")
        .insert({
          user_id: user.id,
          author: `${user.prenom} ${user.nom}`,
          media_url: null,
          mime_type: "text/plain",
          caption: rawText.slice(0, 100),
          story_type: "text",
          text_content: rawText,
          background: bgKey,
          created_at: now.toISOString(),
          expires_at: expiresAt,
          moderation_status: "published",
          visibility: premium ? "public" : "community",
        })
        .select("id,user_id,author,media_url,mime_type,caption,views,likes,story_type,text_content,background")
        .single();

      if (!error && data) {
        return NextResponse.json(
          {
            story: {
              id: data.id,
              author: data.author,
              authorUserId: data.user_id,
              mediaUrl: "",
              mimeType: "text/plain",
              caption: data.caption,
              views: data.views || 0,
              likes: data.likes || 0,
              storyType: "text",
              textContent: data.text_content,
              background: data.background,
            },
          },
          { status: 201 }
        );
      }
    }

    const story: WabStory = {
      id: crypto.randomUUID(),
      author: `${user.prenom} ${user.nom}`,
      authorUserId: user.id,
      mediaUrl: "",
      mimeType: "text/plain",
      caption: rawText.slice(0, 100),
      storyType: "text",
      textContent: rawText,
      background: bgKey,
      createdAt: now.toISOString(),
      expiresAt,
      views: 0,
      likes: 0,
      moderationStatus: "published",
    };
    const db = readWabDB();
    db.stories.unshift(story);
    writeWabDB(db);
    return NextResponse.json({ story }, { status: 201 });
  }

  // 2. STORY MÉDIA (PHOTO OU VIDÉO 30S)
  if (typeof body?.mediaUrl !== "string" || !/^(https?:\/\/|\/)/.test(body.mediaUrl)) {
    return NextResponse.json({ error: "Le média n’est pas disponible. Veuillez réessayer le téléversement." }, { status: 400 });
  }
  const mimeType = typeof body.mimeType === "string" ? body.mimeType : "image/jpeg";

  if (supabase) {
    const premium = await isWabPremiumUser(user.id);
    const { data, error } = await supabase
      .from("wab_stories")
      .insert({
        user_id: user.id,
        author: `${user.prenom} ${user.nom}`,
        media_url: body.mediaUrl,
        mime_type: mimeType,
        caption: typeof body.caption === "string" ? body.caption.slice(0, 300) : "",
        story_type: "media",
        created_at: now.toISOString(),
        expires_at: expiresAt,
        moderation_status: "published",
        visibility: premium ? "public" : "community",
      })
      .select("id,user_id,author,media_url,mime_type,caption,views,likes,story_type,text_content,background")
      .single();

    if (!error && data) {
      return NextResponse.json(
        {
          story: {
            id: data.id,
            author: data.author,
            authorUserId: data.user_id,
            mediaUrl: data.media_url,
            mimeType: data.mime_type,
            caption: data.caption,
            views: data.views,
            likes: data.likes,
            storyType: "media",
            textContent: "",
            background: "",
          },
        },
        { status: 201 }
      );
    }
  }

  const story: WabStory = {
    id: crypto.randomUUID(),
    author: `${user.prenom} ${user.nom}`,
    authorUserId: user.id,
    mediaUrl: body.mediaUrl,
    mimeType,
    caption: typeof body.caption === "string" ? body.caption.slice(0, 300) : "",
    storyType: "media",
    textContent: "",
    background: "",
    createdAt: now.toISOString(),
    expiresAt,
    views: 0,
    likes: 0,
    moderationStatus: "published",
  };
  const db = readWabDB();
  db.stories.unshift(story);
  writeWabDB(db);
  return NextResponse.json({ story }, { status: 201 });
}
