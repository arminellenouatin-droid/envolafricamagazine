import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";
import {
  verifyPulseSignature,
  getRecommendedPaymentGateway,
  isMonerooNativeCountry,
  createChariowCheckout,
} from "../chariow";

describe("Passerelle Internationale Chariow & Sécurité Pulse", () => {
  const TEST_SECRET = "whsec_test_secret_for_pulse_verification_12345";

  beforeEach(() => {
    vi.stubEnv("CHARIOW_PULSE_SIGNING_SECRET", TEST_SECRET);
    vi.stubEnv("CHARIOW_SECRET_KEY", "sk_test_mock_chariow_key");
  });

  describe("Routage géographique intelligent (Moneroo vs Chariow)", () => {
    it("détecte correctement les pays natifs Moneroo (UEMOA / CEMAC)", () => {
      expect(isMonerooNativeCountry("BJ")).toBe(true);
      expect(isMonerooNativeCountry("ci")).toBe(true);
      expect(isMonerooNativeCountry("TG")).toBe(true);
      expect(isMonerooNativeCountry("SN")).toBe(true);
      expect(isMonerooNativeCountry("CM")).toBe(true);
    });

    it("route automatiquement vers Chariow les pays non couverts par Moneroo (Centrafrique, Tchad, Madagascar, Gambie, Diaspora)", () => {
      expect(getRecommendedPaymentGateway("CF")).toBe("chariow"); // Centrafrique
      expect(getRecommendedPaymentGateway("TD")).toBe("chariow"); // Tchad
      expect(getRecommendedPaymentGateway("MG")).toBe("chariow"); // Madagascar
      expect(getRecommendedPaymentGateway("GM")).toBe("chariow"); // Gambie
      expect(getRecommendedPaymentGateway("CD")).toBe("chariow"); // RDC
      expect(getRecommendedPaymentGateway("FR")).toBe("chariow"); // France / Diaspora
      expect(getRecommendedPaymentGateway("US")).toBe("chariow"); // USA / Diaspora
    });

    it("sélectionne Moneroo pour les pays à faibles commissions locales", () => {
      expect(getRecommendedPaymentGateway("BJ")).toBe("moneroo");
      expect(getRecommendedPaymentGateway("CI")).toBe("moneroo");
    });
  });

  describe("Vérification mathématique de signature Pulse (HMAC-SHA256)", () => {
    it("valide avec succès une signature conforme générée sur le corps brut", () => {
      const rawPayload = JSON.stringify({
        event: "successful.sale",
        data: {
          purchase: {
            id: "sal_test_12345",
            amount: { value: 15000, currency: "XOF" },
            custom_metadata: { user_id: "usr_abc", type: "subscription" },
          },
        },
      });

      const hmac = crypto
        .createHmac("sha256", TEST_SECRET)
        .update(rawPayload)
        .digest("hex");

      const header = `sha256=${hmac}`;
      expect(verifyPulseSignature(rawPayload, header)).toBe(true);
    });

    it("rejette immédiatement une signature falsifiée ou altérée", () => {
      const rawPayload = JSON.stringify({ event: "successful.sale", amount: 1000 });
      const badHeader = "sha256=0000000000000000000000000000000000000000000000000000000000000000";
      expect(verifyPulseSignature(rawPayload, badHeader)).toBe(false);
    });

    it("rejette si le corps brut a été modifié après signature (anti-tampering)", () => {
      const originalPayload = '{"amount":15000}';
      const tamperedPayload = '{"amount":500}';

      const hmac = crypto
        .createHmac("sha256", TEST_SECRET)
        .update(originalPayload)
        .digest("hex");

      const header = `sha256=${hmac}`;
      expect(verifyPulseSignature(tamperedPayload, header)).toBe(false);
    });

    it("rejette les signatures sans préfixe sha256= ou vides", () => {
      expect(verifyPulseSignature("{}", "")).toBe(false);
      expect(verifyPulseSignature("{}", null)).toBe(false);
      expect(verifyPulseSignature("{}", "md5=123456")).toBe(false);
    });
  });

  describe("Initialisation Checkout API", () => {
    it("signale une erreur propre si la clé secrète est absente", async () => {
      vi.stubEnv("CHARIOW_SECRET_KEY", "");
      const res = await createChariowCheckout({
        product_id: "prd_123",
        email: "client@test.com",
        first_name: "Jean",
        last_name: "Dupont",
        phone: { number: "97000000", country_code: "BJ" },
      });
      expect(res.ok).toBe(false);
      expect(res.error).toContain("CHARIOW_SECRET_KEY manquante");
    });
  });
});
