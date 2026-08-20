import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createRecoveryCodes, createTotpSecret, createTotpUri, decryptSecret, encryptSecret, hashRecoveryCode, verifyTotpCode } from "@/lib/security-crypto";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromCookie();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const client = getSupabaseAdmin();
    if (!client) return NextResponse.json({ error: "Service 2FA indisponible" }, { status: 503 });
    const body = await request.json().catch(() => ({}));
    const action = body.action;

    if (action === "enable") {
      const secret = createTotpSecret();
      const recoveryCodes = createRecoveryCodes();
      const { error } = await client.from("users").update({ two_factor_secret: encryptSecret(secret), two_factor_recovery_hashes: recoveryCodes.map(hashRecoveryCode), two_factor_enabled: false }).eq("id", user.id);
      if (error) throw error;
      return NextResponse.json({ success: true, pending: true, uri: createTotpUri(secret, user.email), recoveryCodes, message: "Scannez le QR code ou saisissez le secret, puis confirmez avec un code à 6 chiffres." });
    }

    if (action === "verify") {
      const code = String(body.code || "").trim();
      const { data, error } = await client.from("users").select("two_factor_secret,two_factor_recovery_hashes").eq("id", user.id).single();
      if (error) throw error;
      const secret = typeof data.two_factor_secret === "string" ? decryptSecret(data.two_factor_secret) : null;
      const recoveryHashes = Array.isArray(data.two_factor_recovery_hashes) ? data.two_factor_recovery_hashes.map(String) : [];
      const isTotpValid = Boolean(secret && verifyTotpCode(secret, code));
      const recoveryHash = hashRecoveryCode(code);
      const recoveryIndex = recoveryHashes.indexOf(recoveryHash);
      if (!isTotpValid && recoveryIndex < 0) return NextResponse.json({ error: "Code 2FA invalide" }, { status: 400 });
      if (recoveryIndex >= 0) recoveryHashes.splice(recoveryIndex, 1);
      const { error: updateError } = await client.from("users").update({ two_factor_enabled: true, two_factor_recovery_hashes: recoveryHashes }).eq("id", user.id);
      if (updateError) throw updateError;
      return NextResponse.json({ success: true, usedRecoveryCode: recoveryIndex >= 0 });
    }

    if (action === "disable") {
      const code = String(body.code || "").trim();
      const { data, error } = await client.from("users").select("two_factor_secret,two_factor_recovery_hashes").eq("id", user.id).single();
      if (error) throw error;
      const secret = typeof data.two_factor_secret === "string" ? decryptSecret(data.two_factor_secret) : null;
      const recoveryHashes = Array.isArray(data.two_factor_recovery_hashes) ? data.two_factor_recovery_hashes.map(String) : [];
      const valid = Boolean(secret && verifyTotpCode(secret, code)) || recoveryHashes.includes(hashRecoveryCode(code));
      if (!valid) return NextResponse.json({ error: "Confirmation 2FA requise" }, { status: 400 });
      const { error: updateError } = await client.from("users").update({ two_factor_enabled: false, two_factor_secret: null, two_factor_recovery_hashes: [] }).eq("id", user.id);
      if (updateError) throw updateError;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Action invalide" }, { status: 400 });
  } catch (error) {
    console.error("2FA operation failed", error);
    return NextResponse.json({ error: "Opération 2FA impossible" }, { status: 500 });
  }
}
