import { describe, it, expect } from "vitest";
import sitemap from "@/app/sitemap";
import { isProductionRuntime } from "@/lib/supabase-admin";

describe("LOT 5 & LOT 8 — Tests d'Intégration Sitemap & Sécurité des URLs", () => {
  it("génère une liste d'URLs non vide pour les moteurs de recherche", async () => {
    const entries = await sitemap();
    expect(Array.isArray(entries)).toBe(true);
    expect(entries.length).toBeGreaterThan(30);
  });

  it("vérifie que chaque entrée possède une URL absolue bien formée", async () => {
    const entries = await sitemap();
    for (const entry of entries) {
      expect(entry.url).toMatch(/^https?:\/\//);
      expect(entry.url).not.toContain("undefined");
      expect(entry.url).not.toContain("[object");
    }
  });

  it("garantit qu'aucune page privée ou d'administration n'est exposée dans le sitemap", async () => {
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);

    for (const url of urls) {
      expect(url).not.toMatch(/\/admin(\/|$)/);
      expect(url).not.toMatch(/\/compte(\/|$)/);
      expect(url).not.toMatch(/\/api(\/|$)/);
      expect(url).not.toMatch(/\/panier(\/|$)/);
    }
  });

  it("inclut les piliers majeurs de l'écosystème Envol Africa", async () => {
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);

    expect(urls.some((u) => u.endsWith("/kiosque"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/emploi"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/financement"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/marketplace"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/don"))).toBe(true);
  });
});

describe("LOT 1, 2 & LOT 8 — Tests d'Intégration Fail-Closed et Détection Production", () => {
  it("détecte correctement l'environnement de production", () => {
    const originalEnv = process.env.NODE_ENV;
    try {
      (process.env as any).NODE_ENV = "production";
      expect(isProductionRuntime()).toBe(true);

      (process.env as any).NODE_ENV = "development";
      expect(isProductionRuntime()).toBe(false);

      (process.env as any).NODE_ENV = "test";
      expect(isProductionRuntime()).toBe(false);
    } finally {
      (process.env as any).NODE_ENV = originalEnv;
    }
  });
});
