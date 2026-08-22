import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createOpaqueToken, hashOpaqueToken, normalizeEmail, isPlausibleEmail } from "@/lib/security-crypto";

function hashEmail(email: string) {
  return hashOpaqueToken(`${process.env.NEWSLETTER_HASH_SECRET || process.env.JWT_SECRET || "local-newsletter-salt"}:${email}`);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = normalizeEmail(body.email);
    const source = typeof body.source === "string" && body.source.trim() ? body.source.trim().slice(0, 80) : "kiosque";

    if (!isPlausibleEmail(email)) {
      return NextResponse.json({ error: "Veuillez saisir une adresse e-mail valide." }, { status: 400 });
    }

    const client = getSupabaseAdmin();
    if (!client) {
      return NextResponse.json({ error: "Le service newsletter n’est pas encore configuré." }, { status: 503 });
    }

    const emailHash = hashEmail(email);
    const verificationToken = createOpaqueToken(32);
    const verificationHash = hashOpaqueToken(verificationToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { data: existing, error: findError } = await client
      .from("newsletter_subscribers")
      .select("id,status")
      .eq("email_hash", emailHash)
      .maybeSingle();
    if (findError) throw findError;

    if (existing?.status === "active") {
      return NextResponse.json({ success: true, message: "Cette adresse est déjà inscrite à la newsletter." });
    }

    const subscriberPayload = {
      email,
      email_hash: emailHash,
      status: "pending",
      source,
      consent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const subscriberQuery = existing
      ? client.from("newsletter_subscribers").update(subscriberPayload).eq("id", existing.id).select("id").single()
      : client.from("newsletter_subscribers").insert(subscriberPayload).select("id").single();
    const { data: savedSubscriber, error: subscriberError } = await subscriberQuery;
    if (subscriberError || !savedSubscriber) throw subscriberError || new Error("Abonné newsletter introuvable après sauvegarde");

    await client.from("email_verification_tokens").delete().eq("subscriber_id", savedSubscriber.id).eq("purpose", "newsletter_verification");
    const { error: tokenError } = await client.from("email_verification_tokens").insert({
      subscriber_id: savedSubscriber.id,
      token_hash: verificationHash,
      purpose: "newsletter_verification",
      expires_at: expiresAt,
    });
    if (tokenError) throw tokenError;

    // L’envoi réel est volontairement isolé : Resend/SMTP pourra consommer ce même token sans changer le stockage.
    console.info("Newsletter verification pending", { emailHash, source, expiresAt });
    return NextResponse.json({
      success: true,
      pendingVerification: true,
      message: "Un lien de confirmation sera envoyé à cette adresse.",
    });
  } catch (error) {
    console.error("Newsletter subscription failed", error);
    return NextResponse.json({ error: "Impossible d’enregistrer l’inscription pour le moment." }, { status: 500 });
  }
}
