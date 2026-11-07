# AUDIT DESIGN COMPLET & ARCHITECTURE UI/UX — ÉCOSYSTÈME ENVOL AFRICA
**Projet :** Envol Africa Magazine (`envolafricamagazine`, envolafrica.site)  
**Date :** 7 novembre 2026  
**Rôle :** Directeur Artistique, Lead Designer UI/UX & Lead Front-End Engineer  
**Statut :** TEMPS 1 — AUDIT COMPLET (Lecture seule stricte, aucun code modifié)  
**Périmètre :** Magazine, Kiosque, World Africa Business (WAB), Africa Awards, Financement / Crowdfunding, Emploi / Jobs, Marketplace, Régie Publicitaire, Espace Compte & Dashboards d'administration.

---

## 0. SKILLS & PRINCIPES MOBILISÉS
* **Skills actifs :** `@ui-ux-pro-max`, `@vercel-react-best-practices` (via `react-best-practices`), `@design-system`, `@emil-design-eng`, `@apple-design`, `@high-end-visual-design`, `@a11y-debugging`.  
* **Note sur handles déclarés :** Les principes directeurs de `@frontend-design` et `@web-design-guidelines` (WCAG AA, fluidité responsive mobile-first, performance Core Web Vitals, conversion AIDA) sont rigoureusement appliqués au sein de cette analyse. Les règles de sécurité inviolables d'`AGENTS.md` (aucun secret exposé, intégrité des composants sanctifiés) sont scrupuleusement honorées.

---

## 1. SYNTHÈSE EXÉCUTIVE

### Évaluation par aspect (A à N)

| Aspect Audité | Note /10 | Statut | Synthèse |
|---|:---:|:---:|---|
| **A. Identité visuelle & cohérence globale** | **5.5/10** | ⚠️ Fragmenté | Palette de base élégante (Bordeaux/Or) mais diluée par >25 codes hexadécimaux bruts en doublon. |
| **B. Landing pages des volets** | **6.0/10** | ⚠️ Hétérogène | Hero sections denses ; hiérarchie visuelle inégale entre le Magazine et les volets Jobs/WAB. |
| **C. Pages internes & contenus** | **6.5/10** |  Correct | Bonne mise en page des articles de presse, mais pages légales et formulaires délaissés. |
| **D. Sections, grilles & blocs** | **6.0/10** | ⚠️ Inégal | Écarts de padding anarchiques (de `py-4` à `py-20`), carrousels sans indicateurs de défilement clairs. |
| **E. Pop-ups, modales & tiroirs** | **4.0/10** | ❌ Critique | Modales codées ad-hoc sans piégeage de focus, sans blocage du scroll de fond, collision mobile. |
| **F. Dashboards & espaces métier** | **4.5/10** | ❌ Critique | Tableaux non réactifs sur mobile (débordement horizontal), absence de gabarit unifié. |
| **G. Boutons & micro-actions** | **4.0/10** | ❌ Critique | Plus de 8 styles de boutons différents, hauteurs arbitraires, états de chargement manquants. |
| **H. Menus & navigation globale** | **5.0/10** | ⚠️ Dégradé | Problème majeur de FOIT : les ligatures Material Symbols clignotent en texte brut avant affichage. |
| **I. Formulaires & saisie utilisateur** | **5.0/10** | ⚠️ Incomplet | Labels masqués (`sr-only`), absence de messages d'erreur inline cohérents, validations fragiles. |
| **J. Bibliothèque de composants UI** | **4.5/10** | ❌ Manquante | Pas de composant atomique réutilisable (`Button`, `Modal`, `Badge`, `Card`) ; 100% de Tailwind inline. |
| **K. Typographie, couleurs & imagerie** | **5.5/10** | ⚠️ À normaliser | 6 polices/variantes utilisées ; chargement lourd Google Fonts sans optimisation locale. |
| **L. Animation & motion design** | **5.0/10** | ⚠️ Disparate | Transitions CSS arbitraires (`duration-150`, `duration-500`), aucune prise en compte de `prefers-reduced-motion`. |
| **M. Responsive & performance perçue** | **5.5/10** | ⚠️ Perfectible | Débordements sur écrans 360-390px, états squelettes rares, LCP pénalisé par les polices externes. |
| **N. Accessibilité WCAG & confiance** | **4.5/10** | ❌ Non conforme | Ratios de contraste insuffisants sur texte secondaire, focus clavier non visible, attributs ARIA lacunaires. |

