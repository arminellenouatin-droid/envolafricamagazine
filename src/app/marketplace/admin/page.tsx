import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserFromCookie } from "@/lib/auth";

const modules = [
  ["Vendeurs et boutiques", "Gérer les fournisseurs, les boutiques, les certifications et les statuts de validation.", "/marketplace/boutique"],
  ["Produits et modération", "Examiner les produits, catégories, médias, prix, stocks et demandes de publication.", "/marketplace/boutique#catalogue"],
  ["Commandes et fonds bloqués", "Suivre les paiements encaissés par Envol Africa, les confirmations de réception et les litiges.", "/marketplace/commandes"],
  ["Commissions Marketplace", "Configurer le taux de commission et contrôler le montant brut, la commission et le net vendeur.", "/compte?platform=marketplace"],
  ["Demandes de versement", "Valider ou refuser les demandes de versement lorsque le client a confirmé la réception.", "/marketplace/commandes#versements"],
  ["Affiliation Marketplace", "Suivre l’attribution et les commissions d’affiliation propres aux transactions Marketplace.", "/compte?platform=marketplace&tab=affiliation"],
];

export default async function MarketplaceAdminPage() {
  const user = await getCurrentUserFromCookie();
  if (!user) redirect("/auth/login?next=/marketplace/admin");
  if (!["admin", "gerant"].includes(user.role)) redirect("/compte?platform=marketplace&role=seller");

  return <main className="min-h-screen bg-[#FFFCF5] px-4 py-10 sm:px-8">
    <div className="mx-auto max-w-6xl">
      <div className="rounded-[28px] bg-[#0A1931] p-8 text-white shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-white/60">Espace administrateur</p>
        <h1 className="mt-3 text-3xl font-black">Administration Marketplace</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/75">Un espace dédié au pilotage des vendeurs, produits, commandes, commissions et versements. Les comptes et sessions restent communs à toute la plateforme, mais les données affichées ici sont exclusivement Marketplace.</p>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{modules.map(([title, detail, href]) => <section key={title} className="rounded-[22px] border border-zinc-200 bg-white p-6 shadow-sm"><h2 className="font-black text-[#0A1931]">{title}</h2><p className="mt-3 text-sm leading-6 text-zinc-600">{detail}</p><Link href={href} className="mt-5 inline-flex rounded-full bg-[#9e001f] px-4 py-2 text-xs font-black text-white">Ouvrir le module →</Link></section>)}</div>
    </div>
  </main>;
}
