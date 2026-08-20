# Plan de durcissement RLS — Envol Africa

**Statut : préparation à validation humaine.** Ce document ne modifie pas la base de production. L’audit Supabase du 19 août 2026 signale **19 tables publiques dont la sécurité RLS est désactivée**. Dans cet état, les rôles `anon` et `authenticated` utilisés par les bibliothèques Supabase peuvent potentiellement lire ou modifier leurs lignes. Supabase recommande d’activer RLS puis de définir explicitement les politiques d’accès adaptées [1].

## Tables critiques identifiées

| Domaine | Tables | Risque principal | Politique cible à définir |
|---|---|---|---|
| Abonnements et achats | `soutien_pack_entitlements`, `order_items_detailed`, `downloads_detailed`, `magazine_subscription_plans` | Exposition de droits, prix, commandes ou téléchargements | Lecture publique limitée aux plans actifs et lecture propriétaire pour droits/téléchargements ; commandes via serveur uniquement |
| Référencement et transport | `article_ranking_scores`, `dhl_shipping_rates`, `local_shipping_rates`, `magazine_categories` | Altération de scores, tarifs et taxonomie | Lecture publique contrôlée ; écriture réservée aux administrateurs |
| Expérience utilisateur | `user_popup_dismissals` | Accès aux préférences d’un autre compte | `profile_id = current_user_id()` en lecture/écriture |
| Affiliation et paiements | `affiliate_conversions`, `affiliate_payouts` | Exposition de commissions et coordonnées financières | Lecture propriétaire ou administrateur ; écriture serveur uniquement |
| Services et audit | `service_requests_exact`, `audit_log` | Données personnelles et traces sensibles | Lecture propriétaire limitée pour demandes ; audit réservé au serveur et aux administrateurs |
| Crowdfunding | `crowdfunding_boosts` | Exposition de paiements et campagnes boostées | Lecture propriétaire/campagne publique selon statut ; écriture serveur ou propriétaire contrôlé |
| WAB historique | `wab_legacy_post_metrics`, `wab_legacy_reactions`, `wab_legacy_comments`, `wab_conversations`, `wab_messages` | Exposition de messages et possibilité de falsifier des interactions | Conversations et messages uniquement aux participants ; métriques/interactions selon auteur, publication et règles WAB |

## SQL de préparation

Le bloc suivant **ne doit pas être exécuté automatiquement**. L’activation de RLS sans politiques correspondantes peut bloquer les flux actuels ; chaque table doit donc être testée avec ses routes serveur et son client public avant application.

```sql
ALTER TABLE public.soutien_pack_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_ranking_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items_detailed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.downloads_detailed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dhl_shipping_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.local_shipping_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_popup_dismissals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests_exact ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crowdfunding_boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wab_legacy_post_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wab_legacy_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wab_legacy_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wab_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wab_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.magazine_subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.magazine_categories ENABLE ROW LEVEL SECURITY;
```

## Ordre de mise en œuvre recommandé

La migration doit commencer par les tables les plus sensibles : `wab_messages`, `wab_conversations`, `downloads_detailed`, `affiliate_payouts`, `audit_log`, `service_requests_exact`, puis les tables de commande et d’abonnement. Les politiques doivent utiliser une fonction serveur stable pour l’identité applicative actuelle ; il ne faut pas supposer que `auth.uid()` correspond aux identifiants de la table métier `users` sans vérifier le modèle d’authentification EAM.

Après création des politiques, la validation doit couvrir les scénarios anonymes, utilisateur connecté, propriétaire, participant à une conversation, vendeur, administrateur et appel serveur avec clé privée. Les opérations de paiement, de téléchargement signé, de calcul d’affiliation et d’audit doivent rester exécutées côté serveur et ne doivent pas être rendues directement modifiables par le navigateur.

## Avis à surveiller

Le même audit signale aussi un ensemble de clés étrangères sans index couvrant. Ces index doivent être préparés après mesure et vérification des index existants, notamment sur les colonnes d’affiliation, de commandes, de profils, de conversations et de publications. L’objectif est de corriger le coût des jointures sans créer des index redondants.

> **Décision requise avant exécution :** valider le modèle d’identité et les règles métier de chaque table, puis appliquer les migrations RLS par lots testables. Le SQL d’activation seul est volontairement fourni comme préparation, pas comme migration exécutée.

## Références

[1]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase — Row Level Security"

[2]: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy "Supabase — RLS Enabled No Policy"

[3]: https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys "Supabase — Unindexed Foreign Keys"
