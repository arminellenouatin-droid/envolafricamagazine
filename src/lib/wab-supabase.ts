import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createGlobalNotification } from "@/lib/ecosystem-inbox";

export type WabPostRow = {
  id: string;
  author_id: string;
  content: string;
  media: Array<{ path: string; mimeType: string; name: string; size?: number }> | null;
  content_type: string;
  visibility: "public" | "community" | "group";
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
  source_type?: string | null;
  source_id?: string | null;
  source_url?: string | null;
  source_title?: string | null;
  page_id?: string | null;
  group_id?: string | null;

  audience?: { countries?: string[]; industries?: string[] } | null;
  wab_pages?: { id: string; name: string; slug: string; logo_url: string | null; owner_user_id: string };
  wab_groups?: { id: string; name: string; slug: string; logo_url: string | null; owner_user_id: string };
  wab_profiles?: {
    id: string;
    fullName?: string;
    user_id: string;
    headline: string | null;
    industry: string | null;
    avatar_url: string | null;
    city: string | null;
    country_code: string | null;
    users?: { prenom?: string | null; nom?: string | null; full_name?: string | null };
  };
};

export type WabPageRow = { id: string; owner_user_id: string; name: string; slug: string; logo_url: string | null; description: string | null; status: string; created_at: string; updated_at: string };
export type WabGroupRow = { id: string; owner_user_id: string; name: string; slug: string; description: string | null; logo_url: string | null; privacy: "community" | "private"; status: string; created_at: string; updated_at: string };
export type WabGroupMemberRow = { group_id: string; user_id: string; role: "owner" | "moderator" | "member"; status: "active" | "pending" | "blocked"; created_at: string };

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

// --- PAGES ---
export async function listWabPages(ownerUserId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const, pages: null };
  const { data, error } = await supabase.from("wab_pages").select("*").eq("owner_user_id", ownerUserId).eq("status", "active").order("created_at", { ascending: true });
  if (error) return { configured: true as const, pages: null, error };
  return { configured: true as const, pages: data as WabPageRow[] };
}

export async function ensureWabPage(ownerUserId: string, input: { name: string; slug: string; logoUrl?: string; description?: string }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const, page: null };
  const { data: existing } = await supabase.from("wab_pages").select("*").eq("slug", input.slug).maybeSingle();
  if (existing) return { configured: true as const, page: existing as WabPageRow };
  const { data, error } = await supabase.from("wab_pages").insert({ owner_user_id: ownerUserId, name: input.name, slug: input.slug, logo_url: input.logoUrl ?? null, description: input.description ?? null, status: "active" }).select("*").single();
  if (error) return { configured: true as const, page: null, error };
  return { configured: true as const, page: data as WabPageRow };
}

