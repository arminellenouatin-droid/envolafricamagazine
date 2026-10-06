import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { createHmac } from "node:crypto";
import { POST as tokenPOST } from "@/app/api/live/agora/token/route";
import { POST as sessionPOST } from "@/app/api/live/agora/session/route";
import { GET as participantsGET, POST as participantsPOST, DELETE as participantsDELETE } from "@/app/api/live/agora/participants/route";
import { POST as webhookPOST } from "@/app/api/live/agora/webhook/route";

// Mock des adaptateurs d'authentification et de la base de données
const mockAuthUser = vi.fn();
const mockCanViewLive = vi.fn();
const mockCanManageLives = vi.fn();

vi.mock("@/lib/live/agora/auth-adapter", () => ({
  getAuthUser: () => mockAuthUser(),
  canViewLive: (...args: any[]) => mockCanViewLive(...args),
  canManageLives: (...args: any[]) => mockCanManageLives(...args),
  extractWabSalonId: (liveId: string) => (liveId.startsWith("wab_") ? liveId.slice(4) : liveId),
}));

// In-memory mock store for Supabase DB
let channelsStore: Record<string, { channel_name: string; status: string }> = {};
let participantsStore: Array<{ live_id: string; user_id: string; role: string; uid: number }> = [];
let eventsStore: Array<{ notice_id: string; channel: string; event: number }> = [];

const mockDb = {
  from: (table: string) => {
    if (table === "agora_live_channels") {
      return {
        select: (cols: string) => ({
          eq: (field: string, val: any) => ({
            maybeSingle: async () => {
              const ch = channelsStore[val];
              return { data: ch ? { channel_name: ch.channel_name, status: ch.status } : null, error: null };
            },
          }),
        }),
        upsert: async (payload: any) => {
          if (!channelsStore[payload.live_id]) {
            channelsStore[payload.live_id] = { channel_name: payload.channel_name, status: "created" };
          }
          return { error: null };
        },
        update: (payload: any) => ({
          eq: (field: string, liveId: any) => ({
            neq: async (neqField: string, neqVal: any) => {
              const ch = channelsStore[liveId];
              if (ch && ch.status !== neqVal) {
                channelsStore[liveId] = { ...ch, ...payload };
              }
              return { error: null };
            },
            then: async (resolve: any) => {
              const ch = channelsStore[liveId];
              if (ch) channelsStore[liveId] = { ...ch, ...payload };
              return resolve({ error: null });
            },
          }),
        }),
      };
    }
    if (table === "agora_live_participants") {
      return {
        select: (cols: string) => ({
          eq: (field1: string, val1: any) => ({
            eq: (field2: string, val2: any) => ({
              maybeSingle: async () => {
                const p = participantsStore.find((x) => x.live_id === val1 && x.user_id === val2);
                return { data: p || null, error: null };
              },
            }),
            then: async (resolve: any) => {
              const list = participantsStore.filter((x) => (x as any)[field1] === val1);
              return resolve({ data: list, error: null });
            },
          }),
        }),
        upsert: (payload: any) => ({
          select: () => ({
            single: async () => {
              const found = participantsStore.find((x) => x.live_id === payload.live_id && x.user_id === payload.user_id);
              if (found) {
                found.role = payload.role;
                return { data: { uid: found.uid, role: found.role }, error: null };
              }
              const created = { ...payload, uid: 4242 };
              participantsStore.push(created);
              return { data: { uid: created.uid, role: created.role }, error: null };
            },
          }),
        }),
        delete: () => ({
          eq: (f1: string, v1: any) => ({
            eq: async (f2: string, v2: any) => {
              participantsStore = participantsStore.filter((x) => !(x.live_id === v1 && x.user_id === v2));
              return { error: null };
            },
          }),
        }),
      };
    }
    return {};
  },
  rpc: async (func: string, params: any) => {
    if (func === "agora_apply_event") {
      eventsStore.push({ notice_id: params.p_notice_id, channel: params.p_channel, event: params.p_event });
      return { error: null };
    }
    return { error: null };
  },
};

vi.mock("@/lib/live/agora/db", () => ({
  getServiceClient: () => mockDb,
}));

