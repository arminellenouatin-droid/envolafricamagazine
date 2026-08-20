# Constat public MagicAfrica — 20 août 2026

La base Supabase de référence contient un seul projet : `MagicAfrica` avec l’identifiant `51c966b9-193a-405a-af4e-b967a7fc7a25` et le statut `en_cours`.

La cause de l’absence publique a été identifiée dans `src/app/api/crowdfunding/projects/route.ts` : la route publique appliquait par défaut le filtre `statut=active`, alors que le statut réellement utilisé par l’administration et Supabase est `en_cours`. Le correctif `0e042e3` remplace ce filtre par `en_cours`.

Le nouveau preview `https://envolafricamagazinegildas-bamat3ebq-arminel.vercel.app` est READY. Son endpoint public retourne maintenant MagicAfrica avec `statut: "en_cours"`, objectif `5 000 000 XOF`, type `angel` et fin prévue le 19 septembre 2026.

La page `/financement` capturée immédiatement après le déploiement affiche encore son état initial « 0 campagnes affichées » puis « Chargement des campagnes… » dans le rendu capturé. L’API est corrigée ; il faut vérifier un rechargement complet de la page et, si nécessaire, le chargement client ou le cache de cette page avant de passer à Moneroo.

Aucun paiement n’a été lancé.
