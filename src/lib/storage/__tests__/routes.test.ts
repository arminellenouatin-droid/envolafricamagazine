import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST as presignPOST } from "@/app/api/storage/presign/route";
import { POST as confirmPOST } from "@/app/api/storage/confirm/route";
import { GET as urlGET } from "@/app/api/storage/url/route";
import { DELETE as storageDELETE } from "@/app/api/storage/[id]/route";

const mockUser = vi.fn();

vi.mock("@/lib/auth", () => ({
  getCurrentUserFromCookie: () => mockUser(),
}));

// Mock S3 client et presigner
vi.mock("@/lib/storage/client", () => ({
  getR2Client: () => ({
    send: vi.fn().mockImplementation(async (command: { constructor?: { name?: string }; input?: { Key?: string } }) => {
      // Simulate HeadObject
      if (command?.constructor?.name === "HeadObjectCommand" || command?.input?.Key) {
        return { ContentLength: 1024, ContentType: "image/webp" };
      }
      return {};
    }),
  }),
}));

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn().mockResolvedValue("https://r2.mock.signed.url/upload?signature=xyz"),
}));

let mockObjectsStore: Record<string, Record<string, unknown>> = {};

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: (_table: string) => ({
      select: (_cols: string) => ({
        eq: (_field: string, val: string) => ({
          maybeSingle: async () => ({ data: mockObjectsStore[val] || null, error: null }),
        }),
        in: (_field: string, _vals: string[]) => ({
          data: Object.values(mockObjectsStore),
          error: null,
        }),
      }),
      insert: (payload: Record<string, unknown> & { id: string }) => ({
        select: () => ({
          single: async () => {
            mockObjectsStore[payload.id] = payload;
            return { data: payload, error: null };
          },
        }),
      }),
      update: (payload: Record<string, unknown>) => ({
        eq: (_field: string, val: string) => {
          if (mockObjectsStore[val]) {
            mockObjectsStore[val] = { ...mockObjectsStore[val], ...payload };
          }
          return { error: null };
        },
      }),
    }),
  }),
}));

