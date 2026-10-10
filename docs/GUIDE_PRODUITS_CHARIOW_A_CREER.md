# GUIDE COMPLET : PRODUITS CHARIOW À CRÉER & CONNECTER
## Écosystème Monétisation Envol Africa Magazine

Ce document détaille la **liste exhaustive de tous les produits, abonnements et services payants** de la plateforme Envol Africa Magazine à créer dans votre boutique officielle [Chariow](https://mychariow.shop).

Pour chaque produit, vous trouverez :
- Le **Nom exact** à renseigner dans Chariow
- Le **Type de produit** (Fichier numérique, Abonnement récurrent, Don, Service/Accès)
- Le **Prix en XOF** (Franc CFA) et l'équivalent indicatif en **EUR (€)**
- La **Description commerciale prête à copier-coller**
- Le **Statut de connexion** (Déjà connecté ou À créer)
- La **Clé de configuration technique** correspondante dans le code (`src/lib/chariow.ts`)

---

## 1. PRODUITS DÉJÀ CRÉÉS & CONNECTÉS (PRIORITÉ 1 : FONCTIONNELS)

Ces trois produits sont déjà créés dans votre boutique et intégrés dans le sélecteur intelligent de paiement du site :

| Produit | Type | Prix (XOF) | Prix (€) | URL Chariow Actuelle | ID Produit |
|---|---|:---:|:---:|---|---|
| **Magazine Version Numérique** | Numérique (PDF) | 10 000 XOF | ~15,20 € | `https://toerbwke.mychariow.shop/prd_ac3bruo2` | `prd_ac3bruo2` |
| **Abonnement Mensuel Chef d’entreprise** | Abonnement | 20 000 XOF / mois | ~30,50 € | `https://toerbwke.mychariow.shop/prd_g8iz7mej` | `prd_g8iz7mej` |
| **Don & Soutien à la Presse Panafricaine** | Don / Mécénat | Libre (dès 1 000 XOF) | ~1,50 € | `https://toerbwke.mychariow.shop/prd_d1v11apk` | `prd_d1v11apk` |

---

## 2. KIOSQUE & ÉDITIONS DU MAGAZINE

Permet aux lecteurs internationaux et de la diaspora d'acheter des numéros uniques sous différents formats.

### 2.1 Magazine Version Papier (Exemplaire Physique)
- **Nom Chariow :** `Magazine Envol Africa — Version Papier (Livraison Postale)`
- **Type :** Produit physique / Livraison
- **Prix :** **16 000 XOF** (~24,40 €) *(Frais d'expédition inclus ou calculés à la commande)*
- **Description :**
  > *Exemplaire imprimé haute qualité du magazine économique Envol Africa. Impression sur papier glacé de prestige, analyses économiques approfondies, dossiers sectoriels et enquêtes exclusives. Expédié par voie postale sécurisée.*
- **Clé technique dans le code :** `magazinePapier`

### 2.2 Magazine Pack Duo (Audio + PDF Numérique)
- **Nom Chariow :** `Magazine Envol Africa — Pack Duo (Audio + PDF)`
- **Type :** Fichier numérique
- **Prix :** **12 000 XOF** (~18,30 €)
- **Description :**
  > *Le duo numérique complet : recevez immédiatement la version PDF haute résolution pour lecture sur tablette/ordinateur ainsi que la version CD Audio / Fichier Audio lue par nos professionnels.*
- **Clé technique dans le code :** `magazineAudioPdf`

### 2.3 Magazine Pack Intégral (Papier + Audio + PDF)
- **Nom Chariow :** `Magazine Envol Africa — Pack Intégral (Papier + Audio + PDF)`
- **Type :** Produit physique & numérique
- **Prix :** **18 000 XOF** (~27,45 €)
- **Description :**
  > *L'expérience complète Envol Africa : votre exemplaire papier livré chez vous, accompagné du PDF numérique haute définition et de la version audio multilingue.*
- **Clé technique dans le code :** `magazineIntegral`

### 2.4 Magazine Version Audio Seule
- **Nom Chariow :** `Magazine Envol Africa — Version Audio (Téléchargement)`
- **Type :** Fichier numérique / Audio
- **Prix :** **5 000 XOF** (~7,60 €)
- **Description :**
  > *Écoutez l'intégralité des analyses et articles du numéro sous forme de podcasts et fichiers audio professionnels, adaptés à vos déplacements.*
- **Clé technique dans le code :** `magazineAudio`

---

## 3. ABONNEMENTS LECTEURS & ENTREPRISES

Ces formules assurent vos revenus récurrents auprès des particuliers et des professionnels.

### 3.1 Abonnement Mensuel Lecteur Standard
- **Nom Chariow :** `Abonnement Mensuel Lecteur — Envol Africa`
- **Type :** Abonnement récurrent (Mensuel)
- **Prix :** **5 000 XOF / mois** (~7,60 €) *(Essai à 2 000 XOF le 1er mois)*
- **Description :**
  > *Accès illimité à l'ensemble des articles et enquêtes réservés aux abonnés sur le site web, écoute audio illimitée de tous les articles et 1 magazine numérique gratuit chaque mois.*
- **Clé technique dans le code :** `abonnementMensuel`

### 3.2 Abonnement Annuel Lecteur (12 mois)
- **Nom Chariow :** `Abonnement Annuel Lecteur — Envol Africa (Économisez 30%)`
- **Type :** Abonnement récurrent (Annuel)
- **Prix :** **42 000 XOF / an** (~64 €) *(au lieu de 60 000 XOF)*
- **Description :**
  > *12 mois d'accès illimité à l'actualité économique africaine : tous les avantages Mensuel, les 12 magazines numériques de l'année inclus, accès complet aux archives et invitations prioritaires aux webinaires.*
- **Clé technique dans le code :** `abonnementAnnuel`

### 3.3 Abonnement Annuel Chef d’entreprise (12 mois)
- **Nom Chariow :** `Abonnement Annuel Chef d’entreprise — Pack Décideurs`
- **Type :** Abonnement récurrent (Annuel)
- **Prix :** **168 000 XOF / an** (~256 €) *(au lieu de 240 000 XOF)*
- **Description :**
  > *Formule annuelle haut de gamme pour dirigeants et équipes : magazine papier livré chaque mois, version audio en avant-première, accès multi-utilisateurs jusqu'à 10 collaborateurs, invitations VIP aux salons professionnels et support dédié.*
- **Clé technique dans le code :** `abonnementAnnuelChefEntreprise`

### 3.4 Pack Mécène & Soutien Annuel (Prestige VIP)
- **Nom Chariow :** `Adhésion Mécène & Grand Soutien — Envol Africa`
- **Type :** Abonnement annuel / Mécénat
- **Prix :** **420 000 XOF / an** (~640 €)
- **Description :**
  > *Devenez grand mécène du journalisme économique panafricain. Inclut tous les avantages Chef d'entreprise, Pack Prestige VIP avec dîners institutionnels, rencontres exclusives avec la rédaction et mention de remerciement au tableau d'honneur.*
- **Clé technique dans le code :** `adhesionMecene`

---

## 4. EMPLOI & RECRUTEMENT (ENVOL AFRICA JOBS)

Permet de monétiser la plateforme de recrutement auprès des candidats et des entreprises de la diaspora.

### 4.1 Pass Candidat — 1 Semaine
- **Nom Chariow :** `Pass Candidat Emploi — 1 Semaine (Accès Illimité)`
- **Type :** Accès numérique à durée limitée
- **Prix :** **2 000 XOF** (~3,05 €)
- **Description :**
  > *7 jours d'accès complet pour décrypter toutes les offres d'emploi, accéder aux coordonnées des recruteurs et postuler sans limite sur Envol Africa Jobs.*
- **Clé technique dans le code :** `jobsCandidateWeek`

### 4.2 Pass Candidat — 1 Mois Pro
- **Nom Chariow :** `Pass Candidat Emploi — 1 Mois (Recherche Active)`
- **Type :** Accès numérique (30 jours)
- **Prix :** **5 000 XOF** (~7,60 €)
- **Description :**
  > *30 jours d'accès prioritaire à toutes les offres d'emploi en Afrique et auprès de la diaspora, mise en avant de votre profil dans la CVthèque consultée par les recruteurs.*
- **Clé technique dans le code :** `jobsCandidateMonth`

### 4.3 Publication d'Offre d'Emploi à l'Unité (Entreprise)
- **Nom Chariow :** `Publication d'Offre d'Emploi — Envol Africa Jobs`
- **Type :** Service numérique
- **Prix :** **1 000 XOF** (~1,50 €)
- **Description :**
  > *Publication et diffusion de votre offre d'emploi pendant 30 jours sur le portail Emploi d'Envol Africa. Réception directe des candidatures qualifiées.*
- **Clé technique dans le code :** `jobsEmployerPost`

### 4.4 Forfait Recruteur 1 Mois Pro (Publications Illimitées)
- **Nom Chariow :** `Forfait Recruteur Pro — 1 Mois (Publications Illimitées & CVthèque)`
- **Type :** Accès entreprise (30 jours)
- **Prix :** **22 000 XOF** (~33,50 €)
- **Description :**
  > *Publications d'offres illimitées pendant 30 jours, accès intégral à la CVthèque des cadres et talents africains, alertes directes et 1 magazine numérique du mois offert.*
- **Clé technique dans le code :** `jobsEmployerMonth`

---

## 5. WORLD AFRICA BUSINESS (RÉSEAU WAB)

### 5.1 Abonnement Compte Entreprise WAB Pro (Mensuel)
- **Nom Chariow :** `Abonnement Compte Entreprise WAB (Mensuel)`
- **Type :** Abonnement récurrent
- **Prix :** **5 000 XOF / mois** (~7,60 €)
- **Description :**
  > *Débloquez toutes les fonctionnalités B2B du réseau WAB : badge officiel Entreprise Vérifiée, publication et diffusion de vidéos sans restriction, création de salons professionnels privés et visibilité accrue.*
- **Clé technique dans le code :** `wabBusinessSubscription`

### 5.2 Pack WAB Coins — Pack Pro (500 Coins)
- **Nom Chariow :** `Pack WAB Coins — 500 Coins (+10% Bonus)`
- **Type :** Crédit virtuel
- **Prix :** **4 500 XOF** (~6,90 €)
- **Description :**
  > *500 WAB Coins pour booster vos publications, débloquer des contacts d'affaires et animer vos salons virtuels sur le réseau World Africa Business.*
- **Clé technique dans le code :** `wabCoinsPack500`

### 5.3 Pack WAB Coins — Pack VIP (1 200 Coins)
- **Nom Chariow :** `Pack WAB Coins — 1 200 Coins (+20% Bonus)`
- **Type :** Crédit virtuel
- **Prix :** **10 000 XOF** (~15,20 €)
- **Description :**
  > *1 200 WAB Coins pour vos campagnes de notoriété et promotions de marques sur le fil d'actualité WAB.*
- **Clé technique dans le code :** `wabCoinsPack1200`

---

## 6. AFRICA AWARDS

### 6.1 Pack de Votes Supporters (50 Votes)
- **Nom Chariow :** `Pack de 50 Votes — Africa Awards`
- **Type :** Produit numérique
- **Prix :** **4 500 XOF** (~6,90 €)
- **Description :**
  > *Attribuez 50 votes instantanés à votre candidat ou projet favori dans les compétitions de l'excellence africaine.*
- **Clé technique dans le code :** `awardsVotesPack50`

### 6.2 Pack de Votes Supporters (100 Votes)
- **Nom Chariow :** `Pack de 100 Votes — Africa Awards`
- **Type :** Produit numérique
- **Prix :** **8 000 XOF** (~12,20 €)
- **Description :**
  > *Pack officiel de 100 votes pour propulser votre candidat au classement des Africa Awards.*
- **Clé technique dans le code :** `awardsVotesPack100`

---

## 7. RÉGIE PUBLICITAIRE & ENVOL ADS (PRINT & WEB)

Permet aux entreprises internationales et annonceurs de commander et régler leurs encarts publicitaires par carte bancaire internationale en toute conformité.

### 7.1 Encart Publicitaire Magazine (1/4 de Page)
- **Nom Chariow :** `Encart Publicitaire Magazine (1/4 Page)`
- **Type :** Espace publicitaire print & digital
- **Prix :** **150 000 XOF** (~230 €)
- **Description :**
  > *Format 90 x 130 mm au cœur des rubriques spécialisées du magazine imprimé et de sa version numérique.*
- **Clé technique dans le code :** `adMagEncart`

### 7.2 Demi-Page Magazine (1/2 Page)
- **Nom Chariow :** `Demi-Page Publicitaire Magazine (1/2 Page)`
- **Type :** Espace publicitaire print & digital
- **Prix :** **300 000 XOF** (~460 €)
- **Description :**
  > *Format 180 x 130 mm, idéal pour les lancements de produits, annonces institutionnelles ou offres B2B.*
- **Clé technique dans le code :** `adMagDemiPage`

### 7.3 Pleine Page Magazine (1 Page A4 Entière)
- **Nom Chariow :** `Pleine Page Publicitaire Magazine (1 Page A4)`
- **Type :** Espace publicitaire print & digital
- **Prix :** **550 000 XOF** (~840 €)
- **Description :**
  > *Format 210 x 297 mm pour un impact visuel maximal auprès des 50 000+ décideurs et chefs d'entreprise lecteurs d'Envol Africa.*
- **Clé technique dans le code :** `adMagPleinePage`

### 7.4 Article Sponsorisé & Publi-reportage Éditorial
- **Nom Chariow :** `Article Sponsorisé & Publi-reportage Multi-canaux`
- **Type :** Prestation éditoriale et diffusion web
- **Prix :** **400 000 XOF** (~610 €)
- **Description :**
  > *Rédaction journalistique complète par notre rédaction, publication permanente à la Une du site web, inclusion dans la newsletter et relais sur nos réseaux sociaux officiels.*
- **Clé technique dans le code :** `adWebSponsoredArticle`

---

## 8. COMMENT CONNECTER CES PRODUITS DANS LE CODE APRÈS LEUR CRÉATION

Dès que vous créez un ou plusieurs de ces produits dans votre espace Chariow :
1. Copiez le lien de partage généré par Chariow (ex. `https://toerbwke.mychariow.shop/prd_xxxxxx`).
2. Ouvrez le fichier centralisé [`src/lib/chariow.ts`](file:///c:/Users/EliteBook/NOUVEAUX%20PROJETS/EAM%20final/workspace-01a006c0-f1ea-794b-ab86-9c66600c787c/envolafricamagazine/src/lib/chariow.ts).
3. Ajoutez ou mettez à jour l'URL et l'identifiant dans les constantes `CHARIOW_PRODUCT_URLS` et `CHARIOW_PRODUCT_IDS`.

Exemple :
```typescript
export const CHARIOW_PRODUCT_URLS = {
  // Déjà connectés :
  magazineNumerique: "https://toerbwke.mychariow.shop/prd_ac3bruo2",
  abonnementChefEntreprise: "https://toerbwke.mychariow.shop/prd_g8iz7mej",
  don: "https://toerbwke.mychariow.shop/prd_d1v11apk",

  // Nouveaux à ajouter au fur et à mesure de votre création :
  magazinePapier: "https://toerbwke.mychariow.shop/prd_VOTRE_ID_PAPIER",
  abonnementAnnuel: "https://toerbwke.mychariow.shop/prd_VOTRE_ID_ANNUEL",
  jobsEmployerMonth: "https://toerbwke.mychariow.shop/prd_VOTRE_ID_JOBS",
  wabBusinessSubscription: "https://toerbwke.mychariow.shop/prd_VOTRE_ID_WAB",
} as const;
```

Ce système est 100% modulaire et prêt à accueillir chaque nouveau produit que vous créerez !
