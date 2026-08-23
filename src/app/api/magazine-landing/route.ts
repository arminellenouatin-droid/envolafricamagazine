import { NextResponse } from "next/server";
import { listMagazineLandingBlocks } from "@/lib/magazine-landing";

export const revalidate = 60;

export async function GET() {
  try {
    return NextResponse.json({ blocks: await listMagazineLandingBlocks() });
  } catch (cause) {
    console.error("[magazine-landing] GET", cause);
    return NextResponse.json({ error: "Configuration Landing indisponible" }, { status: 503 });
  }
}
