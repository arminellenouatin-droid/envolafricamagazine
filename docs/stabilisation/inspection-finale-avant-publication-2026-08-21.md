# Inspection finale avant publication

## Résultat général

La branche de stabilisation est propre après le commit `8170f73`. La build Next.js et TypeScript passe, `git diff --check` passe et aucune clé secrète réelle n’a été trouvée dans les sources inspectées. Les migrations de sécurité, TOTP, challenges de connexion et Marketplace numérique ont été appliquées de manière additive au projet Supabase EAM.

## Contrôles réalisés

L’authentification vérifie maintenant l’adresse e-mail, applique une limitation serveur des tentatives et demande un challenge TOTP avant émission de session pour les comptes protégés. L’inspection a détecté puis corrigé une lacune : l’inscription construisait un lien `/auth/verify-email`, mais la page utilisateur correspondante n’existait pas. La page est maintenant créée et appelle la route de vérification existante.

Le webhook Moneroo vérifie la signature lorsqu’un secret de production est présent, vérifie le statut et le montant avant confirmation, et la branche Marketplace émet l’accès numérique seulement après paiement confirmé. Les fichiers sont conservés dans le bucket privé et servis par URL signée temporaire.

Le formulaire Marketplace distingue les offres physiques, services, formations, produits digitaux et fichiers téléchargeables. Le prix minimum serveur de 100 XOF est conservé. Les KPI administrateur utilisent les événements et données internes disponibles. AdSense est préparé mais désactivé par défaut sans identifiant réel et sans consentement publicitaire.

## Limites avant production

L’envoi réel des e-mails nécessite encore un fournisseur configuré et une adresse de domaine vérifiée. L’activation réelle d’AdSense nécessite l’identifiant éditeur, un domaine de production validé et l’examen Google. Ces éléments ne peuvent pas être inventés ni déduits de façon fiable dans le code.

La publication doit être déclenchée depuis l’interface de gestion du projet avec le dernier checkpoint validé. Après publication, il faut effectuer les tests réels de connexion, confirmation e-mail, TOTP, newsletter, création vendeur, création de fichier numérique, paiement Moneroo confirmé et téléchargement acheteur.

## Campagne de tests avant publication

La branche a été recompilée avec succès. Le serveur Next de production locale a démarré sans erreur bloquante. Les routes publiques `/auth/login`, `/auth/register`, `/auth/verify-email`, `/kiosque`, `/marketplace` et `/marketplace/commandes` ont répondu HTTP 200. Les routes protégées `/api/admin/kpis` et `/api/marketplace/downloads` ont correctement répondu HTTP 401 sans session. Les validations négatives des routes `/api/newsletter`, `/api/auth/login` et `/api/auth/register` ont correctement répondu HTTP 400 avec un corps vide, sans créer de données. La route GET du webhook Moneroo répond HTTP 200.

La branche locale `stabilization/lot-4-finance-migration-audit` est au commit `bdda517` et contient douze commits d’avance sur sa branche distante correspondante. La seule modification non committée est le suivi local `todo.md`, qui n’appartient pas au code de livraison.
