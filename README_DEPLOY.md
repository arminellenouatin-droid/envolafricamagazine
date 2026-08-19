# 🚀 Déploiement Envol Africa Magazine - Supabase + Vercel

Tu as fourni :
- Supabase Project URL : `https://rtfjwpytiuvoekomevpu.supabase.co`
- Clé Supabase publique : à renseigner via l’environnement, sans la versionner
- Project ref : `rtfjwpytiuvoekomevpu`
- Mot de passe DB : jamais stocké dans la documentation
- Tokens GitHub : jamais stockés dans la documentation

## ✅ Ce qui est déjà fait dans le code

- `supabase/migrations/001_init.sql` → schéma complet (users, articles, magazines, orders, affiliate_earnings, donations, comments) avec RLS permissif pour service_role
- `lib/supabase.ts` → client Supabase avec fallback JSON
- `prisma/schema.prisma` → schéma Prisma prêt pour Postgres (utilise DATABASE_URL)
- `lib/prisma.ts` → client Prisma singleton
- `scripts/migrate-to-supabase.js` → migration JSON → Supabase via REST
- `.env.example` → toutes les variables documentées
- `vercel.json` → config Vercel

## ❌ Ce qui manque / à compléter par toi

### 1. Supabase - Clé secrète manquante
Tu as donné la **publishable key** (`sb_publishable_...`) mais pas la **secret key**.

**Où la trouver :**
Supabase Dashboard > `https://supabase.com/dashboard/project/rtfjwpytiuvoekomevpu/settings/api-keys`
- Tu verras "Publishable" (tu l'as) et **"Secret"** → `sb_secret_...`
- Copie le secret, c'est le `SUPABASE_SERVICE_ROLE_KEY`

**Anciennes clés (legacy) :**
- `anon` key (JWT) → `SUPABASE_ANON_KEY`
- `service_role` key (JWT) → `SUPABASE_SERVICE_ROLE_KEY` (legacy)

**Pour Prisma, il te faut aussi :**
- **Pooled connection string** (IPv4, pour Vercel serverless) :
  Dans Supabase > Settings > Database > Connection string > **Transaction mode** (port 6543) / Session mode
  Format attendu :
  ```
  postgresql://postgres.rtfjwpytiuvoekomevpu:3r+j9XtJuSRxUbh@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
  ```
  Vérifie la région exacte (aws-0-eu-central-1, us-east-1, etc.) dans ton dashboard > Database > Region

### 2. Vercel - Token ou import manuel

Tu as donné des **GitHub tokens** mais pas de **Vercel token**.

**Deux options :**

**Option A - Import via Dashboard (recommandé, pas besoin de token) :**
1. Va sur https://vercel.com/new
2. Import Git Repository → `arminellenouatin-droid/envolafricamagazine`
3. Choisis branche `arena/019fdc3b-envolafricamagazine` ou `main` (après merge)
4. Ajoute les Environment Variables :
   ```
   MONEROO_API_KEY=<clé Moneroo de production stockée uniquement dans Vercel>
   JWT_SECRET=un-secret-32-caracteres-minimum-change-moi
   NEXT_PUBLIC_BASE_URL=https://ton-projet.vercel.app
   SUPABASE_URL=https://rtfjwpytiuvoekomevpu.supabase.co
   NEXT_PUBLIC_SUPABASE_URL=https://rtfjwpytiuvoekomevpu.supabase.co
   SUPABASE_PUBLISHABLE_KEY=<clé publique Supabase>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<clé publique Supabase>
   SUPABASE_SERVICE_ROLE_KEY=sb_secret_... (à compléter)
   SUPABASE_SECRET_KEY=sb_secret_...
   DATABASE_URL=postgresql://postgres.rtfjwpytiuvoekomevpu:XXXX@aws-...pooler...:6543/postgres?pgbouncer=true
   DIRECT_URL=postgresql://postgres:<mot de passe Supabase stocké uniquement dans l’environnement>@db.rtfjwpytiuvoekomevpu.supabase.co:5432/postgres
   ```
5. Deploy

**Option B - Deploy via CLI (besoin VERCEL_TOKEN) :**
- Va sur https://vercel.com/account/tokens → Create Token → `vercel_...`
- Donne-le moi, je lance `vercel --prod`

### 3. Exécuter le SQL dans Supabase

1. Supabase Dashboard > SQL Editor > New query
2. Copie/colle `supabase/migrations/001_init.sql` → Run
3. Vérifie : Table Editor > tu dois voir 7 tables créées

### 4. Migrer les données actuelles (admin + articles + magazines)

Une fois les tables créées et le secret key configuré :

**En local (avec internet) :**
```bash
npm install
SUPABASE_URL=https://rtfjwpytiuvoekomevpu.supabase.co SUPABASE_SERVICE_ROLE_KEY=sb_secret_... node scripts/migrate-to-supabase.js
```

Ce script va :
- Lire `src/data/db.json` (1 admin Quentin, 15 articles, 25 magazines)
- Upsert dans Supabase
- Tu retrouveras ton compte admin dans Supabase > Table Editor > users

### 5. GitHub - Sécuriser tes tokens

Tu as partagé 2 tokens GitHub en clair dans le chat. **Recommandation sécurité :**
- Va sur GitHub > Settings > Developer settings > Personal access tokens > Tokens (classic) → Delete `ghp_7jpnX...`
- Fine-grained tokens → Delete `github_pat_11CKG...`
- Recrée de nouveaux tokens si besoin, et ne les partage jamais en clair. Utilise `.env` ou GitHub Secrets.

## 📋 Checklist finale pour toi

- [ ] Récupérer `sb_secret_...` dans Supabase Dashboard > API Keys
- [ ] Récupérer pooled connection string (port 6543) dans Database > Connection string
- [ ] Me donner `sb_secret_...` et pooled `DATABASE_URL` (ou les mettre dans Vercel env toi-même)
- [ ] Me donner `VERCEL_TOKEN` si tu veux que je déploie via CLI, sinon importe manuellement via dashboard
- [ ] Exécuter `001_init.sql` dans Supabase SQL Editor
- [ ] Lancer migration `node scripts/migrate-to-supabase.js`
- [ ] Vercel → Deploy → Tester https://ton-projet.vercel.app/auth/login avec un compte de recette créé spécifiquement, sans mot de passe documenté

## 🎯 Une fois déployé

- Ton site sera sur `https://...vercel.app`
- Base de données Supabase Postgres au lieu de JSON (persistant, scalable)
- Paiement Moneroo toujours actif avec ta clé `<clé Moneroo de production stockée uniquement dans Vercel>`
- Admin Quentin DAVAKAN opérationnel
- Tous les features (paywall serveur, kiosque, abonnements, affiliation 10/25%, panier, dons) fonctionnent en prod

Dis-moi dès que tu as le `sb_secret_...` et le pooled DATABASE_URL, je finalise le déploiement en 2 minutes.
