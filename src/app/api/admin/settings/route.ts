import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserForAdmin } from "@/lib/admin-auth";
import { readDB, writeDB } from "@/lib/db";

export async function GET() {
  const { db, error, status } = await getCurrentUserForAdmin('gerant');
  if (error) return NextResponse.json({ error }, { status });
  return NextResponse.json({ settings: db!.settings, constants: {
    shippingRates: {
      BJ: 2000, CI: 2500, SN: 3000, TG: 2000, CM: 3500, NG: 4000, GH: 3500, FR: 8000, US: 12000, GB: 10000, default: 5000
    },
    currencies: ["XOF","EUR","USD","NGN","GHS"],
    languages: { print_digital: ["fr","en","es"], audio: ["fr","en","es","sw","ha","yo","ig","fon","ff","zu","ee","wo"] }
  }});
}

export async function PUT(req: NextRequest) {
  const { db, error, status } = await getCurrentUserForAdmin('admin');
  if (error) return NextResponse.json({ error }, { status });
  try {
    const body = await req.json();
    const { homeSections, ads, shippingRates, plans } = body;
    if (homeSections) db!.settings.homeSections = { ...db!.settings.homeSections, ...homeSections };
    if (ads) db!.settings.ads = ads;
    if (shippingRates) db!.settings.shippingRates = shippingRates;
    if (plans) db!.settings.plans = plans;
    // Sauvegarder
    writeDB(db!);
    return NextResponse.json({ success: true, settings: db!.settings });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
