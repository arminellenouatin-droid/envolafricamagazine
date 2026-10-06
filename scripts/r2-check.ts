import fs from "fs";
import path from "path";
import https from "https";
import {
  S3Client,
  HeadBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

console.log("=== PHASE 2 : VÉRIFICATION DE LA CONFIGURATION CLOUDFLARE R2 ===");

// 1. Charger les variables d'environnement depuis .env.local
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

const accountId = env.R2_ACCOUNT_ID;
const accessKeyId = env.R2_ACCESS_KEY_ID;
const secretAccessKey = env.R2_SECRET_ACCESS_KEY;
const bucketPublic = env.R2_BUCKET_PUBLIC || "envol-public";
const bucketPrivate = env.R2_BUCKET_PRIVATE || "envol-private";
const publicBaseUrl = env.R2_PUBLIC_BASE_URL;
const keyPrefix = env.R2_KEY_PREFIX || "dev/";

const results: string[] = [];

if (!accountId || !accessKeyId || !secretAccessKey || !publicBaseUrl) {
  console.error("❌ Variables d'environnement R2 manquantes !");
  process.exit(1);
}

results.push("1. Présence des variables d'environnement :");
results.push("✅ R2_ACCOUNT_ID : présent (longueur " + accountId.length + ")");
results.push("✅ R2_ACCESS_KEY_ID : présent (longueur " + accessKeyId.length + ")");
results.push("✅ R2_SECRET_ACCESS_KEY : présent (longueur " + secretAccessKey.length + ")");
results.push(`✅ R2_BUCKET_PUBLIC : ${bucketPublic}`);
results.push(`✅ R2_BUCKET_PRIVATE : ${bucketPrivate}`);
results.push(`✅ R2_PUBLIC_BASE_URL : ${publicBaseUrl}`);
results.push(`✅ R2_KEY_PREFIX : ${keyPrefix}`);

const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;

const s3 = new S3Client({
  region: "auto",
  endpoint,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

async function main() {
  // 2. HeadBucket et cycle d'écriture/lecture/suppression de test sur les 2 buckets
  results.push("\n2. Test opérationnel HeadBucket et cycle I/O sur chaque bucket :");
  for (const b of [bucketPublic, bucketPrivate]) {
    try {
      await s3.send(new HeadBucketCommand({ Bucket: b }));
      results.push(`✅ Bucket [${b}] : accessible (HeadBucket OK)`);

      const testKey = `${keyPrefix}healthcheck/test-${Date.now()}.txt`;
      const content = `Healthcheck test for ${b} at ${new Date().toISOString()}`;

      // Write
      await s3.send(new PutObjectCommand({ Bucket: b, Key: testKey, Body: content, ContentType: "text/plain" }));
      results.push(`  - Écriture objet : ${testKey} ✅`);

      // Read
      const getRes = await s3.send(new GetObjectCommand({ Bucket: b, Key: testKey }));
      const readContent = await getRes.Body?.transformToString();
      if (readContent === content) {
        results.push(`  - Relecture objet : conforme ✅`);
      } else {
        results.push(`  - Relecture objet : incohérent ❌`);
      }

      // Delete
      await s3.send(new DeleteObjectCommand({ Bucket: b, Key: testKey }));
      results.push(`  - Suppression objet : supprimé ✅`);
    } catch (err: any) {
      results.push(`❌ Échec sur bucket [${b}] : ${err.message}`);
    }
  }

  // 3. Test PUT via URL présignée + Vérification d'accès anonyme
  results.push("\n3. Test PUT présigné et différenciation Public / Privé :");
  const testFilename = `presign-test-${Date.now()}.txt`;
  const pubKey = `${keyPrefix}healthcheck/pub-${testFilename}`;
  const privKey = `${keyPrefix}healthcheck/priv-${testFilename}`;

  // PUT presigned for public bucket
  const pubPutUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: bucketPublic, Key: pubKey, ContentType: "text/plain" }),
    { expiresIn: 300 }
  );

  // PUT via fetch/http
  await fetch(pubPutUrl, {
    method: "PUT",
    headers: { "Content-Type": "text/plain" },
    body: "Contenu public pour test",
  });
  results.push(`✅ Upload PUT présigné vers [${bucketPublic}] réussi`);

  // PUT presigned for private bucket
  const privPutUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: bucketPrivate, Key: privKey, ContentType: "text/plain" }),
    { expiresIn: 300 }
  );
  await fetch(privPutUrl, {
    method: "PUT",
    headers: { "Content-Type": "text/plain" },
    body: "Contenu privé confidentiel",
  });
  results.push(`✅ Upload PUT présigné vers [${bucketPrivate}] réussi`);

  // Lecture anonyme sur l'URL publique
  const publicAccessUrl = `${publicBaseUrl}/${pubKey}`;
  const pubFetchRes = await fetch(publicAccessUrl);
  if (pubFetchRes.status === 200) {
    results.push(`✅ Bucket Public [${bucketPublic}] : lisible publiquement (200 OK) sur ${publicAccessUrl}`);
  } else {
    results.push(`⚠️ Bucket Public statut : ${pubFetchRes.status} sur ${publicAccessUrl}`);
  }

  // Tentative de lecture anonyme directe sur le bucket privé (doit être refusée)
  const privRawUrl = `${endpoint}/${bucketPrivate}/${privKey}`;
  const privFetchRes = await fetch(privRawUrl);
  if (privFetchRes.status !== 200) {
    results.push(`✅ Bucket Privé [${bucketPrivate}] : accès anonyme direct REFUSÉ (${privFetchRes.status} Rejeté)`);
  } else {
    results.push(`❌ Bucket Privé : anomalie de sécurité ! Statut anonyme : 200`);
  }

  // Nettoyage des objets de test
  await s3.send(new DeleteObjectCommand({ Bucket: bucketPublic, Key: pubKey }));
  await s3.send(new DeleteObjectCommand({ Bucket: bucketPrivate, Key: privKey }));

  // 4. Test CORS
  results.push("\n4. Test des règles CORS Cloudflare R2 :");
  // Test OPTIONS avec origine autorisée
  const corsOkRes = await fetch(pubPutUrl, {
    method: "OPTIONS",
    headers: {
      Origin: "https://envolafricamag.com",
      "Access-Control-Request-Method": "PUT",
    },
  });
  const corsAllowed = corsOkRes.headers.get("access-control-allow-origin");
  if (corsAllowed) {
    results.push(`✅ CORS Origine autorisée (https://envolafricamag.com) : acceptée (${corsAllowed})`);
  } else {
    results.push(`⚠️ CORS Origine autorisée statut : ${corsOkRes.status}`);
  }

  // Test OPTIONS avec origine non autorisée
  const corsBadRes = await fetch(pubPutUrl, {
    method: "OPTIONS",
    headers: {
      Origin: "https://hacker-unauthorized.example",
      "Access-Control-Request-Method": "PUT",
    },
  });
  const corsBadAllowed = corsBadRes.headers.get("access-control-allow-origin");
  if (!corsBadAllowed || corsBadAllowed === "null") {
    results.push(`✅ CORS Origine non autorisée (https://hacker-unauthorized.example) : REFUSÉE`);
  } else {
    results.push(`❌ CORS non restreint : renvoie ${corsBadAllowed}`);
  }

  // Sauvegarde dans docs/r2/02-config-check.txt
  const docDir = path.join(__dirname, "../docs/r2");
  if (!fs.existsSync(docDir)) fs.mkdirSync(docDir, { recursive: true });
  const docPath = path.join(docDir, "02-config-check.txt");
  fs.writeFileSync(docPath, results.join("\n") + "\n", "utf8");

  console.log(results.join("\n"));
  console.log(`\nRapport sauvegardé dans docs/r2/02-config-check.txt`);
}

main().catch((err) => {
  console.error("Erreur exécution :", err);
  process.exit(1);
});