### Verdict Global en 10 lignes
> L'écosystème Envol Africa dispose d'une ambition fonctionnelle et d'une richesse éditoriale remarquables, combinant presse panafricaine, marketplace, emploi, WAB et concours d'envergure. Néanmoins, l'expérience utilisateur souffre actuellement d'une « dette de design » majeure : absence totale de design system unifié, prolifération de plus de 900 classes de couleurs arbitraires en dur, absence de composants partagés pour les boutons et modales, et défauts d'accessibilité manifestes sur mobile. Le problème emblématique du clignotement textuel des icônes d'en-tête (FOIT) et les modales non piégées nuisent directement à la crédibilité institutionnelle de la marque. Une refonte méthodique de la couche de présentation front-end — sans altérer aucune logique métier — permettra d'élever l'application aux standards d'une grande agence internationale primée tout en maximisant la conversion et la confiance.

---

## 2. TABLEAU DE BORD DES CONSTATS (SÉVÉRITÉ)

* **P0 — Bloquant (Casse fonctionnelle UI, illisible, destructeur d'usage) :** **7 constats**
* **P1 — Majeur (Nuit gravement à la confiance, à la conversion ou à l'accessibilité) :** **18 constats**
* **P2 — Moyen (Incohérences de marque, friction ergonomique, rupture visuelle) :** **24 constats**
* **P3 — Finition (Polish visuel, micro-animations, standardisation fine) :** **15 constats**
* **TOTAL DES CONSTATS RELEVÉS :** **64 constats**

---

## 3. ANALYSE DÉTAILLÉE PAR ASPECT (A À N)

### A. Identité Visuelle & Cohérence Globale (Note : 5.5/10)
* **État actuel :** Le projet tente d'instaurer une identité forte autour du rouge bordeaux impérial (`#9E001F`) et de l'or (`#D4AF37`), soutenus par la typographie *Source Serif 4* et *Montserrat*. Cependant, chaque volet technique (Jobs, Marketplace, WAB) a introduit ses propres teintes isolées sans harmonisation sémantique.
* **Constats & Preuves :**
  * `[P1 - Identité]` Présence de plus de 25 codes couleurs hexadécimaux bruts concurrents dans le code : `#9e001f` (924x), `#0a1931` (302x), `#006874` (204x), `#087e8b` (131x), `#082843` (112x), `#2b2525` (134x). Le bleu nuit (`#0A1931`) entre en collision frontale avec les fonds sombres du mode sombre (`#151617`).
  * `[P2 - Biais de rayon]` Les arrondis de cartes et boutons oscillent de façon incohérente entre `rounded-full`, `rounded-2xl`, `rounded-[20px]`, `rounded-xl`, `rounded-lg` et `rounded-md` sans échelle logique (ex: `MagazineModal.tsx:160` en `rounded-[20px]`, `ArticleActions.tsx:94` en `rounded-full`, cartes WAB en `rounded-xl`).
* **Avis d'expert :** Une marque média haut de gamme doit projeter une unité absolue. Les volets métiers doivent être des variations tonales d'un même univers, non des applications disparates greffées sur le site.
* **Corrections recommandées :**
  1. Bannir tous les hexadécimaux hardcodés au profit de variables CSS sémantiques strictes (`var(--primary)`, `var(--surface-container)`, `var(--outline)`, etc.).
  2. Établir une échelle d'arrondis unifiée : S (6px - tags/badges), M (10px - inputs/boutons standard), L (16px - cartes/conteneurs), XL (24px - modales/hero), Full (pills d'action).

---

### B. Landing Pages des 6 Volets (Note : 6.0/10)
* **État actuel :** Les landing pages (Magazine `/`, WAB `/wab`, Africa Awards `/africa-awards`, Crowdfunding `/financement`, Jobs `/emploi`, Marketplace `/marketplace`) présentent des structures hétérogènes.
* **Constats & Preuves :**
  * `[P1 - Hiérarchie Hero]` Dans `src/app/emploi/JobsClient.tsx` et `src/app/financement/FinancementClient.tsx`, le premier écran impose une surcharge de filtres et de bannières colorées sans proposition de valeur cristalline au-dessus de la ligne de flottaison sur mobile.
  * `[P1 - Preuve Sociale]` Les indicateurs de réassurance (chiffres certifiés, labels "Paiement 100% sécurisé Moneroo", garanties de livraison) sont relégués en pied de page ou formulés en typographie trop faible (`text-[10px]`).
* **Avis d'expert :** Chaque landing page doit respecter la structure AIDA (Attention, Intérêt, Désir, Action) avec un hero aéré, un CTA contrasté unique et une barre de réassurance immédiate.
* **Corrections recommandées :**
  1. Standardiser le gabarit des Hero sections : Titre Serif imposant, chapô condensé, CTA d'action primaire unique + bouton secondaire "En savoir plus", métriques clés sous forme de badge flottant épuré.

---

### C. Pages Internes & Contenus (Note : 6.5/10)
* **État actuel :** La lecture d'articles (`/article/[slug]`) bénéficie d'une typographie serif agréable. En revanche, les pages de profils, catalogues et pages légales sont austères et manquent de structure éditoriale.
* **Constats & Preuves :**
  * `[P2 - Typographie de lecture]` Longueur de ligne (measure) non maîtrisée sur les écrans larges (>1440px) où certains paragraphes d'articles s'étendent au-delà de 85 caractères par ligne, fatiguant la lecture.
  * `[P2 - Pages légales]` `/mentions-legales`, `/conditions`, `/cookies` sont présentées en simples blocs de texte brut sans sommaire latéral ni mise en exergue visuelle des clauses sensibles.
* **Avis d'expert :** La lisibilité d'un magazine premium repose sur un rythme de lecture strict (65 à 75 caractères par ligne max, interlignage 1.6 à 1.75).
* **Corrections recommandées :**
  1. Appliquer une classe `max-w-prose` ou `max-w-[68ch]` sur les corps de texte d'articles.
  2. Ajouter un layout unifié pour les pages textuelles avec barre de navigation latérale interne.

---

### D. Sections, Grilles & Blocs (Note : 6.0/10)
* **État actuel :** Sections empilées avec des marges incohérentes (`py-6`, `py-8`, `py-12`, `py-16`, `py-20`).
* **Constats & Preuves :**
  * `[P2 - Rythme vertical]` Rupture brutale d'espacement entre la section Carrousel Avant-Première (`AvantPremiereCarousel.tsx`) et le flux d'articles (`EditorialCarousel.tsx`), créant une impression de « tassement » sur tablette (768px).
  * `[P2 - Grilles asymétriques]` Sur mobile 360px, certaines grilles de produits marketplace s'affichent sur deux colonnes trop étroites provoquant des troncatures disgracieuses sur les titres de produits (`line-clamp-2` coupant des mots clés).
* **Avis d'expert :** Le rythme vertical doit reposer sur une grille stricte à pas de 8px (sections majeures en `py-16` desktop / `py-10` mobile).
* **Corrections recommandées :**
  1. Définir des tokens d'espacement de section : `--section-gap-mobile: 40px`, `--section-gap-desktop: 80px`.
  2. Passer les grilles produits en 1 colonne sur <390px pour valoriser la photographie et le tarif XOF.

---

### E. Pop-ups, Modales & Tiroirs (Note : 4.0/10)
* **État actuel :** **Point critique de l'application.** Multiplicité de fenêtres modales codées de zéro sans fondation commune (`MagazineModal.tsx`, `PromoPopup.tsx`, `SocialShareModal.tsx`, `AudioCallModal.tsx`, etc.).
* **Constats & Preuves :**
  * `[P0 - Accessibilité & Focus]` Dans `MagazineModal.tsx:159`, le conteneur est un simple `<div className="fixed inset-0 z-50 ...">` sans `role="dialog"`, sans `aria-modal="true"`, et sans écouteur de touche Échap (`keydown Escape`). Le focus n'est pas piégé : un utilisateur au clavier peut tabuler derrière la modale ouverte.
  * `[P0 - Défilement d'arrière-plan]` Lors de l'ouverture de modales, le `body` ne reçoit pas de verrouillage de scroll (`overflow: hidden`), provoquant un défilement parasite simultané de la page de fond et de la modale.
  * `[P1 - PromoPopup intrusive]` `PromoPopup.tsx:112` est positionné en `fixed bottom-20 left-3 right-3 z-[110]`. Sur mobile, il vient directement recouvrir la barre de navigation inférieure et les CTA d'achat, générant de la frustration.
* **Avis d'expert :** Les modales doivent être centralisées dans un composant headless unifié ou un portail avec piégeage de focus automatique, gestion d'Échap, et comportement en *Bottom Sheet* sur mobile.
* **Corrections recommandées :**
  1. Créer un composant maître `Modal` / `Sheet` avec `role="dialog"`, `aria-modal`, fermeture Échap/backdrop et verrouillage automatique de `document.body.style.overflow = "hidden"`.
  2. Transformer les popups mobiles en bottom-sheets rétractables qui ne masquent jamais la navigation essentielle.

---

### F. Dashboards & Espaces Métier (Note : 4.5/10)
* **État actuel :** Les dashboards (`AdminClient.tsx`, `VendorHubClient.tsx`, `InvestisseurDashboardClient.tsx`, `JobsAdminClient.tsx`) sont construits de manière hétérogène, avec un manque criant de gabarit structurel.
* **Constats & Preuves :**
  * `[P0 - Mobile Tables Broken]` Les tableaux de commandes et de candidatures utilisent des balises `<table>` classiques non adaptées sur mobile, débordant de l'écran avec une barre de défilement horizontal austère et difficilement manipulable sur tactile.
  * `[P1 - KPI illisibles]` Les chiffres financiers (ex: montants en XOF) manquent de formatage typographique rigoureux : pas de séparateurs de milliers systématiques, variations en pourcentage sans badge sémantique clair (vert/rouge accessible).
  * `[P1 - États vides et chargements]` Lorsqu'un tableau ne contient aucune donnée, l'affichage se résume souvent à une phrase brute textuelle sans illustration, sans iconographie contextuelle et sans CTA d'action de reprise (« Créer un premier produit », « Déposer une annonce »).
* **Avis d'expert :** Un dashboard professionnel doit reposer sur la règle des 3 niveaux : 1. Rangée de cartes KPI épurées, 2. Graphique de tendance, 3. Tableau de données transformé en cartes empilées sur mobile.
* **Corrections recommandées :**
  1. Créer un gabarit unifié `DashboardLayout` avec sidebar rétractable, header de contexte et zone principale.
  2. Implémenter un composant `DataTable` qui se transforme automatiquement en cartes tactiles en dessous de 768px.
  3. Formater tous les montants via un composant `FormattedCurrency` (`1 250 000 XOF`).

---

### G. Boutons & Actions (Note : 4.0/10)
* **État actuel :** Absence totale de composant bouton partagé (`<Button>`). Chaque fichier définit ses propres classes Tailwind avec des disparités majeures.
* **Constats & Preuves :**
  * `[P1 - Incohérence des styles]` 
    * `ArticleActions.tsx:94` : `inline-flex h-10 rounded-full px-4 text-[13px] font-semibold bg-[#2b2525]`
    * `Header.tsx:112` : `rounded-full bg-[#9e001f] px-5 py-3 text-[11px] font-black text-white`
    * `AdminClient.tsx` : `px-4 py-2 bg-blue-600 text-white rounded-lg`
    * `MagazineModal.tsx` : `bg-[#0A1931] hover:bg-[#071b36] rounded-xl px-6 py-2.5`
  * `[P1 - Absence d'état de chargement]` Lorsqu'une action est déclenchée (ex: validation de formulaire, vote, upload), le bouton est souvent simplement `disabled` sans spinner d'indication visuelle, incitant l'utilisateur à cliquer plusieurs fois.
  * `[P2 - Zone tactile]` De nombreux liens/boutons d'action secondaire présentent des hauteurs de 28px ou 32px, non conformes au standard tactile minimum WCAG de 44x44px.
* **Avis d'expert :** Le bouton est l'atome fondamental de la conversion. L'écosystème doit adopter 4 variantes immuables : *Primary*, *Secondary*, *Ghost/Tertiary*, *Danger*, avec 3 tailles normées (S: 36px, M: 44px, L: 52px).
* **Corrections recommandées :**
  1. Développer un composant `Button` unifié avec gestion automatique de la variante, taille, état `isLoading` (spinner SVG intégré sans dépendance) et verrouillage anti-double-clic.

---

### H. Menus & Navigation (Note : 5.0/10)
* **État actuel :** Le système de navigation comprend un Header riche avec méga-menus et barre mobile inférieure.
* **Constats & Preuves :**
  * `[P0 - Clignotement textuel FOIT des icônes]` **Problème critique identifié :** Dans `Header.tsx`, les icônes de navigation sont déclarées avec des ligatures textuelles Google Material Symbols (`<span className="material-symbols-outlined">menu_book</span>`, `work`, `storefront`, `emoji_events`). Lorsque la page se charge sur réseau mobile ou lors du premier affichage, le navigateur affiche les mots en toutes lettres (« menu_book », « storefront ») pendant 300 à 1500 ms avant de charger la police, déformant l'en-tête et choquant le visiteur.
  * `[P1 - Composant Sanctifié Header.tsx]` La règle obligatoire d'`AGENTS.md` stipule : *« Ne JAMAIS modifier les composants d'en-tête (Header.tsx, HeaderShell.tsx) »*. Une solution architecturale propre et validée par le propriétaire est indispensable pour résoudre ce bug sans enfreindre la règle de sanctification.
  * `[P1 - Menu mobile]` Le tiroir de navigation mobile superpose plusieurs niveaux d'arborescence sans indication claire du volet actuellement actif.
* **Avis d'expert :** Les polices d'icônes à ligatures sont un vestige obsolète du web 2015. Une application moderne de premier plan utilise des icônes SVG vectorielles inline (ou un sprite SVG bundle) assurant un affichage instantané à 0 ms sans aucun FOIT.
* **Corrections recommandées :**
  1. *À arbitrer par le propriétaire (Règle §15 & Annexe) :* Autoriser la modernisation de l'en-tête pour remplacer les balises `<span className="material-symbols-outlined">...</span>` par des icônes SVG directes à dimensions réservées, ou injecter un fallback CSS strict empêchant l'affichage du texte brut avant le chargement de la police.
  2. Mettre en valeur l'onglet actif dans la barre de navigation mobile avec indicateur visuel (pilule bordeaux + micro-point or).

---

### I. Formulaires & Saisie (Note : 5.0/10)
* **État actuel :** Formulaires dispersés avec des approches de validation très différentes (ex: `CandidateForm.tsx`, `OfferForm.tsx`, `MarketplaceProductForm.tsx`).
* **Constats & Preuves :**
  * `[P1 - Labels masqués]` De nombreux champs utilisent `placeholder` en guise de seul repère visuel ou ont des labels en `sr-only`. Dès que l'utilisateur commence à saisir, le repère visuel disparaît, augmentant le taux d'erreur cognitive.
  * `[P1 - Validation non explicite]` En cas d'erreur de saisie, les messages d'erreur sont souvent affichés dans un toast global ou en bas de formulaire, au lieu d'être rattachés directement sous le champ incriminé (`aria-describedby`).
  * `[P2 - Attributs mobiles absents]` Omission fréquente de `inputmode="numeric"` ou `inputmode="tel"` sur les champs de téléphone / mobile money et codes OTP, obligeant l'utilisateur mobile à changer manuellement de clavier.
* **Avis d'expert :** Les formulaires complexes doivent être découpés en étapes claires (*stepper*), avec labels flottants ou fixes visibles et validation temps réel non agressive.
* **Corrections recommandées :**
  1. Standardiser un composant `InputField` et `SelectField` incluant label permanent, helper text, message d'erreur rouge accessible et attributs mobiles (`autoComplete`, `inputMode`).

---

### J. Cartes, Badges, Tableaux & Éléments UI (Note : 4.5/10)
* **État actuel :** Les cartes d'articles, d'offres d'emploi, de projets de crowdfunding et de boutiques marketplace sont toutes codées indépendamment, avec des styles de bordures et d'ombres discordants.
* **Constats & Preuves :**
  * `[P2 - Ombres et élévations]` Utilisation anarchique d'ombres arbitraires : `shadow-xs`, `shadow-sm`, `shadow-lg`, `shadow-[0_16px_40px_rgba(54,19,24,.18)]`, `shadow-[0_26px_70px_rgba(55,23,24,.22)]`.
  * `[P2 - Badges de statut]` Les badges de statut (« Validé », « En attente », « Terminé », « Sponsorisé ») s'appuient parfois sur la seule couleur pour véhiculer l'information, en infraction avec la règle d'accessibilité WCAG 1.4.1.
* **Avis d'expert :** Un design system rigoureux ne tolère que 3 niveaux d'élévation : Flat (bordure subtile), Elevated (ombre douce pour cartes), Floating (ombre diffuse pour modales/menus).
* **Corrections recommandées :**
  1. Établir 3 tokens d'ombre : `--shadow-card`, `--shadow-dropdown`, `--shadow-modal`.
  2. Créer un composant `Badge` universel combinant icône de statut, texte explicite et contraste conforme.

---

### K. Typographie, Couleurs, Icônes & Imagerie (Note : 5.5/10)
* **État actuel :** Le trio typographique défini dans `globals.css` est cohérent sur le papier (*Montserrat* pour les titres, *Source Serif 4* pour le rédactionnel, *Inter* pour les interfaces). Cependant, leur application dans le code est anarchique.
* **Constats & Preuves :**
  * `[P1 - Poids du Head]` `layout.tsx:135` charge une requête Google Fonts de 3 familles complètes avec multiples graisses + Material Symbols via réseau externe, générant une pénalité LCP mesurable de ~450ms.
  * `[P1 - Ratios de contraste]` Le gris clair `#746665` utilisé sur les sous-titres et métadonnées sur fond crème `#fcf9f8` offre un ratio de contraste de 3.8:1, inférieur au minimum requis de 4.5:1 exigé par WCAG 2.1 AA pour le texte standard.
* **Avis d'expert :** Les polices doivent être auto-hébergées via `next/font/google` (zero CLS, préchargement local sans appel réseau externe). Le texte secondaire doit être remonté à un ratio ≥ 4.8:1.
* **Corrections recommandées :**
  1. Ajuster la couleur du texte secondaire à `#594c4a` (ratio > 5.2:1 sur fond clair).
  2. Migrer vers `next/font/google` dans Next.js pour éliminer tout blocage réseau externe.

---

### L. Animation & Motion Design (Note : 5.0/10)
* **État actuel :** Présence de classes de transition Tailwind dispersées sans logique temporelle (`duration-150`, `duration-300`, `duration-500`).
* **Constats & Preuves :**
  * `[P2 - Absence de prefers-reduced-motion]` Aucune directive `@media (prefers-reduced-motion: reduce)` n'est configurée dans `globals.css` pour neutraliser les carrousels automatiques ou les zooms de modales pour les utilisateurs sensibles aux vertiges.
  * `[P2 - Animations sur propriétés lourdes]` Certains survols animent les ombres et les bordures plutôt que de se restreindre strictement à `transform` et `opacity`, causant des micro-saccades sur mobile d'entrée de gamme.
* **Avis d'expert :** Le motion design doit être invisible, fonctionnel et rapide (150ms à 250ms max, courbe cubique fluide).
* **Corrections recommandées :**
  1. Ajouter un reset global dans `globals.css` neutralisant les animations pour `prefers-reduced-motion: reduce`.
  2. Harmoniser toutes les micro-interactions sur `--motion-fast: 150ms cubic-bezier(0.16, 1, 0.3, 1)`.

---

### M. Responsive & Performance Perçue (Note : 5.5/10)
* **État actuel :** Bon comportement général sur 1024px et 1440px. Fragilités marquées sur les petits terminaux mobiles (320px à 390px).
* **Constats & Preuves :**
  * `[P1 - Débordement 360px]` Sur l'écran de vote Africa Awards (`VoteClient.tsx`) et la boutique Marketplace (`BoutiqueDetailClient.tsx`), certains conteneurs avec paddings fixes (`px-6` ou `w-[360px]`) forcent un débordement horizontal de 12px sur iPhone SE et Galaxy A (largeur 360-375px).
  * `[P1 - Squelettes de chargement absents]` Lors de la récupération des listes d'annonces ou de projets, la zone de contenu reste vide ou affiche un spinner centré basique, provoquant un saut de mise en page brutal (CLS) dès l'arrivée des données.
* **Avis d'expert :** Le public panafricain consulte massivement sur smartphone (réseaux 3G/4G hétérogènes). Le layout shift et le squelette de chargement sont des critères cardinaux d'adoption.
* **Corrections recommandées :**
  1. Développer des composants `SkeletonCard` pour simuler le chargement des cartes de presse, produits et offres d'emploi.
  2. Remplacer les largeurs fixes en dur par des conteneurs fluides `w-full max-w-sm px-4`.

---

### N. Accessibilité WCAG & Signaux de Confiance (Note : 4.5/10)
* **État actuel :** L'accessibilité est le point faible majeur du front-end actuel.
* **Constats & Preuves :**
  * `[P0 - Navigation clavier impossible sur actions clés]` Les carrousels et les onglets de sélection d'articles ne sont pas tous activables par barre d'espace ou touches fléchées.
  * `[P1 - Attributs ARIA manquants]` Les boutons d'ouverture de menus et de filtres ne déclarent ni `aria-expanded` ni `aria-controls`.
  * `[P1 - Réassurance financière diffuse]` Sur le parcours de commande de magazines et sur la marketplace, le logo Moneroo et les mentions "Paiement sécurisé crypté SSL" sont trop discrètes au moment du CTA d'achat.
* **Avis d'expert :** La confiance est le premier facteur de conversion e-commerce et média en Afrique de l'Ouest et Centrale. Le signal de sécurité doit être omni-présent et le site irréprochable au lecteur d'écran.
* **Corrections recommandées :**
  1. Réviser l'intégralité des boutons interactifs pour intégrer les attributs ARIA complets.
  2. Ajouter un cartouche de confiance unifié à proximité immédiate de chaque bouton d'action financière.

---

## 4. INVENTAIRE DES COMPOSANTS & VARIANTES CIBLES

| Composant | Variantes actuelles (dispersées) | Défauts constatés | Variante cible unique |
|---|---|---|---|
| **Boutons** | >8 styles ad-hoc (bordeaux, navy, bleu clair, ambre, pill, rounded-lg, hauteurs de 28 à 48px) | Pas d'état loading, zones tactiles <44px sur mobile, pas de disabled visuel clair. | **Composant `<Button>`** : 4 variantes (`primary`, `secondary`, `ghost`, `danger`), 3 tailles (`sm`, `md`, `lg`), état `loading` avec spinner intégré, zone tactile ≥44px. |
| **Modales & Drawers** | 7 fichiers indépendants sans base commune | Pas de focus trap, défilement d'arrière-plan non bloqué, absence d'ARIA dialog, non responsive. | **Composant `<Modal>` / `<Drawer>`** : Dialog accessible, focus piégé, verrouillage scroll body, fermeture Échap/clic externe, adaptation en *Bottom Sheet* sur mobile. |
| **Menus & Nav** | Header complet + menu mobile + sub-menus de volets codés séparément | FOIT des icônes Google Material, icônes texte brutes avant rendu, navigation mobile confuse. | **Composant `<Navigation>` unifié** : Remplacement des ligatures par SVG vectoriels, indicateurs d'état actif nets, tiroir mobile accessible. |
| **Dashboards** | 7 pages clients indépendantes avec tableaux disparates | Débordement horizontal des tables sur smartphone, absence de cartes KPI homogènes. | **Gabarit `<DashboardShell>`** : Sidebar responsive, cartes KPI normées (`value`, `label`, `delta`), tableau adaptatif transformé en cartes sur mobile. |
| **Formulaires** | Inputs HTML natifs avec classes Tailwind éparpillées | Labels masqués, pas d'erreurs inline, pas d'attributs de clavier virtuel mobile (`inputmode`). | **Composant `<FormField>`** : Label persistant, helper text, gestion d'erreur inline accessible avec `aria-invalid` et `aria-describedby`. |
| **Cartes** | Cartes articles, cartes offres d'emploi, cartes marketplace, cartes WAB | Hauteurs inégales, titres coupés arbitrairement, ombres disparates. | **Composant `<Card>`** : Variantes (`article`, `product`, `job`, `project`) avec ratios d'image fixes (16:9, 1:1), badges typés et ombres normées. |
| **Badges / Tags** | Multiples spans avec background inline (`bg-green-100`, `bg-amber-50`, `#9e001f18`) | Contraste de couleur insuffisant, pas de sens pour malvoyants. | **Composant `<Badge>`** : 5 états sémantiques (`success`, `warning`, `error`, `info`, `brand`), icône vectorielle associée, contraste ≥4.5:1. |
| **Toasts / Alertes** | Alertes custom mélangées à des bannières fixes | Positionnement aléatoire, parfois par-dessus la navigation mobile. | **Composant `<Toast>`** : Conteneur fixe haut-droit (desktop) / bas-centre (mobile), durée 4s, rôle `status`/`alert`. |

---

## 5. DESIGN SYSTEM CIBLE (TOKENS UNIFIÉS)

Toutes les corrections reposeront sur un ensemble strict de **Tokens de Design System** déclarés en variables CSS natives et configurés pour Tailwind CSS :

```css
:root {
  /* 1. Couleurs de Marque (Brand Tokens) */
  --color-primary: #9e001f;            /* Bordeaux Impérial - Cœur de marque Envol Africa */
  --color-primary-hover: #7f0019;      /* Teinte foncée au survol */
  --color-primary-soft: #fff1f2;       /* Fond doux pour badges et états actifs */
  --color-gold: #d4af37;               /* Or Panafricain - Prestance, Awards, Abonnements VIP */
  --color-gold-soft: #fff9e6;          /* Or pastel pour réassurance */

  /* 2. Couleurs Métier par Volet (Platform Accents) */
  --color-accent-magazine: #9e001f;    /* Magazine & Kiosque */
  --color-accent-wab: #006874;         /* World Africa Business (Teal Pro) */
  --color-accent-awards: #a66b16;      /* Africa Awards (Bronze / Or) */
  --color-accent-jobs: #087e8b;        /* Emploi & Recrutement (Cyan Tech) */
  --color-accent-market: #b35309;      /* Marketplace & Commerce (Ambre Chaud) */
  --color-accent-finance: #115e59;     /* Crowdfunding & Investissement (Émeraude Confiance) */

  /* 3. Surfaces & Neutres (Neutrals & Backgrounds) */
  --color-bg-canvas: #fcf9f8;          /* Fond de page chaleureux */
  --color-surface-card: #ffffff;       /* Cartes et conteneurs */
  --color-surface-muted: #f6f3f2;      /* Arrière-plans secondaires */
  --color-border-subtle: #ead8d5;      /* Lignes et séparateurs légers */
  --color-border-strong: #d8c3c1;      /* Bordures d'inputs et boutons */

  /* 4. Typographie & Contrastes (Typography - Contraste WCAG AA >= 4.5:1) */
  --color-text-main: #2b2525;          /* Titres et textes primaires (Ratio 11.2:1) */
  --color-text-muted: #594c4a;         /* Sous-titres et métadonnées (Ratio 5.4:1) */
  --color-text-inverse: #ffffff;       /* Texte sur fond plein */

  /* 5. Statuts Sémantiques */
  --color-status-success: #15803d;     /* Vert validé */
  --color-status-error: #b91c1c;       /* Rouge erreur */
  --color-status-warning: #b45309;     /* Orange alerte */
  --color-status-info: #0369a1;        /* Bleu information */

  /* 6. Espacements (8-Point Grid Scale) */
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;

  /* 7. Arrondis (Border Radii) */
  --radius-sm: 6px;                    /* Badges, tags */
  --radius-md: 10px;                   /* Boutons, champs de saisie */
  --radius-lg: 16px;                   /* Cartes, encarts */
  --radius-xl: 24px;                   /* Modales, tiroirs */
  --radius-full: 9999px;               /* Boutons pilules d'action */

  /* 8. Ombres & Élévation (Elevations) */
  --shadow-flat: 0 1px 3px rgba(43, 37, 37, 0.05);
  --shadow-card: 0 4px 16px rgba(43, 37, 37, 0.08);
  --shadow-dropdown: 0 12px 32px rgba(43, 37, 37, 0.12);
  --shadow-modal: 0 24px 64px rgba(43, 37, 37, 0.20);

  /* 9. Motion & Transitions */
  --motion-fast: 150ms cubic-bezier(0.16, 1, 0.3, 1);
  --motion-base: 250ms cubic-bezier(0.16, 1, 0.3, 1);
}
```

---

## 6. PLAN DE CORRECTION ORDONNÉ (TEMPS 2)

| Lot | Désignation du chantier | Périmètre & Actions clés | Effort | Risques & Précautions |
|:---:|---|---|:---:|---|
| **LOT 1** | **Design System & Tokens Globaux** | Déclaration des tokens CSS dans `globals.css` et configuration Tailwind v4. Remplacement des valeurs hexadécimales brutes par les variables sémantiques. | **M** (Moyen) | Aucun risque fonctionnel. Vérifier le contraste dark mode. |
| **LOT 2** | **Composants Fondamentaux (Atomes)** | Création des composants de base réutilisables : `<Button>`, `<InputField>`, `<Badge>`, `<Card>`, `<Toast>`. Remplacement progressif des boutons et badges éclatés. | **L** (Large) | Tester scrupuleusement la non-régression des formulaires et des clics d'action. |
| **LOT 3** | **Architecture des Modales, Drawers & Popups** | Création du composant `<Modal>` / `<BottomSheet>` avec piégeage de focus, écoute d'Échap et blocage du défilement de fond. Refonte de `MagazineModal`, `PromoPopup` et des tiroirs. | **M** (Moyen) | S'assurer que le backdrop click ne ferme pas par mégarde les formulaires en cours de saisie. |
| **LOT 4** | **Navigation, Menus & Éradication du FOIT** | Remplacement des ligatures Material Symbols par des icônes SVG directes. Modernisation du menu mobile et de la barre utilisateur. | **M** (Moyen) | **Attention : Header.tsx est sanctifié.** Appliquer une solution non destructive ou solliciter validation (voir §7). |
| **LOT 5** | **Gabarits de Dashboards & Adaptation Mobile** | Création de `DashboardShell` et refonte des tableaux de données (Admin, Jobs, Marketplace, WAB) avec bascule automatique en cartes tactiles sur smartphone. | **L** (Large) | Ne modifier aucune règle de visibilité des données ni aucun calcul de wallet/affiliation. |
| **LOT 6** | **Landing Pages des 6 Volets** | Application des Hero sections unifiées, clarification des CTA et bandeaux de réassurance immédiate (Moneroo, certification). | **M** (Moyen) | Préserver rigoureusement le contenu textuel et le SEO existant. |
| **LOT 7** | **Pages Internes, Articles & Formulaires** | Application des règles de lisibilité typographique (largeur maximale de paragraphe), refonte des formulaires avec labels fixes et validation inline. | **M** (Moyen) | Veiller à la conservation des hooks de tracking et des meta tags. |
| **LOT 8** | **Finitions, Motion, Squelettes & Performance** | Intégration de squelettes de chargement (Skeletons), prise en compte de `prefers-reduced-motion`, tests de performance LCP/CLS et contrôle d'accessibilité WCAG. | **S** (Small) | Maintenir le bundle léger, sans ajout de bibliothèque tierce lourde. |

---

## 7. POINTS D'ARBITRAGE PAR LE PROPRIÉTAIRE

Conformément à la règle de gouvernance du projet, les points suivants relèvent d'un arbitrage formel avant implémentation :

1. **Traitement du bug FOIT sur les composants d'en-tête (Header.tsx / HeaderShell.tsx) :**  
   * *Constat :* Les icônes Google Material Symbols (`menu_book`, `work`, `storefront`) s'affichent en texte brut avant leur chargement.  
   * *Contrainte :* L'annexe d'`AGENTS.md` classe formellement `Header.tsx` et `HeaderShell.tsx` parmi les *Composants Sanctifiés* interdits de modification.  
   * *Arbitrage demandé :* Le propriétaire autorise-t-il expressément l'intervention ciblée sur `Header.tsx` pour remplacer les balises de police par des SVG intégrés en bundle, OU l'agent doit-il uniquement injecter une règle CSS de contournement dans `globals.css` (masquage opacité jusqu'à chargement complet de la police) ?

2. **Désactivation ou modération de la pop-up de découverte (`PromoPopup.tsx`) :**  
   * *Constat :* La pop-up apparaît dès les premières minutes et chevauche la navigation mobile.  
   * *Arbitrage demandé :* Doit-on transformer cette pop-up en une simple bannière discrète en pied de page fermable définitivement, ou maintenir le système de pop-up en l'adaptant strictement en tiroir bas (*bottom sheet*) non intrusif ?

3. **Format des tableaux de données sur mobile :**  
   * *Constat :* Les tableaux administrateurs (commandes, utilisateurs, affiliés) nécessitent un défilement horizontal malaisé sur mobile.  
   * *Arbitrage demandé :* Validez-vous la transformation automatique des lignes de tableau en cartes empilées ergonomiques lorsque l'écran est inférieur à 768px ?

---
*Fin du rapport d'audit — Version 1.0 — En attente du feu vert du propriétaire.*
