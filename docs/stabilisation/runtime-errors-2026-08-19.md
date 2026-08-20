# Erreurs runtime Vercel — vérification du 19 août 2026

L’agrégateur Vercel a retourné deux groupes d’erreurs sur les dernières 24 heures, provenant de déploiements antérieurs :

| Route | Erreur | Dernier déploiement signalé | Interprétation |
|---|---|---|---|
| `/api/wab/subscription` | `EROFS` sur `src/data/wab-subscriptions.json` | `dpl_2cpGLMAefxeKAQaXyziS8u7yNuDC` | Le store actuel contient déjà un garde de production et utilise `wab_business_subscriptions` lorsque Supabase est configuré. Le groupe correspond à un ancien déploiement et doit être recontrôlé après la prochaine publication. |
| `/api/admin/magazines` | `EROFS` sur `src/data/db.json` | `dpl_37MnEDRsreuQW3ngvBzapx1hKSE3` | La route actuelle utilise déjà Supabase pour GET/POST/PUT/DELETE lorsque le client serveur est configuré. Le groupe est historique et doit être recontrôlé sur le déploiement courant. |

Aucune correction supplémentaire n’a été appliquée sur ces deux fichiers à ce stade, car le code présent dans la branche utilise déjà les chemins Supabase et le fallback JSON uniquement lorsque l’environnement n’est pas production. La vérification correcte est donc un nouveau contrôle ciblé du déploiement actuel après publication, afin d’éviter de modifier inutilement des flux déjà durcis.
