"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const menu = [
  { href: "/compte", label: "Tableau de bord", icon: "⌂" },
  { href: "/compte/abonnement", label: "Mon abonnement", icon: "★" },
  { href: "/compte/achats", label: "Mes achats & téléchargements", icon: "◫" },
  { href: "/compte/parrainage", label: "Parrainage & gains", icon: "💸" },
  { href: "/compte/favoris", label: "Favoris", icon: "❤️" },
  { href: "/compte/dons", label: "Mes dons", icon: "🎁" },
  { href: "/compte/parametres", label: "Paramètres", icon: "⚙" },
];

export default function CompteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(()=>{
    fetch("/api/auth/me").then(r=>r.json()).then(d=>{
      if (!d.user) router.push("/auth/login");
      else setUser(d.user);
    });
  },[]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method:"POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <div className="bg-[#FFFCF5] min-h-screen pb-20">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 xl:px-8 pt-8 grid lg:grid-cols-[280px_1fr] gap-8">
        <aside className="lg:sticky lg:top-24 h-fit">
          <div className="bg-white rounded-[20px] border border-zinc-100 p-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#0A1931] text-white flex items-center justify-center font-bold">{user ? `${user.prenom?.[0]}${user.nom?.[0]}` : "?"}</div>
              <div>
                <div className="font-bold text-[14px] text-[#0A1931]">{user ? `${user.prenom} ${user.nom}` : "Chargement..."}</div>
                <div className="text-[12px] text-zinc-500">{user?.email}</div>
              </div>
            </div>
            {user?.subscription?.status==="active" && <div className="mt-4 bg-green-50 border border-green-100 rounded-full px-3 py-1.5 text-[11px] font-bold text-green-800 uppercase text-center">✓ Abonné {user.subscription.planId} • jusqu'au {new Date(user.subscription.endDate).toLocaleDateString('fr-FR')}</div>}
            {!user?.subscription && <div className="mt-4 bg-amber-50 border border-amber-100 rounded-full px-3 py-1.5 text-[11px] font-bold text-amber-800 uppercase text-center">Non abonné • 12 lignes / article</div>}
          </div>

          <nav className="mt-4 bg-white rounded-[20px] border border-zinc-100 p-2">
            {menu.map(m=>(
              <Link key={m.href} href={m.href} className={`flex items-center gap-3 px-4 py-2.5 rounded-full text-[13px] font-medium transition-colors ${pathname===m.href ? "bg-[#0A1931] text-white" : "text-zinc-700 hover:bg-zinc-50"}`}>
                <span className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-[12px]">{m.icon}</span>{m.label}
              </Link>
            ))}
            <button onClick={logout} className="w-full mt-2 flex items-center gap-3 px-4 py-2.5 rounded-full text-[13px] font-medium text-red-600 hover:bg-red-50"><span className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center text-[12px]">↪</span>Se déconnecter</button>
          </nav>

          <div className="mt-4 rounded-[16px] bg-[#0A1931] p-4 text-white">
            <div className="text-[12px] font-bold uppercase tracking-wide text-[#D4AF37]">Besoin d'aide ?</div>
            <div className="text-[13px] mt-1 leading-5 text-zinc-300">Support dédié pour abonnés Chef d'entreprise & Soutien.</div>
            <button className="mt-3 h-9 px-4 rounded-full bg-white text-[#0A1931] text-[12px] font-bold">Contacter le support</button>
          </div>
        </aside>

        <main>{children}</main>
      </div>
    </div>
  );
}
