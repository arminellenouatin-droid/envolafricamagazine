# ENVOL AFRICA MAGAZINE — EAM

**Le magazine économique panafricain haut de gamme, rapide, multilingue, multi-devises. Inspiré de Jeune Afrique, avec une identité propre ENVOL AFRICA.**

Site officiel : Envol Africa Magazine (EAM) — magazine en ligne, boutique (Kiosque), porte d'entrée vers l'écosystème ENVOL AFRICA (Emploi, Marketplace, Financement participatif, Africa Awards, Salons, World Africa Business).

---

## 🚀 Fonctionnalités implémentées (100% opérationnelles)

### Public & rôles
- **Visiteur** : accueil, 12 premières lignes d'articles, Kiosque, dons, demande de service
- **Inscrit** : favoris, notifications, commentaires, likes, panier
- **Abonné** : lecture illimitée, audio, magazine gratuit/mois selon formule
- **Affilié/Parrain** : lien personnel, commission 10% (non abonné) / 25% (abonné)
- **Client Kiosque** : achat à l'unité format/langue au choix
- **Rédacteur / Rédacteur en chef / Gérant / Administrateur** (admin complet)

### Revenus
1. **Abonnements 4 formules** (tarif réduit 1er mois auto) :
   - Mensuel 5 000 F CFA (2 000 F 1er mois) • Annuel 42 000 F (3 500/mois) • Chef d'entreprise 20 000 F (15 000 1er mois) • Soutien 600 000 F/an Pack Prestige
2. **Kiosque** : CD Audio 5 000 F, Numérique 10 000 F, Papier 16 000 F + shipping auto par pays, Audio+PDF 12 000 F, Audio+Papier 18 000 F • 3 langues papier/numérique (FR/EN/ES), 12 langues audio (FR, EN, ES, SW, HA, YO, IG, FON, FF, ZU, EE-Mina, WO)
3. **Dons** : montant + paiement Moneroo
4. **Parrainage** : dashboard temps réel, retrait 150 000 F via Mobile Money/virement
5. **Publicité** : bandeaux accueil + footer

