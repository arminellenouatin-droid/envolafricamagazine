import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { readWabDB, writeWabDB } from "@/lib/wab-db";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUserFromCookie();
  const visitorId = request.headers.get("x-visitor-id") || request.headers.get("x-forwarded-for") || "anonymous";
  const db = readWabDB();
  const story = db.stories.find((item) => item.id === id && item.moderationStatus === "published");
  if (!story) return NextResponse.json({ error: "Story introuvable." }, { status: 404 });
  const alreadyViewed = db.views.some((view) => view.postId === `story:${id}` && (user?.id ? view.userId === user.id : view.visitorId === visitorId) && Date.now() - Date.parse(view.createdAt) < 30 * 60 * 1000);
  if (!alreadyViewed) { story.views += 1; db.views.push({ postId: `story:${id}`, userId: user?.id, visitorId, watchSeconds: 0, createdAt: new Date().toISOString() }); writeWabDB(db); }
  return NextResponse.json({ views: story.views, counted: !alreadyViewed });
}
