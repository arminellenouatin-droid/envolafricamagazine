import { getSupabaseAdmin } from "@/lib/supabase-admin";

export type WabPostRow = {
  id: string;
  author_id: string;
  content: string;
  media: Array<{ path: string; mimeType: string; name: string }> | null;
  content_type: string;
  visibility: string;
  moderation_status: string;
  moderation_reason: string | null;
  is_boosted: boolean;
  boost_ends_at: string | null;
  views_count: number;
  eligible_views_count: number;
  watch_seconds: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  updated_at: string;
  wab_profiles?: {
    id: string;
    fullName?: string;
    user_id: string;
    headline: string | null;
    avatar_url: string | null;
    city: string | null;
    country_code: string | null;
  };
};

export type WabProfileRow = {
  id: string;
  user_id: string;
  headline: string | null;
  about: string | null;
  company_name: string | null;
  industry: string | null;
  country_code: string | null;
  city: string | null;
  avatar_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

// --- PROFILES ---
export async function getWabProfileByUserId(userId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const, profile: null };
  const { data, error } = await supabase
    .from("wab_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return { configured: true as const, profile: null, error };
  return { configured: true as const, profile: data as WabProfileRow | null };
}

export async function upsertWabProfile(userId: string, input: {
  headline?: string;
  about?: string;
  companyName?: string;
  industry?: string;
  countryCode?: string;
  city?: string;
  avatarUrl?: string;
}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const, profile: null };
  const { data, error } = await supabase
    .from("wab_profiles")
    .upsert({
      user_id: userId,
      headline: input.headline,
      about: input.about,
      company_name: input.companyName,
      industry: input.industry,
      country_code: input.countryCode?.slice(0, 2),
      city: input.city,
      avatar_url: input.avatarUrl,
      status: "active",
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" })
    .select()
    .single();
  if (error) return { configured: true as const, profile: null, error };
  return { configured: true as const, profile: data as WabProfileRow };
}

// --- POSTS ---
export async function listWabPosts(page: number, limit: number, filters: { country?: string; industry?: string } = {}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const, posts: null };

  const start = (page - 1) * limit;
  const end = start + limit - 1;

  // RÃ©cupÃ©rer les posts avec les profils associÃ©s
  let query = supabase
    .from("wab_posts")
    .select("*, wab_profiles:author_id(id, user_id, headline, avatar_url, city, country_code)")
    .eq("moderation_status", "published");

  // Tri par boost puis par date
  query = query.order("is_boosted", { ascending: false }).order("created_at", { ascending: false });
  query = query.range(start, end);

  const { data, error } = await query;
  if (error) return { configured: true as const, posts: null, error };

  // Filtrer cÃ´tÃ© serveur (ou via structure SQL si plus complexe)
  let filteredData = data as WabPostRow[];
  if (filters.country) {
    filteredData = filteredData.filter(post => 
      post.wab_profiles?.country_code?.toLowerCase() === filters.country?.toLowerCase()
    );
  }

  return { 
    configured: true as const, 
    posts: filteredData,
    pagination: { hasMore: data.length === limit }
  };
}

export async function createWabPostInSupabase(profileId: string, input: {
  content: string;
  type: string;
  media?: Array<{ path: string; mimeType: string; name: string }>;
  tags?: string[];
}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const, post: null };

  const moderationStatus = input.media && input.media.length > 0 ? "pending_review" : "published";

  const { data, error } = await supabase
    .from("wab_posts")
    .insert({
      author_id: profileId,
      content: input.content,
      content_type: input.type,
      media: input.media || [],
      moderation_status: moderationStatus,
      views_count: 0,
      likes_count: 0,
      comments_count: 0,
      shares_count: 0
    })
    .select()
    .single();

  if (error) return { configured: true as const, post: null, error };
  return { configured: true as const, post: data as WabPostRow };
}

// --- COMMENTS & INTERACTIONS ---
export async function getCommentsForPost(postId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const, comments: null };
  const { data, error } = await supabase
    .from("wab_comments")
    .select("*, wab_profiles:author_id(id, user_id, headline, avatar_url)")
    .eq("post_id", postId)
    .eq("moderation_status", "published")
    .order("created_at", { ascending: true });
  if (error) return { configured: true as const, comments: null, error };
  return { configured: true as const, comments: data };
}

