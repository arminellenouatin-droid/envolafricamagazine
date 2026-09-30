# MEMO : Affiliation Boutique & Liens Ambassadeurs

## 1. Objectif
- Permettre aux vendeurs de gérer l'affiliation de leur boutique avec clarté : afficher la liste des articles actifs en affiliation et un bouton "+ Ajouter un produit en affiliation" ouvrant un modal dédié avec sélecteur de produit et simulation de taux.
- Permettre aux clients et ambassadeurs de copier en 1 clic leur lien d'affiliation personnalisé sur la vitrine publique de la boutique ainsi que sur la fiche détaillée du produit.

## 2. Périmètre des modifications
1. `src/app/marketplace/boutique/[slug]/BoutiqueDetailClient.tsx` :
   - Onglet Affiliation : affichage de la liste des produits affiliés (`activeAffiliatedProducts`), bouton "+ Ajouter un produit en affiliation", suppression du basculement automatique vers l'onglet d'ajout de produit.
   - Modal `showAffiliateModal` : sélecteur de catalogue + curseur/boutons de taux (5%, 10%, 15%, 20%, 25%, 30%) + simulation temps réel (prix vente, commission ambassadeur, frais plateforme, net vendeur).
   - Vitrine publique : bouton direct "🔗 Copier le lien affilié" sur chaque carte de produit affilié.
2. `src/app/marketplace/produits/[id]/page.tsx` :
   - Sélection des `product_affiliations(*)` dans `getProduct`.
   - Récupération de `currentUser` via `getCurrentUserFromCookie()`.
3. `src/app/marketplace/produits/[id]/ProductDetailClient.tsx` :
   - Encadré Ambassadeur / Affiliation avec montant de commission en XOF, taux, et bouton "📋 Copier mon lien affilié".

## 3. Sécurité & Invariants
- Sanctification : `Header.tsx` et `HeaderShell.tsx` non modifiés.
- Respect de la RLS et de l'API PATCH sécurisée existante `/api/marketplace/products`.
- Couleurs et contrastes accessibles conformes au design system.
