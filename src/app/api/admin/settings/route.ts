import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserForAdmin } from "@/lib/admin-auth";
import { writeDB } from "@/lib/db";

const DEFAULT_SETTINGS = {
  homeSections: {},
  ads: [],
  serviceRequests: [],
  withdrawRequests: [],
  shippingRates: {
    BJ: 2000, CI: 2500, SN: 3000, TG: 2000, CM: 3500, NG: 4000, GH: 3500, FR: 8000, US: 12000, GB: 10000, default: 5000
  },
  plans: [],
};

let cachedProdSettings: any = null;

export async function GET() {
  const { db, error, status } = await getCurrentUserForAdmin('gerant');
  if (error) return NextResponse.json({ error }, { status });
  const settings = db?.settings ?? cachedProdSettings ?? DEFAULT_SETTINGS;
  return NextResponse.json({ settings, constants: {
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
    if (db) {
      if (!db.settings) db.settings = { ...DEFAULT_SETTINGS };
      if (homeSections) db.settings.homeSections = { ...db.settings.homeSections, ...homeSections };
      if (ads) db.settings.ads = ads;
      if (shippingRates) db.settings.shippingRates = shippingRates;
      if (plans) db.settings.plans = plans;
      writeDB(db);
      return NextResponse.json({ success: true, settings: db.settings });
    }
    if (!cachedProdSettings) cachedProdSettings = { ...DEFAULT_SETTINGS };
    if (homeSections) cachedProdSettings.homeSections = { ...cachedProdSettings.homeSections, ...homeSections };
    if (ads) cachedProdSettings.ads = ads;
    if (shippingRates) cachedProdSettings.shippingRates = shippingRates;
    if (plans) cachedProdSettings.plans = plans;
    return NextResponse.json({ success: true, settings: cachedProdSettings });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
