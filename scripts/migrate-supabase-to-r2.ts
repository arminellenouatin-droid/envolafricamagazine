import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { S3Client } from "@aws-sdk/client-s3";
import { MIME_TO_EXTENSION } from "../src/lib/storage/storage-rules";

console.log("=== SCRIPT DE MIGRATION SÉCURISÉE SUPABASE STORAGE → CLOUDFLARE R2 ===");

const args = process.argv.slice(2);
const isDryRun = !args.includes("--execute");
const limitSample = args.includes("--sample") ? 20 : 100;

console.log(`Mode : ${isDryRun ? "🔍 DRY-RUN (simulation sans écriture)" : "🚀 EXECUTION RÉELLE"}`);
console.log(`Limite d'échantillon : ${limitSample} fichiers max`);

// Charger .env.local
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
  console.error("Configuration Supabase manquante dans .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

const r2Config = {
  R2_ACCOUNT_ID: env.R2_ACCOUNT_ID,
  R2_BUCKET_PUBLIC: env.R2_BUCKET_PUBLIC || "envol-public",
  R2_BUCKET_PRIVATE: env.R2_BUCKET_PRIVATE || "envol-private",
  R2_KEY_PREFIX: env.R2_KEY_PREFIX || "dev/",
};

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: env.R2_SECRET_ACCESS_KEY || "",
  },
});

async function runMigration() {
  const reportLines: string[] = [];
  reportLines.push(`# Rapport de Migration Supabase Storage → Cloudflare R2`);
  reportLines.push(`Date: ${new Date().toISOString()}`);
  reportLines.push(`Mode: ${isDryRun ? "DRY-RUN (Simulation)" : "EXECUTION RÉELLE"}\n`);

  // 1. Lister les objets dans les buckets Supabase existants
  const targetBuckets = ["article-media", "wab-media", "marketplace", "jobs-cvs"];
  let totalDiscovered = 0;
  let totalBytes = 0;
  const filesToMigrate: Array<{ bucket: string; name: string; size: number; contentType: string }> = [];

  for (const b of targetBuckets) {
    const { data: list, error } = await supabase.storage.from(b).list("", { limit: limitSample });
    if (error) {
      console.log(`Bucket [${b}] non accessible ou vide : ${error.message}`);
      continue;
    }

    if (list) {
      for (const item of list) {
        if (item.name && item.id) {
          totalDiscovered++;
          const size = item.metadata?.size || 0;
          totalBytes += size;
          filesToMigrate.push({
            bucket: b,
            name: item.name,
            size,
            contentType: item.metadata?.mimetype || "application/octet-stream",
          });
        }
      }
    }
  }

  console.log(`\nFichiers découverts dans Supabase Storage : ${totalDiscovered}`);
  console.log(`Volume total estimé : ${(totalBytes / (1024 * 1024)).toFixed(2)} Mo`);

  reportLines.push(`## 1. Inventaire`);
  reportLines.push(`- Fichiers découverts : ${totalDiscovered}`);
  reportLines.push(`- Volume total : ${(totalBytes / (1024 * 1024)).toFixed(2)} Mo`);

  let migratedCount = 0;
  let failedCount = 0;

  for (const file of filesToMigrate) {
    try {
      // Télécharger depuis Supabase
      const { data: fileBlob, error: dlError } = await supabase.storage.from(file.bucket).download(file.name);
      if (dlError || !fileBlob) {
        throw new Error(`Téléchargement Supabase échoué : ${dlError?.message}`);
      }

      const buffer = Buffer.from(await fileBlob.arrayBuffer());
      const r2Bucket = file.bucket.includes("cv") || file.bucket.includes("digital") ? r2Config.R2_BUCKET_PRIVATE : r2Config.R2_BUCKET_PUBLIC;
      const r2Key = `${r2Config.R2_KEY_PREFIX}migrated/${file.bucket}/${file.name}`;

      if (!isDryRun) {
        // Envoi vers R2
        await s3.send(
          new PutObjectCommand({
            Bucket: r2Bucket,
            Key: r2Key,
            Body: buffer,
            ContentType: file.contentType,
          })
        );

        // Sauvegarder dans la table de backup
        await supabase.from("storage_migration_backup").insert({
          table_name: file.bucket,
          column_name: "path",
          record_id: file.name,
          old_value: `${file.bucket}/${file.name}`,
          new_key: r2Key,
        });
      }

      migratedCount++;
      console.log(`[${isDryRun ? "DRY-RUN" : "MIGRÉ"}] ${file.bucket}/${file.name} -> ${r2Key} (${(buffer.length / 1024).toFixed(1)} Ko)`);
    } catch (err: any) {
      failedCount++;
      console.error(`❌ Échec pour ${file.name} : ${err.message}`);
    }
  }

  reportLines.push(`\n## 2. Résultat de la passe`);
  reportLines.push(`- Fichiers traités : ${migratedCount}`);
  reportLines.push(`- Échecs : ${failedCount}`);
  reportLines.push(`- Règle de sécurité respectée : **Aucun fichier supprimé de Supabase Storage**.`);
  reportLines.push(`\n## 3. Requête SQL de Rollback d'urgence`);
  reportLines.push("```sql");
  reportLines.push("-- Rejouer les anciennes valeurs depuis la table d'audit :");
  reportLines.push("select * from public.storage_migration_backup;");
  reportLines.push("```");

  const docDir = path.join(__dirname, "../docs/r2");
  if (!fs.existsSync(docDir)) fs.mkdirSync(docDir, { recursive: true });
  fs.writeFileSync(path.join(docDir, "05-migration-report.md"), reportLines.join("\n"), "utf8");
  console.log("\nRapport écrit dans docs/r2/05-migration-report.md");
}

runMigration().catch(console.error);
