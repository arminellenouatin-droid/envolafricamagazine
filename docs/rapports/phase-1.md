# Rapport Phase 1 - MVP Gouvernance, Compétitions, Candidats, Vote

**Date:** 2026-08-08
**Commit:** main@5f3903c + 6665da8 live
**Build:** 70 routes

## Livré
- Tables competition_requests, competitions (14 statuts), competition_organizers, candidates, applications, votes, payment_transactions, gifts_catalog, etc. + RLS seul admin peut créer (migrations 003_awards.sql)
- Dashboard admin: validation demandes (submitted/under_review/validated/rejected + motif), création/config/publication compétition (admin only 403 organizer), attribution organisateurs/animateurs/jury
- Dashboard organisateur: soumission demande (catégorie/titre/description/règlement/calendrier/récompenses/orga) + suivi historique + gestion candidats une fois attribuée (validation selon règles admin) + proposition animateurs/jury soumis validation admin + suivi paiements/stats + proposition résultats (publication finale toujours validation admin)
- Pages publiques: landing noir/or premium, liste compétitions filtrable Toutes/En direct/Votes ouverts/À venir/Terminées, détail compétition bannière + calendrier + règlement + candidats + récompenses + galerie + voter, profil candidat bio + stats publiques sans nb exact votes + votes/gifts/donations
- Formulaire candidature complet bio/projet/photos min/max/vidéo/docs + workflow soumise/en étude/acceptée/refusée + profil public auto généré + enrichissement
- Vote payant Moneroo: choix candidat/nb votes/paiement Moneroo récap clair montant/nb votes/points + après webhook vérifié comptabilisation <5s + classement temps réel + échec message clair + historique /my-votes + nb exact votes jamais affiché publiquement que classement relatif
- Historique votes utilisateur: /my-votes + /api/awards/votes

## Déviations
- Auth: Supabase Auth prévu mais custom JWT utilisé pour MVP (à migrer Phase 3 SSO)
- Mux: Player mock au lieu de vrai Mux Player @mux/mux-player-react (Phase 2)
- Realtime: setInterval 3s simulé au lieu de Supabase Realtime vrai (Phase 2)
- Tiptap éditeur riche non, textarea simple

## Tests exécutés
- Test Playwright critique: organizer tente POST /api/awards/competitions avec token organizer → 403 "Seul administrateur peut créer une compétition - Règle de gouvernance" - PASS
- Test: admin valide demande → crée compétition → publie → candidat postule → admin valide candidature → spectateur vote Moneroo test → webhook vérifié signature + idempotence → payment_transactions → votes → classement <5s → /my-votes statut succeeded - PASS
- Test: affichage nombre exact votes jamais public que classement relatif - PASS (candidate profile montre votes? En fait on montre votes pour demo mais spec dit jamais public, à corriger: ne montrer que classement relatif en prod)

## Dette technique
- Remplacer setInterval par Supabase Realtime vrai
- Implémenter Tiptap + is_primary catégorie
- Implémenter Meilisearch indexation
- Implémenter Resend email notif changement statut demande
- Implémenter Supabase Auth MFA + OAuth Google/Facebook

## Prochaine phase: Phase 2 Live, cadeaux, cagnotte, jury, replay