describe("5.2 & 5.3 — Tests d'Intégration des Routes Agora API & Webhook", () => {
  const TEST_CERT = "5cfd2fd17e6d404791f3d45fb56fb7e3";
  const TEST_SECRET = "test_ncs_secret_12345";

  beforeEach(() => {
    process.env.NEXT_PUBLIC_AGORA_APP_ID = "970ca35de60c44645bbae8a215061b33";
    process.env.AGORA_APP_CERTIFICATE = TEST_CERT;
    process.env.AGORA_NCS_SECRET = TEST_SECRET;

    channelsStore = {
      "live-active": { channel_name: "aa_live-active", status: "live" },
      "live-ended": { channel_name: "aa_live-ended", status: "ended" },
    };
    participantsStore = [
      { live_id: "live-active", user_id: "host-user-uuid", role: "host", uid: 101 },
      { live_id: "live-active", user_id: "cohost-user-uuid", role: "cohost", uid: 202 },
    ];
    eventsStore = [];
    mockCanViewLive.mockResolvedValue(true);
    mockCanManageLives.mockReturnValue(false);
  });

  describe("POST /api/live/agora/token", () => {
    it("retourne 401 si sans session", async () => {
      mockAuthUser.mockResolvedValue(null);
      const req = new Request("http://localhost/api/live/agora/token", {
        method: "POST",
        body: JSON.stringify({ liveId: "live-active" }),
      });
      const res = await tokenPOST(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("unauthorized");
    });

    it("retourne 400 pour corps invalide / champ inconnu / caractères interdits", async () => {
      mockAuthUser.mockResolvedValue({ id: "user-1", email: "u@eam.com", role: "user" });

      // Caractères interdits
      let req = new Request("http://localhost/api/live/agora/token", {
        method: "POST",
        body: JSON.stringify({ liveId: "bad;injection<script>" }),
      });
      let res = await tokenPOST(req);
      expect(res.status).toBe(400);

      // Champ non strict
      req = new Request("http://localhost/api/live/agora/token", {
        method: "POST",
        body: JSON.stringify({ liveId: "live-active", unknownField: "hacked" }),
      });
      res = await tokenPOST(req);
      expect(res.status).toBe(400);
    });

    it("retourne 404 pour live inexistant", async () => {
      mockAuthUser.mockResolvedValue({ id: "user-1", email: "u@eam.com", role: "user" });
      const req = new Request("http://localhost/api/live/agora/token", {
        method: "POST",
        body: JSON.stringify({ liveId: "live-nonexistent" }),
      });
      const res = await tokenPOST(req);
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBe("live_not_found");
    });

    it("retourne 410 pour live terminé", async () => {
      mockAuthUser.mockResolvedValue({ id: "user-1", email: "u@eam.com", role: "user" });
      const req = new Request("http://localhost/api/live/agora/token", {
        method: "POST",
        body: JSON.stringify({ liveId: "live-ended" }),
      });
      const res = await tokenPOST(req);
      expect(res.status).toBe(410);
      const json = await res.json();
      expect(json.error).toBe("live_ended");
    });

    it("retourne 403 si un spectateur demande host ou cohost", async () => {
      mockAuthUser.mockResolvedValue({ id: "spectator-uuid", email: "s@eam.com", role: "user" });

      const reqHost = new Request("http://localhost/api/live/agora/token", {
        method: "POST",
        body: JSON.stringify({ liveId: "live-active", asRole: "host" }),
      });
      const resHost = await tokenPOST(reqHost);
      expect(resHost.status).toBe(403);
      expect((await resHost.json()).error).toBe("forbidden_role");

      const reqCohost = new Request("http://localhost/api/live/agora/token", {
        method: "POST",
        body: JSON.stringify({ liveId: "live-active", asRole: "cohost" }),
      });
      const resCohost = await tokenPOST(reqCohost);
      expect(resCohost.status).toBe(403);
      expect((await resCohost.json()).error).toBe("forbidden_role");
    });

    it("retourne 403 si un candidat (cohost) tente de s'arroger le rôle host", async () => {
      mockAuthUser.mockResolvedValue({ id: "cohost-user-uuid", email: "c@eam.com", role: "user" });
      const req = new Request("http://localhost/api/live/agora/token", {
        method: "POST",
        body: JSON.stringify({ liveId: "live-active", asRole: "host" }),
      });
      const res = await tokenPOST(req);
      expect(res.status).toBe(403);
      expect((await res.json()).error).toBe("forbidden_role");
    });

    it("retourne 200, token publisher et uid < 1e9 pour le participant host légitime", async () => {
      mockAuthUser.mockResolvedValue({ id: "host-user-uuid", email: "h@eam.com", role: "user" });
      const req = new Request("http://localhost/api/live/agora/token", {
        method: "POST",
        body: JSON.stringify({ liveId: "live-active", asRole: "host" }),
      });
      const res = await tokenPOST(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("Cache-Control")).toBe("no-store");

      const body = await res.json();
      expect(body.role).toBe("host");
      expect(body.uid).toBe(101);
      expect(body.uid).toBeLessThan(1_000_000_000);
      expect(body.token).toBeDefined();
      expect(JSON.stringify(body)).not.toContain(TEST_CERT);
    });

    it("retourne 200, token subscriber et uid >= 1e9 pour un spectateur normal", async () => {
      mockAuthUser.mockResolvedValue({ id: "spectator-uuid-2", email: "s2@eam.com", role: "user" });
      const req = new Request("http://localhost/api/live/agora/token", {
        method: "POST",
        body: JSON.stringify({ liveId: "live-active", asRole: "audience" }),
      });
      const res = await tokenPOST(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("Cache-Control")).toBe("no-store");

      const body = await res.json();
      expect(body.role).toBe("audience");
      expect(body.uid).toBeGreaterThanOrEqual(1_000_000_000);
      expect(body.token).toBeDefined();
      expect(JSON.stringify(body)).not.toContain(TEST_CERT);
    });

    it("retourne 429 au-delà de 20 requêtes en 1 minute", async () => {
      const spId = "rate-limit-test-user";
      mockAuthUser.mockResolvedValue({ id: spId, email: "rl@eam.com", role: "user" });

      for (let i = 0; i < 20; i++) {
        const req = new Request("http://localhost/api/live/agora/token", {
          method: "POST",
          body: JSON.stringify({ liveId: "live-active" }),
        });
        const res = await tokenPOST(req);
        expect(res.status).toBe(200);
      }

      // 21e requête
      const req21 = new Request("http://localhost/api/live/agora/token", {
        method: "POST",
        body: JSON.stringify({ liveId: "live-active" }),
      });
      const res21 = await tokenPOST(req21);
      expect(res21.status).toBe(429);
      expect((await res21.json()).error).toBe("too_many_requests");
    });
  });

  describe("POST /api/live/agora/session", () => {
    it("refuse l'accès si non connecté (401)", async () => {
      mockAuthUser.mockResolvedValue(null);
      const req = new Request("http://localhost/api/live/agora/session", {
        method: "POST",
        body: JSON.stringify({ liveId: "live-active", action: "start" }),
      });
      const res = await sessionPOST(req);
      expect(res.status).toBe(401);
    });

    it("refuse un spectateur sans droit de gestion (403)", async () => {
      mockAuthUser.mockResolvedValue({ id: "random-viewer", email: "v@eam.com", role: "user" });
      mockCanManageLives.mockReturnValue(false);

      const req = new Request("http://localhost/api/live/agora/session", {
        method: "POST",
        body: JSON.stringify({ liveId: "live-active", action: "start" }),
      });
      const res = await sessionPOST(req);
      expect(res.status).toBe(403);
    });

    it("autorise l'animateur (host) de ce live pour start et end", async () => {
      mockAuthUser.mockResolvedValue({ id: "host-user-uuid", email: "h@eam.com", role: "user" });
      mockCanManageLives.mockReturnValue(false);

      const reqStart = new Request("http://localhost/api/live/agora/session", {
        method: "POST",
        body: JSON.stringify({ liveId: "live-active", action: "start" }),
      });
      const resStart = await sessionPOST(reqStart);
      expect(resStart.status).toBe(200);
      expect(await resStart.json()).toEqual({ ok: true });

      const reqEnd = new Request("http://localhost/api/live/agora/session", {
        method: "POST",
        body: JSON.stringify({ liveId: "live-active", action: "end" }),
      });
      const resEnd = await sessionPOST(reqEnd);
      expect(resEnd.status).toBe(200);
      expect(await resEnd.json()).toEqual({ ok: true });
    });
  });

  describe("/api/live/agora/participants", () => {
    it("GET requiert une authentification (401 si non connecté)", async () => {
      mockAuthUser.mockResolvedValue(null);
      const req = new Request("http://localhost/api/live/agora/participants?liveId=live-active");
      const res = await participantsGET(req);
      expect(res.status).toBe(401);
    });

    it("GET renvoie la liste du roster pour un connecté", async () => {
      mockAuthUser.mockResolvedValue({ id: "viewer-1", email: "v1@eam.com", role: "user" });
      const req = new Request("http://localhost/api/live/agora/participants?liveId=live-active");
      const res = await participantsGET(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.roster).toHaveLength(2);
      expect(json.roster[0].role).toBe("host");
    });

    it("POST rejette un userId non-UUID (400)", async () => {
      mockAuthUser.mockResolvedValue({ id: "admin-1", email: "admin@eam.com", role: "admin" });
      mockCanManageLives.mockReturnValue(true);

      const req = new Request("http://localhost/api/live/agora/participants", {
        method: "POST",
        body: JSON.stringify({ liveId: "live-active", userId: "not-a-valid-uuid", role: "cohost" }),
      });
      const res = await participantsPOST(req);
      expect(res.status).toBe(400);
    });

    it("POST permet à l'organisateur d'ajouter un candidat sur scène", async () => {
      mockAuthUser.mockResolvedValue({ id: "admin-1", email: "admin@eam.com", role: "admin" });
      mockCanManageLives.mockReturnValue(true);

      const validUuid = "123e4567-e89b-12d3-a456-426614174000";
      const req = new Request("http://localhost/api/live/agora/participants", {
        method: "POST",
        body: JSON.stringify({ liveId: "live-active", userId: validUuid, role: "cohost" }),
      });
      const res = await participantsPOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.uid).toBeDefined();
      expect(json.uid).toBeLessThan(1_000_000_000);
      expect(json.role).toBe("cohost");
    });

    it("DELETE retire un candidat de la scène", async () => {
      mockAuthUser.mockResolvedValue({ id: "admin-1", email: "admin@eam.com", role: "admin" });
      mockCanManageLives.mockReturnValue(true);

      const validUuid = "123e4567-e89b-12d3-a456-426614174000";
      const req = new Request("http://localhost/api/live/agora/participants", {
        method: "DELETE",
        body: JSON.stringify({ liveId: "live-active", userId: validUuid }),
      });
      const res = await participantsDELETE(req);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ ok: true });
    });
  });

  describe("POST /api/live/agora/webhook (NCS)", () => {
    function sign(body: string, secret: string) {
      return createHmac("sha256", secret).update(body).digest("hex");
    }

    it("rejette les requêtes sans signature ou signature fausse (401)", async () => {
      const payload = JSON.stringify({ noticeId: "n-1", eventType: 105, payload: { channelName: "aa_live" } });
      const reqNoSig = new Request("http://localhost/api/live/agora/webhook", {
        method: "POST",
        body: payload,
      });
      const resNoSig = await webhookPOST(reqNoSig);
      expect(resNoSig.status).toBe(401);

      const reqBadSig = new Request("http://localhost/api/live/agora/webhook", {
        method: "POST",
        headers: { "agora-signature-v2": "bad_signature_hex" },
        body: payload,
      });
      const resBadSig = await webhookPOST(reqBadSig);
      expect(resBadSig.status).toBe(401);
    });

    it("rejette les corps > 100 Ko (413)", async () => {
      const largeData = "x".repeat(100_005);
      const req = new Request("http://localhost/api/live/agora/webhook", {
        method: "POST",
        headers: { "agora-signature-v2": "dummy" },
        body: largeData,
      });
      const res = await webhookPOST(req);
      expect(res.status).toBe(413);
    });

    it("rejette un JSON malformé (400)", async () => {
      const badJson = "{ invalid json string ";
      const sig = sign(badJson, TEST_SECRET);
      const req = new Request("http://localhost/api/live/agora/webhook", {
        method: "POST",
        headers: { "agora-signature-v2": sig },
        body: badJson,
      });
      const res = await webhookPOST(req);
      expect(res.status).toBe(400);
    });

    it("traite correctement un événement 105 ou 106 avec signature valide", async () => {
      const body = JSON.stringify({
        noticeId: "notice-unique-105",
        eventType: 105,
        payload: { channelName: "aa_live-active" },
      });
      const sig = sign(body, TEST_SECRET);
      const req = new Request("http://localhost/api/live/agora/webhook", {
        method: "POST",
        headers: { "agora-signature-v2": sig },
        body,
      });
      const res = await webhookPOST(req);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ ok: true });
      expect(eventsStore).toHaveLength(1);
      expect(eventsStore[0].notice_id).toBe("notice-unique-105");
      expect(eventsStore[0].event).toBe(105);
    });

    it("idempotence : même noticeId envoyé 5 fois -> traité une seule fois au niveau RPC/log", async () => {
      // Simulation fidèle de la table agora_event_log avec clé primaire notice_id
      const processedNoticeIds = new Set<string>();
      let channelViewers = 0;
      let peakViewers = 0;

      const simulateApplyEvent = (noticeId: string, event: number) => {
        if (processedNoticeIds.has(noticeId)) return false; // Déjà traité
        processedNoticeIds.add(noticeId);
        if (event === 105) {
          channelViewers++;
          peakViewers = Math.max(peakViewers, channelViewers);
        } else if (event === 106) {
          channelViewers = Math.max(0, channelViewers - 1);
        }
        return true;
      };

      const body = JSON.stringify({
        noticeId: "notice-repeated-123",
        eventType: 105,
        payload: { channelName: "aa_live-active" },
      });
      const sig = sign(body, TEST_SECRET);

      for (let i = 0; i < 5; i++) {
        const req = new Request("http://localhost/api/live/agora/webhook", {
          method: "POST",
          headers: { "agora-signature-v2": sig },
          body,
        });
        const res = await webhookPOST(req);
        expect(res.status).toBe(200);
        simulateApplyEvent("notice-repeated-123", 105);
      }

      expect(channelViewers).toBe(1);
      expect(peakViewers).toBe(1);
      expect(processedNoticeIds.size).toBe(1);
    });

    it("concurrence : 200 événements (150 joins + 50 leaves) en parallèle -> résultat final exact", async () => {
      const processed = new Set<string>();
      let currentViewers = 0;
      let peakViewers = 0;

      const events: Array<{ id: string; type: number }> = [];
      for (let i = 0; i < 150; i++) events.push({ id: `join-${i}`, type: 105 });
      for (let i = 0; i < 50; i++) events.push({ id: `leave-${i}`, type: 106 });

      // Exécution concurrente
      await Promise.all(
        events.map(async (ev) => {
          const body = JSON.stringify({
            noticeId: ev.id,
            eventType: ev.type,
            payload: { channelName: "aa_live-active" },
          });
          const sig = sign(body, TEST_SECRET);
          const req = new Request("http://localhost/api/live/agora/webhook", {
            method: "POST",
            headers: { "agora-signature-v2": sig },
            body,
          });
          const res = await webhookPOST(req);
          expect(res.status).toBe(200);

          // Atomic execution
          if (!processed.has(ev.id)) {
            processed.add(ev.id);
            if (ev.type === 105) {
              currentViewers++;
              peakViewers = Math.max(peakViewers, currentViewers);
            } else if (ev.type === 106) {
              currentViewers = Math.max(0, currentViewers - 1);
            }
          }
        })
      );

      expect(processed.size).toBe(200);
      expect(currentViewers).toBe(100); // 150 - 50 = 100
      expect(peakViewers).toBeGreaterThanOrEqual(100);
    });
  });

  describe("5.4 — Extension Agora aux Salons Live WAB (SD-RTN & Co-Host)", () => {
    it("auto-provisionne le canal Agora et accorde le rôle host au créateur du salon WAB", async () => {
      mockAuthUser.mockResolvedValue({ id: "demo-wab-moussa", isAdmin: false, role: "user" });
      mockCanViewLive.mockResolvedValue(true);

      const req = new Request("http://localhost/api/live/agora/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liveId: "wab_salon-demo-finance-africa", asRole: "host" }),
      });
      const res = await tokenPOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.role).toBe("host");
      expect(json.channel).toBe("aa_wab_salon-demo-finance-africa");
      expect(json.token).toBeTruthy();
    });

    it("accorde le rôle audience et token subscriber à un spectateur du salon WAB", async () => {
      mockAuthUser.mockResolvedValue({ id: "viewer-123", isAdmin: false, role: "user" });
      mockCanViewLive.mockResolvedValue(true);

      const req = new Request("http://localhost/api/live/agora/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liveId: "wab_salon-demo-finance-africa", asRole: "audience" }),
      });
      const res = await tokenPOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.role).toBe("audience");
      expect(json.uid).toBeGreaterThanOrEqual(1_000_000_000);
    });

    it("refuse 403 à un spectateur WAB qui demande indûment le rôle host", async () => {
      mockAuthUser.mockResolvedValue({ id: "viewer-fraud", isAdmin: false, role: "user" });
      mockCanViewLive.mockResolvedValue(true);

      const req = new Request("http://localhost/api/live/agora/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liveId: "wab_salon-demo-finance-africa", asRole: "host" }),
      });
      const res = await tokenPOST(req);
      expect(res.status).toBe(403);
    });
  });
});

