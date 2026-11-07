import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { GET as getMarketplaceProducts } from "@/app/api/marketplace/products/route";
import { GET as getSalonProducts } from "@/app/api/wab/salons/[id]/products/route";
import { NextRequest } from "next/server";

describe("PHASE 0 — Vérité, Hygiène Immédiate & Retrait du Faux", () => {
  it("0.C — vérifie que robots.txt utilise le domaine canonique www.envolafrica.site", () => {
    const robotsPath = path.join(process.cwd(), "public", "robots.txt");
    expect(fs.existsSync(robotsPath)).toBe(true);

    const robotsContent = fs.readFileSync(robotsPath, "utf-8");
    expect(robotsContent).toContain("Sitemap: https://www.envolafrica.site/sitemap.xml");
    expect(robotsContent).not.toMatch(/Sitemap:\s+https:\/\/envolafrica\.site\/sitemap\.xml/);
    expect(robotsContent).toContain("Host: https://www.envolafrica.site");
    expect(robotsContent).toContain("Disallow: /admin/");
    expect(robotsContent).toContain("Disallow: /compte/");
    expect(robotsContent).toContain("Disallow: /panier");
  });

  it("0.A — vérifie que tous les icônes référencés dans manifest.webmanifest existent physiquement", () => {
    const manifestPath = path.join(process.cwd(), "public", "manifest.webmanifest");
    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThan(0);

    for (const icon of manifest.icons) {
      const cleanSrc = icon.src.replace(/^\//, "");
      const iconPath = path.join(process.cwd(), "public", cleanSrc);
      expect(fs.existsSync(iconPath)).toBe(true);
    }
  });

  it("0.B — garantit qu'aucun seed-* factice n'est renvoyé par l'API publique marketplace", async () => {
    const req = new NextRequest("https://www.envolafrica.site/api/marketplace/products?category=Equipements");
    const response = await getMarketplaceProducts(req);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(Array.isArray(json.products)).toBe(true);
    for (const product of json.products) {
      expect(product.id).not.toMatch(/^seed-/);
    }
  });

  it("0.B — garantit qu'aucun seed-* factice n'est renvoyé par l'API salons WAB et gère les salons inexistants", async () => {
    // Salon existant
    const reqExisting = new NextRequest("https://www.envolafrica.site/api/wab/salons/salon-demo-finance-africa/products");
    const resExisting = await getSalonProducts(reqExisting, { params: Promise.resolve({ id: "salon-demo-finance-africa" }) });
    expect(resExisting.status).toBe(200);

    const jsonExisting = await resExisting.json();
    expect(Array.isArray(jsonExisting.availableProducts)).toBe(true);
    for (const product of jsonExisting.availableProducts) {
      expect(product.id).not.toMatch(/^seed-/);
    }

    // Salon inexistant -> 404 attendu
    const reqMissing = new NextRequest("https://www.envolafrica.site/api/wab/salons/inconnu-123/products");
    const resMissing = await getSalonProducts(reqMissing, { params: Promise.resolve({ id: "inconnu-123" }) });
    expect(resMissing.status).toBe(404);
  });

  it("0.A & 0.B — vérifie la présence des inventaires techniques et de la matrice d'environnement", () => {
    const inventairePath = path.join(process.cwd(), "docs", "INVENTAIRE_TECHNIQUE.md");
    const envMatrixPath = path.join(process.cwd(), "docs", "ENVIRONMENT_MATRIX.md");

    expect(fs.existsSync(inventairePath)).toBe(true);
    expect(fs.existsSync(envMatrixPath)).toBe(true);

    const envMatrix = fs.readFileSync(envMatrixPath, "utf-8");
    expect(envMatrix).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(envMatrix).toContain("MONEROO_SECRET_KEY");
    expect(envMatrix).toContain("NEXT_PUBLIC_SUPABASE_URL");
  });
});
