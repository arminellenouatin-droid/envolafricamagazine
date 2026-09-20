<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# RÈGLES DE SÉCURITÉ STRICTES & OBLIGATOIRES
## Applicables obligatoirement avant et pendant TOUTE intervention, correction ou développement

Ces 10 règles sont fondamentales, non négociables et doivent être vérifiées à chaque intervention :

1. **Sauvegarde Préalable Obligatoire** :
   - Avant toute modification sensible de base de données, migration ou opération critique, vérifier ou créer une sauvegarde complète (dump SQL/JSON ou snapshot).
   - Interdiction formelle des commandes destructrices (`DROP TABLE`, `TRUNCATE`, `DELETE` sans clause WHERE, `rm -rf`, `reset --hard`) sans accord explicite préalable.

2. **Règle Zéro-Régression & Composants Sanctifiés** :
   - Ne JAMAIS modifier les composants d'en-tête (`Header.tsx`, `HeaderShell.tsx`).
   - Préserver rigoureusement le fonctionnement des fonctionnalités existantes : paiement Moneroo, lecteur Flipbook (paywall page 8), authentification, publications WAB, kiosque.

3. **Confidentialité Totale des Secrets** :
   - Aucun mot de passe de base de données, clé API privée, token JWT ou secret webhook ne doit figurer dans le code source ou la documentation Markdown.
   - `.env` et `.env.local` doivent toujours être ignorés par Git (`.gitignore`).
   - Aucune clé secrète ne doit être exposée côté client (`NEXT_PUBLIC_`).

4. **Contrôle d'Accès Zéro-Trust & Validation Serveur** :
   - Aucune vérification de permission ne doit reposer uniquement sur l'interface React / client.
   - Contrôle systématique des rôles (`admin`, `gerant`, `redacteur`) et de la propriété des ressources (anti-IDOR) côté serveur et via l'Edge Middleware sur `/admin/*`.

5. **Validation et Assainissement des Entrées (Zero-Trust Input)** :
   - Validation stricte de tous les corps de requête et paramètres d'URL.
   - Prévention XSS obligatoire : tout contenu texte enrichi ou HTML doit passer par `sanitizeRichText`. Interdiction des balises exécutables (`<script>`, `<iframe>`, `<svg>`, `<math>`, etc.) et des protocoles non autorisés (`javascript:`, `data:`).
   - Prévention SSRF obligatoire : vérification stricte de liste blanche pour tout téléchargement distant côté serveur (`*.supabase.co` et domaine officiel uniquement).
   - Prévention injections SQL : requêtes paramétrées exclusivement, aucune concaténation directe de chaîne.

6. **Protection Anti-Abus & Rate Limiting** :
   - Limitation de fréquence obligatoire sur toutes les routes d'écriture sensibles (`/api/payment/init`, `/api/auth/register`, `/api/newsletter`, `/api/comments`).

7. **Sécurité Réseau, En-têtes HTTP & Cookies** :
   - En-têtes de sécurité maintenus : HSTS, `X-Frame-Options`, `Content-Security-Policy` avec `frame-ancestors 'self'`, `X-Content-Type-Options: nosniff`.
   - Cookies de session configurés avec `HttpOnly`, `Secure` et `SameSite`.

8. **Sécurité des Transactions Financières** :
   - Vérification cryptographique obligatoire des signatures des webhooks de paiement avant tout traitement.
   - Confirmation de paiement validée côté serveur, jamais sur simple redirection du navigateur client.
   - Aucun stockage de coordonnées bancaires sur nos serveurs.

9. **Maintien des Dépendances & Sécurité CVE** :
   - Maintenir les versions de framework à jour (ex: Next.js sans vulnérabilités RCE critiques).
   - Vérifier l'audit des dépendances à chaque ajout de package.

10. **Validation Systématique Avant Déploiement** :
    - `npx tsc --noEmit` : 0 erreur de compilation.
    - `npm run build` : succès complet de la génération de production.
    - Vérification en production réelle (Vercel) des codes HTTP attendus.

