# Audit du Stockage Existant — Envol Africa Magazine (Phase 1)

Date: 2026-10-06  
Auteur: Antigravity Agent  
Branche: `feat/r2-storage`  

---

## 1. Cartographie des Emplacements de Fichiers

| Module Métier | Type de Fichier | Destination Actuelle | Table / Colonne | Visibilité |
| :--- | :--- | :--- | :--- | :--- |
| **WAB (Réseau Social)** | Images de posts, statuts, reels, vidéos, stories | Supabase Storage (`wab-media`) | `wab_posts.media_urls`, `wab_stories.media_url` | Public (stories/posts) ou privé (salons) |
| **Magazine & Éditorial** | Couvertures de magazines, PDF complets, images d'articles | Supabase Storage (`article-media`, `magazine-protected`) | `magazines.cover_url`, `magazines.pdf_url`, `articles.featured_image` | Public (couvertures) / Privé protégé (PDF paywalls) |
| **Marketplace** | Photos produits, vidéos de démonstration, fichiers numériques téléchargeables | Supabase Storage (`marketplace`, `marketplace-digital`, `marketplace-product-videos`) | `marketplace_products.images`, `marketplace_products.digital_file_url`, `marketplace_product_videos.url` | Public (photos/vidéos) / Privé signé (fichiers numériques vendus) |
| **Crowdfunding** | Visuels de projets, business plans, pièces d'identité, justificatifs | Supabase Storage (`crowdfunding-documents`) | `crowdfunding_projects.cover_image`, `crowdfunding_documents.url` | Public (visuels) / Privé signé (documents financiers) |
| **Emploi / Jobs** | CVs des candidats (PDF/DOCX), pièces jointes candidatures | Supabase Storage (`jobs-cvs`) | `jobs_candidates.cv_url` | Privé strict (accessible uniquement par l'employeur ayant débloqué l'offre) |
| **Africa Awards** | Photos des candidats, affiches des cérémonies | Supabase Storage (`article-media`) | `awards_candidates.photo_url` | Public |
| **Messageries & Salons** | Pièces jointes de discussion (Marketplace, Crowdfunding, WAB) | Supabase Storage (`marketplace`, `wab-media`) | `marketplace_messages.attachment_url` | Privé (participants uniquement) — **Non modifiable et non supprimable pour audit litiges** |
| **Profils Utilisateurs** | Avatars, bannières | Supabase Storage (`article-media` / fallback) | `users.avatar_url` | Public |

---

## 2. Configuration Supabase Storage & Contraintes Observées

- **Limites du plan gratuit Supabase** :
  - Taille totale de stockage : 1 Go maximum.
  - Bande passante (egress) : 5 Go par mois maximum.
  - Taille maximale par fichier : 50 Mo par fichier.
- **Pourquoi Cloudflare R2 résout le problème** :
  - 10 Go de stockage entièrement gratuits chaque mois.
  - **ZÉRO frais d'egress / bande passante illimitée** (Egress Free).
  - Aucune limite restrictive à 50 Mo (support des vidéos de 150 Mo sans pénalité).
  - Préservation de Supabase pour la base de données relationnelle PostgreSQL et l'authentification.

---

## 3. Authentification & Droits

- **Méthode d'authentification** : JWT cryptographiquement signé via cookie HttpOnly `eam_token` (clé `JWT_SECRET`).
- **Validation serveur** : `getCurrentUserFromCookie()` extrait l'utilisateur et valide son rôle (`admin`, `seller`, `candidate`, `host`, `user`).
- **Contrôle d'accès stockage** :
  - Les uploads publics (photos, miniatures) sont signés par présignature R2 courte (5 min).
  - Les téléchargements de fichiers protégés (PDF payants, CV, fichiers numériques achetés) génèrent une URL GET signée d'une durée de 5 minutes après vérification stricte du droit d'accès.

---

## 4. Next.js & Optimisation d'Images

- `next.config.ts` dispose de `images.remotePatterns` avec Unsplash et Supabase.
- Le domaine public Cloudflare R2 (`*.r2.dev` et `pub-df336181dd964534a4866a10762a3327.r2.dev`) doit être ajouté à `images.remotePatterns`.
- `sharp` (`^0.35.3`) est déjà présent dans `package.json` pour le traitement d'images côté serveur.
- Côté client, `createImageBitmap` et `canvas` convertiront et compresseront automatiquement les images en WebP ($\le 1920\text{px}$, qualité 0.8) pour économiser 70 à 90 % d'espace avant upload direct.
