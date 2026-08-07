# DECISIONS.md - Journal des décisions Envol Africa Magazine

Format: Date | Question | Réponse | Validateur | Impact code

---

## Tickets en attente (Backlog non planifié - §1 RULES.md)

Ces tickets ne rentrent dans aucun sprint tant que blocage non levé. Statut "en attente" dès Sprint 0.

### 1. Contenu des 7 sous-blocs "Fil d'info" restants (§12.1)
- **Date:** 2026-08-07
- **Question:** Quel contenu pour les 7 sous-blocs restants du Fil d'info ? Proposition: Pouls du jour, Chronique, Focus Régional, Interview flash, Chiffre clé, Agenda ENVOL, Opportunité du jour. Validé ?
- **Réponse:** En attente validation Quentin + équipe éditoriale
- **Validateur:** Quentin
- **Impact:** `landing_blocks` table `article_id=null` pour 7 sous-blocs, UI back-office affiche message "En attente validation §12.1" au lieu de saisie libre. Implémenté dans Admin > Settings.

### 2. Entitlements pack prestige Soutien (600k/an) (§12.2)
- **Date:** 2026-08-07
- **Question:** Contenu exact pack prestige ? Proposition: invitation VIP 2 places gala Africa Awards, portrait interview magazine, logo Partenaire Soutien, accompagnement conseiller, salon privé B2B, badge distinctif. Validé ?
- **Réponse:** En attente validation Quentin + Gérant (impact contractuel/éditorial)
- **Validateur:** Quentin + Gérant
- **Impact:** `soutien_pack_entitlements` table créée vide/désactivée, pas d'entitlements codés en dur. Abonnement Soutien donne avantages Chef d'entreprise + mention "Pack prestige à définir".

### 3. Mesures pixels exactes plan blocs (§7.3.1, §6 RULES.md)
- **Date:** 2026-08-07
- **Question:** Plan PDF blocs avec mesures pixels fourni ? Dimensions Sentinelles 1000x1000, bloc secondaire 1000x460, Essor 460x460, Ombre douce 460x460, Clarté 700x933 exactes ?
- **Réponse:** PDF non encore reçu/lisible - en attente
- **Validateur:** Quentin
- **Impact:** Implémentation approximative responsive avec aspect-ratio, à ajuster une fois PDF reçu. Pas bloquant MVP.

### 4. Compte DHL Express entreprise (§12.3, §10 Sprint 10)
- **Date:** 2026-08-07
- **Question:** Compte DHL entreprise ouvert pour API MyDHL calcul frais internationaux ?
- **Réponse:** En attente ouverture compte par Quentin
- **Validateur:** Quentin
- **Impact:** Implémenté avec `SHIPPING_RATES` forfaitaire local Bénin/zone limitrophe + DHL API placeholder. Calcul frais dynamique panier avec pays, mais pas d'appel réel MyDHL. Job DHL à activer une fois compte ouvert.

### 5. Politique robots IA robots.txt (§17.3)
- **Date:** 2026-08-07
- **Question:** Autoriser GPTBot, Google-Extended, PerplexityBot, ClaudeBot à crawler métadonnées + contenu gratuit (bon pour visibilité IA) mais bloquer contenu payant complet ? Ou bloquer tous ?
- **Réponse:** En attente arbitrage stratégique Quentin
- **Validateur:** Quentin
- **Impact:** `robots.txt` actuel autorise public mais disallow /api/, /admin/, /compte/, /panier. `llms.txt` créé avec description site + conditions citation. À finaliser une fois arbitrage tranché.

### 6. Clés OAuth Google/Facebook production (§5.5)
- **Date:** 2026-08-07
- **Question:** Accès OAuth Google/Facebook prod fournis ?
- **Réponse:** Non fournis - en attente
- **Validateur:** Quentin
- **Impact:** Auth sociale avec boutons placeholder, OAuth flow non fonctionnel. Connexion email/téléphone custom JWT implémentée. À activer une fois clés fournies + Supabase Auth OAuth config.

---

## Écarts Stack Technique (RULES.md §5 - Stack verrouillée)

