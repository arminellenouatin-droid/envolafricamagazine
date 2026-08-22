# Vérification aperçu Kiosque à la une — 20 août 2026

Le bouton **Feuilleter** du bloc du magazine à la une a été testé sur la build locale `/kiosque`. Avant correction, il déclenchait uniquement une alerte et n’ouvrait aucun lecteur.

Après correction, le bouton ouvre le même `PreviewFlipbook` que la fiche produit. Le dialogue affiche la couverture du magazine vedette, les contrôles « 1 page » et « 2 pages », le son de tournage, la fermeture et les boutons de navigation. Le contrôle visuel montre que le lecteur est ouvert directement depuis le Kiosque, sans redirection vers la fiche produit.

Le branchement choisit le PDF de la langue active, utilise la route sécurisée `/api/magazines/[id]/preview` pour les références privées `private-pdf://`, et conserve les images d’aperçu comme solution de secours. Le bouton d’achat du lecteur redirige vers la fiche du magazine avec l’ancre des options d’achat.