export async function createWabPage(ownerUserId: string, input: { name: string; slug: string; logoUrl?: string; description?: string }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const, page: null };
  const { data, error } = await supabase.from("wab_pages").insert({ owner_user_id: ownerUserId, name: input.name, slug: input.slug, logo_url: input.logoUrl ?? null, description: input.description ?? null, status: "active" }).select("*").single();
  if (error) return { configured: true as const, page: null, error };
  return { configured: true as const, page: data as WabPageRow };
}

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
export async function listWabPosts(page: number, limit: number, filters: { country?: string; industry?: string } = {}, viewerUserId?: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const, posts: null };

  const { data: memberships } = viewerUserId ? await supabase.from("wab_group_members").select("group_id").eq("user_id", viewerUserId).eq("status", "active").limit(500) : { data: [] };
  const groupIds = (memberships ?? []).map((item) => item.group_id);
  const { data: connections } = viewerUserId ? await supabase.from("wab_connections").select("profile_id").eq("follower_user_id", viewerUserId).limit(500) : { data: [] };
  const profileIds = (connections ?? []).map((item) => item.profile_id);
  const { data: followedProfiles } = profileIds.length ? await supabase.from("wab_profiles").select("user_id").in("id", profileIds).limit(500) : { data: [] };
  const followedUserIds = new Set([...(viewerUserId ? [viewerUserId] : []), ...(followedProfiles ?? []).map((item) => item.user_id)]);

  const { data, error } = await supabase
    .from("wab_posts")
    .select("*, wab_pages:page_id(id, name, slug, logo_url, owner_user_id), wab_groups:group_id(id, name, slug, logo_url, owner_user_id), wab_profiles:author_id(id, user_id, headline, avatar_url, city, country_code, users:user_id(prenom, nom, full_name))")
    .eq("moderation_status", "published")
    .order("is_boosted", { ascending: false })
    .order("created_at", { ascending: false })
    .range(0, 199);
  if (error) return { configured: true as const, posts: null, error };

  let filteredData = (data as WabPostRow[]).filter((post) => {
    if (post.visibility === "public" || post.is_boosted) return true;
    if (post.visibility === "group") return Boolean(viewerUserId && post.group_id && groupIds.includes(post.group_id));
    return Boolean(viewerUserId && post.wab_profiles?.user_id && followedUserIds.has(post.wab_profiles.user_id));
  });
  if (filters.country) filteredData = filteredData.filter((post) => post.wab_profiles?.country_code?.toLowerCase() === filters.country?.toLowerCase());
  if (filters.industry) filteredData = filteredData.filter((post) => post.wab_profiles?.industry?.toLowerCase() === filters.industry?.toLowerCase());
  const start = (page - 1) * limit;
  return { configured: true as const, posts: filteredData.slice(start, start + limit), pagination: { hasMore: start + limit < filteredData.length } };
}

export async function createWabPostInSupabase(profileId: string, input: {
  content: string;
  type: string;
  media?: Array<{ path: string; mimeType: string; name: string; size?: number }>;
  tags?: string[];
  pageId?: string;
  groupId?: string;
  visibility?: "public" | "community" | "group";
  audience?: { countries?: string[]; industries?: string[] };
}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const, post: null };

  const moderationStatus = "published";

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
      shares_count: 0,
      page_id: input.pageId ?? null,
      group_id: input.groupId ?? null,
      visibility: input.visibility ?? "community",
      audience: input.audience ?? {}
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

export async function notifyWabFollowers(profileId: string, input: { type: string; title: string; body: string; href?: string }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const };
  const { data: followers } = await supabase.from("wab_connections").select("follower_user_id").eq("profile_id", profileId).limit(500);
  if (!followers?.length) return { configured: true as const, count: 0 };
  const rows = followers.map((item) => ({ user_id: item.follower_user_id, type: input.type, title: input.title, body: input.body.slice(0, 240), href: input.href ?? "/wab", created_at: new Date().toISOString() }));
  const { error } = await supabase.from("wab_notifications").insert(rows);
  if (!error) await Promise.all(followers.map((item) => createGlobalNotification({ userId: item.follower_user_id, platform: "wab", type: input.type, title: input.title, body: input.body, link: input.href })));
  return { configured: true as const, count: error ? 0 : rows.length, error };
}

export async function notifyWabUser(userId: string, input: { type: string; title: string; body: string; href?: string }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const };
  const { error } = await supabase.from("wab_notifications").insert({ user_id: userId, type: input.type, title: input.title, body: input.body.slice(0, 240), href: input.href ?? "/wab", created_at: new Date().toISOString() });
  if (!error) await createGlobalNotification({ userId, platform: "wab", type: input.type, title: input.title, body: input.body, link: input.href });
  return { configured: true as const, error };
}

export async function notifyWabPostFollowers(postId: string, input: { type: string; title: string; body: string; href?: string }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const };
  const { data: post } = await supabase.from("wab_posts").select("author_id").eq("id", postId).maybeSingle();
  if (!post?.author_id) return { configured: true as const, count: 0 };
  return notifyWabFollowers(post.author_id, input);
}


export async function findWabPageBySlug(slug: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const, page: null };
  const { data, error } = await supabase.from("wab_pages").select("*").eq("slug", slug).eq("status", "active").maybeSingle();
  if (error) return { configured: true as const, page: null, error };
  return { configured: true as const, page: data as WabPageRow | null };
}

