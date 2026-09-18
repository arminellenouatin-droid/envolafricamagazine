import type { Metadata } from "next";
import { findMagazineById } from "@/lib/core-db";
import MagazineDetailClient from "./MagazineDetailClient";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const magazine = await findMagazineById(id).catch(() => null);

  if (!magazine) {
    return {
      title: "Magazine Kiosque | Envol Africa",
      description: "Découvrez nos éditions et dossiers économiques au Kiosque Envol Africa.",
    };
  }

  const title = magazine.title || `Envol Africa Magazine N°${magazine.numero || ""}`;
  const description = (magazine.description || "Édition exclusive disponible en lecture numérique et papier au Kiosque Envol Africa.")
    .replace(/<[^>]*>/g, "")
    .slice(0, 180)
    .trim();

  const image = magazine.cover || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800";

  return {
    title,
    description,
    alternates: {
      canonical: `/kiosque/${encodeURIComponent(id)}`,
    },
    openGraph: {
      title,
      description,
      url: `/kiosque/${encodeURIComponent(id)}`,
      type: "book",
      images: [
        {
          url: image,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default function MagazineDetailPage() {
  return <MagazineDetailClient />;
}
