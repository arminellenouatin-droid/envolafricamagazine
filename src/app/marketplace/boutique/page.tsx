import { redirect } from "next/navigation";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { generateVendorSlug } from "@/lib/marketplace-slug";

export default async function MarketplaceBoutiquePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await getCurrentUserFromCookie();
  const sp = await searchParams;
  const searchEntries = Object.entries(sp).flatMap(([k, v]) =>
    Array.isArray(v) ? v.map((item) => [k, item]) : v ? [[k, v]] : []
  );
  const q = searchEntries.length > 0 ? `?${new URLSearchParams(searchEntries).toString()}` : "";

  // Si l'utilisateur n'est pas connecté, le diriger vers la connexion
  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent(`/marketplace/boutique${q}`)}`);
  }

  // Redirection automatique du vendeur vers son hub dédié /marketplace/boutique/[vendor] (ex: /marketplace/boutique/arminelle)
  const vendorSlug = generateVendorSlug(user);
  redirect(`/marketplace/boutique/${encodeURIComponent(vendorSlug)}${q}`);
}
