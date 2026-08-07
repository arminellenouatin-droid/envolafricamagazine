import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#0A1931] text-zinc-300 mt-20">
      {/* Newsletter */}
      <div className="border-b border-white/[0.08] bg-[#0f2142]">
        <div className="max-w-[1440px] mx-auto px-6 xl:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-serif text-white text-[22px] font-bold leading-tight">Restez à la pointe de l'économie africaine</h3>
            <p className="text-zinc-400 text-sm mt-1.5">La newsletter la plus influente du continent, chaque matin à 7h GMT.</p>
          </div>
          <form className="flex w-full md:w-auto gap-2">
            <input placeholder="Votre email professionnel" className="w-full md:w-[320px] h-12 rounded-full bg-white/[0.08] border border-white/10 px-5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#D4AF37]/50" />
            <button className="h-12 px-6 rounded-full bg-[#D4AF37] text-[#0A1931] text-sm font-bold hover:bg-[#F0D878] transition-colors whitespace-nowrap">S'abonner</button>
          </form>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 xl:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2">
            <Link href="/" className="flex flex-col gap-3">
              {/* REAL LOGO BLANC POUR FOOTER sur fond sombre */}
              <img 
                src="/logo-blanc-footer.png" 
                alt="Envol Africa Mag - envolafricamag.com - Batir une jeunesse entreprenante" 
                className="h-[72px] w-auto object-contain object-left"
              />
            </Link>
            <p className="mt-5 text-[13px] leading-6 text-zinc-400 max-w-[320px]">
              Le magazine économique panafricain de référence. Analyses, enquêtes, portraits et perspectives pour comprendre l'Afrique qui bouge.
            </p>
            <div className="mt-6 flex gap-2">
              {["𝕏","in","f","ig","yt"].map(s=>(
                <a key={s} href="#" className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-xs transition-colors">{s}</a>
              ))}
            </div>
          </div>

          <div>
            <div className="text-white font-semibold text-[13px] uppercase tracking-wider mb-4">Rubriques</div>
            <ul className="space-y-2.5 text-[13px] text-zinc-400">
              <li><Link href="/" className="hover:text-white">Économie</Link></li>
              <li><Link href="/" className="hover:text-white">Finance</Link></li>
              <li><Link href="/" className="hover:text-white">Tech & Innovation</Link></li>
              <li><Link href="/" className="hover:text-white">Entrepreneuriat</Link></li>
              <li><Link href="/" className="hover:text-white">Énergie</Link></li>
              <li><Link href="/kiosque" className="hover:text-white">Kiosque</Link></li>
            </ul>
          </div>

          <div>
            <div className="text-white font-semibold text-[13px] uppercase tracking-wider mb-4">Écosystème</div>
            <ul className="space-y-2.5 text-[13px] text-zinc-400">
              <li><Link href="/emploi" className="hover:text-white">Envol Emploi</Link></li>
              <li><Link href="/marketplace" className="hover:text-white">Marketplace</Link></li>
              <li><Link href="/financement" className="hover:text-white">Financement Participatif</Link></li>
              <li><Link href="/africa-awards" className="hover:text-white">Africa Awards</Link></li>
              <li><Link href="/salons" className="hover:text-white">Salons Professionnels</Link></li>
              <li><Link href="/wab" className="hover:text-white">World Africa Business</Link></li>
            </ul>
          </div>

          <div>
            <div className="text-white font-semibold text-[13px] uppercase tracking-wider mb-4">Groupe</div>
            <ul className="space-y-2.5 text-[13px] text-zinc-400">
              <li><Link href="/abonnement" className="hover:text-white">S'abonner</Link></li>
              <li><Link href="/don" className="hover:text-white">Faire un don</Link></li>
              <li><Link href="/affiliation" className="hover:text-white">Parrainage -10% / -25%</Link></li>
              <li><Link href="/admin" className="hover:text-white">Espace Rédaction</Link></li>
              <li><span className="hover:text-white">Contact & Pub</span></li>
              <li><span className="hover:text-white">Mentions légales</span></li>
            </ul>
          </div>
        </div>

        {/* Pub banner */}
        <div className="mt-12 rounded-[20px] bg-white/[0.04] border border-white/[0.06] p-1 flex items-center justify-center h-[120px] relative overflow-hidden">
          <span className="absolute top-3 left-4 text-[10px] tracking-widest uppercase text-zinc-500">Publicité • Espace Sponsorisé</span>
          <div className="text-center">
            <div className="text-white font-serif text-xl font-bold">Votre marque ici, devant 2,5M de décideurs africains</div>
            <div className="text-zinc-400 text-sm mt-1">Régie publicitaire • Contactez-nous pour nos kits média 2026</div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-4 text-[12px] text-zinc-500">
          <div>© {new Date().getFullYear()} ENVOL AFRICA GROUPE • Tous droits réservés • Conçu à Cotonou & Dakar avec passion pour l'Afrique</div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2"><span className="w-2 h-2 bg-green-400 rounded-full"></span> Tous systèmes opérationnels</span>
            <span>•</span>
            <span>Paiement sécurisé par Moneroo</span>
            <span className="w-8 h-5 rounded bg-white/10 flex items-center justify-center text-[9px] font-bold text-white">PCI</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