export async function addCommentToPost(postId: string, profileId: string, content: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const, comment: null };
  
  const { data, error } = await supabase
    .from("wab_comments")
    .insert({
      post_id: postId,
      author_id: profileId,
      content: content.slice(0, 2000),
      moderation_status: "published"
    })
    .select()
    .single();

  if (error) return { configured: true as const, comment: null, error };

  // IncrÃ©menter le compteur de commentaires du post
  const { data: post } = await supabase.from("wab_posts").select("comments_count").eq("id", postId).single();
  if (post) {
    await supabase.from("wab_posts").update({ comments_count: (post.comments_count || 0) + 1 }).eq("id", postId);
  }

  return { configured: true as const, comment: data };
}

export async function toggleReactionOnPost(postId: string, userId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const, reacted: false };

  const { data: existing } = await supabase
    .from("wab_post_reactions")
    .select("*")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  let reacted = false;
  if (existing) {
    await supabase.from("wab_post_reactions").delete().eq("post_id", postId).eq("user_id", userId);
    reacted = false;
  } else {
    await supabase.from("wab_post_reactions").insert({ post_id: postId, user_id: userId });
    reacted = true;
  }

  // Mettre Ã  jour le compteur de likes
  const { count } = await supabase.from("wab_post_reactions").select("*", { count: "exact", head: true }).eq("post_id", postId);
  await supabase.from("wab_posts").update({ likes_count: count || 0 }).eq("id", postId);

  return { configured: true as const, reacted, likes: count || 0 };
}

// --- CONNECTIONS (FOLLOWS) ---
export async function followProfile(followerUserId: string, targetProfileId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const, followed: false };

  const { data: existing } = await supabase
    .from("wab_connections")
    .select("*")
    .eq("follower_user_id", followerUserId)
    .eq("profile_id", targetProfileId)
    .maybeSingle();

  let followed = false;
  if (existing) {
    await supabase.from("wab_connections").delete().eq("follower_user_id", followerUserId).eq("profile_id", targetProfileId);
    followed = false;
  } else {
    await supabase.from("wab_connections").insert({ follower_user_id: followerUserId, profile_id: targetProfileId });
    followed = true;
  }
  return { configured: true as const, followed };
}

export async function isFollowingProfile(followerUserId: string, targetProfileId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const, following: false };
  const { data, error } = await supabase
    .from("wab_connections")
    .select("*")
    .eq("follower_user_id", followerUserId)
    .eq("profile_id", targetProfileId)
    .maybeSingle();
  if (error) return { configured: true as const, following: false, error };
  return { configured: true as const, following: Boolean(data) };
}

// --- SALONS ---
export async function listWabSalons() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const, salons: null };
  const { data, error } = await supabase
    .from("wab_salons")
    .select("*, wab_profiles:host_profile_id(id, user_id, headline, avatar_url)")
    .order("starts_at", { ascending: true });
  if (error) return { configured: true as const, salons: null, error };
  return { configured: true as const, salons: data };
}

export async function createWabSalonInSupabase(hostProfileId: string, input: {
  title: string;
  description?: string;
  startsAt: string;
}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const, salon: null };
  const { data, error } = await supabase
    .from("wab_salons")
    .insert({
      host_profile_id: hostProfileId,
      title: input.title,
      description: input.description,
      starts_at: input.startsAt,
      status: "scheduled"
    })
    .select()
    .single();
  if (error) return { configured: true as const, salon: null, error };
  return { configured: true as const, salon: data };
}

// --- VIEWS ---
export async function incrementPostViews(postId: string, viewerUserId?: string, visitorId?: string, watchSeconds = 0) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const };
  
  await supabase.from("wab_post_views").insert({
    post_id: postId,
    viewer_user_id: viewerUserId || null,
    visitor_id: visitorId || null,
    watch_seconds: watchSeconds,
    is_eligible: true
  });

  const { data: post } = await supabase.from("wab_posts").select("views_count").eq("id", postId).single();
  if (post) {
    await supabase.from("wab_posts").update({ views_count: (post.views_count || 0) + 1 }).eq("id", postId);
  }
  return { configured: true as const };
}
