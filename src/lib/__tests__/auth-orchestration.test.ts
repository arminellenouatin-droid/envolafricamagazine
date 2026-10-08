import { describe, it, expect } from "vitest";
import { COOKIE_NAME, COOKIE_OPTIONS, generateToken, verifyToken } from "@/lib/auth";
import { findUserById } from "@/lib/core-db";
import { getOrCreateSocialUser } from "@/lib/auth-social";
import { DEFAULT_PROMPT_CONFIG } from "@/lib/prompt-orchestrator";

describe("Orchestration de Sécurité & Authentification Envol Africa", () => {
  describe("1. Résilience de findUserById contre les identifiants non-UUID (Google sub)", () => {
    it("ne plante pas avec l'erreur Postgres 22P02 lorsqu'un ID Google sub est transmis", async () => {
      // Les Google sub IDs sont de la forme "google_102837482910"
      const result = await findUserById("google_102837482910");
      expect(result).toBeNull();
    });

    it("retourne null pour les identifiants vides ou invalides", async () => {
      expect(await findUserById("")).toBeNull();
      expect(await findUserById("   ")).toBeNull();
      expect(await findUserById("invalid-id-not-uuid")).toBeNull();
    });
  });

  describe("2. Unification sociale et robustesse getOrCreateSocialUser", () => {
    it("gère un providerId avec préfixe google_ sans lever d'exception de syntaxe UUID", async () => {
      const email = `test-google-${Date.now()}@example.com`;
      const user = await getOrCreateSocialUser({
        provider: "google",
        email,
        prenom: "Test",
        nom: "GoogleUser",
        providerId: "google_1182736452918",
      });

      expect(user).toBeDefined();
      expect(user.email).toBe(email);
      expect(user.nom).toBe("GoogleUser");
      expect(user.prenom).toBe("Test");
      expect(user.role).toBe("user");
      // Vérifier que le token JWT peut être généré et vérifié pour cet utilisateur
      const token = generateToken(user);
      const decoded = verifyToken(token);
      expect(decoded.id).toBe(user.id);
      expect(decoded.email).toBe(user.email);
    });

    it("rejette les profils sans adresse email valide", async () => {
      await expect(
        getOrCreateSocialUser({
          provider: "google",
          email: "",
          prenom: "Test",
        })
      ).rejects.toThrow("Adresse e-mail invalide");
    });
  });

  describe("3. Configuration de l'Orchestrateur de Prompts", () => {
    it("possède des délais UX centralisés et conformes aux spécifications", () => {
      expect(DEFAULT_PROMPT_CONFIG.delayInitialMs).toBe(400);
      // Entre 500 et 1000 ms après la décision cookies
      expect(DEFAULT_PROMPT_CONFIG.delayAfterCookieMs).toBeGreaterThanOrEqual(500);
      expect(DEFAULT_PROMPT_CONFIG.delayAfterCookieMs).toBeLessThanOrEqual(1000);
      // Entre 1500 et 3000 ms après One Tap
      expect(DEFAULT_PROMPT_CONFIG.delayAfterOneTapMs).toBeGreaterThanOrEqual(1500);
      expect(DEFAULT_PROMPT_CONFIG.delayAfterOneTapMs).toBeLessThanOrEqual(3000);
    });
  });

  describe("4. Intégrité des Cookies de Session (eam_token)", () => {
    it("définit un cookie httpOnly, sameSite lax et avec path /", () => {
      expect(COOKIE_NAME).toBe("eam_token");
      expect(COOKIE_OPTIONS.httpOnly).toBe(true);
      expect(COOKIE_OPTIONS.sameSite).toBe("lax");
      expect(COOKIE_OPTIONS.path).toBe("/");
      expect(COOKIE_OPTIONS.maxAge).toBe(30 * 24 * 60 * 60);
    });
  });
});
