# Notes de régression WAB — 22 août 2026

Le serveur local EAM a été lancé sur `http://localhost:3001` car le port 3000 est occupé par le hub de stabilisation. La page `/wab` se charge après l’état initial de chargement et affiche une publication existante, le profil auteur et les actions d’interaction.

Le menu de partage de la publication s’ouvre correctement. Il expose les destinations demandées : **WhatsApp**, **Copier le lien**, **Story**, **Fil WAB** et **Un ami**. Le lien généré est de la forme `/wab#post-{id}`, donc il conserve l’identifiant exact de la publication.

La console visuelle locale affiche le badge Next.js « 1 2 Issues » déjà présent dans l’environnement de développement ; aucune erreur d’affichage n’a été observée dans le fil après le chargement. La modale de consentement aux notifications reste affichée en local, comme comportement prévu pour un visiteur non connecté.

Le build et TypeScript passent. Le lint ciblé des fichiers WAB ne remonte plus d’erreur, seulement des avertissements historiques (navigation par `window.location.assign`, images `<img>`, états inutilisés). Le build signale aussi le warning préexistant d’accès fichiers dynamique dans l’aperçu documentaire WAB, à traiter séparément dans le lot performance/déploiement.


## Console navigateur

L’écran profil fonctionne visuellement, mais le mode développement signale des avertissements Next.js préexistants liés à un script injecté hors du document principal et à un mismatch d’hydratation. Aucun de ces messages n’est provoqué par les données pages/groupes ajoutées dans le profil ; ils proviennent de l’outillage de développement/layout global et devront être isolés avant une optimisation dédiée du shell applicatif.

## Permalien

L’API locale `/api/wab/posts?page=1` renvoie la publication de test `wab-1`. Le test de permalien peut donc être effectué avec `http://localhost:3001/wab#post-wab-1` ; le composant possède maintenant l’ancre DOM correspondante et l’API `/api/wab/posts/wab-1` doit hydrater ce post même s’il n’est pas dans la première page du feed.

Le test `http://localhost:3001/wab#post-wab-1` a réussi : la publication ciblée est affichée et `document.getElementById('post-wab-1')` existe dans le DOM avec le hash conservé. Le fil peut donc résoudre un post hors de la première réponse grâce à la route GET dédiée.

## Contrôles sécurité du lot

Les nouvelles lectures Supabase restent côté serveur derrière le client administrateur ; aucune clé privée n’est ajoutée au navigateur. La route GET d’un post ne renvoie que les publications publiées et applique une vérification de visibilité : public/boosté, auteur, membre actif du groupe ou abonné au profil. Les groupes privés ne sont pas exposés dans le profil public. Les opérations de modification et suppression restent protégées par la session et le contrôle de propriété déjà présents.

Le plan global RLS de `docs/security/rls-hardening-plan.md` reste un plan de migration à appliquer par lots après validation des politiques en production ; il n’a pas été exécuté automatiquement dans cette session, afin de ne pas bloquer des flux existants sans validation de chaque table. Le warning de traçage filesystem de l’aperçu documentaire WAB reste également à traiter dans un lot performance séparé.
