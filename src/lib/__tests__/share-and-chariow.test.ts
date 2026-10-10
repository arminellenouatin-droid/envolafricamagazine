import { describe, it, expect } from "vitest";
import {
  buildShareMetadata,
  buildShareUrl,
  CANONICAL_SITE_URL,
} from "../share-metadata-service";
import {
  CHARIOW_PRODUCT_URLS,
  CHARIOW_PRODUCT_IDS,
} from "../chariow";

describe("Partage Réseaux Sociaux & Open Graph (WAB, Magazines, Documents)", () => {
  it("génère les métadonnées Open Graph parfaites pour un post WAB vidéo avec bouton Play", () => {
    const meta = buildShareMetadata({
      type: "video",
      id: "wab-video-123",
      title: "Intervention exclusive CEO Wave",
      description: "Découvrez les coulisses de la stratégie d'expansion panafricaine.",
      videoUrl: "https://pub-df336181dd964534a4866a10762a3327.r2.dev/wab/video1.mp4",
      author: "Amadou Diallo",
    });

    expect((meta.openGraph as any)?.type).toBe("video.other");
    expect((meta.twitter as any)?.card).toBe("summary_large_image");
    
    const images = meta.openGraph?.images as any[];
    expect(images).toBeDefined();
    expect(images.length).toBeGreaterThan(0);
    expect(images[0].url).toContain("/api/og/wab-post?id=wab-video-123");
    expect(images[0].width).toBe(1200);
    expect(images[0].height).toBe(630);
  });

  it("génère les métadonnées Open Graph parfaites pour un magazine du Kiosque avec capture sans rognage", () => {
    const meta = buildShareMetadata({
      type: "magazine",
      id: "25",
      title: "Envol Africa Magazine N°25",
      description: "Grand dossier sur l'émergence des licornes de la fintech.",
      imageUrl: "/covers/envol-africa-cover-01.jpg",
      badge: "MAGAZINE N°25",
    });

    expect((meta.openGraph as any)?.type).toBe("book");
    expect((meta.twitter as any)?.card).toBe("summary_large_image");

    const images = meta.openGraph?.images as any[];
    expect(images).toBeDefined();
    expect(images.length).toBeGreaterThanOrEqual(2);
    // Première image : carte 1200x630 optimisée réseaux sociaux
    expect(images[0].url).toContain("/api/og/share?title=");
    expect(images[0].url).toContain("type=magazine");
    expect(images[0].width).toBe(1200);
    expect(images[0].height).toBe(630);

    // Seconde image : couverture brute JPEG haute résolution
    expect(images[1].url).toBe(`${CANONICAL_SITE_URL}/covers/envol-africa-cover-01.jpg`);
  });

  it("construit des URLs de partage absolues HTTPS", () => {
    expect(buildShareUrl({ type: "video", id: "post-456" })).toBe(
      `${CANONICAL_SITE_URL}/wab/posts/post-456`
    );
    expect(buildShareUrl({ type: "magazine", id: "24" })).toBe(
      `${CANONICAL_SITE_URL}/kiosque/24`
    );
    expect(buildShareUrl({ type: "article", slug: "agro-business-2026" })).toBe(
      `${CANONICAL_SITE_URL}/article/agro-business-2026`
    );
  });
});

describe("Connexion des Produits Chariow créés par le propriétaire", () => {
  it("contient les URLs exactes de tous les produits Chariow officiels", () => {
    // Kiosque
    expect(CHARIOW_PRODUCT_URLS.magazineNumerique).toBe("https://toerbwke.mychariow.shop/prd_ac3bruo2");
    expect(CHARIOW_PRODUCT_URLS.magazinePapier).toBe("https://toerbwke.mychariow.shop/prd_4x3iyvnk");
    expect(CHARIOW_PRODUCT_URLS.magazineAudio).toBe("https://toerbwke.mychariow.shop/prd_xo2ui9rr");
    // Abonnements
    expect(CHARIOW_PRODUCT_URLS.abonnementMensuelLecteur).toBe("https://toerbwke.mychariow.shop/prd_5acrvnze");
    expect(CHARIOW_PRODUCT_URLS.abonnementAnnuelLecteur).toBe("https://toerbwke.mychariow.shop/prd_94zp94e0");
    expect(CHARIOW_PRODUCT_URLS.abonnementChefEntreprise).toBe("https://toerbwke.mychariow.shop/prd_g8iz7mej");
    expect(CHARIOW_PRODUCT_URLS.abonnementAnnuelChefEntreprise).toBe("https://toerbwke.mychariow.shop/prd_0lpe86o1");
    // Don
    expect(CHARIOW_PRODUCT_URLS.don).toBe("https://toerbwke.mychariow.shop/prd_d1v11apk");
  });

  it("contient les identifiants de produit Chariow correspondants", () => {
    expect(CHARIOW_PRODUCT_IDS.magazineNumerique).toBe("prd_ac3bruo2");
    expect(CHARIOW_PRODUCT_IDS.magazinePapier).toBe("prd_4x3iyvnk");
    expect(CHARIOW_PRODUCT_IDS.magazineAudio).toBe("prd_xo2ui9rr");
    expect(CHARIOW_PRODUCT_IDS.abonnementMensuelLecteur).toBe("prd_5acrvnze");
    expect(CHARIOW_PRODUCT_IDS.abonnementAnnuelLecteur).toBe("prd_94zp94e0");
    expect(CHARIOW_PRODUCT_IDS.abonnementChefEntreprise).toBe("prd_g8iz7mej");
    expect(CHARIOW_PRODUCT_IDS.abonnementAnnuelChefEntreprise).toBe("prd_0lpe86o1");
    expect(CHARIOW_PRODUCT_IDS.don).toBe("prd_d1v11apk");
  });
});
