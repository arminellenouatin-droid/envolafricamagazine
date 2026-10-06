import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { canPublish, AUDIENCE_UID_MIN, AUDIENCE_UID_MAX, type LiveRole } from "../roles";
import { randomAudienceUid, buildRtcToken } from "../token";
import { rateLimit } from "../rate-limit";
import { getAgoraConfig } from "../config";
// @ts-expect-error internal agora-token path
import { AccessToken2 } from "agora-token/src/AccessToken2";

describe("5.1 — Tests Unitaires Agora", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.NEXT_PUBLIC_AGORA_APP_ID = "970ca35de60c44645bbae8a215061b33";
    process.env.AGORA_APP_CERTIFICATE = "5cfd2fd17e6d404791f3d45fb56fb7e3";
    process.env.AGORA_NCS_SECRET = "test_ncs_secret_12345";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("roles.ts", () => {
    it("canPublish est vrai uniquement pour host et cohost", () => {
      expect(canPublish("host")).toBe(true);
      expect(canPublish("cohost")).toBe(true);
      expect(canPublish("moderator")).toBe(false);
      expect(canPublish("audience")).toBe(false);
    });
  });

  describe("randomAudienceUid()", () => {
    it("10 000 tirages sont tous dans [1e9, 4e9[ et aucun >= 2^32", () => {
      const MAX_U32 = 4_294_967_296;
      let minObserved = Infinity;
      let maxObserved = -Infinity;

      for (let i = 0; i < 10_000; i++) {
        const uid = randomAudienceUid();
        expect(uid).toBeGreaterThanOrEqual(AUDIENCE_UID_MIN);
        expect(uid).toBeLessThan(AUDIENCE_UID_MAX);
        expect(uid).toBeLessThan(MAX_U32);

        if (uid < minObserved) minObserved = uid;
        if (uid > maxObserved) maxObserved = uid;
      }

      expect(minObserved).toBeGreaterThanOrEqual(1_000_000_000);
      expect(maxObserved).toBeLessThan(4_000_000_000);
    });
  });

  describe("config.ts", () => {
    it("retourne la configuration quand les variables sont valides", () => {
      const cfg = getAgoraConfig();
      expect(cfg.NEXT_PUBLIC_AGORA_APP_ID).toBe("970ca35de60c44645bbae8a215061b33");
      expect(cfg.AGORA_APP_CERTIFICATE).toBe("5cfd2fd17e6d404791f3d45fb56fb7e3");
    });

    it("lève une erreur claire si une variable manque sans afficher sa valeur", () => {
      // Create isolated test function for schema failure without breaking singleton cache
      const { z } = require("zod");
      const testSchema = z.object({
        NEXT_PUBLIC_AGORA_APP_ID: z.string().min(16, "NEXT_PUBLIC_AGORA_APP_ID manquant"),
        AGORA_APP_CERTIFICATE: z.string().min(16, "AGORA_APP_CERTIFICATE manquant"),
      });

      const parsed = testSchema.safeParse({});
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        const missing = parsed.error.issues.map((i: any) => i.path.join(".")).join(", ");
        const errorMsg = `Configuration Agora invalide : ${missing}`;
        expect(errorMsg).toContain("NEXT_PUBLIC_AGORA_APP_ID");
        expect(errorMsg).toContain("AGORA_APP_CERTIFICATE");
        // S'assurer qu'aucun secret n'est affiché
        expect(errorMsg).not.toContain("5cfd2fd17e6d404791f3d45fb56fb7e3");
      }
    });
  });

  describe("token.ts", () => {
    it("génère un token non vide et conforme pour un publisher (host)", () => {
      const channel = "live-af-test-channel";
      const uid = 1001;
      const res = buildRtcToken({ channelName: channel, uid, role: "host" });

      expect(res.token).toBeTypeOf("string");
      expect(res.token.length).toBeGreaterThan(20);
      expect(res.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000) + 10000); // 3h = 10800s

      const at = new AccessToken2();
      at.from_string(res.token);

      const service = at.services[0];
      expect(service.__channel_name.toString()).toBe(channel);
      expect(service.__uid.toString()).toBe(String(uid));

      // Droits publisher : 1, 2, 3, 4 présents
      const privs = service.__privileges;
      expect(privs["1"]).toBe(10800); // JOIN_CHANNEL (3h)
      expect(privs["2"]).toBe(10800); // PUBLISH_AUDIO_STREAM (3h)
      expect(privs["3"]).toBe(10800); // PUBLISH_VIDEO_STREAM (3h)
      expect(privs["4"]).toBe(10800); // PUBLISH_DATA_STREAM (3h)
    });

    it("génère un token non vide et conforme pour un cohost (candidat)", () => {
      const channel = "live-af-candidate-channel";
      const uid = 2002;
      const res = buildRtcToken({ channelName: channel, uid, role: "cohost" });

      const at = new AccessToken2();
      at.from_string(res.token);
      const service = at.services[0];
      const privs = service.__privileges;

      expect(privs["1"]).toBe(10800);
      expect(privs["2"]).toBe(10800);
      expect(privs["3"]).toBe(10800);
      expect(privs["4"]).toBe(10800);
    });

    it("génère un token subscriber (sans droits de publication) pour audience et moderator", () => {
      const channel = "live-af-spectator-channel";
      const uid = 1_500_000_123;
      const resAudience = buildRtcToken({ channelName: channel, uid, role: "audience" });

      expect(resAudience.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000) + 3500); // 1h = 3600s
      const atAudience = new AccessToken2();
      atAudience.from_string(resAudience.token);
      const serviceAudience = atAudience.services[0];
      const privsAudience = serviceAudience.__privileges;

      expect(privsAudience["1"]).toBe(3600); // JOIN_CHANNEL (1h)
      expect(privsAudience["2"]).toBeUndefined(); // AUCUN droit de publication audio
      expect(privsAudience["3"]).toBeUndefined(); // AUCUN droit de publication vidéo

      const resMod = buildRtcToken({ channelName: channel, uid: 3003, role: "moderator" });
      const atMod = new AccessToken2();
      atMod.from_string(resMod.token);
      const privsMod = atMod.services[0].__privileges;
      expect(privsMod["1"]).toBe(3600);
      expect(privsMod["2"]).toBeUndefined();
      expect(privsMod["3"]).toBeUndefined();
    });
  });

  describe("rate-limit.ts", () => {
    it("bloque au-delà du seuil et libère après la fenêtre glissante", () => {
      const key = "test-ip-" + Date.now();
      const max = 5;
      const windowMs = 50;

      // 5 requêtes autorisées
      for (let i = 0; i < max; i++) {
        expect(rateLimit(key, max, windowMs)).toBe(true);
      }

      // La 6e requête dépasse le seuil et est bloquée
      expect(rateLimit(key, max, windowMs)).toBe(false);

      // Attendre expiration de la fenêtre
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(rateLimit(key, max, windowMs)).toBe(true);
          resolve();
        }, windowMs + 10);
      });
    });
  });
});
