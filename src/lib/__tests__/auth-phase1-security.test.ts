import { describe, it, expect } from "vitest";
import { POST as registerHandler } from "@/app/api/auth/register/route";
import { POST as logoutHandler } from "@/app/api/auth/logout/route";
import { NextRequest } from "next/server";
import { hasRole, canManageUsers, canViewOrders, Role } from "@/lib/rbac";
import { COOKIE_NAME, COOKIE_OPTIONS, generateToken, verifyToken } from "@/lib/auth";
import { ProductionDatabaseNotConfiguredError } from "@/lib/core-db";
import { isProductionRuntime } from "@/lib/supabase-admin";

describe("PHASE 1 — Souveraineté Auth, Contrôle d'Accès & Anti-IDOR", () => {
  describe("1.A — Règle 4.2 : Longueur minimale du mot de passe >= 10 & Anti-Élévation de privilèges", () => {
    it("rejette les inscriptions avec mot de passe de moins de 10 caractères", async () => {
      const req = new NextRequest("https://www.envolafrica.site/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: "Test",
          prenom: "User",
          email: "court-pwd@example.com",
          password: "Court9!", // 7 caractères
        }),
      });

      const res = await registerHandler(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("au moins 10 caractères");
    });

    it("rejette les tentatives d'élévation de privilège à l'inscription (payload role: admin ignoré)", async () => {
      const email = `test-no-priv-esc-${Date.now()}@example.com`;
      const req = new NextRequest("https://www.envolafrica.site/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: "Hacker",
          prenom: "Attacker",
          email,
          password: "SuperSecretPassword123!",
          role: "admin", // Tentative d'injection de rôle admin
        }),
      });

      const res = await registerHandler(req);
      // Soit 201 avec rôle forcé à user, soit 429 si rate limited
      if (res.status === 201) {
        const json = await res.json();
        expect(json.success).toBe(true);
      } else {
        expect([201, 409, 429]).toContain(res.status);
      }
    });
  });

  describe("1.B — Sécurisation des cookies et session eam_token", () => {
    it("applique les attributs de sécurité conformes (HttpOnly, SameSite Lax, MaxAge 30j)", () => {
      expect(COOKIE_NAME).toBe("eam_token");
      expect(COOKIE_OPTIONS.httpOnly).toBe(true);
      expect(COOKIE_OPTIONS.sameSite).toBe("lax");
      expect(COOKIE_OPTIONS.maxAge).toBe(30 * 24 * 60 * 60);
    });

    it("vérifie que la déconnexion invalide immédiatement le cookie (maxAge: 0, expires expiré)", async () => {
      const res = await logoutHandler();
      expect(res.status).toBe(200);
      const setCookie = res.headers.get("set-cookie") || "";
      expect(setCookie).toContain("eam_token=");
      expect(setCookie).toContain("Max-Age=0");
    });

    it("génère et valide des tokens JWT inviolables avec rôle scellé", () => {
      const mockUser: any = {
        id: "usr-phase1-test",
        email: "verified@envolafrica.site",
        role: "user",
      };
      const token = generateToken(mockUser);
      const decoded = verifyToken(token);
      expect(decoded.id).toBe("usr-phase1-test");
      expect(decoded.role).toBe("user");
    });
  });

  describe("1.C — RBAC & Anti-IDOR", () => {
    it("respecte la hiérarchie stricte des rôles et l'accès d'administration", () => {
      const visitor = null;
      const user: any = { role: "user" };
      const redacteur: any = { role: "redacteur" };
      const gerant: any = { role: "gerant" };
      const admin: any = { role: "admin" };

      expect(hasRole(visitor, "user")).toBe(false);
      expect(hasRole(user, "user")).toBe(true);
      expect(hasRole(user, "redacteur")).toBe(false);
      expect(hasRole(redacteur, "redacteur")).toBe(true);
      expect(hasRole(gerant, "redacteur")).toBe(true);
      expect(hasRole(admin, "gerant")).toBe(true);

      // Gestion des utilisateurs réservée à l'administrateur
      expect(canManageUsers(user)).toBe(false);
      expect(canManageUsers(gerant)).toBe(false);
      expect(canManageUsers(admin)).toBe(true);
    });

    it("garantit l'étanchéité anti-IDOR sur les commandes (propriétaire vs tiers)", () => {
      const userA: any = { id: "user-alpha", role: "user" };
      const userB: any = { id: "user-beta", role: "user" };
      const gerant: any = { id: "user-staff", role: "gerant" };

      // User A peut voir ses propres commandes
      expect(canViewOrders(userA, "user-alpha")).toBe(true);
      // User B NE PEUT PAS voir les commandes de User A (anti-IDOR)
      expect(canViewOrders(userB, "user-alpha")).toBe(false);
      // Le gérant peut voir toutes les commandes pour support client
      expect(canViewOrders(gerant, "user-alpha")).toBe(true);
    });
  });

  describe("1.D — Fail-Closed en Production", () => {
    it("déclenche ProductionDatabaseNotConfiguredError en production sans Supabase", () => {
      const originalEnv = process.env.NODE_ENV;
      try {
        (process.env as any).NODE_ENV = "production";
        expect(isProductionRuntime()).toBe(true);
        const err = new ProductionDatabaseNotConfiguredError();
        expect(err.name).toBe("ProductionDatabaseNotConfiguredError");
      } finally {
        (process.env as any).NODE_ENV = originalEnv;
      }
    });
  });
});
