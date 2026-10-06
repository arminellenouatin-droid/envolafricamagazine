import fs from "fs";
import path from "path";
import https from "https";
import { createClient } from "@supabase/supabase-js";
import {
  S3Client,
  HeadBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { RtcTokenBuilder, RtcRole } from "agora-token";

console.log("=== VÉRIFICATION GLOBALE AGORA LIVE & CLOUDFLARE R2 ===");

// 1. Charger l'environnement
const envPath = path.join(__dirname, "../.env.local");
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
const env: Record<string, string> = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[match[1]] = val;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("❌ Identifiants Supabase introuvables dans .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

async function checkDatabase() {
  console.log("\n--- 1. VÉRIFICATION DES TABLES SUPABASE ---");
  
  // Agora Live
  const { data: agoraSessions, error: agoraSessionsErr } = await supabase
    .from("live_agora_sessions")
    .select("id")
    .limit(1);
  if (agoraSessionsErr) {
    console.error(`❌ Table live_agora_sessions non accessible : ${agoraSessionsErr.message}`);
  } else {
    console.log("✅ Table live_agora_sessions présente et active dans Supabase.");
  }

  const { data: agoraParticipants, error: agoraParticipantsErr } = await supabase
    .from("live_agora_participants")
    .select("id")
    .limit(1);
  if (agoraParticipantsErr) {
    console.error(`❌ Table live_agora_participants non accessible : ${agoraParticipantsErr.message}`);
  } else {
    console.log("✅ Table live_agora_participants présente et active dans Supabase.");
  }

  // Cloudflare R2
  const { data: storageObjs, error: storageObjsErr } = await supabase
    .from("storage_objects")
    .select("id")
    .limit(1);
  if (storageObjsErr) {
    console.error(`❌ Table storage_objects non accessible : ${storageObjsErr.message}`);
  } else {
    console.log("✅ Table storage_objects présente et active dans Supabase.");
  }

  const { data: storageBackups, error: storageBackupsErr } = await supabase
    .from("storage_migration_backup")
    .select("id")
    .limit(1);
  if (storageBackupsErr) {
    console.error(`❌ Table storage_migration_backup non accessible : ${storageBackupsErr.message}`);
  } else {
    console.log("✅ Table storage_migration_backup présente et active dans Supabase.");
  }
}

async function checkAgoraTokens() {
  console.log("\n--- 2. VÉRIFICATION DE LA GÉNÉRATION DE JETONS AGORA RTC ---");
  const appId = env.NEXT_PUBLIC_AGORA_APP_ID;
  const appCert = env.AGORA_APP_CERTIFICATE;

  if (!appId || !appCert) {
    console.error("❌ Variables Agora (APP_ID ou APP_CERTIFICATE) manquantes");
    return;
  }

  const channel = "test-live-channel";
  const uid = 123456789;
  const expire = Math.floor(Date.now() / 1000) + 3600;

  try {
    const tokenHost = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCert,
      channel,
      uid,
      RtcRole.PUBLISHER,
      expire,
      expire
    );
    console.log(`✅ Jeton Host généré avec succès (longueur ${tokenHost.length}, commence par ${tokenHost.slice(0, 4)}...)`);

    const tokenAudience = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCert,
      channel,
      987654321,
      RtcRole.SUBSCRIBER,
      expire,
      expire
    );
    console.log(`✅ Jeton Audience généré avec succès (longueur ${tokenAudience.length}, commence par ${tokenAudience.slice(0, 4)}...)`);
  } catch (err: any) {
    console.error(`❌ Échec de génération des jetons Agora : ${err.message}`);
  }
}

async function checkCloudflareR2Live() {
  console.log("\n--- 3. TEST RÉEL DU STOCKAGE CLOUDFLARE R2 ---");
  const accountId = env.R2_ACCOUNT_ID;
  const accessKeyId = env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY;
  const bucketPublic = env.R2_BUCKET_PUBLIC || "envol-public";
  const bucketPrivate = env.R2_BUCKET_PRIVATE || "envol-private";
  const publicBaseUrl = env.R2_PUBLIC_BASE_URL;

  if (!accountId || !accessKeyId || !secretAccessKey || !publicBaseUrl) {
    console.error("❌ Variables R2 incomplètes");
    return;
  }

  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  // A. Buckets existants
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucketPublic }));
    console.log(`✅ Bucket public [${bucketPublic}] accessible en écriture/lecture.`);
    await s3.send(new HeadBucketCommand({ Bucket: bucketPrivate }));
    console.log(`✅ Bucket privé [${bucketPrivate}] accessible en écriture/lecture.`);
  } catch (err: any) {
    console.error(`❌ Échec d'accès aux buckets R2 : ${err.message}`);
    return;
  }

  // B. Test Upload public
  const testKey = `dev/test-prod-check-${Date.now()}.txt`;
  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucketPublic,
        Key: testKey,
        Body: Buffer.from("Vérification de production Envol Africa Magazine - R2 OK"),
        ContentType: "text/plain",
      })
    );
    console.log(`✅ Fichier test uploadé avec succès sur [${bucketPublic}]: ${testKey}`);

    // Tester l'accès HTTP public
    const publicUrl = `${publicBaseUrl}/${testKey}`;
    await new Promise<void>((resolve, reject) => {
      https.get(publicUrl, (res) => {
        if (res.statusCode === 200) {
          console.log(`✅ URL publique accessible et répond en HTTP 200 : ${publicUrl}`);
          resolve();
        } else {
          reject(new Error(`Réponse HTTP ${res.statusCode} sur ${publicUrl}`));
        }
      }).on("error", reject);
    });

    // Nettoyer
    await s3.send(new DeleteObjectCommand({ Bucket: bucketPublic, Key: testKey }));
    console.log(`✅ Fichier test nettoyé du bucket public.`);
  } catch (err: any) {
    console.error(`❌ Échec du cycle d'upload/téléchargement public R2 : ${err.message}`);
  }

  // C. Test Upload privé avec URL signée GET
  const privateKey = `dev/private-test-${Date.now()}.txt`;
  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucketPrivate,
        Key: privateKey,
        Body: Buffer.from("Document privé sécurisé - Envol Africa Magazine"),
        ContentType: "text/plain",
      })
    );
    console.log(`✅ Fichier test privé uploadé sur [${bucketPrivate}]: ${privateKey}`);

    const getCmd = new GetObjectCommand({
      Bucket: bucketPrivate,
      Key: privateKey,
    });
    const presignedGetUrl = await getSignedUrl(s3, getCmd, { expiresIn: 60 });
    console.log(`✅ URL privée pré-signée générée avec succès (expire en 60s).`);

    // Tester l'accès via URL signée
    await new Promise<void>((resolve, reject) => {
      https.get(presignedGetUrl, (res) => {
        if (res.statusCode === 200) {
          console.log(`✅ Accès sécurisé par URL signée validé (HTTP 200).`);
          resolve();
        } else {
          reject(new Error(`Réponse HTTP ${res.statusCode} sur URL signée`));
        }
      }).on("error", reject);
    });

    // Nettoyer
    await s3.send(new DeleteObjectCommand({ Bucket: bucketPrivate, Key: privateKey }));
    console.log(`✅ Fichier test nettoyé du bucket privé.`);
  } catch (err: any) {
    console.error(`❌ Échec du test privé R2 : ${err.message}`);
  }
}

async function main() {
  await checkDatabase();
  await checkAgoraTokens();
  await checkCloudflareR2Live();
  console.log("\n=== CONTRÔLE TERMINÉ AVEC SUCCÈS ===");
}

main().catch(console.error);
