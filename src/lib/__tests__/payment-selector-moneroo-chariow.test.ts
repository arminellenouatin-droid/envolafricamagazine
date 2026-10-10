import { describe, it, expect } from "vitest";
import {
  MONEROO_SUPPORTED_COUNTRIES,
  isMonerooSupportedCountry,
  getRecommendedGateway,
} from "@/lib/payment-config";
import { CHARIOW_PRODUCT_URLS } from "@/lib/chariow";
import { POST as initPaymentHandler } from "@/app/api/payment/init/route";
import { NextRequest } from "next/server";

describe("PHASE 2.C — Sélecteur Intelligent & Arbitrage Moneroo vs Chariow", () => {
  describe("1. Configuration des 6 Pays Moneroo (Doc 1 § 7)", () => {
    it("contient exactement les 6 pays UEMOA officiellement supportés par Moneroo", () => {
      expect(MONEROO_SUPPORTED_COUNTRIES).toHaveLength(6);
      expect(MONEROO_SUPPORTED_COUNTRIES).toEqual(["BJ", "CI", "SN", "TG", "BF", "ML"]);
    });

    it("TEST 1 — valide tous les 6 pays compatibles Moneroo", () => {
      for (const code of ["BJ", "CI", "SN", "TG", "BF", "ML"]) {
        expect(isMonerooSupportedCountry(code)).toBe(true);
        expect(isMonerooSupportedCountry(code.toLowerCase())).toBe(true);
        expect(getRecommendedGateway(code)).toBe("moneroo");
      }
    });

    it("TEST 2 & TEST 3 — route les pays internationaux et hors Moneroo obligatoirement vers Chariow", () => {
      const internationalCountries = ["FR", "US", "BE", "CA", "DE", "GB", "NG", "GH", "CM", "CD"];
      for (const code of internationalCountries) {
        expect(isMonerooSupportedCountry(code)).toBe(false);
        expect(getRecommendedGateway(code)).toBe("chariow");
      }

      // Cas indéterminé ou vide -> Chariow
      expect(isMonerooSupportedCountry(null)).toBe(false);
      expect(isMonerooSupportedCountry("")).toBe(false);
      expect(getRecommendedGateway(null)).toBe("chariow");
    });
  });

  describe("2. TEST 4 — Refus et Verrouillage Côté Backend (Doc 1 § 6 & § 13)", () => {
    it("rejette immédiatement toute tentative de forcer Moneroo avec un pays non compatible", async () => {
      const req = new NextRequest("https://www.envolafrica.site/api/payment/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donAmount: 10000,
          currency: "XOF",
          shippingCountry: "FR", // France : NON compatible Moneroo
          email: "client-france@example.com",
        }),
      });

      const res = await initPaymentHandler(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.code).toBe("MONEROO_COUNTRY_NOT_SUPPORTED");
      expect(json.error).toContain("Moneroo n'est pas disponible pour ce pays");
      expect(json.recommendedGateway).toBe("chariow");
    });

    it("accepte l'initialisation Moneroo lorsque le pays est parmi les 6 pays compatibles", async () => {
      const req = new NextRequest("https://www.envolafrica.site/api/payment/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donAmount: 10000,
          currency: "XOF",
          shippingCountry: "BJ", // Bénin : compatible Moneroo
          email: "client-benin@example.com",
        }),
      });

      const res = await initPaymentHandler(req);
      // En test/dev, l'initialisation réussit (200) avec checkout_url
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.checkout_url).toBeDefined();
    });
  });

  describe("3. Intégrité des Produits Chariow Déclarés par l'Utilisateur", () => {
    it("vérifie les URLs exactes des 3 produits officiels Chariow", () => {
      expect(CHARIOW_PRODUCT_URLS.magazineNumerique).toBe("https://toerbwke.mychariow.shop/prd_ac3bruo2");
      expect(CHARIOW_PRODUCT_URLS.abonnementChefEntreprise).toBe("https://toerbwke.mychariow.shop/prd_g8iz7mej");
      expect(CHARIOW_PRODUCT_URLS.don).toBe("https://toerbwke.mychariow.shop/prd_d1v11apk");
    });
  });
});
