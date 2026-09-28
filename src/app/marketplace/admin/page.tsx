import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserFromCookie } from "@/lib/auth";
import MarketplaceAdminClient from "./MarketplaceAdminClient";

export const dynamic = "force-dynamic";

export default async function MarketplaceAdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; section?: string }>;
}) {
  const user = await getCurrentUserFromCookie();
  if (!user) redirect("/auth/login?next=/marketplace/admin");

  if (!["admin", "administrateur", "gerant"].includes(user.role)) {
    redirect("/marketplace");
  }

  const params = searchParams ? await searchParams : {};
  const requestedTab = (params?.tab || params?.section || "suppliers") as any;

  return (
    <main className="min-h-screen bg-[#fcf9f8] px-4 py-8 text-[#2a211a] sm:px-6 md:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        {/* Navigation retour administration générale */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9e001f] hover:underline"
          >
            ← Retour à l&apos;Administration Générale
          </Link>

          <div className="flex items-center gap-3">
            <span className="rounded-full bg-[#0A1931] text-white px-3 py-1 text-xs font-black">
              Session Admin · {user.prenom || user.email}
            </span>
            <Link
              href="/marketplace"
              target="_blank"
              className="rounded-full border border-zinc-200 bg-white px-3.5 py-1 text-xs font-bold text-zinc-700 hover:bg-zinc-50"
            >
              Voir le Marketplace ↗
            </Link>
          </div>
        </div>

        {/* Hero Bannière */}
        <div className="mt-6 rounded-[28px] bg-[#0A1931] p-6 text-white md:p-8 shadow-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ffca63]/20 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-[#ffca63]">
            🛡️ Module Marketplace Officiel
          </span>
          <h1 className="mt-3 font-display text-2xl font-black md:text-3xl">
            Supervision & Administration Marketplace
          </h1>
          <p className="mt-2 max-w-3xl text-xs sm:text-sm leading-6 text-white/75">
            Pilotez l&apos;ensemble des boutiques, vendeurs, produits, commandes, livraisons, fonds sous séquestre et litiges à l&apos;échelle panafricaine.
          </p>
        </div>

        {/* Client Dashboard */}
        <div className="mt-6">
          <MarketplaceAdminClient initialTab={requestedTab} />
        </div>
      </div>
    </main>
  );
}
