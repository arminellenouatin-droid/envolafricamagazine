# Validation preview — 20 août 2026

Le preview de la branche `stabilization/lot-4-finance-migration-audit` est accessible sous `https://envolafricamagazinegildas-git-stabilization-lot-7b984e-arminel.vercel.app` après reprise de session Vercel. La page `/financement` répond et affiche le parcours Crowdfunding, les filtres et l’état vide attendu après suppression des données de test : aucune campagne active n’est affichée.

Le endpoint `/api/crowdfunding/advisory-plans` répond avec les trois formules Angel actives : 50 000 FCFA, 80 000 FCFA et 100 000 FCFA par mois, avec leurs niveaux de service et descriptions. La validation authentifiée complète reste à effectuer avec un compte applicatif connecté.

L’endpoint `/api/crowdfunding/projects?limit=12` répond avec `projets: []`, `nextCursor: null` et `boostedIds: []`, cohérent avec la suppression des données de test et avec le contrat de pagination. L’endpoint `/api/crowdfunding/payouts` répond sans session par `{"error":"Connexion requise."}`, ce qui confirme que les données financières ne sont pas exposées publiquement.

L’endpoint `/api/crowdfunding/documents` refuse également une requête non authentifiée avec `Connexion requise.`. La page `/financement/dashboard/porteur` se rend correctement sur le preview et affiche le wizard en 8 étapes, mais le parcours authentifié complet n’est pas encore exécuté dans cette session ; les métriques de synthèse visibles restent des valeurs de démonstration dans l’interface et devront être remplacées par des agrégats Supabase avant validation métier finale.

Le preview READY du commit `bc9dc06` est disponible sous `https://envolafricamagazinegildas-lch57ajok-arminel.vercel.app`. Le dashboard porteur affiche désormais 0 F, 0 vue et 0 investisseur lorsque le compte n’a aucun projet, au lieu des anciennes valeurs fictives. Le dashboard investisseur se rend correctement, mais conserve encore deux blocs de démonstration visibles lorsqu’il n’y a aucun investissement : « Parts détenues 2.5 % • 20M valo » et « Valeur actuelle 520k F (+4 %) ». Ces valeurs doivent être remplacées par des données conditionnelles Supabase dans la prochaine correction avant validation finale.