### 7. ORM: Drizzle vs Prisma
- **Date:** 2026-08-07
- **Question:** Cahier recommande Drizzle ORM (compatible Edge, pas de moteur binaire) vs Prisma utilisé (v5.22.0)
- **Réponse:** Choix Prisma pour rapidité MVP + équipe connaît Prisma, mais Drizzle plus cohérent avec Edge Functions Deno. Décision provisoire: garder Prisma pour Phase 1, migrer vers Drizzle Phase 3 si besoin Edge.
- **Validateur:** Agent + Quentin (à valider)
- **Impact:** `prisma/schema.prisma` utilisé, `lib/prisma.ts` avec fallback sandbox. À documenter.

### 8. Auth: Supabase Auth vs custom JWT
- **Date:** 2026-08-07
- **Question:** Cahier recommande Supabase Auth natif avec projet Auth unique partagé + cookie domaine racine .envolafrica.net pour SSO écosystème vs custom JWT `eam_token` httpOnly actuel
- **Réponse:** Custom JWT pour MVP rapide, mais SSO écosystème prévu Phase 3 nécessite Supabase Auth partagé. Décision: custom JWT Phase 1, migration Supabase Auth Phase 3.
- **Validateur:** Agent
- **Impact:** `lib/auth.ts` custom, pas de `auth.users` trigger. À migrer.

### 9. Recherche: Meilisearch vs JSON search
- **Date:** 2026-08-07
- **Question:** Cahier recommande Meilisearch auto-hébergé vs Algolia, implémentation actuelle JSON search dans `/api/search`
- **Réponse:** JSON search pour MVP (volume <100 articles), Meilisearch prévu Phase 3 avec indexation incrémentale.
- **Validateur:** Agent
- **Impact:** `/api/search` scope param mais pas Meilisearch.

### 10. Emailing: Resend vs Brevo
- **Date:** 2026-08-07
- **Question:** Resend + React Email recommandé (intégration Vercel) vs Brevo
- **Réponse:** Pas d'emailing implémenté MVP, à ajouter Phase 2 avec Resend.
- **Validateur:** Agent

### 11. Analytics: Plausible vs GA4
- **Date:** 2026-08-07
- **Question:** Plausible Analytics RGPD par défaut, GA4 en complément seulement si besoin pub
- **Réponse:** Aucun analytics implémenté MVP, à ajouter Phase 3 avec Plausible.
- **Validateur:** Agent

### 12. Image Optimization: Vercel Image Optimization vs Cloudinary
- **Date:** 2026-08-07
- **Question:** Vercel Image Optimization (next/image) recommandé, Cloudinary seulement si besoin avancé
- **Réponse:** Utilisé `<img>` tag, pas `next/image`. À migrer vers `next/image` pour WebP/AVIF + CDN.
- **Validateur:** Agent
- **Impact:** Images non optimisées WebP, à corriger.

### 13. Tests: Vitest + Playwright + Husky
- **Date:** 2026-08-07
- **Question:** Tests unitaires Vitest + E2E Playwright + Husky pre-commit + GitHub Actions portail qualité obligatoire avant merge main
- **Réponse:** Pas de tests implémentés, pas de Husky, pas de GitHub Actions, main non protégée. À ajouter avant recette Phase 1.
- **Validateur:** Agent
- **Impact:** Definition of Done §7 non respectée (point 4).

---

## Questions résolues

### 14. Moneroo key hardcodée
- **Date:** 2026-08-07
- **Question:** Clé Moneroo en dur dans `lib/moneroo.ts` ?
- **Réponse:** Corrigé, env only + mock dev
- **Validateur:** Agent
- **Impact:** `lib/moneroo.ts` utilise `process.env.MONEROO_API_KEY` uniquement.

### 15. Liens téléchargement expirants
- **Date:** 2026-08-07
- **Question:** Comment garantir liens expirants 24h ?
- **Réponse:** Implémenté JWT signé 24h via `lib/download.ts` + `/api/download/[token]` vérifie exp + achat
- **Validateur:** Agent

---

## Format futur
- Toute nouvelle question sera ajoutée ici avec statut en attente/en cours/validé.
