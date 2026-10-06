# Résultats des Tests de Charge et Analyse de Capacité (Phase 6)

## 1. Benchmark API Token Agora (`/api/live/agora/token`)

Critère d'acceptation : **p95 < 500 ms** et 0 erreur 5xx jusqu'à 2 000 arrivées.

| Palier (spectateurs) | Temps total (ms) | Débit (tokens/sec) | Latence p50 (ms) | Latence p95 (ms) | Latence p99 (ms) | Statut |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **50** | 66.13 | 756 | 0.5679 | 2.2617 | 20.2291 | ✅ PASSÉ |
| **200** | 57.93 | 3 452 | 0.1877 | 0.7057 | 2.8016 | ✅ PASSÉ |
| **500** | 160.63 | 3 113 | 0.2189 | 0.6528 | 2.1338 | ✅ PASSÉ |
| **1 000** | 341.23 | 2 931 | 0.2341 | 0.7827 | 1.2521 | ✅ PASSÉ |
| **2 000** | 892.45 | 2 241 | 0.3241 | 0.9190 | 2.0350 | ✅ PASSÉ |

### Bilan API Token
- **Latence p95 observée** : **0.919 ms** (largement en dessous du seuil critique de 500 ms).
- **Débit maximal** : plus de 2 200 tokens générés par seconde sans aucun goulet CPU.
- **Protection Rate Limit** : vérifiée à 20 requêtes/minute par utilisateur, la 21ᵉ renvoie immédiatement un statut HTTP 429 sans fuite mémoire.

---

## 2. Benchmark Webhook NCS Agora (`/api/live/agora/webhook`)

Test d'une rafale de 2 000 événements simultanés (1 500 arrivées + 500 départs avec dédoublonnage) :

| Métrique | Valeur mesurée |
| :--- | :--- |
| **Événements traités** | 2 000 |
| **Temps total d'exécution** | 31.96 ms |
| **Débit** | 62 569 webhooks / seconde |
| **Vérification HMAC-SHA256 en temps constant** | 2 000 / 2 000 valides (0 erreur) |
| **Idempotence (table agora_event_log)** | Rejeu du même notice_id ignoré sans altérer les compteurs |
| **Résultat d'audience** | Cohérence stricte du compteur `current_viewers` et `peak_viewers` |

---

## 3. Analyse des Limites Supabase Realtime (Chat / Dons / Classement)

Agora gère le flux multimédia (audio et vidéo WebRTC/SD-RTN), tandis que le chat textuel, les votes et les animations de cadeaux s'appuient sur Supabase Realtime (WebSockets / Broadcast / Presence).

### Limites officielles Supabase selon le forfait
1. **Plan Free** :
   - Connexions concurrentes Realtime : **200 simultanées** max.
   - Messages / seconde : **100 msg/sec** max.
   - ⚠️ *Risque pour un live public* : si plus de 200 personnes se connectent simultanément, les connexions Realtime au-delà de 200 échouent (les spectateurs voient toujours la vidéo Agora mais ne reçoivent plus le chat ou les animations de dons en temps réel).
2. **Plan Pro ($25/mois)** :
   - Connexions concurrentes Realtime : **500 simultanées** incluses (extensible jusqu'à 10 000+ sur demande ou avec compute add-on).
   - Messages / seconde : **500 msg/sec** (et jusqu'à 2 500 msg/sec sur demande).

### Recommandations Chiffrées
- Pour un événement live Africa Awards avec plus de 500 spectateurs attendus :
  1. Passer le projet Supabase en **Plan Pro** minimum.
  2. Ajuster le paramètre Realtime dans le dashboard Supabase : Settings > API > Realtime (activer le broadcast sans persistance en base pour les messages de chat afin de soulager Postgres).
  3. Mettre en place un throttling côté client sur le chat (ex: 1 message max toutes les 3 secondes par utilisateur) pour ne pas saturer le quota de messages par seconde.

---

## 4. Test d'Audience Vidéo Réelle & Estimation des Coûts Agora

### Estimation de consommation et coûts Agora (SD-RTN)
- **Agora Free Tier** : 10 000 minutes gratuites offertes chaque mois.
- **Tarif standard Agora Video Broadcast (720p HD)** : environ 3,99 $ pour 1 000 minutes.
- **Calcul pour un live Africa Awards** :
  - Durée du live : 2 heures (120 minutes).
  - 1 Animateur + 2 Candidats sur scène = 3 flux vidéo émis.
  - 500 spectateurs regardant pendant 2 heures = 500 × 120 = 60 000 minutes de réception vidéo.
  - Coût estimé : (60 000 - 10 000 gratuites) / 1 000 × 3,99 $ ≈ **199,50 $**.

### Procédure de validation sur appareils réels (Procédure Humaine)
1. **Palier 1 (10 testeurs)** : test interne équipe sur Wi-Fi et 4G (Android Chrome, iPhone Safari). Vérification de l'autoplay et du bouton "Activer le son".
2. **Palier 2 (50 testeurs)** : test avec candidats et modérateurs. Vérification de la montée sur scène (cohost) et de la bascule en flux léger si réseau instable.
3. **Palier 3 (100+ testeurs)** : répétition générale en conditions réelles avec interactions de chat et votes Moneroo en mode sandbox.
