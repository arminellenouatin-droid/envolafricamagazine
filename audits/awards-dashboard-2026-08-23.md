# Audit dashboard Africa Awards — 23 août 2026

## Constat Production

La page `https://envolafricamagazinealokpe.vercel.app/africa-awards/admin/dashboard` affiche 8 compétitions, 18 candidats, 13 800 votes, 2,5 M F de chiffre d’affaires, 150 lives et 5 k utilisateurs actifs. Les seules actions visibles sont des liens ; le lien « Gérer compétitions » mène à une page qui liste les compétitions mais aucun dossier dynamique `[id]` n’existe dans le code local pour le lien « Ouvrir le module ».

## Vérification Supabase

Le projet EAM `rtfjwpytiuvoekomevpu` contient 8 lignes dans `public.awards_competitions`. Les deux lignes opérationnelles créées le 20 août 2026 sont `qui-veut-etre-mon-associe` et `awards-du-fa`, toutes deux en `draft`, avec 0 candidature, 0 vote et aucun live. Les six autres lignes sont des compétitions historiques `archived` avec des compteurs legacy de démonstration et ne doivent pas être présentées comme compétitions opérationnelles courantes.

Les compteurs legacy des compétitions historiques ne correspondent pas toujours aux lignes relationnelles actuelles. Le dashboard doit donc distinguer les compétitions opérationnelles des archives et ne plus afficher de constantes inventées. Les indicateurs sans source réelle disponible doivent afficher une valeur explicite du type « non disponible » plutôt qu’un chiffre de démonstration.

## Cause identifiée

La liste de gestion charge toutes les compétitions sans filtrer les archives. Le dashboard utilise des constantes codées en dur pour les pays, la variation mensuelle du vote, le chiffre d’affaires, le nombre de lives et les utilisateurs actifs. Le lien de module existe dans l’interface mais sa route dynamique n’est pas présente, ce qui empêche la modification détaillée et la finalisation des compétitions existantes.

## Correction prévue

Filtrer le tableau opérationnel sur les statuts non archivés, afficher séparément le nombre d’archives, calculer les candidats et votes depuis les tables relationnelles lorsque disponibles, supprimer tous les KPIs fictifs et créer un module de détail par compétition avec modification sécurisée du statut et accès aux candidatures. Une requête de validation après déploiement devra confirmer que seules les deux compétitions courantes apparaissent par défaut.

## Point sécurité à traiter séparément

L’inspection Supabase a signalé que `public.marketplace_download_tokens` n’a pas la protection RLS activée. Aucune modification automatique n’est appliquée dans ce lot, car l’activation sans politiques adaptées bloquerait potentiellement les accès légitimes. Ce point doit faire l’objet d’une migration et d’une définition de politiques dédiées après validation.
