# MATRICE DES VARIABLES D'ENVIRONNEMENT — ENVOL AFRICA
## Configuration, Niveaux de Sensibilité et Déploiement Sécurisé
> **Conformité stricte AGENTS.md :** Aucune valeur de secret n'est mentionnée dans ce document.  
> **Date :** 10 Octobre 2026

---

## 1. VARIABLES D'ENVIRONNEMENT PUBLIQUES (Client-Side)

Ces variables sont préfixées par `NEXT_PUBLIC_` et sont injectées dans le bundle JavaScript navigateur :

| Nom de la Variable | Environnements Requis | Sensibilité | Description |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Dev, Staging, Production | Public | URL canonique du site (`https://www.envolafrica.site`) |
| `NEXT_PUBLIC_BASE_URL` | Dev, Staging, Production | Public | URL de base pour les requêtes relatives/absolues |
| `NEXT_PUBLIC_SUPABASE_URL` | Dev, Staging, Production | Public | URL du projet Supabase (accès API PostgREST) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Dev, Staging, Production | Public | Clé anonyme publique Supabase (protégée par RLS) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Dev, Staging, Production | Public | Alias clé publique Supabase |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Production | Public | Identifiant Google Analytics 4 (Consent Mode requis) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Dev, Staging, Production | Public | Client ID Google OAuth / One Tap |
| `NEXT_PUBLIC_AGORA_APP_ID` | Dev, Staging, Production | Public | Identifiant public Agora Live Streaming |
| `NEXT_PUBLIC_R2_BASE_URL` | Dev, Staging, Production | Public | URL publique du CDN R2 pour les médias publics |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Production | Public | Clé publique pour les notifications Web Push |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | Production | Public | Identifiant client Google AdSense |
| `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID` | Production | Public | Identifiant éditeur Google AdSense |

---

## 2. SECRETS ET CLÉS SERVEUR UNIQUEMENT (Sensibles / Plateforme)

Ces variables ne doivent **JAMAIS** posséder le préfixe `NEXT_PUBLIC_`, ne jamais être incluses dans le bundle client, et être configurées en type **Sensitive** sur Vercel :

| Nom de la Variable | Niveaux Requis | Sensibilité | Rôle & Sécurité |
|---|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Dev, Staging, Production | **SECRET CRITIQUE** | Clé administrative Supabase (contourne la RLS). Serveur uniquement. |
| `SUPABASE_SECRET_KEY` | Dev, Staging, Production | **SECRET CRITIQUE** | Alias serveur Supabase. |
| `SUPABASE_JWT_SECRET` | Dev, Staging, Production | **SECRET CRITIQUE** | Clé de signature et vérification des tokens JWT Supabase. |
| `DATABASE_URL` | Production | **SECRET CRITIQUE** | Chaîne de connexion PostgreSQL directe (Prisma / Migrations). |
| `JWT_SECRET` | Dev, Staging, Production | **SECRET CRITIQUE** | Secret de hachage des sessions internes EAM (>= 32 car). |
| `DOWNLOAD_SECRET` | Dev, Staging, Production | **SECRET CRITIQUE** | Secret de génération des liens de téléchargement de magazines. |
| `MONEROO_SECRET_KEY` | Dev, Staging, Production | **SECRET CRITIQUE (FINANCE)** | Clé API secrète de la passerelle de paiement Moneroo. |
| `MONEROO_API_KEY` | Dev, Staging, Production | **SECRET CRITIQUE (FINANCE)** | Clé API marchande Moneroo. |
| `MONEROO_WEBHOOK_SECRET` | Dev, Staging, Production | **SECRET CRITIQUE (FINANCE)** | Secret de validation de signature HMAC des webhooks Moneroo. |
| `CHARIOW_SECRET_KEY` | Staging, Production | **SECRET CRITIQUE (FINANCE)** | Clé API secrète de la passerelle Chariow (Pulse). |
| `CHARIOW_PULSE_SIGNING_SECRET`| Staging, Production | **SECRET CRITIQUE (FINANCE)** | Secret de vérification de signature des webhooks Pulse Chariow. |
| `AGORA_APP_CERTIFICATE` | Dev, Staging, Production | **SECRET CRITIQUE** | Certificat primaire Agora pour la génération de tokens RTC/RTM. |
| `AGORA_NCS_SECRET` | Production | **SECRET CRITIQUE** | Secret de signature des webhooks d'enregistrement NCS Agora. |
| `R2_ACCOUNT_ID` | Dev, Staging, Production | **SECRET** | Identifiant de compte Cloudflare. |
| `R2_ACCESS_KEY_ID` | Dev, Staging, Production | **SECRET** | Identifiant de clé d'accès S3 Cloudflare R2. |
| `R2_SECRET_ACCESS_KEY` | Dev, Staging, Production | **SECRET CRITIQUE** | Clé secrète d'accès S3 Cloudflare R2. |
| `R2_BUCKET_PRIVATE` | Dev, Staging, Production | Sensible | Nom du bucket R2 pour les documents privés / KYC / factures. |
| `R2_BUCKET_PUBLIC` | Dev, Staging, Production | Sensible | Nom du bucket R2 pour les assets publics. |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Production | **SECRET CRITIQUE** | Compte de service Firebase Admin (Notifications FCM). |
| `ENVOL_ADS_SIGNING_SECRET` | Production | **SECRET CRITIQUE** | Secret HMAC pour la signature des jetons d'impression et clics pub. |
| `ENVOL_ADS_IP_SALT` | Production | **SECRET** | Sel cryptographique pour l'anonymisation des adresses IP en régie. |
| `CRON_SECRET` | Production | **SECRET** | Jeton d'authentification des routes de maintenance et cron jobs Vercel. |
| `INTERNAL_API_SECRET` | Production | **SECRET** | Jeton de communication entre micro-services internes. |
| `VAPID_PRIVATE_KEY` | Production | **SECRET** | Clé privée pour l'envoi de notifications Web Push. |

---

## 3. GARDE-FOUS DE SÉCURITÉ CONSTATÉS

1. **Aucun secret exposé** dans le code commité ou les fichiers de build client.
2. Le fichier `.env.local` est **strictement ignoré** par `.gitignore`.
3. Le fichier `.env.example` ne contient que des noms de variables et des valeurs factices.
4. Les variables financières (`MONEROO_*`, `CHARIOW_*`) sont strictement restreintes aux handlers d'API serveur.
