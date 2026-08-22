import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { readWabDB, writeWabDB } from "@/lib/wab-db";

function matchesAuthor(value: string | null | undefined, author: string) {
  return Boolean(value && value.trim().toLocaleLowerCase() === author.trim().toLocaleLowerCase());
}

export async function GET(request: NextRequest) {
  const author = request.nextUrl.searchParams.get("author")?.trim();
  const db = readWabDB();
  if (author) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data: profileRows } = await supabase
        .from("wab_profiles")
        .select("id,user_id,headline,about,company_name,industry,country_code,city,avatar_url,status,users:user_id(prenom,nom,full_name,avatar)")
        .eq("status", "active")
        .limit(500);
      const profileRow = (profileRows ?? []).find((row) => { const userRow = Array.isArray(row.users) ? row.users[0] : row.users; return matchesAuthor(userRow?.full_name, author) || matchesAuthor([userRow?.prenom, userRow?.nom].filter(Boolean).join(" "), author); });
      if (profileRow) {
        const userRow = Array.isArray(profileRow.users) ? profileRow.users[0] : profileRow.users;
        const userId = profileRow.user_id as string;
        const profile = {
          id: profileRow.id,
          userId,
          fullName: userRow?.full_name || [userRow?.prenom, userRow?.nom].filter(Boolean).join(" ") || author,
          headline: profileRow.headline || "Membre du réseau WAB",
          about: profileRow.about || "",
          companyName: profileRow.company_name || "",
          industry: profileRow.industry || "",
          country: profileRow.country_code || "",
          city: profileRow.city || "",
          status: profileRow.status,
        };
        const [{ data: postRows }, { data: pages }, { data: memberships }, { data: followerRows }] = await Promise.all([
          supabase.from("wab_posts").select("id,content,created_at,likes_count,comments_count,views_count,is_boosted,media").eq("author_id", profileRow.id).eq("moderation_status", "published").order("created_at", { ascending: false }).limit(100),
          supabase.from("wab_pages").select("id,name,slug,logo_url,avatar_url,cover_url,description,status").eq("owner_user_id", userId).eq("status", "active").limit(100),
          supabase.from("wab_group_members").select("group_id,status,role").eq("user_id", userId).eq("status", "active").limit(100),
          supabase.from("wab_connections").select("follower_user_id").eq("profile_id", profileRow.id).limit(500),
        ]);
        const pageIds = (pages ?? []).map((page) => page.id);
        const { data: pagePostRows } = pageIds.length ? await supabase.from("wab_posts").select("id,page_id,content,created_at,likes_count,comments_count,views_count,is_boosted,media").in("page_id", pageIds).eq("moderation_status", "published").order("created_at", { ascending: false }).limit(200) : { data: [] };
        const groupIds = (memberships ?? []).map((membership) => membership.group_id);
        const { data: groups } = groupIds.length ? await supabase.from("wab_groups").select("id,name,slug,logo_url,avatar_url,cover_url,description,privacy,status").in("id", groupIds).eq("status", "active").limit(100) : { data: [] };
        const followerIds = (followerRows ?? []).map((row) => row.follower_user_id);
        const { data: followerProfiles } = followerIds.length ? await supabase.from("wab_profiles").select("id,user_id,avatar_url,users:user_id(prenom,nom,full_name)").in("user_id", followerIds).limit(500) : { data: [] };
        const followerByUser = new Map((followerProfiles ?? []).map((row) => [row.user_id, { ...row, user: Array.isArray(row.users) ? row.users[0] : row.users }]));
        const mapPost = (row: { id: string; content: string; created_at: string; likes_count?: number | null; comments_count?: number | null; views_count?: number | null; is_boosted?: boolean | null; media?: unknown }) => ({ id: row.id, content: row.content, createdAt: row.created_at, likes: row.likes_count ?? 0, comments: row.comments_count ?? 0, views: row.views_count ?? 0, isBoosted: Boolean(row.is_boosted), media: Array.isArray(row.media) ? row.media : [] });
        const pagePostMap = new Map<string, ReturnType<typeof mapPost>[]>();
        for (const row of pagePostRows ?? []) pagePostMap.set(row.page_id, [...(pagePostMap.get(row.page_id) ?? []), mapPost(row)]);
        return NextResponse.json({ profile, author, avatarUrl: profileRow.avatar_url || userRow?.avatar, postCount: (postRows ?? []).length, posts: (postRows ?? []).map(mapPost), followers: followerIds.map((followerId) => { const row = followerByUser.get(followerId); return { id: row?.id ?? followerId, userId: followerId, fullName: row?.user?.full_name || [row?.user?.prenom, row?.user?.nom].filter(Boolean).join(" ") || "Membre WAB", avatarUrl: row?.avatar_url }; }), pages: (pages ?? []).map((page) => ({ ...page, posts: pagePostMap.get(page.id) ?? [] })), groups: (groups ?? []).filter((group) => group.privacy !== "private") });
      }
    }
    const profile = db.profiles.find((item) => item.status === "active" && matchesAuthor(item.fullName, author)) ?? null;
    const posts = db.posts.filter((item) => matchesAuthor(item.author, author) && item.moderationStatus === "published").sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    const followers = profile ? db.connections.filter((item) => item.profileId === profile.id).map((item) => db.profiles.find((candidate) => candidate.userId === item.followerUserId)).filter(Boolean).map((item) => ({ id: item!.id, userId: item!.userId, fullName: item!.fullName, avatarUrl: undefined })) : [];
    return NextResponse.json({ profile, author, avatarUrl: posts[0]?.authorAvatarUrl, postCount: posts.length, posts, followers, pages: [], groups: [] });
  }
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ profile: null });
  const profile = db.profiles.find((item) => item.userId === user.id) ?? null;
  return NextResponse.json({ profile });
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const body = await request.json();
  const required = ["headline", "about", "country"];
  const missing = required.find((key) => typeof body[key] !== "string" || !body[key].trim());
  if (missing) return NextResponse.json({ error: `Champ obligatoire : ${missing}` }, { status: 400 });
  const db = readWabDB();
  const now = new Date().toISOString();
  const previous = db.profiles.find((item) => item.userId === user.id);
  const next = { id: previous?.id ?? crypto.randomUUID(), userId: user.id, fullName: `${user.prenom} ${user.nom}`, headline: body.headline.trim().slice(0, 180), about: body.about.trim().slice(0, 3000), companyName: body.companyName?.trim().slice(0, 160), industry: body.industry?.trim().slice(0, 120), country: body.country.trim().slice(0, 100), city: body.city?.trim().slice(0, 100), status: "active" as const, createdAt: previous?.createdAt ?? now, updatedAt: now };
  db.profiles = [next, ...db.profiles.filter((item) => item.userId !== user.id)];
  writeWabDB(db);
  return NextResponse.json({ profile: next });
}