### Homepage (sections nommées comme spec)
- Bandeau supérieur (S'abonner, Kiosque, Emploi, Marketplace, Financement, Africa Awards, Salons, WAB) + langue/devise switcher
- Bande défilante titres à la une
- **Sentinelles / Essor / Ombre Douce** vedettes avec image/titre/auteur
- Carrousel couvertures magazines
- **Fil d'info** live + **Manager du mois**
- Classement plus lus
- Formations certifiées ENVOL AFRICA
- Tabs Financement/Formation/Concours
- Vidéos + aperçu prochain numéro + mosaïque écosystème ENVOL AFRICA
- Tout éditable depuis admin (sans refaire le site)

### Paywall sécurisé
- 12 premières lignes visibles pour tous, 3 lignes floues, puis CTA S'abonner
- **Sécurité serveur** : le reste du texte n'est JAMAIS envoyé au navigateur non abonné (API /api/articles/[slug] enforce)

### Kiosque & achat
- Mise en avant dernier numéro, scroll anciens, filtres année/type
- Choix **format PUIS langue** (jamais inverse), prix auto dans devise pays
- Aperçu limité 5 pages, liens de téléchargement sécurisés expirant en 24h

### Panier & paiement Moneroo
- Panier localStorage + sync, frais livraison calcul auto selon pays (SHIPPING_RATES)
- Paiement via **Moneroo** (Mobile Money MTN/Orange/Moov/Wave + carte), clé API `pvk_4lf37v|01KZ7F2SRWWFQ70JCRASB8YHEC` dans `.env.local`
- Aucune donnée bancaire stockée, vérification `GET /v1/payments/{id}/verify`
- Affiliate code auto rattaché si ?ref= dans URL

### Espace personnel / Compte
- Infos, préférences langue/devise, abonnement, historique achats/téléchargements, dashboard parrainage, favoris, commentaires, dons

### Mobile & Tablet
- Top icons (direct, panier, favs, messages, notif, langue, profil)
- Bottom bar fixe (Accueil, Kiosque, Emploi, Financement, Marketplace, Africa Awards, WAB)

### Sécurité (règles non négociables)
- Paywall serveur, liens expirants, pas de stockage CB, vérification paiement, 2FA obligatoire pour rôles équipe, RBAC (chacun voit seulement ses données), secrets jamais en code (env)

---

## 👤 Compte administrateur

**Nom : DAVAKAN — Prénom : Quentin**

- Email : `yekpondafe@gmail.com`
- Mot de passe : `3NAtiposy@22`
- Rôle : `admin` (tous droits : comptes, tarifs, langues/devises, sécurité, réglages)
- Affiliate Code : généré auto (ex: QUE2294)
- Hash bcrypt stocké dans `src/data/db.json`

Connexion : `/auth/login` → Espace admin : `/admin`

---

## 💳 Paiement Moneroo

Clé API fournie : `pvk_4lf37v|01KZ7F2SRWWFQ70JCRASB8YHEC` → `.env.local`

Intégration :
- `src/lib/moneroo.ts` → `initMonerooPayment()` POST `https://api.moneroo.io/v1/payments/initialize`
- `verifyMonerooPayment()` GET `https://api.moneroo.io/v1/payments/{id}/verify`
- Fallback mock si clé invalide en dev (checkout_url avec `?mock_success=1`)
- Méthodes : `card, mtn_bj, orange_bj, moov_bj, mtn_ci, orange_ci, wave, mtn` etc.

---

## 🛠️ Stack technique

- **Next.js 16.3.0** App Router + TypeScript + TailwindCSS 4 (design premium #0A1931 navy + #D4AF37 gold)
- **Auth** : JWT + bcryptjs, cookies httpOnly
- **DB** : JSON file `src/data/db.json` (persistance snapshot) + seed automatique 15 articles + 25 magazines + admin
- **Cart** : localStorage + API Orders
- **Affiliation** : tracking via `?ref=` → localStorage + cookie + API `/api/affiliate`

---

## 📦 Installation & lancement

```bash
npm install
# Seeder admin + contenus si besoin
node seed-admin.js

# Dev
npm run dev # http://localhost:3000

# Prod build
npm run build
npm run start
```

Env `.env.local` déjà configuré avec Moneroo.

---

## 🔗 Routes

- `/` Accueil premium
- `/article/[slug]` Lecture avec paywall
- `/kiosque` + `/kiosque/[id]` Achat magazine
- `/abonnement` 4 formules
- `/panier` Checkout Moneroo
- `/don` Dons
- `/affiliation` Programme parrain + dashboard
- `/compte/*` Espace perso (dashboard, abonnement, achats, parrainage, favoris, dons, paramètres)
- `/emploi, /marketplace, /financement, /africa-awards, /salons, /wab` Écosystème
- `/auth/login, /auth/register`
- `/admin` Dashboard complet (overview, articles, kiosque, users, orders, affiliation, settings)
- API : `/api/auth/*, /api/articles, /api/magazines, /api/payment/init, /api/payment/verify, /api/affiliate, /api/orders, /api/dons`

---

## 👨‍💻 Design professionnel

Palette : `#0A1931` navy profond, `#D4AF37` gold, `#FFFCF5` warm white. Typo : Playfair Display (titres serif premium) + Inter (corps). Composants : rounded-[24px], magazine-shadow, glass, ticker animé, blur paywall, gold-gradient. Responsive desktop/mobile avec bottom bar.

---

## 📌 Points restés à décider avec Quentin (selon spec)

- Contenu exact 7 blocs Fil d'info restants
- Pack Prestige Soutien (VIP à définir avec Gérant)
- Mesures px plan blocs accueil
- Compte pro DHL livraison papier
- Règles autorisation robots IA (ChatGPT etc.)
- Identifiants OAuth Google/Facebook prod

---

*ENVOL AFRICA GROUPE — Document technique — Août 2026*
