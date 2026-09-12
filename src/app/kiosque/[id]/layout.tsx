import type { Metadata } from "next";
import { findMagazineById } from "@/lib/core-db";
import { absoluteSiteUrl, metadataText } from "@/lib/site-metadata";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const magazine = await findMagazineById(id).catch(() => null);
  if (!magazine) return { title: "Magazine introuvable | Envol Africa", robots: { index: false, follow: false } };

  const title = `${magazine.title} | Envol Africa Magazine`;
  const description = metadataText(magazine.description, `Découvrez le numéro ${magazine.numero} d’Envol Africa Magazine.`);
  const image = absoluteSiteUrl(magazine.cover);
  const canonical = `/kiosque/${encodeURIComponent(magazine.id)}`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: "article",
      url: canonical,
      siteName: "Envol Africa Magazine",
      images: [{ url: image, alt: magazine.title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default function MagazineDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