export async function listWabGroups(userId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const, groups: null, memberships: null };
  const { data: memberships, error: membershipError } = await supabase.from("wab_group_members").select("*").eq("user_id", userId).eq("status", "active");
  if (membershipError) return { configured: true as const, groups: null, memberships: null, error: membershipError };
  const groupIds = (memberships ?? []).map((item) => item.group_id);
  const { data: owned, error: ownedError } = await supabase.from("wab_groups").select("*").eq("owner_user_id", userId).eq("status", "active");
  if (ownedError) return { configured: true as const, groups: null, memberships: memberships as WabGroupMemberRow[] };
  const { data: joined } = groupIds.length ? await supabase.from("wab_groups").select("*").in("id", groupIds).eq("status", "active") : { data: [] };
  const byId = new Map<string, WabGroupRow>();
  [...(owned ?? []), ...(joined ?? [])].forEach((group) => byId.set(group.id, group as WabGroupRow));
  return { configured: true as const, groups: Array.from(byId.values()), memberships: memberships as WabGroupMemberRow[] };
}

export async function createWabGroup(ownerUserId: string, input: { name: string; slug: string; description?: string; logoUrl?: string; privacy?: "community" | "private" }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const, group: null };
  const { data: group, error } = await supabase.from("wab_groups").insert({ owner_user_id: ownerUserId, name: input.name, slug: input.slug, description: input.description ?? null, logo_url: input.logoUrl ?? null, privacy: input.privacy ?? "community", status: "active" }).select("*").single();
  if (error || !group) return { configured: true as const, group: null, error };
  await supabase.from("wab_group_members").insert({ group_id: group.id, user_id: ownerUserId, role: "owner", status: "active" });
  return { configured: true as const, group: group as WabGroupRow };
}

export async function joinWabGroup(userId: string, groupId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const, membership: null };
  const { data: group } = await supabase.from("wab_groups").select("privacy,status").eq("id", groupId).eq("status", "active").maybeSingle();
  if (!group) return { configured: true as const, membership: null, error: new Error("Groupe introuvable.") };
  const status = group.privacy === "private" ? "pending" : "active";
  const { data, error } = await supabase.from("wab_group_members").upsert({ group_id: groupId, user_id: userId, role: "member", status }, { onConflict: "group_id,user_id" }).select("*").single();
  return { configured: true as const, membership: data as WabGroupMemberRow | null, error };
}

export async function canPublishToWabGroup(userId: string, groupId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const, allowed: true };
  const { data: group } = await supabase.from("wab_groups").select("owner_user_id,status").eq("id", groupId).eq("status", "active").maybeSingle();
  if (!group) return { configured: true as const, allowed: false, reason: "Groupe introuvable." };
  if (group.owner_user_id === userId) return { configured: true as const, allowed: true };
  const { data: member } = await supabase.from("wab_group_members").select("status").eq("group_id", groupId).eq("user_id", userId).maybeSingle();
  return member?.status === "active" ? { configured: true as const, allowed: true } : { configured: true as const, allowed: false, reason: "Vous devez être membre actif de ce groupe pour publier." };
}

export async function isWabPremiumUser(userId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;
  const { data } = await supabase.from("users").select("role,subscription").eq("id", userId).maybeSingle();
  const subscription = data?.subscription as { status?: string; planId?: string } | null;
  return data?.role === "admin" || subscription?.status === "active" || subscription?.planId?.toLowerCase().includes("premium") === true;
}


export async function canPublishToWabPage(userId: string, pageId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const, allowed: true };
  const { data: page } = await supabase.from("wab_pages").select("owner_user_id,status").eq("id", pageId).eq("status", "active").maybeSingle();
  return page?.owner_user_id === userId ? { configured: true as const, allowed: true } : { configured: true as const, allowed: false, reason: "Seul le propriétaire de la page peut y publier." };
}
