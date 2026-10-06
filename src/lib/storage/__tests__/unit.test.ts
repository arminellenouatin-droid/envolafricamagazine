import { describe, it, expect } from "vitest";
import { generateStorageKey } from "../keys";
import { detectBinaryMimeType, isValidBinaryContent } from "../magic-bytes";
import { resolveFileUrl } from "../resolve-url";
import { MODULE_RULES } from "../storage-rules";

describe("6.1 — Tests Unitaires du Stockage Cloudflare R2", () => {
  describe("Génération de clés (keys.ts)", () => {
    it("génère une clé bien formée avec structure module/owner/yyyy/mm/uuid.ext", () => {
      const key = generateStorageKey({
        prefix: "dev/",
        module: "marketplace",
        ownerId: "user-123",
        contentType: "image/webp",
      });

      expect(key).toMatch(/^dev\/marketplace\/user-123\/\d{4}\/\d{2}\/[a-f0-9-]+\.webp$/);
      expect(key).not.toContain("..");
      expect(key.startsWith("/")).toBe(false);
    });

    it("nettoie les tentatives de path traversal dans l'ownerId ou le préfixe", () => {
      const key = generateStorageKey({
        prefix: "/../../dev/",
        module: "profile",
        ownerId: "../../../etc/passwd",
        contentType: "image/png",
      });

      expect(key).not.toContain("..");
      expect(key).not.toContain("/etc/passwd");
      expect(key.endsWith(".png")).toBe(true);
    });

    it("lève une erreur si le type MIME n'a pas d'extension autorisée", () => {
      expect(() =>
        generateStorageKey({
          module: "wab",
          ownerId: "user-1",
          contentType: "application/x-msdownload",
        })
      ).toThrow("Extension inconnue");
    });
  });

  describe("Détection des signatures binaires (Magic Bytes)", () => {
    it("détecte correctement un en-tête JPEG", () => {
      const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      expect(detectBinaryMimeType(jpegHeader)).toBe("image/jpeg");
      expect(isValidBinaryContent(jpegHeader, "image/jpeg")).toBe(true);
    });

    it("détecte correctement un en-tête PNG", () => {
      const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      expect(detectBinaryMimeType(pngHeader)).toBe("image/png");
      expect(isValidBinaryContent(pngHeader, "image/png")).toBe(true);
    });

    it("détecte correctement un en-tête WebP (RIFF....WEBP)", () => {
      const webpHeader = Buffer.from("RIFF\x00\x00\x00\x00WEBPVP8 ");
      expect(detectBinaryMimeType(webpHeader)).toBe("image/webp");
      expect(isValidBinaryContent(webpHeader, "image/webp")).toBe(true);
    });

    it("détecte correctement un en-tête PDF (%PDF-)", () => {
      const pdfHeader = Buffer.from("%PDF-1.7\n");
      expect(detectBinaryMimeType(pdfHeader)).toBe("application/pdf");
      expect(isValidBinaryContent(pdfHeader, "application/pdf")).toBe(true);
    });

    it("détecte correctement un conteneur MP4 (ftyp)", () => {
      const mp4Header = Buffer.from([0, 0, 0, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d]); // ftypisom
      expect(detectBinaryMimeType(mp4Header)).toBe("video/mp4");
      expect(isValidBinaryContent(mp4Header, "video/mp4")).toBe(true);
    });

    it("rejette un faux fichier JPEG contenant du code malveillant / HTML / SVG", () => {
      const fakeJpgHtml = Buffer.from("<svg onload=alert(1)>");
      expect(detectBinaryMimeType(fakeJpgHtml)).toBeNull();
      expect(isValidBinaryContent(fakeJpgHtml, "image/jpeg")).toBe(false);

      const fakeJpgExe = Buffer.from("MZ\x90\x00\x03\x00\x00\x00"); // DOS executable header
      expect(detectBinaryMimeType(fakeJpgExe)).toBeNull();
      expect(isValidBinaryContent(fakeJpgExe, "image/jpeg")).toBe(false);
    });
  });

  describe("Règles de modules et listes blanches (storage-rules.ts)", () => {
    it("interdit absolument les SVG, HTML, JS et exécutables sur tous les modules", () => {
      for (const [, kinds] of Object.entries(MODULE_RULES)) {
        for (const [, rule] of Object.entries(kinds)) {
          if (rule) {
            expect(rule.allowedMimes).not.toContain("image/svg+xml");
            expect(rule.allowedMimes).not.toContain("text/html");
            expect(rule.allowedMimes).not.toContain("application/javascript");
            expect(rule.allowedMimes).not.toContain("application/x-msdownload");
          }
        }
      }
    });

    it("vérifie les tailles maximales (10 Mo images, 150 Mo vidéos)", () => {
      const wabImg = MODULE_RULES.wab.image;
      expect(wabImg?.maxSizeBytes).toBe(10 * 1024 * 1024);

      const wabVideo = MODULE_RULES.wab.video;
      expect(wabVideo?.maxSizeBytes).toBe(150 * 1024 * 1024);
    });
  });

  describe("Résolution d'URL et rétrocompatibilité (resolve-url.ts)", () => {
    it("préserve intactes les anciennes URLs complètes Supabase Storage", () => {
      const legacySupabaseUrl = "https://rtfjwpytiuvoekomevpu.supabase.co/storage/v1/object/public/article-media/cover.jpg";
      expect(resolveFileUrl(legacySupabaseUrl)).toBe(legacySupabaseUrl);
    });

    it("résout une nouvelle clé R2 vers l'URL publique Cloudflare", () => {
      const r2Key = "dev/marketplace/user-1/2026/10/product-123.webp";
      const resolved = resolveFileUrl(r2Key);
      expect(resolved).toContain("pub-df336181dd964534a4866a10762a3327.r2.dev");
      expect(resolved).toContain(r2Key);
    });

    it("renvoie une chaîne vide pour les valeurs nulles ou indéfinies", () => {
      expect(resolveFileUrl(null)).toBe("");
      expect(resolveFileUrl(undefined)).toBe("");
      expect(resolveFileUrl("")).toBe("");
    });
  });
});
