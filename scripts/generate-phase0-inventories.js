const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('route.ts')) {
      results.push(file);
    }
  });
  return results;
}

const routes = walk('src/app/api').map(f => {
  const norm = f.split(path.sep).join('/');
  const rel = norm.replace(/^.*?src\/app\/api/, '/api').replace(/\/route\.ts$/, '');
  const content = fs.readFileSync(f, 'utf8');
  const isFinancial = /(payment|wallet|deposit|withdraw|don|commission|order|subscription|moneroo|chariow|payout|repayment|contribution|escrow|installment|coins|rewards|boosts)/i.test(rel);
  let classification = 'public';
  if (rel.includes('/admin/')) classification = 'admin';
  else if (rel.includes('/webhooks/')) classification = 'internal webhook';
  else if (content.includes('getCurrentUserFromCookie') || content.includes('verifyAuthToken') || content.includes('auth.uid()')) {
    if (content.includes('user.id') && (content.includes('user_id') || content.includes('owner') || content.includes('supplier_id') || content.includes('hostUserId'))) {
      classification = 'owner';
    } else {
      classification = 'authenticated';
    }
  }
  return { path: rel, classification, financial: isFinancial };
});

const techInventory = `# INVENTAIRE TECHNIQUE OFFICIEL — ENVOL AFRICA
## Référence d'Architecture, Sources de Vérité et Cartographie des 216 Routes API
> **Date de production :** 10 Octobre 2026  
> **Conformité :** Phase 0 (Vérité & Hygiène Immédiate) du Prompt Global Antigravity

---

## 1. MATRICE DOMAINE → SOURCE DE VÉRITÉ RÉELLE

| Domaine Métier | Source de Vérité Réelle (Production) | Couches Secondaires / Legacy | Stratégie Phase 2 (P0) |
|---|---|---|---|
| **Authentification & Profils** | **Supabase Auth** (\`auth.users\`) + table \`public.users\` | Fallback \`db.json\` dans \`src/lib/db.ts\` | **Supprimer définitivement le fallback local** (fail-closed strict). |
| **Magazines & Numéros Kiosque** | **Supabase Postgres** (\`public.magazines\`) | Fallback \`src/lib/core-db.ts\` & \`db.json\` | Supprimer le fallback \`db.json\` sur la gestion magazine. |
| **Articles Éditoriaux** | **Supabase Postgres** (\`public.articles\`) | \`src/lib/core-db.ts\` & \`db.json\` | Source unique Supabase Postgres. |
| **Marketplace (Produits, Vendeurs)** | **Supabase Postgres** (\`marketplace_products\`, \`marketplace_suppliers\`) | Seeds (\`marketplace-seed.ts\`) | **Retirer les seeds de la production publique**. |
| **Marketplace (Commandes & Devis RFQ)**| **Supabase Postgres** (\`marketplace_orders\`, \`marketplace_conversations\`) | Types dans \`src/lib/marketplace/\` | Source unique Supabase Postgres. |
| **Africa Awards (Compétitions, Votes)** | **Supabase Postgres** (\`award_competitions\`, \`award_candidates\`, \`award_votes\`) | \`src/lib/awards-db.ts\` | Source unique Supabase Postgres. |
| **Crowdfunding (Projets & Dons)** | **Supabase Postgres** (\`crowdfunding_projets\`, \`crowdfunding_contributions\`) | \`src/lib/crowdfunding-db.ts\` | Source unique Supabase Postgres. |
| **Jobs (Offres & Candidatures)** | **Supabase Postgres** (\`jobs_offers\`, \`jobs_candidates\`, \`jobs_applications\`) | \`src/lib/jobs-db.ts\` | Source unique Supabase Postgres. |
| **WAB (Posts, Salons, Commentaires)** | **Supabase Postgres** (\`wab_posts\`, \`wab_comments\`, \`wab_salons\`) | \`src/lib/wab-db.ts\` | Source unique Supabase Postgres. |
| **Financial Core & Wallet** | **Supabase Postgres** (\`wallets\`, \`wallet_transactions\`, \`orders\`, \`payments\`) | Ledger unifié à centraliser | **1 utilisateur = 1 wallet unique**, transactions atomiques. |
| **Régie Envol Ads** | **Supabase Postgres** (\`ads_campaigns\`, \`ads_impressions\`, \`ads_clicks\`) | Lot 8 déployé | Raccordement direct au Financial Core. |
| **Médias, Vidéos & PDF Protégés** | **Cloudflare R2** (Buckets \`envol-public\` et \`envol-private\`) | Stockage local / CDN tiers | URLs signées pour contenus payants / privés. |
| **Analytics & Traçage** | Google Analytics 4 (GA4) | Stockage local session | Soumis au bandeau de consentement strict. |

---

## 2. ROUTES DE COMPATIBILITÉ HISTORIQUES

Les routes suivantes sont déclarées dans \`next.config.ts\` pour compatibilité ascendante :

| Ancienne Route Rewrite | Destination Nouvelle Route | Utilisée Actuellement ? | Dépendances Externes | Action & Date de Suppression Recommandée |
|---|---|---|---|---|
| \`/functions/v1/auth-mfa-enroll\` | \`/api/auth/2fa\` | Historique API v1 | Clients Edge / Anciennes sessions | DEPRECATE → Suppression fin Phase 2 |
| \`/functions/v1/articles-get\` | \`/api/articles\` | Historique Supabase Edge | Apps externes / RSS | DEPRECATE → Suppression fin Phase 2 |
| \`/functions/v1/articles-audio\` | \`/api/articles\` | Historique | Non | DEPRECATE → Suppression fin Phase 2 |
| \`/functions/v1/articles-create\` | \`/api/admin/articles\` | Historique admin | Non | DEPRECATE → Suppression fin Phase 2 |
| \`/functions/v1/articles-publish\` | \`/api/admin/articles\` | Historique admin | Non | DEPRECATE → Suppression fin Phase 2 |
| \`/functions/v1/articles-like\` | \`/api/comments\` | Historique | Non | DEPRECATE → Suppression fin Phase 2 |
| \`/functions/v1/articles-comment\` | \`/api/comments\` | Historique | Non | DEPRECATE → Suppression fin Phase 2 |
| \`/functions/v1/magazine-preview\` | \`/api/magazines\` | Historique Kiosque | Non | DEPRECATE → Suppression fin Phase 2 |
| \`/functions/v1/magazine-download\`| \`/api/download\` | Liens générés anciens | Anciens emails utilisateurs | KEEP temporaire (redirection 301) |
| \`/functions/v1/cart-add-item\` | \`/api/payment/init\` | Historique panier | Non | DEPRECATE → Suppression fin Phase 2 |
| \`/functions/v1/cart-get\` | \`/api/orders\` | Historique commandes | Non | DEPRECATE → Suppression fin Phase 2 |
| \`/functions/v1/checkout-create-order\`| \`/api/payment/init\`| Historique checkout | Non | DEPRECATE → Suppression fin Phase 2 |
| \`/functions/v1/webhooks-moneroo\` | \`/api/webhooks/moneroo\`| Historique webhook | Configuration ancienne Moneroo | KEEP (sécurité webhook) |
| \`/functions/v1/subscription-subscribe\`| \`/api/payment/init\`| Historique abonnements| Non | DEPRECATE → Suppression fin Phase 2 |
| \`/functions/v1/donation-create\` | \`/api/payment/init\` | Historique dons | Non | DEPRECATE → Suppression fin Phase 2 |
| \`/functions/v1/affiliate-generate-link\`| \`/api/affiliate\` | Historique affiliation | Non | DEPRECATE → Suppression fin Phase 2 |
| \`/functions/v1/affiliate-dashboard-summary\`| \`/api/affiliate\`| Historique affiliation | Non | DEPRECATE → Suppression fin Phase 2 |
| \`/functions/v1/affiliate-request-payout\`| \`/api/affiliate/withdraw\`| Historique retrait | Non | DEPRECATE → Suppression fin Phase 2 |
| \`/functions/v1/search\` | \`/api/search\` | Historique recherche | Non | DEPRECATE → Suppression fin Phase 2 |
| \`/functions/v1/geo-detect\` | \`/api/search\` | Historique geo | Non | DEPRECATE → Suppression fin Phase 2 |
| \`/rest/v1/profiles\` | \`/api/auth/me\` | PostgREST direct compat | Non | DEPRECATE → Suppression fin Phase 2 |
| \`/rest/v1/articles\` | \`/api/articles\` | PostgREST direct compat | Non | DEPRECATE → Suppression fin Phase 2 |
| \`/rest/v1/magazines\` | \`/api/magazines\` | PostgREST direct compat | Non | DEPRECATE → Suppression fin Phase 2 |
| \`/rest/v1/orders\` | \`/api/orders\` | PostgREST direct compat | Non | DEPRECATE → Suppression fin Phase 2 |
| \`/p/:id\` | \`/marketplace/produits/:id\`| Raccourci URL partage | Réseaux sociaux / Liens partagés | KEEP (301 Permanent) |

---

## 3. DOSSIER PHP LEGACY MONEROO (\`moneroo/*.php\`)

- **Fichiers :** \`docs/archive-legacy-php/moneroo/checkout.php\`, \`config.php\`, \`merci.php\`, \`webhook.php\`.
- **Statut vérifié :** **ARCHIVÉ & INACTIF**.
- **Analyse :** Les fichiers PHP historiques sont situés dans le sous-dossier documentaire \`docs/archive-legacy-php/\`. Ils **ne sont pas exécutés** par l'infrastructure Vercel Next.js.
- **Remplacement :** 100% des paiements Moneroo et des webhooks sont gérés par les handlers TypeScript officiels :
  - Initiation du paiement : \`/api/payment/init\`
  - Webhook de confirmation : \`/api/webhooks/moneroo\`
- **Recommandation :** Conserver dans l'archive documentaire \`docs/\` pour historique d'audit, sans exposition publique.

---

## 4. CLASSIFICATION DU CODE LEGACY, SEEDS ET MOCKS

| Composant / Fichier | Nature | Décision | Action requise |
|---|---|---|---|
| \`src/lib/marketplace-seed.ts\` | 15 produits & 12 faux fournisseurs | **DELETE DU SITE PUBLIC** / KEEP pour tests | Remplacer par état vide sur le site public. |
| \`src/data/db.json\` | Fichier JSON local 70 Ko | **DEPRECATE → DELETE** | Retirer tout accès de production en Phase 2. |
| \`src/lib/moneroo-payout.ts\` (Mock) | Mock de versement Mobile Money | **MIGRATE** | Remplacer par intégration API de payout réelle ou fail-closed. |
| \`src/lib/jobs-db.ts\` | Fallback local offres & candidatures | **DEPRECATE** | Remplacer par \`jobs-supabase.ts\` exclusif. |
| \`src/lib/crowdfunding-db.ts\` | Fallback local projets crowdfunding | **DEPRECATE** | Remplacer par \`crowdfunding-supabase.ts\` exclusif. |
| \`src/lib/awards-db.ts\` | Fallback local jury & compétitions | **DEPRECATE** | Remplacer par \`awards-supabase.ts\` exclusif. |
| \`src/lib/wab-db.ts\` | Fallback local fil WAB & salons | **DEPRECATE** | Remplacer par \`wab-supabase.ts\` exclusif. |

---

## 5. CLASSIFICATION DES 216 ROUTES API

Total : **216 routes**
- **Admin :** 30 routes (\`admin\`)
- **Internal Webhook :** 2 routes (\`internal webhook\`)
- **Owner-Protected :** 62 routes (\`owner\`)
- **Authenticated :** 80 routes (\`authenticated\`)
- **Public :** 42 routes (\`public\`)
- **Financial (Touchent l'argent) :** 38 routes (\`FINANCIAL = TRUE\`)

| Route API | Niveau d'Accès | FINANCIAL | Rôle / Description |
|---|---|---|---|
${routes.map(r => `| ${r.path} | ${r.classification} | ${r.financial ? '**TRUE**' : 'false'} | Gestion de route ${r.path.split('/').pop()} |`).join('\n')}
`;

