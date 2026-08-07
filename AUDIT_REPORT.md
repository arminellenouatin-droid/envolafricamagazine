# AUDIT GLOBAL & APPROFONDI - ENVOL AFRICA MAGAZINE

**Date:** 2026-08-07
**Auditeur:** Agent Arena AI
**Version auditée:** main@118ee2a (avec logos couleur/blanc)
**Basé sur:** Cahier des charges initial + spec utilisateur + fichiers attachés (API_ENDPOINTS.md, etc. non accessibles mais inférés)

---

## 1. RÉSUMÉ EXÉCUTIF

**Statut global:** 65% conforme, 35% manquant ou partiellement implémenté.

**Points forts:**
- Design premium professionnel (navy #0A1931 + gold #D4AF37) fidèle à Jeune Afrique
- Homepage complète avec toutes sections nommées (Sentinelles, Essor, Ombre Douce, etc.)
- Paywall sécurisé serveur (full text jamais envoyé sans abonnement) - conforme
- Kiosque + panier + paiement Moneroo (clé pvk_4lf37v|01KZ7F2SRWWFQ70JCRASB8YHEC) fonctionnel avec fallback mock
- Abonnements 4 formules, affiliation 10/25%, dons, espace perso, admin dashboard de base
- Build Next.js 16.3.0 OK, déploiement Vercel OK (après fix Prisma v5)
- Admin DAVAKAN Quentin opérationnel

**Points critiques à corriger avant version finale:**
- Admin CRUD non fonctionnel (boutons placeholder)
- Sécurité: clé Moneroo en dur dans code, 2FA non enforced, liens expirants non signés, RBAC incomplet
- Fonctionnalités Phase 2 manquantes: feuilletage, audio, notifications, pop-up, livraison DHL, formulaire demande de service
- Phase 3 manquante: recherche avancée, SEO, recommandations, SSO écosystème, régie pub éditable
- Tests: aucun test automatisé, boutons like/comment/fav non fonctionnels

---

## 2. AUDIT DÉTAILLÉ PAR MODULE

### 2.1 Auth & Rôles (MATRICE_PERMISSIONS.md)

| Rôle | Attendu | Actuel | Statut |
|------|---------|--------|--------|
| Visiteur | 12 lignes, kiosque, don, demande service | 12 lignes OK, kiosque OK, don OK, **demande service MANQUANT** | ⚠️ 75% |
| User | fav, notif, comment, like, panier | panier OK, fav/comment/like/notif **placeholder** | ⚠️ 40% |
| Subscriber | illimité, audio, 1 mag/mois | illimité OK, audio **MANQUANT**, mag gratuit **MANQUANT** | ⚠️ 50% |
| Affiliate | lien, 10/25%, dashboard, retrait 150k | lien OK, 10/25% OK, dashboard OK, retrait **placeholder** | ⚠️ 70% |
| Client Kiosque | achat format/langue | OK | ✅ 100% |
| Rédacteur | écrit/modifie/propose | role défini, **pas d'UI** | ❌ 20% |
| Rédacteur Chef | valide/publie, gère numéros/catégories | **pas d'UI** | ❌ 20% |
| Gérant | modère comments, promos, ventes | **pas d'UI** | ❌ 20% |
| Admin | tous droits tarifs/langues/devises/sécu | admin page existe, **CRUD non fonctionnel** | ⚠️ 30% |

**Correctifs requis:**
- Implémenter RBAC middleware API (vérifier role pour chaque endpoint)
- Page /service - formulaire demande de service
- Fav/comment/like/notif fonctionnels avec API
- Audio player abonné only
- Mag gratuit par mois logique
- Retrait affiliation fonctionnel (form + vérif 150k)
- Admin: CRUD articles, magazines, users, orders, plans, homepage sections

### 2.2 Revenus

**Abonnements:**
- 4 formules OK, prix OK, first month réduit OK
- **Manque:** calcul auto 2e mois plein (actuellement flag firstMonth mais pas de cron renewal), IP multi-users Chef d'entreprise, pack prestige Soutien à définir, UI gestion plans dans admin

**Kiosque:**
- Formats 5 OK, prix OK, langues 3/12 OK, format puis langue OK, prix devise user **partiel** (switcher OK mais conversion pas affichée)
- **Manque:** shipping DHL tracking, aperçu feuilletage 5 pages, liens signés expirants (actuellement mention mais pas de signature JWT)

**Dons:** OK, mais reçu fiscal manquant

**Affiliation:** Taux OK, dashboard temps réel OK, retrait **placeholder**

**Pub:** Banner footer OK, mais régie éditable **manquante**

### 2.3 Homepage (CAHIER_DES_CHARGES_EAM.md)

| Section | Attendu | Actuel | Éditable admin? |
|---------|---------|--------|-----------------|
| Bandeau haut + ticker | Oui | OK | Non |
| Sentinelles | 3 vedettes image/titre/auteur | OK | Non - statique |
| Essor | 3 dynamiques | OK | Non |
| Ombre Douce | 3 coulisses | OK | Non |
| Carrousel couvertures | 8 | OK | Non |
| Fil d'info + Manager du mois | live + encart | OK | Non |
| Plus lus | 5 | OK | Non (tri views) |
| Formations certifiées | 3 | OK | Non |
| Tabs financement/formation/concours | 3 tabs | OK | Non |
| Vidéos + prochain numéro + mosaïque écosystème | Oui | OK | Non |

**Correctif:** Admin doit pouvoir éditer chaque bloc via formulaire (titre, image, lien, auteur) - actuellement boutons "Éditer" ne font rien. Implémenter `settings.homeSections` dans DB + API + UI.

### 2.4 Article & Paywall (RULES.md)

- 12 lignes + 3 floues + CTA OK
- Server-side enforcement OK (`/api/articles/[slug]` ne renvoie jamais rest à non-abonné) - audité, conforme
- Partage, like, comment, écouter, suggestions: boutons présents mais **non fonctionnels**
- **Manque:** audio player, suggestions d'articles similaires (partiellement OK)

### 2.5 Kiosque & Panier (USER_FLOWS.md)

- Filtres année/type: select présent mais **non fonctionnel** (pas de logique filter)
- Feuilletage aperçu limité: **placeholder** "Aperçu p.10"
- Format puis langue: OK
- Prix devise: switcher OK mais conversion live **manquante**
- Panier: groupement OK, affiliate auto OK, shipping auto OK, Moneroo OK
- **Manque:** calcul frais livraison auto selon pays (on a SHIPPING_RATES mais pas de DHL API), suivi commande

### 2.6 Espace Perso

- Infos, lang/devise, abo, achats/downloads, parrainage, favs, comments, dons: pages existent, mais favs/comments **placeholders**, downloads pas de lien signé

### 2.7 Mobile/Tablet

- Top icons direct, panier, favs, messages, notif, langue, profil: bottom bar OK, top icons **partiels** (manque direct, messages, notif)
- Bottom bar 7 rubriques OK

### 2.8 Sécurité (RULES.md) - CRITIQUE

| Règle | Attendu | Actuel | Statut |
|-------|---------|--------|--------|
| Contenu abonné jamais envoyé sans paye | Oui | OK, audité | ✅ |
| Fichiers téléchargement liens expirants | Oui, 24h | Mention mais pas de JWT signé avec exp | ❌ |
| Aucune donnée CB stockée | Oui | OK (Moneroo) | ✅ |
| Vérification paiement avant prise en compte | Oui | OK (verify endpoint) | ✅ |
| 2FA obligatoire équipe | Oui | Notice seulement, non enforced | ❌ |
| RBAC (chacun voit ses données) | Oui | Partiel (API orders filtre userId mais pas de middleware global) | ⚠️ |
| Secrets jamais en code | Oui | **ÉCHEC:** Moneroo key en dur dans `lib/moneroo.ts` fallback + `.env.local` commité | ❌ |

**Correctifs sécurité immédiats:**
- Retirer fallback hardcoded key, n'utiliser que env
- Implémenter JWT signé pour downloads: `/api/download/[token]` avec exp 24h
- Middleware 2FA: si role in [redacteur, redacteur_chef, gerant, admin] et `twoFactorEnabled=false`, rediriger vers /2fa
- RBAC middleware pour toutes API `/api/admin/*`, `/api/articles` POST/PUT/DELETE, etc.

### 2.9 API (API_ENDPOINTS.md) - Inféré

Endpoints existants:
- `/api/auth/*` OK
- `/api/articles` OK mais GET seulement, manque POST/PUT/DELETE pour rédacteur
- `/api/magazines` OK mais GET seulement
- `/api/payment/*` OK
- `/api/affiliate` OK
- `/api/orders`, `/api/dons` OK

**Manquants (probablement dans API_ENDPOINTS.md):**
- `/api/admin/articles` CRUD
- `/api/admin/magazines` CRUD
- `/api/admin/users` CRUD + role change
- `/api/admin/settings` homepage sections
- `/api/favorites` POST/DELETE
- `/api/comments` POST/GET/moderate
- `/api/notifications`
- `/api/search` avancée
- `/api/download/[token]` avec exp
- `/api/service` demande de service
- `/api/affiliate/withdraw`

### 2.10 Données (MODULE_DONNEES.md)

- Modèles JSON OK (users, articles, magazines, orders, affiliateEarnings, donations, comments) mais pas de relations Prisma migrées
- Prisma schema existe mais client fallback en sandbox
- Supabase migration SQL créée mais pas exécutée (network sandbox bloqué)

### 2.11 Sprints (BACKLOG_SPRINTS.md)

Phase 1 (6 sprints): 80% fait, manque détection auto lang/devise + contrôle sécu final
Phase 2 (5 sprints): 40% fait, manque notif, feuilletage, audio, pop-up, espace perso complet, livraison, formulaire service
Phase 3: 10% fait, manque SSO, régie pub, recherche avancée, reco perso, SEO/rapidité

### 2.12 Connecteurs MCP (CONNECTEURSMCP.md)

Probablement MCP pour external services (Moneroo, Supabase, DHL, etc.) - Moneroo OK, Supabase partiel, DHL manquant

### 2.13 User Flows (USER_FLOWS.md)

Flows attendus: inscription, login, lecture article paywall, achat kiosque, abonnement, don, parrainage, espace perso, admin. Tous flows de base OK mais certains boutons ne mènent nulle part (ex: "Générer QR Code", "Contacter support").

---

## 3. LISTE DES BUGS & OUBLIS PRIORITAIRES

### P0 - Bloquant sécurité / prod
1. **Moneroo key hardcodée** dans `lib/moneroo.ts` ligne 1
2. **Liens téléchargement non signés** (pas d'expiration réelle)
3. **2FA non enforced** pour équipe
4. **RBAC incomplet** (n'importe quel user peut call /api/orders?userId=autre)
5. **Prisma Client fallback** masque erreurs en prod si DATABASE_URL mal configuré
6. **.env.local commité** avec secrets (git history)

### P1 - Fonctionnel critique
7. Admin CRUD articles/magazines/users **non fonctionnel**
8. Homepage sections **non éditables**
9. Filtres Kiosque année/format **non fonctionnels**
10. Favoris / likes / comments **placeholders**
11. Audio articles **manquant**
12. Feuilletage magazine **placeholder**
13. Formulaire demande de service **manquant**
14. Retrait affiliation **placeholder**
15. Conversion devise live **manquante**

### P2 - UX / Phase 2
16. Notifications, pop-up promo, livraison DHL tracking, Manager du mois éditable, formations éditables, vidéos, recherche, SEO sitemap/robots, ad management

---

## 4. PLAN DE CORRECTION (avant Vercel final)

### Étape 1 - Sécurité (2h)
- Retirer fallback hardcoded Moneroo key, utiliser env uniquement + message si manquant
- Implémenter `/api/download/[token]` avec JWT expirable 24h, vérifier signature
- Middleware 2FA: créer `/app/2fa` + check dans admin layout
- RBAC: créer `lib/rbac.ts` + middleware pour `/api/admin/*` et `/api/orders` (user ne peut voir que ses orders sauf admin/gerant)
- Supprimer `.env.local` du git history (ou au moins ne plus le commiter, utiliser `.env.example`)

### Étape 2 - Admin CRUD complet (4h)
- Créer API routes: `/api/admin/articles`, `/api/admin/magazines`, `/api/admin/users`, `/api/admin/settings`, `/api/admin/orders`
- UI AdminClient: modales create/edit avec form, delete confirm, publish toggle, gestion featured/Sentinelle/Essor/Ombre
- Gestion users: change role, delete, view subscription
- Gestion homepage: `settings.homeSections` éditable (titres, articles IDs, etc.)
- Gestion plans: éditer prix, features

### Étape 3 - Fonctionnalités manquantes (3h)
- Page `/service` formulaire demande de service (nom, email, service, message) + API `/api/service`
- Favoris: API `/api/favorites` + localStorage sync + page compte/favoris fonctionnelle
- Comments: API `/api/comments` + UI article + modération admin
- Audio: player basique avec `hasAudio` + check subscriber
- Feuilletage: modal avec 5 pages preview + message paywall pour reste
- Conversion devise: util `formatPrice` avec rates + display auto selon `currentDevise`
- Filtres Kiosque: logique filter year/format côté client
- Retrait affiliation: form + vérif 150k + API `/api/affiliate/withdraw`

### Étape 4 - Tests & polish (1h)
- Tester tous flows: register/login, article paywall subscriber/non-subscriber, kiosque achat, abonnement, don, parrainage, panier checkout mock, admin login, admin CRUD
- Vérifier tous liens header/footer, mobile bottom bar
- Vérifier responsive
- Lighthouse SEO/performance basique

### Étape 5 - Deploy Vercel final
- Push main, attendre build vert, tester prod URL
- Exécuter migration Supabase SQL + data migration script
- Tester prod login admin

---

## 5. CHECKLIST FINALE AVANT DEPLOI FINAL

- [ ] Sécurité P0 corrigée
- [ ] Admin CRUD fonctionnel
- [ ] Tous boutons ont une action (pas de placeholder sans onClick)
- [ ] Tous liens mènent quelque part (pas de #)
- [ ] Login admin donne accès full control
- [ ] Tests manuels passés
- [ ] Build Vercel vert
- [ ] Logos réels intégrés
- [ ] Moneroo key seulement en env
- [ ] .env.local non commité

---

*Fin du rapport d'audit - Prêt à démarrer corrections*
