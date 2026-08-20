# Vérification performance flipbook mobile — 20 août 2026

## Cause identifiée

Le bouton du Kiosque ouvrait auparavant le lecteur tout en déclenchant le téléchargement et le traitement du PDF protégé. La route `/api/magazines/[id]/preview` téléchargeait le PDF complet depuis le stockage, initialisait PDF.js côté serveur et rendait ensuite l’image de la page demandée. Sur mobile, ce chemin pouvait rester bloqué longtemps avant qu’un contenu visuel apparaisse.

Le blocage était aggravé par l’interface qui masquait la zone de lecture pendant le chargement au lieu d’afficher immédiatement la couverture déjà disponible.

## Correction appliquée

Le lecteur affiche maintenant immédiatement la couverture du magazine, puis charge la page protégée en arrière-plan. Un indicateur discret « Chargement de la page… » informe l’utilisateur sans masquer le contenu initial. Si les données PDF détaillées ne sont pas présentes dans la liste Kiosque, le lecteur s’ouvre d’abord avec les données disponibles puis récupère la fiche complète du magazine sans bloquer l’ouverture.

Le comportement conserve la protection PDF, la navigation et le mode une page/deux pages. La couverture reste un fallback visible en cas de lenteur ou d’échec de la route d’aperçu.

## Vérification

La build TypeScript et Next.js passe. La route `/kiosque` répond en HTTP 200. En test local, le bouton mobile ouvre le dialogue et la couverture est immédiatement visible avant la fin éventuelle du chargement de la page PDF.
