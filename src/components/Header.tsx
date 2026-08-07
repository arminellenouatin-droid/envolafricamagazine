"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const topLinks = [
  { name: "S'abonner", href: "/abonnement", highlight: true },
  { name: "Kiosque", href: "/kiosque" },
  { name: "Emploi", href: "/emploi" },
  { name: "Marketplace", href: "/marketplace" },
  { name: "Financement", href: "/financement" },
  { name: "Africa Awards", href: "/africa-awards" },
  { name: "Salons", href: "/salons" },
  { name: "WAB", href: "/wab" },
];

const langs = [
  { code: "fr", label: "FR" },
  { code: "en", label: "EN" },
  { code: "es", label: "ES" },
];
const devises = [
  { code: "XOF", symbol: "F CFA" },
  { code: "EUR", symbol: "€" },
  { code: "USD", symbol: "$" },
];

export default function Header({ user }: { user?: any }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);
  const [currentLang, setCurrentLang] = useState("fr");
  const [currentDevise, setCurrentDevise] = useState("XOF");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const loadCart = () => {
      const saved = localStorage.getItem("eam_cart");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setCartCount(parsed.length);
        } catch {}
      }
    };
    loadCart();
    window.addEventListener("storage", loadCart);
    const interval = setInterval(loadCart, 1000);
    return () => {
      window.removeEventListener("storage", loadCart);
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      {/* Ticker */}
      <div className="bg-[#0A1931] text-white text-[11px] md:text-xs py-2 overflow-hidden relative border-b border-[#1a3355]">
        <div className="flex animate-ticker whitespace-nowrap gap-8">
          <span className="flex items-center gap-8">
            <span className="bg-[#D4AF37] text-[#0A1931] px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wider">À LA UNE</span>
            <span>• Zone de libre-échange continentale : un marché de 1,3 milliard de consommateurs</span>
            <span>• Nigeria : Lagos attire les licornes de la Tech avec 2,5Md$ levés en 2025</span>
            <span>• BCEAO maintient son taux directeur à 3,5% malgré l'inflation</span>
            <span>• Cacao ivoirien : la barre des 50% de transformation locale en vue</span>
            <span>• Fintech : Wave dépasse les 20M d'utilisateurs en Afrique de l'Ouest</span>
            <span>• Entretien exclusif avec le PDG de la BAD ce weekend</span>
          </span>
          <span className="flex items-center gap-8">
            <span className="bg-[#D4AF37] text-[#0A1931] px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wider">À LA UNE</span>
            <span>• Zone de libre-échange continentale : un marché de 1,3 milliard de consommateurs</span>
            <span>• Nigeria : Lagos attire les licornes de la Tech avec 2,5Md$ levés en 2025</span>
            <span>• Cacao ivoirien : la barre des 50% de transformation locale en vue</span>
          </span>
        </div>
      </div>

      {/* Top bar */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-xl shadow-[0_2px_20px_rgba(0,0,0,0.06)] border-b border-zinc-100" : "bg-white border-b border-zinc-100"}`}>
        {/* Upper header */}
        <div className="border-b border-zinc-100 bg-[#FFFCF5]/50 hidden lg:block">
          <div className="max-w-[1440px] mx-auto px-6 xl:px-8 flex items-center justify-between h-10 text-[12px]">
            <div className="flex items-center gap-6">
              <span className="text-zinc-500 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                Édition du {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span className="h-3 w-px bg-zinc-200"></span>
              <Link href="/don" className="text-zinc-600 hover:text-[#0A1931] transition-colors flex items-center gap-1.5">
                <span>❤️</span> Faire un don
              </Link>
              <Link href="/affiliation" className="text-zinc-600 hover:text-[#0A1931] transition-colors">Parrainage</Link>
            </div>
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-1 bg-zinc-100 rounded-full p-1">
                {langs.map(l => (
                  <button key={l.code} onClick={() => setCurrentLang(l.code)} className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${currentLang===l.code ? "bg-[#0A1931] text-white shadow" : "text-zinc-600 hover:text-[#0A1931]"}`}>
                    {l.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 bg-zinc-100 rounded-full p-1">
                {devises.map(d => (
                  <button key={d.code} onClick={() => setCurrentDevise(d.code)} className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${currentDevise===d.code ? "bg-[#D4AF37] text-[#0A1931] shadow" : "text-zinc-600 hover:text-[#0A1931]"}`}>
                    {d.code}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main header */}
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 xl:px-8">
          <div className="flex items-center justify-between h-[68px] md:h-[80px]">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-11 h-11 md:w-12 md:h-12 bg-[#0A1931] rounded-[12px] flex items-center justify-center relative overflow-hidden group-hover:scale-[1.02] transition-transform">
                <span className="text-[#D4AF37] font-serif font-black text-xl leading-none tracking-tight">E</span>
                <span className="text-white font-serif font-black text-xl leading-none tracking-tight -ml-0.5">A</span>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#D4AF37] rounded-full blur-[8px] opacity-60"></div>
              </div>
              <div className="leading-[0.9]">
                <div className="font-serif font-black text-[18px] md:text-[22px] tracking-tight text-[#0A1931] uppercase">Envol Africa</div>
                <div className="font-sans font-bold text-[10px] md:text-[11px] tracking-[0.2em] text-[#D4AF37] uppercase -mt-0.5">Magazine</div>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {topLinks.map(link => (
                <Link key={link.name} href={link.href}
                  className={`px-3.5 py-2.5 rounded-full text-[13px] font-medium transition-all ${link.highlight ? "bg-[#0A1931] text-white hover:bg-[#142850] shadow-sm" : pathname===link.href ? "bg-zinc-900 text-white" : "text-zinc-700 hover:text-[#0A1931] hover:bg-zinc-50"}`}>
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1.5 md:gap-2.5">
              <Link href="/panier" className="relative w-10 h-10 rounded-full bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 flex items-center justify-center transition-colors group">
                <svg className="w-4 h-4 text-zinc-700 group-hover:text-[#0A1931]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                {cartCount>0 && <span className="absolute -top-1 -right-1 bg-[#D4AF37] text-[#0A1931] text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">{cartCount}</span>}
              </Link>
              <Link href="/compte" className="hidden md:flex w-10 h-10 rounded-full bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 items-center justify-center transition-colors">
                {user ? (
                  <span className="w-7 h-7 rounded-full bg-[#0A1931] text-white flex items-center justify-center text-xs font-bold">{user.prenom?.[0]}{user.nom?.[0]}</span>
                ) : (
                  <svg className="w-4 h-4 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                )}
              </Link>
              {user ? (
                <Link href="/compte" className="hidden lg:flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-zinc-900 text-white text-[13px] font-medium hover:bg-black transition-colors">
                  <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[11px] font-bold">{user.prenom?.[0]}</span>
                  <span className="max-w-[80px] truncate">{user.prenom}</span>
                </Link>
              ) : (
                <div className="hidden lg:flex items-center gap-2">
                  <Link href="/auth/login" className="px-4 py-2.5 text-[13px] font-medium text-zinc-700 hover:text-[#0A1931]">Connexion</Link>
                  <Link href="/auth/register" className="px-5 py-2.5 rounded-full bg-[#D4AF37] text-[#0A1931] text-[13px] font-bold hover:bg-[#C9A44A] transition-colors shadow-sm">S'inscrire</Link>
                </div>
              )}
              <button onClick={()=>setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center">
                {mobileMenuOpen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-zinc-100 bg-white animate-fade-in">
            <div className="px-4 py-6 space-y-6">
              <div className="grid grid-cols-2 gap-2">
                {topLinks.map(link=>(
                  <Link key={link.name} href={link.href} onClick={()=>setMobileMenuOpen(false)} className={`p-3.5 rounded-2xl text-[13px] font-medium border ${link.highlight ? "bg-[#0A1931] text-white border-[#0A1931]" : "bg-zinc-50 text-zinc-800 border-zinc-100"}`}>
                    {link.name}
                  </Link>
                ))}
              </div>
              <div className="flex gap-2">
                <Link href="/auth/login" onClick={()=>setMobileMenuOpen(false)} className="flex-1 py-3 rounded-full border border-zinc-200 text-center text-[14px] font-medium">Connexion</Link>
                <Link href="/auth/register" onClick={()=>setMobileMenuOpen(false)} className="flex-1 py-3 rounded-full bg-[#D4AF37] text-[#0A1931] text-center text-[14px] font-bold">S'inscrire</Link>
              </div>
              <div className="pt-4 border-t border-zinc-100 flex items-center justify-between text-xs">
                <div className="flex gap-1">
                  {langs.map(l=><button key={l.code} className={`px-3 py-1.5 rounded-full border ${currentLang===l.code ? "bg-[#0A1931] text-white" : "bg-zinc-50"}`}>{l.label}</button>)}
                </div>
                <div className="flex gap-1">
                  {devises.map(d=><button key={d.code} className={`px-3 py-1.5 rounded-full border ${currentDevise===d.code ? "bg-[#D4AF37] text-[#0A1931] border-[#D4AF37]" : "bg-zinc-50"}`}>{d.symbol}</button>)}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile bottom bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-zinc-200 px-2 py-2 safe-area-bottom">
        <div className="flex items-center justify-around">
          {[
            { name: "Accueil", href: "/", icon: "⌂" },
            { name: "Kiosque", href: "/kiosque", icon: "◫" },
            { name: "Emploi", href: "/emploi", icon: "💼" },
            { name: "Finance", href: "/financement", icon: "💰" },
            { name: "Market", href: "/marketplace", icon: "🛒" },
            { name: "Awards", href: "/africa-awards", icon: "🏆" },
            { name: "WAB", href: "/wab", icon: "🌍" },
          ].map(item=>(
            <Link key={item.name} href={item.href} className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl ${pathname===item.href ? "text-[#0A1931]" : "text-zinc-500"}`}>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[14px] ${pathname===item.href ? "bg-[#0A1931] text-white" : "bg-zinc-100"}`}>{item.icon}</span>
              <span className="text-[9px] font-medium tracking-wide uppercase">{item.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