describe("6.2 — Tests d'Intégration des Routes API Stockage R2", () => {
  beforeEach(() => {
    process.env.R2_ACCOUNT_ID = "0123456789abcdef0123456789abcdef";
    process.env.R2_ACCESS_KEY_ID = "mock_r2_access_key_id_test";
    process.env.R2_SECRET_ACCESS_KEY = "mock_r2_secret_access_key_value_test_12345678";
    process.env.R2_BUCKET_PUBLIC = "envol-public";
    process.env.R2_BUCKET_PRIVATE = "envol-private";
    process.env.R2_PUBLIC_BASE_URL = "https://pub-df336181dd964534a4866a10762a3327.r2.dev";
    process.env.R2_KEY_PREFIX = "dev/";
    process.env.R2_SOFT_LIMIT_BYTES = "9663676416";
    process.env.SUPABASE_URL = "https://mock.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "mock_service_key";

    mockObjectsStore = {};
  });

  describe("POST /api/storage/presign", () => {
    it("renvoie 401 si utilisateur non connecté", async () => {
      mockUser.mockResolvedValue(null);
      const req = new Request("http://localhost/api/storage/presign", {
        method: "POST",
        body: JSON.stringify({ module: "marketplace", kind: "image", contentType: "image/webp", size: 1024 }),
      });
      const res = await presignPOST(req);
      expect(res.status).toBe(401);
    });

    it("renvoie 400 si type MIME interdit (ex: SVG ou exécutable)", async () => {
      mockUser.mockResolvedValue({ id: "user-1", email: "u@eam.com", role: "user" });
      const req = new Request("http://localhost/api/storage/presign", {
        method: "POST",
        body: JSON.stringify({ module: "marketplace", kind: "image", contentType: "image/svg+xml", size: 1024 }),
      });
      const res = await presignPOST(req);
      expect(res.status).toBe(400);
    });

    it("renvoie 400 si la taille dépasse la limite autorisée", async () => {
      mockUser.mockResolvedValue({ id: "user-1", email: "u@eam.com", role: "user" });
      const req = new Request("http://localhost/api/storage/presign", {
        method: "POST",
        body: JSON.stringify({ module: "marketplace", kind: "image", contentType: "image/webp", size: 50 * 1024 * 1024 }), // 50 Mo > 10 Mo
      });
      const res = await presignPOST(req);
      expect(res.status).toBe(400);
      expect((await res.json()).error).toBe("file_too_large");
    });

    it("génère une URL de présignature PUT valide (200 OK) pour une requête conforme", async () => {
      mockUser.mockResolvedValue({ id: "user-1", email: "u@eam.com", role: "user" });
      const req = new Request("http://localhost/api/storage/presign", {
        method: "POST",
        body: JSON.stringify({ module: "marketplace", kind: "image", contentType: "image/webp", size: 200 * 1024 }),
      });
      const res = await presignPOST(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.uploadUrl).toBeDefined();
      expect(json.key).toContain("marketplace/user-1");
      expect(json.visibility).toBe("public");
      expect(json.expiresInSeconds).toBe(300);
    });
  });

  describe("POST /api/storage/confirm", () => {
    it("renvoie 401 si non authentifié", async () => {
      mockUser.mockResolvedValue(null);
      const req = new Request("http://localhost/api/storage/confirm", {
        method: "POST",
        body: JSON.stringify({ id: "123e4567-e89b-12d3-a456-426614174099" }),
      });
      const res = await confirmPOST(req);
      expect(res.status).toBe(401);
    });

    it("renvoie 404 si l'objet n'existe pas", async () => {
      mockUser.mockResolvedValue({ id: "user-1", email: "u@eam.com", role: "user" });
      const req = new Request("http://localhost/api/storage/confirm", {
        method: "POST",
        body: JSON.stringify({ id: "123e4567-e89b-12d3-a456-426614174099" }),
      });
      const res = await confirmPOST(req);
      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/storage/url (Accès aux fichiers protégés)", () => {
    it("renvoie 403 si un utilisateur tente d'accéder au document privé d'un tiers", async () => {
      const docId = "123e4567-e89b-12d3-a456-426614174001";
      mockObjectsStore[docId] = {
        id: docId,
        owner_id: "other-user",
        visibility: "private",
        module: "jobs",
        kind: "document",
        bucket: "envol-private",
        key: "dev/jobs/other-user/cv.pdf",
        status: "ready",
      };

      mockUser.mockResolvedValue({ id: "hacker-user", email: "h@eam.com", role: "user" });
      const req = new Request(`http://localhost/api/storage/url?id=${docId}`);
      const res = await urlGET(req);
      expect(res.status).toBe(403);
    });

    it("accorde une URL signée au propriétaire légitime du fichier", async () => {
      const docId = "123e4567-e89b-12d3-a456-426614174002";
      mockObjectsStore[docId] = {
        id: docId,
        owner_id: "owner-user",
        visibility: "private",
        module: "jobs",
        kind: "document",
        bucket: "envol-private",
        key: "dev/jobs/owner-user/cv.pdf",
        status: "ready",
      };

      mockUser.mockResolvedValue({ id: "owner-user", email: "owner@eam.com", role: "user" });
      const req = new Request(`http://localhost/api/storage/url?id=${docId}`);
      const res = await urlGET(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("Cache-Control")).toBe("no-store");
      const json = await res.json();
      expect(json.url).toBeDefined();
    });
  });

  describe("DELETE /api/storage/:id (Sécurité & Intégrité)", () => {
    it("interdit formellement la suppression d'une pièce jointe de messagerie (Règle Anti-Litige 8)", async () => {
      const attachId = "123e4567-e89b-12d3-a456-426614174003";
      mockObjectsStore[attachId] = {
        id: attachId,
        owner_id: "seller-1",
        module: "marketplace",
        kind: "attachment",
        bucket: "envol-private",
        key: "dev/marketplace/seller-1/invoice.pdf",
        status: "ready",
      };

      mockUser.mockResolvedValue({ id: "seller-1", email: "s@eam.com", role: "seller" });
      const req = new Request(`http://localhost/api/storage/${attachId}`, { method: "DELETE" });
      const res = await storageDELETE(req, { params: Promise.resolve({ id: attachId }) });

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe("deletion_forbidden");
    });
  });
});
