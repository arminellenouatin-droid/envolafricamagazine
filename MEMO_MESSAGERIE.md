# Mémo de Mission — Correction Messagerie & Amis WAB

## 1. Objectif Réel
Résoudre deux problèmes majeurs sur la messagerie (`/messages` / WAB) :
1. **Comptes suivis introuvables** : l'utilisateur ne retrouve pas ses abonnements/amis WAB dans la liste de contacts pour leur envoyer un message.
2. **Historique des messages non conservé** : après envoi d'un message, quitter la messagerie et y revenir fait disparaître l'historique ou affiche un écran vide/désynchronisé.

## 2. Périmètre
- **Inclus** :
  - Correction de l'endpoint `/api/messages/contacts` : correction de la requête SQL/Supabase (la colonne `full_name` n'existe pas dans `wab_profiles`, le nom se trouve dans `users(prenom, nom)`).
  - Correction de l'endpoint `/api/wab/messages` : suppression de la référence invalide à `wab_profiles.full_name`, tri chronologique croissant des messages (`created_at ASC`) pour un affichage WhatsApp naturel (messages les plus récents en bas).
  - Détection et réutilisation sans doublon des conversations existantes entre deux utilisateurs (`participant_a`, `participant_b`).
  - Prise en charge des paramètres d'URL `?userId=...` et `?conversationId=...` dans `src/app/messages/page.tsx` (avec `<Suspense>`).
  - Affichage direct des amis / comptes suivis WAB dans la colonne de gauche (barre rapide d'amis WAB + liste si aucune discussion active).
  - Navigation mobile fluide : l'écran de discussions s'affiche en premier sur mobile sauf si un contact précis est demandé dans l'URL.
  - Prévention de la perte de texte en cas d'erreur réseau et notifications d'erreur explicites.
- **Hors Périmètre** :
  - Composants sanctifiés (`Header.tsx`, `HeaderShell.tsx`) : strictement non modifiés.
  - Flipbook, paiement Moneroo, kiosque : préservés à 100%.

## 3. Décisions Techniques Clés
1. **Schéma Supabase** :
   - `wab_profiles` : colonnes `id, user_id, headline, about, avatar_url, ...` (pas de `full_name`).
   - `users` : colonnes `id, prenom, nom, avatar, email`.
   - On joint proprement `wab_profiles` et `users` pour obtenir nom complet et avatar sans erreur Postgres.
2. **Tri des messages** :
   - Requête avec `.order("created_at", { ascending: true })` pour que le message le plus récent soit à la fin du tableau (`messages[messages.length - 1]`).
   - Le preview dans la liste des discussions utilise ce dernier message.
   - Le scroll automatique défile vers le bas (dernier message).
3. **Persistance et Idempotence** :
   - Lors de l'envoi d'un message avec `recipientId`, recherche d'une conversation existante dans les deux sens `(participant_a, participant_b)`. Si elle existe, réutilisation de son ID. Sinon création ordonnée `min(a, b), max(a, b)`.
4. **Ergonomie Mobile** :
   - Sur mobile (< 768px), ne pas forcer `activeConversation = conversations[0]` au chargement initial pour permettre à l'utilisateur de voir sa liste de conversations et d'amis.
   - Si `?userId=` ou `?conversationId=` est dans l'URL, activer directement cette conversation.

## 4. Plan d'Exécution & État Réel Livré
- [x] Phase 1 : Compréhension et diagnostic des causes profondes
- [x] Phase 2 : Rédaction du mémo de cadrage
- [x] Phase 3 : Correction de `/api/messages/contacts/route.ts`
- [x] Phase 4 : Correction de `/api/wab/messages/route.ts`
- [x] Phase 5 : Amélioration et robustesse de `src/app/messages/page.tsx`
- [x] Phase 6 : Validation du build (`tsc`, `next build`) et tests de sécurité
- [x] Phase 7 : Clôture et push sur main