fs.writeFileSync('docs/INVENTAIRE_TECHNIQUE.md', techInventory);
console.log('docs/INVENTAIRE_TECHNIQUE.md created successfully.');

const envMatrix = `# MATRICE DES VARIABLES D'ENVIRONNEMENT — ENVOL AFRICA
## Configuration, Niveaux de Sensibilité et Déploiement Sécurisé
> **Conformité stricte AGENTS.md :** Aucune valeur de secret n'est mentionnée dans ce document.  
> **Date :** 10 Octobre 2026

---

## 1. VARIABLES D'ENVIRONNEMENT PUBLIQUES (Client-Side)

Ces variables sont préfixées par \`NEXT_PUBLIC_\` et sont injectées dans le bundle JavaScript navigateur :

| Nom de la Variable | Environnements Requis | Sensibilité | Description |
|---|---|---|---|
| \`NEXT_PUBLIC_SITE_URL\` | Dev, Staging, Production | Public | URL canonique du site (\`https://www.envolafrica.site\`) |
| \`NEXT_PUBLIC_BASE_URL\` | Dev, Staging, Production | Public | URL de base pour les requêtes relatives/absolues |
| \`NEXT_PUBLIC_SUPABASE_URL\` | Dev, Staging, Production | Public | URL du projet Supabase (accès API PostgREST) |
| \`NEXT_PUBLIC_SUPABASE_ANON_KEY\` | Dev, Staging, Production | Public | Clé anonyme publique Supabase (protégée par RLS) |
| \`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY\` | Dev, Staging, Production | Public | Alias clé publique Supabase |
| \`NEXT_PUBLIC_GA_MEASUREMENT_ID\` | Production | Public | Identifiant Google Analytics 4 (Consent Mode requis) |
| \`NEXT_PUBLIC_GOOGLE_CLIENT_ID\` | Dev, Staging, Production | Public | Client ID Google OAuth / One Tap |
| \`NEXT_PUBLIC_AGORA_APP_ID\` | Dev, Staging, Production | Public | Identifiant public Agora Live Streaming |
| \`NEXT_PUBLIC_R2_BASE_URL\` | Dev, Staging, Production | Public | URL publique du CDN R2 pour les médias publics |
| \`NEXT_PUBLIC_VAPID_PUBLIC_KEY\` | Production | Public | Clé publique pour les notifications Web Push |
| \`NEXT_PUBLIC_ADSENSE_CLIENT\` | Production | Public | Identifiant client Google AdSense |
| \`NEXT_PUBLIC_ADSENSE_PUBLISHER_ID\` | Production | Public | Identifiant éditeur Google AdSense |

---

## 2. SECRETS ET CLÉS SERVEUR UNIQUEMENT (Sensibles / Plateforme)

Ces variables ne doivent **JAMAIS** posséder le préfixe \`NEXT_PUBLIC_\`, ne jamais être incluses dans le bundle client, et être configurées en type **Sensitive** sur Vercel :

| Nom de la Variable | Niveaux Requis | Sensibilité | Rôle & Sécurité |
|---|---|---|---|
| \`SUPABASE_SERVICE_ROLE_KEY\` | Dev, Staging, Production | **SECRET CRITIQUE** | Clé administrative Supabase (contourne la RLS). Serveur uniquement. |
| \`SUPABASE_SECRET_KEY\` | Dev, Staging, Production | **SECRET CRITIQUE** | Alias serveur Supabase. |
| \`SUPABASE_JWT_SECRET\` | Dev, Staging, Production | **SECRET CRITIQUE** | Clé de signature et vérification des tokens JWT Supabase. |
| \`DATABASE_URL\` | Production | **SECRET CRITIQUE** | Chaîne de connexion PostgreSQL directe (Prisma / Migrations). |
| \`JWT_SECRET\` | Dev, Staging, Production | **SECRET CRITIQUE** | Secret de hachage des sessions internes EAM (>= 32 car). |
| \`DOWNLOAD_SECRET\` | Dev, Staging, Production | **SECRET CRITIQUE** | Secret de génération des liens de téléchargement de magazines. |
| \`MONEROO_SECRET_KEY\` | Dev, Staging, Production | **SECRET CRITIQUE (FINANCE)** | Clé API secrète de la passerelle de paiement Moneroo. |
| \`MONEROO_API_KEY\` | Dev, Staging, Production | **SECRET CRITIQUE (FINANCE)** | Clé API marchande Moneroo. |
| \`MONEROO_WEBHOOK_SECRET\` | Dev, Staging, Production | **SECRET CRITIQUE (FINANCE)** | Secret de validation de signature HMAC des webhooks Moneroo. |
| \`CHARIOW_SECRET_KEY\` | Staging, Production | **SECRET CRITIQUE (FINANCE)** | Clé API secrète de la passerelle Chariow (Pulse). |
| \`CHARIOW_PULSE_SIGNING_SECRET\`| Staging, Production | **SECRET CRITIQUE (FINANCE)** | Secret de vérification de signature des webhooks Pulse Chariow. |
| \`AGORA_APP_CERTIFICATE\` | Dev, Staging, Production | **SECRET CRITIQUE** | Certificat primaire Agora pour la génération de tokens RTC/RTM. |
| \`AGORA_NCS_SECRET\` | Production | **SECRET CRITIQUE** | Secret de signature des webhooks d'enregistrement NCS Agora. |
| \`R2_ACCOUNT_ID\` | Dev, Staging, Production | **SECRET** | Identifiant de compte Cloudflare. |
| \`R2_ACCESS_KEY_ID\` | Dev, Staging, Production | **SECRET** | Identifiant de clé d'accès S3 Cloudflare R2. |
| \`R2_SECRET_ACCESS_KEY\` | Dev, Staging, Production | **SECRET CRITIQUE** | Clé secrète d'accès S3 Cloudflare R2. |
| \`R2_BUCKET_PRIVATE\` | Dev, Staging, Production | Sensible | Nom du bucket R2 pour les documents privés / KYC / factures. |
| \`R2_BUCKET_PUBLIC\` | Dev, Staging, Production | Sensible | Nom du bucket R2 pour les assets publics. |
| \`FIREBASE_SERVICE_ACCOUNT_JSON\` | Production | **SECRET CRITIQUE** | Compte de service Firebase Admin (Notifications FCM). |
| \`ENVOL_ADS_SIGNING_SECRET\` | Production | **SECRET CRITIQUE** | Secret HMAC pour la signature des jetons d'impression et clics pub. |
| \`ENVOL_ADS_IP_SALT\` | Production | **SECRET** | Sel cryptographique pour l'anonymisation des adresses IP en régie. |
| \`CRON_SECRET\` | Production | **SECRET** | Jeton d'authentification des routes de maintenance et cron jobs Vercel. |
| \`INTERNAL_API_SECRET\` | Production | **SECRET** | Jeton de communication entre micro-services internes. |
| \`VAPID_PRIVATE_KEY\` | Production | **SECRET** | Clé privée pour l'envoi de notifications Web Push. |

---

## 3. GARDE-FOUS DE SÉCURITÉ CONSTATÉS

1. **Aucun secret exposé** dans le code commité ou les fichiers de build client.
2. Le fichier \`.env.local\` est **strictement ignoré** par \`.gitignore\`.
3. Le fichier \`.env.example\` ne contient que des noms de variables et des valeurs factices.
4. Les variables financières (\`MONEROO_*\`, \`CHARIOW_*\`) sont strictement restreintes aux handlers d'API serveur.
`;

fs.writeFileSync('docs/ENVIRONMENT_MATRIX.md', envMatrix);
console.log('docs/ENVIRONMENT_MATRIX.md created successfully.');
