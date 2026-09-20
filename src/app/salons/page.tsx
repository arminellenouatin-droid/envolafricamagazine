import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Salons Professionnels & Forums Économiques | Envol Africa",
  description: "Découvrez les plus grands rendez-vous d'affaires, forums d'investissement et sommets économiques panafricains organisés par Envol Africa.",
  alternates: {
    canonical: "/salons",
  },
  openGraph: {
    title: "Salons Professionnels & Forums Économiques | Envol Africa",
    description: "Les sommets économiques et salons d'affaires de référence en Afrique.",
    url: "/salons",
    type: "website",
  },
};

export default function Page(){
  return (<div className="bg-[#FFFCF5] min-h-screen pb-20"><div className="max-w-[1120px] mx-auto px-6 pt-10"><div className="flex items-center gap-2 text-[11px] uppercase tracking-widest font-bold text-zinc-500"><Link href="/" className="hover:text-[#0A1931]">Accueil</Link><span>›</span><span className="text-[#0A1931]">Salons</span></div><h1 className="font-serif font-black text-[36px] text-[#0A1931] mt-4">Salons Professionnels</h1><p className="text-zinc-600 mt-2 max-w-[640px]">Bientôt: les plus grands rendez-vous Business en Afrique. Networking haut niveau. Même compte Envol Africa.</p><div className="mt-10 grid md:grid-cols-2 gap-4"><div className="bg-white rounded-[16px] border p-6"><div className="font-bold">Africa Finance Forum • Dakar • Mars 2026</div><div className="text-sm text-zinc-500 mt-2">500 décideurs attendus</div></div><div className="bg-white rounded-[16px] border p-6"><div className="font-bold">Envol Tech Summit • Abidjan • Juin 2026</div><div className="text-sm text-zinc-500 mt-2">Le CES africain</div></div></div></div></div>);
}
