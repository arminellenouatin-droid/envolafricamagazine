import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { readWabDB, writeWabDB } from "@/lib/wab-db";

async function admin() { const user = await getCurrentUserFromCookie(); return user && ["admin", "administrateur", "gerant"].includes(user.role) ? user : null; }

export async function GET() {
  if (!await admin()) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  const db = readWabDB();
  return NextResponse.json({ posts: db.posts, stories: db.stories, reels: db.reels, profiles: db.profiles, reports: db.reports, rewards: db.rewards, metrics: { publishedPosts: db.posts.filter((post) => post.moderationStatus === "published").length, pendingPosts: db.posts.filter((post) => post.moderationStatus === "pending_review").length, publishedStories: db.stories.filter((story) => story.moderationStatus === "published").length, pendingStories: db.stories.filter((story) => story.moderationStatus === "pending_review").length, publishedReels: db.reels.filter((reel) => reel.moderationStatus === "published").length, pendingReels: db.reels.filter((reel) => reel.moderationStatus === "pending_review").length, openReports: db.reports.filter((report) => report.status === "open").length, activeProfiles: db.profiles.filter((profile) => profile.status === "active").length, pendingRewards: db.rewards.filter((reward) => reward.status === "pending_review").length } });
}

export async function PATCH(request: NextRequest) {
  if (!await admin()) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  const { targetType, targetId, status } = await request.json();
  const db = readWabDB();
  if (targetType === "post" && ["published", "hidden", "rejected"].includes(status)) { const post = db.posts.find((item) => item.id === targetId); if (!post) return NextResponse.json({ error: "Publication introuvable." }, { status: 404 }); post.moderationStatus = status; writeWabDB(db); return NextResponse.json({ post }); }
  if (targetType === "story" && ["published", "hidden"].includes(status)) { const story = db.stories.find((item) => item.id === targetId); if (!story) return NextResponse.json({ error: "Story introuvable." }, { status: 404 }); story.moderationStatus = status; writeWabDB(db); return NextResponse.json({ story }); }
  if (targetType === "reel" && ["published", "hidden"].includes(status)) { const reel = db.reels.find((item) => item.id === targetId); if (!reel) return NextResponse.json({ error: "Reel introuvable." }, { status: 404 }); reel.moderationStatus = status; writeWabDB(db); return NextResponse.json({ reel }); }
  if (targetType === "profile" && ["active", "silent", "banned"].includes(status)) { const profile = db.profiles.find((item) => item.id === targetId); if (!profile) return NextResponse.json({ error: "Profil introuvable." }, { status: 404 }); profile.status = status; writeWabDB(db); return NextResponse.json({ profile }); }
  if (targetType === "report" && ["reviewing", "resolved", "dismissed"].includes(status)) { const report = db.reports.find((item) => item.id === targetId); if (!report) return NextResponse.json({ error: "Signalement introuvable." }, { status: 404 }); report.status = status; writeWabDB(db); return NextResponse.json({ report }); }
  if (targetType === "reward" && ["validated", "rejected", "paid"].includes(status)) { const reward = db.rewards.find((item) => item.id === targetId); if (!reward) return NextResponse.json({ error: "Récompense introuvable." }, { status: 404 }); reward.status = status; if (status === "validated") reward.validatedAt = new Date().toISOString(); if (status === "paid") reward.paidAt = new Date().toISOString(); writeWabDB(db); return NextResponse.json({ reward }); }
  return NextResponse.json({ error: "Action invalide." }, { status: 400 });
}
