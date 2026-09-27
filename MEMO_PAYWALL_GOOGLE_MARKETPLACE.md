# Mémo de Mission : Refonte Paywall Articles, Audit Google Services & Routage Messagerie Marketplace

## 1. Objectif de la mission
1. **Refonte UI/UX du Paywall des Articles** : Harmoniser l'encart de restriction de lecture avec la charte éditoriale luxueuse d'Envol Africa Magazine (bordeaux `#9e001f`, or chaud `#d4af37`, typographie élégante, carte valorisante). Remplacer l'ancien bloc discret par un appel à l'action percutant : "**La suite de cet article est réservée aux abonnés.**" (agrandi et en gras), "**Abonnez-vous pour lire tout le contenu et les autres articles**", et le bouton d'action principal "**Découvrez nos abonnements**" pointant vers `/abonnement`.
2. **Audit & Résolution Conflits Google (Chrome Push, One Tap & Cookie Consent)** :
   - Éliminer le conflit visuel et de clics entre le bandeau de consentement cookies (`z-[9999]`) et le tiroir Google One Tap (`z-[1000]`/`z-[1001]`).
   - Corriger la callback d'authentification Google (`/auth/callback`) qui rejetait les retours OAuth sous forme de hash fragment `#access_token=...` avec l'erreur `missing_code`.
   - Corriger le Service Worker Push (`public/firebase-messaging-sw.js`) qui désinstallait immédiatement le push sur les domaines Vercel en raison d'une vérification `isAllowedHost` restrictive.
3. **Routage Messagerie Marketplace** :
   - Assurer que lorsqu'un utilisateur navigue dans la Marketplace, le bouton Message ouvre la messagerie dédiée Marketplace (`/marketplace/messages`) plutôt que la messagerie sociale WAB, tout en respectant l'interdiction absolue de modifier `Header.tsx` et `HeaderShell.tsx`.
   - Proposer un sélecteur d'onglets ergonomique en haut des messageries pour basculer aisément entre WAB et Marketplace.

## 2. Périmètre et Contraintes
- **Composants Sanctifiés** : `Header.tsx` et `HeaderShell.tsx` restent strictement intacts.
- **Sécurité RLS & Paywall Serveur** : Le contenu intégral des articles cryptés est tronqué côté serveur avant envoi du HTML/JSON pour les non-abonnés (Règle AGENTS.md §3.7).
- **Responsive** : Validation sur mobile, tablette et desktop.

## 3. Plan d'exécution
- [ ] Étape 1 : Refonte de `src/components/ArticlePaywall.tsx` (bordeaux/or, typographie, badges de valeur, boutons CTA).
- [ ] Étape 2 : Harmonisation de `GoogleOneTapPrompt.tsx` (temporisation après cookies, suppression scrim bloquant mobile).
- [ ] Étape 3 : Sécurisation et robustesse de `src/app/auth/callback/page.tsx` (support code PKCE + tokens hash fragment + échange session Supabase).
- [ ] Étape 4 : Déblocage de `public/firebase-messaging-sw.js` (domaine Vercel autorisé, audit complet rédigé).
- [ ] Étape 5 : Routage intelligent Marketplace / WAB dans `src/app/marketplace/MarketplaceClient.tsx` et `src/app/messages/page.tsx`.
- [ ] Étape 6 : Tests complets, build Next.js, rapport d'audit et déploiement en production.
