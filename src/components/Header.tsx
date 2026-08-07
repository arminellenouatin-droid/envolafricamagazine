"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const topLinks = [
  { name: "S'abonner", href: "/abonnement", icon: "stars" },
  { name: "Kiosque", href: "/kiosque", icon: "menu_book" },
  { name: "Jobs", href: "/emploi", icon: "work" },
  { name: "Marketplace", href: "/marketplace", icon: "storefront" },
  { name: "Crowdfunding", href: "/financement", icon: "volunteer_activism" },
  { name: "Africa Awards", href: "/africa-awards", icon: "emoji_events" },
  { name: "Salons", href: "/salons", icon: "event_seat" },
  { name: "World Africa Business", href: "/wab", icon: "public" },
];

const mainNav = [
  { name: "Finance", href: "/?cat=Finance" },
  { name: "Économie", href: "/?cat=Economie" },
  { name: "Politique", href: "/?cat=Politique" },
  { name: "Tech", href: "/?cat=Tech" },
  { name: "Lifestyle", href: "/?cat=Lifestyle" },
  { name: "Analyses", href: "/?cat=Analyse" },
];

export default function Header({ user }: { user?: any }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    const saved = localStorage.getItem("eam_cart");
    if (saved) {
      try { setCartCount(JSON.parse(saved).length); } catch {}
    }
    const interval = setInterval(() => {
      const s = localStorage.getItem("eam_cart");
      if (s) { try { setCartCount(JSON.parse(s).length); } catch {} }
    }, 1000);
    return () => { window.removeEventListener("scroll", onScroll); clearInterval(interval); };
  }, []);

  const doSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim()) { setSearchResults(null); return; }
    const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
    const data = await res.json();
    setSearchResults(data);
  };

  return (
    <>
      {/* TOP HEADER LAYER 1 - inverse-surface #303030 */}
      <nav className="bg-[#303030] text-white py-2 px-5 md:px-[64px] hidden md:flex justify-between items-center z-50">
        <div className="flex items-center gap-4 text-[12px] font-medium opacity-80">
          {topLinks.map(l=>(
            <Link key={l.name} href={l.href} className="hover:text-[#ffdad8] flex items-center gap-1 transition-colors">
              <span className="material-symbols-outlined text-[14px]">{l.icon}</span> {l.name}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-1 text-[12px] opacity-80 hover:opacity-100">FR <span className="material-symbols-outlined text-[14px]">expand_more</span></button>
          <button className="flex items-center gap-1 text-[12px] opacity-80 hover:opacity-100">EUR <span className="material-symbols-outlined text-[14px]">expand_more</span></button>
        </div>
      </nav>

      {/* MAIN HEADER LAYER 2 - surface #fcf9f8 sticky */}
      <header className={`bg-[#fcf9f8] sticky top-0 z-40 border-b border-[#e5bdbb] shadow-sm ${scrolled ? "shadow-md" : ""}`}>
        <div className="max-w-[1280px] mx-auto px-5 md:px-[64px] flex items-center justify-between h-20">
          <div className="flex items-center gap-8">
            <Link href="/" className="font-black tracking-tighter leading-none text-[#9e001f]" style={{ fontFamily: "Montserrat, sans-serif", fontSize: "2.2rem" }}>Envol Africa</Link>
            <nav className="hidden lg:flex items-center gap-6 text-[14px] text-[#5c403f]" style={{ fontFamily: "Inter, sans-serif" }}>
              {mainNav.map(m=>(
                <Link key={m.name} href={m.href} className="hover:text-[#9e001f] transition-colors font-medium">{m.name}</Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1 border-r border-[#e5bdbb] pr-4 text-[#5f5e5e]">
              <Link href="/panier" className="relative hover:text-[#9e001f] p-1.5">
                <span className="material-symbols-outlined">shopping_cart</span>
                {cartCount>0 && <span className="absolute -top-1 -right-1 bg-[#9e001f] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{cartCount}</span>}
              </Link>
              <button className="hover:text-[#9e001f] p-1.5"><span className="material-symbols-outlined">notifications</span></button>
              <Link href="/service" className="hover:text-[#9e001f] p-1.5"><span className="material-symbols-outlined">mail</span></Link>
              <Link href="/compte/favoris" className="hover:text-[#9e001f] p-1.5"><span className="material-symbols-outlined">favorite</span></Link>
              <button onClick={()=>setShowSearch(!showSearch)} className="hover:text-[#9e001f] p-1.5"><span className="material-symbols-outlined">search</span></button>
            </div>

            <div className="hidden lg:flex items-center gap-2">
              {user ? (
                <Link href="/compte" className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-[#303030] text-white text-[13px] font-medium">
                  <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[11px] font-bold">{user.prenom?.[0]}</span>
                  <span className="max-w-[80px] truncate">{user.prenom}</span>
                </Link>
              ) : (
                <>
                  <Link href="/auth/login" className="text-[12px] font-semibold px-4 py-2 hover:bg-[#f0eded] rounded transition-colors">SE CONNECTER</Link>
                  <Link href="/abonnement" className="text-[12px] font-semibold px-4 py-2 bg-[#9e001f] text-white hover:bg-[#c8102e] rounded shadow-md active:scale-95 transition-all">S'ABONNER</Link>
                  <Link href="/don" className="text-[12px] font-semibold px-4 py-2 border-2 border-[#9e001f] text-[#9e001f] hover:bg-[#9e001f] hover:text-white rounded transition-all">FAIRE UN DON</Link>
                </>
              )}
            </div>

            <button onClick={()=>setMobileMenuOpen(!mobileMenuOpen)} className="p-2 ml-2 hover:bg-[#f0eded] rounded-full lg:hidden">
              <span className="material-symbols-outlined">{mobileMenuOpen?"close":"menu"}</span>
            </button>
          </div>
        </div>

        {showSearch && (
          <div className="border-t border-[#e5bdbb] bg-white p-4">
            <div className="max-w-[720px] mx-auto">
              <form onSubmit={doSearch} className="flex gap-2">
                <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Rechercher articles, magazines..." className="flex-1 h-11 rounded-lg border border-[#e5bdbb] bg-[#f6f3f2] px-4 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#9e001f]" />
                <button type="submit" className="h-11 px-6 rounded-lg bg-[#9e001f] text-white font-bold text-[13px]">Rechercher</button>
                <button type="button" onClick={()=>setShowSearch(false)} className="h-11 w-11 rounded-full border flex items-center justify-center">×</button>
              </form>
              {searchResults && (
                <div className="mt-4 bg-white rounded-[12px] border p-4 max-h-[60vh] overflow-y-auto">
                  <div className="text-[11px] font-bold uppercase text-[#5c403f]">{searchResults.articles?.length} articles • {searchResults.magazines?.length} magazines</div>
                  <div className="mt-3 space-y-2">
                    {searchResults.articles?.slice(0,5).map((a:any)=>(
                      <Link key={a.id} href={`/article/${a.slug}`} onClick={()=>setShowSearch(false)} className="flex gap-3 p-2 rounded hover:bg-[#f6f3f2]">
                        <img src={a.image} alt="" className="w-16 h-16 rounded object-cover" />
                        <div><div className="font-bold text-[13px]">{a.title}</div><div className="text-[11px] text-[#5c403f]">{a.category}</div></div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#e5bdbb] bg-white">
            <div className="px-5 py-6 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {topLinks.map(l=>(
                  <Link key={l.name} href={l.href} onClick={()=>setMobileMenuOpen(false)} className="p-3 rounded-xl border bg-[#f6f3f2] text-[13px] font-medium flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">{l.icon}</span>{l.name}</Link>
                ))}
              </div>
              <div className="flex gap-2">
                <Link href="/auth/login" onClick={()=>setMobileMenuOpen(false)} className="flex-1 py-3 rounded-full border text-center text-[14px] font-medium">Connexion</Link>
                <Link href="/auth/register" onClick={()=>setMobileMenuOpen(false)} className="flex-1 py-3 rounded-full bg-[#9e001f] text-white text-center text-[14px] font-bold">S'inscrire</Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* TICKER BAR */}
      <section className="bg-[#f6f3f2] border-b border-[#e5bdbb] py-2 overflow-hidden flex items-center">
        <div className="px-5 md:px-[64px] flex items-center w-full">
          <span className="bg-[#9e001f] text-white text-[12px] px-3 py-1 mr-4 shrink-0 font-bold tracking-wider">À LA UNE</span>
          <div className="w-full overflow-hidden">
            <p className="scrolling-ticker text-[#5c403f] text-[13px]" style={{ fontFamily: "Inter, sans-serif" }}>
              • Transition énergétique au Nigeria : investissement record 12M$ • Sommet UA : accords libre-échange ratifiés • PIB continental : prévisions 2025 • Fintech Kenya : rapport inclusion financière • ZLECAf : 1,3Md consommateurs • Cacao ivoirien : 50% transformation locale
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
