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

import { getOrganizationSchema, getWebSiteSchema, getNewsArticleSchema, getMarketplaceProductSchema } from "@/lib/schema-org";
import fs from "fs";
import path from "path";

describe("PHASE 4 — Données Structurées Schema.org JSON-LD & Robots.txt", () => {
  it("génère des microdonnées Schema.org valides pour l'organisation et le site", () => {
    const org = getOrganizationSchema();
    expect(org["@context"]).toBe("https://schema.org");
    expect(org["@type"]).toBe("NewsMediaOrganization");
    expect(org.name).toBe("Envol Africa Magazine");

    const site = getWebSiteSchema();
    expect(site["@context"]).toBe("https://schema.org");
    expect(site["@type"]).toBe("WebSite");
  });

  it("génère des microdonnées NewsArticle et Product conformes", () => {
    const articleSchema = getNewsArticleSchema({
      title: "Croissance africaine 2026",
      slug: "croissance-africaine-2026",
      summary: "Analyse économique de la zone UEMOA",
    });
    expect(articleSchema["@type"]).toBe("NewsArticle");
    expect(articleSchema.headline).toBe("Croissance africaine 2026");

    const prodSchema = getMarketplaceProductSchema({
      id: "prod-123",
      title: "Café torréfié artisanal",
      price_xof: 6500,
    });
    expect(prodSchema["@type"]).toBe("Product");
    expect(prodSchema.offers.price).toBe(6500);
    expect(prodSchema.offers.priceCurrency).toBe("XOF");
  });

  it("vérifie la présence du fichier public/robots.txt avec interdiction des zones privées", () => {
    const robotsPath = path.join(process.cwd(), "public", "robots.txt");
    expect(fs.existsSync(robotsPath)).toBe(true);
    const content = fs.readFileSync(robotsPath, "utf-8");
    expect(content).toContain("Disallow: /admin/");
    expect(content).toContain("Disallow: /compte/");
    expect(content).toContain("Disallow: /panier");
    expect(content).toContain("Disallow: /api/");
  });
});

