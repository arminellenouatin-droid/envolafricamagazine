const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("=== EXÉCUTION VÉRIFICATIONS STATIQUES ET SÉCURITÉ CLOUDFLARE R2 ===");

const envLocalPath = path.join(__dirname, '../.env.local');
const env = {};
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
    if (match) {
      let val = match[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[match[1]] = val;
    }
  });
}

const r2Secret = env.R2_SECRET_ACCESS_KEY;
const r2Key = env.R2_ACCESS_KEY_ID;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const results = [];

// 1. Audit secret in .next/static/
console.log("1. Recherche de secrets dans .next/static/ ...");
const staticDir = path.join(__dirname, '../.next/static');
let leakedSecrets = [];

function searchInDir(dir, secrets) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchInDir(fullPath, secrets);
    } else if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.css') || file.endsWith('.json') || file.endsWith('.html'))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const [name, val] of Object.entries(secrets)) {
        if (val && val.length > 5 && content.includes(val)) {
          leakedSecrets.push({ file: fullPath, secretName: name });
        }
      }
    }
  }
}

searchInDir(staticDir, {
  R2_SECRET_ACCESS_KEY: r2Secret,
  R2_ACCESS_KEY_ID: r2Key,
  SUPABASE_SERVICE_ROLE_KEY: serviceKey,
});

if (leakedSecrets.length === 0) {
  console.log("✅ Aucun secret R2 trouvé dans .next/static/ !");
  results.push("1. Recherche dans .next/static/ : ✅ 0 occurrence de secrets (R2_SECRET_ACCESS_KEY, R2_ACCESS_KEY_ID, SUPABASE_SERVICE_ROLE_KEY)");
} else {
  console.error("❌ Fuite de secret détectée dans .next/static/ :", leakedSecrets);
  results.push(`1. Recherche dans .next/static/ : ❌ ${leakedSecrets.length} fuite(s) détectée(s)`);
}

// 2. Vérification des variables NEXT_PUBLIC_
console.log("2. Vérification des variables NEXT_PUBLIC_...");
let nextPublicErrors = [];
for (const [k] of Object.entries(env)) {
  if (k.startsWith('NEXT_PUBLIC_')) {
    if (k.toLowerCase().includes('secret') || k.toLowerCase().includes('r2_access') || k.toLowerCase().includes('service_role') || k.toLowerCase().includes('private')) {
      nextPublicErrors.push(k);
    }
  }
}
if (nextPublicErrors.length === 0) {
  console.log("✅ Aucune variable NEXT_PUBLIC_ ne contient de secret R2 !");
  results.push("2. Préfixe NEXT_PUBLIC_ : ✅ Aucune variable publique ne porte de nom ou contenu de secret");
} else {
  console.error("❌ Variables sensibles en NEXT_PUBLIC_ :", nextPublicErrors);
  results.push("2. Préfixe NEXT_PUBLIC_ : ❌ Variables suspectes : " + nextPublicErrors.join(', '));
}

// 3. npm audit --omit=dev
console.log("3. npm audit --omit=dev ...");
let auditOutput = "";
try {
  auditOutput = execSync('npm audit --omit=dev', { encoding: 'utf8' });
  console.log("Audit passé.");
} catch (err) {
  auditOutput = (err.stdout || "") + "\n" + (err.stderr || "");
}
results.push("3. npm audit --omit=dev :\n" + auditOutput.trim());

// 4. Sauvegarder dans docs/r2/04-security-check.txt
const docDir = path.join(__dirname, '../docs/r2');
if (!fs.existsSync(docDir)) fs.mkdirSync(docDir, { recursive: true });
const docPath = path.join(docDir, '04-security-check.txt');
fs.writeFileSync(docPath, `=== VÉRIFICATIONS SÉCURITÉ CLOUDFLARE R2 (PHASE 6) ===\nDate: ${new Date().toISOString()}\n\n` + results.join('\n\n') + '\n', 'utf8');
console.log("Résultats écrits dans docs/r2/04-security-check.txt");
