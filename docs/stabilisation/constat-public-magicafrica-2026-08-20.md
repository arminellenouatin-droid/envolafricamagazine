# Constat public MagicAfrica — 20 août 2026

Le projet MagicAfrica est confirmé comme approuvé dans l’espace administratif par l’utilisateur. Cependant, sur le preview `https://envolafricamagazinegildas-4bq0osag8-arminel.vercel.app/financement`, la section des campagnes affiche `0 campagnes affichées` et le message « Aucune campagne active pour ces filtres ».

Le contrôle direct de `https://envolafricamagazinegildas-4bq0osag-arminel.vercel.app/api/crowdfunding/projects?limit=12` (URL corrigée ci-dessous) doit être vérifié avec l’URL exacte du déploiement. Le premier contrôle réalisé sur `https://envolafricamagazinegildas-4bq0osag8-arminel.vercel.app/api/crowdfunding/projects?limit=12` a renvoyé `{"projets":[],"nextCursor":null,"boostedIds":[]}`.

Conclusion provisoire : l’approbation administrative est confirmée côté utilisateur, mais le projet n’est pas encore exposé par la liste publique du preview. Il faut diagnostiquer la lecture publique Supabase, le statut réellement enregistré et le filtrage des projets avant toute contribution Moneroo. Aucun paiement ne doit être lancé tant que cette incohérence n’est pas résolue.
