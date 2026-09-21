import type { Metadata } from "next";
import { findMagazineById } from "@/lib/core-db";
import { getMagazineProductSchema, getBreadcrumbSchema } from "@/lib/schema-org";
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

  const canonicalSlug = magazine.numero ? String(magazine.numero) : encodeURIComponent(id);

  return {
    title,
    description,
    alternates: {
      canonical: `/kiosque/${canonicalSlug}`,
    },
    openGraph: {
      title,
      description,
      url: `/kiosque/${canonicalSlug}`,
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

export default async function MagazineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const magazine = await findMagazineById(id).catch(() => null);

  const magazineSchema = magazine ? getMagazineProductSchema(magazine) : null;
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Accueil", url: "/" },
    { name: "Kiosque", url: "/kiosque" },
    { name: magazine?.title || "Magazine", url: `/kiosque/${encodeURIComponent(id)}` },
  ]);

  return (
    <>
      {magazineSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(magazineSchema) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <MagazineDetailClient initialMagazine={magazine} />
    </>
  );
}

