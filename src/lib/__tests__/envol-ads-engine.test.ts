import { describe, it, expect } from "vitest";
import { signAdToken, verifyAdToken, hashIpAddress, hashSessionId } from "@/lib/ads/crypto";
import { serveAd, recordClick, recordImpression } from "@/lib/ads/engine";

describe("Envol Ads Core — Crypto & Signature HMAC", () => {
  it("signe et vérifie avec succès un jeton publicitaire valide", () => {
    const rawData = {
      impressionId: "imp_test_123",
      campaignId: "camp_456",
      creativeId: "creat_789",
      slotCode: "article_top",
      destinationUrl: "https://envolafrica.site/kiosque",
      billingModel: "cpm" as const,
      bidAmount: 2000,
    };

    const token = signAdToken(rawData, 600);
    expect(typeof token).toBe("string");
    expect(token).toContain(".");

    const verified = verifyAdToken(token);
    expect(verified.valid).toBe(true);
    expect(verified.payload).toBeDefined();
    expect(verified.payload?.impressionId).toBe("imp_test_123");
    expect(verified.payload?.slotCode).toBe("article_top");
    expect(verified.payload?.bidAmount).toBe(2000);
  });

  it("rejette catégoriquement un jeton altéré ou falsifié", () => {
    const rawData = {
      impressionId: "imp_test_123",
      campaignId: "camp_456",
      creativeId: "creat_789",
      slotCode: "article_top",
      destinationUrl: "https://envolafrica.site/kiosque",
      billingModel: "cpm" as const,
      bidAmount: 2000,
    };

    const token = signAdToken(rawData, 600);
    const tampered = token.slice(0, -4) + "XXXX";

    const verified = verifyAdToken(tampered);
    expect(verified.valid).toBe(false);
    expect(verified.error).toBe("Signature HMAC invalide");
  });

  it("rejette un jeton expiré", () => {
    const rawData = {
      impressionId: "imp_test_expired",
      campaignId: "camp_456",
      creativeId: "creat_789",
      slotCode: "article_top",
      destinationUrl: "https://envolafrica.site/kiosque",
      billingModel: "cpm" as const,
      bidAmount: 2000,
    };

    // TTL de -1 seconde
    const token = signAdToken(rawData, -1);
    const verified = verifyAdToken(token);
    expect(verified.valid).toBe(false);
    expect(verified.error).toBe("Jeton expiré");
  });

  it("hache les adresses IP de manière anonyme et cohérente", () => {
    const ip1 = "197.234.221.15";
    const ip2 = "154.68.10.22";

    const hash1a = hashIpAddress(ip1);
    const hash1b = hashIpAddress(ip1);
    const hash2 = hashIpAddress(ip2);

    expect(hash1a).toBe(hash1b);
    expect(hash1a).not.toBe(hash2);
    expect(hash1a).not.toContain(ip1);
    expect(hash1a.length).toBe(32);
  });
});

describe("Envol Ads Core — Moteur Ad Serving & Anti-Fraude", () => {
  it("sert une annonce avec fallback propre sans crasher", async () => {
    const res = await serveAd({
      slotCode: "article_top",
      country: "BJ",
      device: "mobile",
    });

    expect(res.served).toBe(true);
    expect(res.creative).toBeDefined();
    expect(res.slot.code).toBe("article_top");
    expect(res.slot.widthDesktop).toBe(728);
    expect(res.impressionToken).toBeDefined();
    expect(res.clickUrl).toBeDefined();
  });

  it("applique la règle anti-fraude contre les clics instantanés (< 400ms)", async () => {
    const rawData = {
      impressionId: "imp_bot_rapid_click",
      campaignId: "camp_bot",
      creativeId: "creat_bot",
      slotCode: "article_top",
      destinationUrl: "https://envolafrica.site/target",
      billingModel: "cpc" as const,
      bidAmount: 150,
    };

    // Jeton créé à l'instant t
    const token = signAdToken(rawData, 600);

    // Clic immédiat
    const clickResult = await recordClick(token, { ip: "127.0.0.1" });
    expect(clickResult.valid).toBe(false);
    expect(clickResult.error).toBe("Délai de clic suspect");
  });

  it("accepte un clic légitime après un délai humain suffisant", async () => {
    const rawData = {
      impressionId: "imp_human_click",
      campaignId: "camp_human",
      creativeId: "creat_human",
      slotCode: "article_top",
      destinationUrl: "https://envolafrica.site/target",
      billingModel: "cpc" as const,
      bidAmount: 150,
    };

    const token = signAdToken(rawData, 600);

    // Simulation d'un délai humain de 450 ms
    await new Promise((resolve) => setTimeout(resolve, 450));

    const clickResult = await recordClick(token, { ip: "127.0.0.1" });
    expect(clickResult.valid).toBe(true);
    expect(clickResult.destinationUrl).toBe("https://envolafrica.site/target");
  });

  it("dédoublonne les impressions avec succès", async () => {
    const rawData = {
      impressionId: "imp_dedup_test",
      campaignId: "camp_test",
      creativeId: "creat_test",
      slotCode: "article_top",
      destinationUrl: "https://envolafrica.site",
      billingModel: "cpm" as const,
      bidAmount: 2000,
    };

    const token = signAdToken(rawData, 600);
    const first = await recordImpression(token, { ip: "127.0.0.1" });
    const second = await recordImpression(token, { ip: "127.0.0.1" });

    expect(first.success).toBe(true);
    expect(second.success).toBe(true);
  });
});
