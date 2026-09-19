import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { enrollAffiliate, AffiliationError } from "@/lib/affiliation/enrollment";

export async function POST(req: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) {
    return NextResponse.json({ error: "Connexion requise pour rejoindre le programme d'affiliation." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { programs, referralCode } = body;

    if (!Array.isArray(programs) || programs.length === 0) {
      return NextResponse.json(
        { error: "Veuillez sélectionner au moins un programme (Magazine ou Marketplace)." },
        { status: 400 }
      );
    }

    const affiliate = await enrollAffiliate({
      userId: user.id,
      programs,
      referralCode,
    });

    return NextResponse.json({
      success: true,
      affiliate: {
        id: affiliate.id,
        referralCode: affiliate.referral_code,
        level: affiliate.level,
        magazineEnrolled: affiliate.magazine_enrolled,
        marketplaceEnrolled: affiliate.marketplace_enrolled,
      },
    });
  } catch (err: any) {
    if (err instanceof AffiliationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[api/affiliate/register] Error:", err);
    return NextResponse.json({ error: "Une erreur est survenue lors de l'inscription." }, { status: 500 });
  }
}
