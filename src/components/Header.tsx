"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Première ligne : 8 menus
const firstLineMenus = [
  { name: "S'abonner", href: "/abonnement", icon: "stars" },
  { name: "Kiosque", href: "/kiosque", icon: "menu_book" },
  { name: "Jobs", href: "/emploi", icon: "work" },
  { name: "Marketplace", href: "/marketplace", icon: "storefront" },
  { name: "Crowdfunding", href: "/financement", icon: "volunteer_activism" },
  { name: "Africa Awards", href: "/africa-awards", icon: "emoji_events" },
  { name: "Salons", href: "/salons", icon: "event_seat" },
  { name: "World Africa Business", href: "/wab", icon: "public" },
];

// Menu déroulant 8 items
const dropdownMenus = [
  { name: "Envol Africa Magazine", href: "/" },
  { name: "Kiosque", href: "/kiosque" },
  { name: "Jobs", href: "/emploi" },
  { name: "Marketplace", href: "/marketplace" },
  { name: "Crowdfunding", href: "/financement" },
  { name: "Africa Awards", href: "/africa-awards" },
  { name: "Salons", href: "/salons" },
  { name: "World Africa Business", href: "/wab" },
];

// Liens panneau latéral droit
const sidePanelLinks = [
  { name: "Montage de plan d'affaires", href: "https://envolafrica.net/" },
  { name: "Conseils et externalisation", href: "https://envolafrica.net/" },
  { name: "Recrutement", href: "https://envolafrica.net/" },
  { name: "Formation et recyclage", href: "https://envolafrica.net/" },
  { name: "Levée de fonds", href: "https://envolafrica.net/" },
  { name: "Services digitaux", href: "https://envolafrica.net/" },
  { name: "Marketing et stratégie de vente", href: "https://envolafrica.net/" },
  { name: "Audit de gestion", href: "https://envolafrica.net/" },
  { name: "Gestion de projet", href: "https://envolafrica.net/" },
  { name: "Courtage", href: "https://envolafrica.net/" },
];

export default function Header({ user }: { user?: any }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const pathname = usePathname();

  useEffect(() => {
    const saved = localStorage.getItem("eam_cart");
    if (saved) { try { setCartCount(JSON.parse(saved).length); } catch {} }
    const interval = setInterval(() => {
      const s = localStorage.getItem("eam_cart");
      if (s) { try { setCartCount(JSON.parse(s).length); } catch {} }
    }, 1000);
    return () => clearInterval(interval);
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
      {/* ===== DESKTOP HEADER ===== */}
      <div className="hidden md:block">
        {/* Première ligne */}
        <nav className="bg-[#303030] text-white py-2 px-5 lg:px-[64px] flex justify-between items-center z-50 border-b border-white/10">
          <div className="flex items-center gap-5 text-[12px] font-medium">
            {firstLineMenus.map(m=>(
              <Link key={m.name} href={m.href} className="hover:text-[#ffdad8] flex items-center gap-1.5 transition-colors">
                <span className="material-symbols-outlined text-[16px]">{m.icon}</span> {m.name}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {/* Juste icones Traduction, devise */}
            <button className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center" title="Traduction"><span className="material-symbols-outlined text-[18px]">translate</span></button>
            <button className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center" title="Devise"><span className="material-symbols-outlined text-[18px]">payments</span></button>
          </div>
        </nav>

        {/* Deuxième ligne - sticky */}
        <header className="bg-[#fcf9f8] sticky top-0 z-40 border-b border-[#e5bdbb] shadow-sm">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-[64px] flex items-center justify-between h-[76px]">
            {/* Logo + Dropdown */}
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2">
                <img src="/logo-couleur-entete.png" alt="Envol Africa" className="h-[48px] w-auto object-contain hidden lg:block" />
                <span className="font-black tracking-tighter text-[#9e001f] text-[24px] lg:hidden" style={{ fontFamily: "Montserrat" }}>Envol Africa</span>
              </Link>

              {/* Menu déroulant */}
              <div className="relative">
                <button onClick={()=>setDropdownOpen(!dropdownOpen)} className="flex items-center gap-1 text-[13px] font-semibold px-3 py-2 rounded hover:bg-[#f0eded] transition-colors">
                  Menu <span className="material-symbols-outlined text-[18px]">expand_more</span>
                </button>
                {dropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-[#e5bdbb] rounded-xl shadow-xl p-2 z-50">
                    {dropdownMenus.map(m=>(
                      <Link key={m.name} href={m.href} onClick={()=>setDropdownOpen(false)} className="block px-4 py-2.5 text-[13px] rounded-lg hover:bg-[#f6f3f2] hover:text-[#9e001f] transition-colors">{m.name}</Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Mega menu Nouveau numéro */}
              <div className="relative">
                <button onClick={()=>setMegaMenuOpen(!megaMenuOpen)} onMouseEnter={()=>setMegaMenuOpen(true)} className="flex items-center gap-1 text-[13px] font-bold px-4 py-2 rounded-full bg-[#9e001f] text-white hover:bg-[#c8102e] transition-colors">
                  Nouveau numéro <span className="material-symbols-outlined text-[18px]">expand_more</span>
                </button>
                {megaMenuOpen && (
                  <div onMouseLeave={()=>setMegaMenuOpen(false)} className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-[960px] bg-white border border-[#e5bdbb] rounded-2xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-[16px]">Nouveau numéro - N°25 Spécial Investissements 2026</h3>
                        <button onClick={()=>setMegaMenuOpen(false)} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">×</button>
                      </div>
                      <div className="grid grid-cols-12 gap-6">
                        {/* Carousel 3 articles vedette */}
                        <div className="col-span-8">
                          <div className="grid grid-cols-3 gap-4">
                            {[1,2,3].map(i=>(
                              <Link key={i} href="/kiosque" className="group">
                                <div className="aspect-[4/3] rounded-lg overflow-hidden bg-[#eae7e7]"><img src={`https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=300`} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" /></div>
                                <div className="mt-2 text-[11px] font-bold uppercase text-[#9e001f]">Économie • Vedette {i}</div>
                                <div className="text-[13px] font-semibold leading-tight mt-1 line-clamp-2">ZLECAf : le grand tournant de l'intégration africaine {i}</div>
                              </Link>
                            ))}
                          </div>
                          <div className="mt-6 flex items-center justify-between border-t border-[#e5bdbb] pt-4">
                            <div className="flex gap-2 text-[11px]">
                              <span className="px-2 py-1 rounded-full bg-[#f0eded]">Economie</span>
                              <span className="px-2 py-1 rounded-full bg-[#f0eded]">Finance</span>
                              <span className="px-2 py-1 rounded-full bg-[#f0eded]">Tech</span>
                              <Link href="/kiosque" className="text-[#9e001f] font-bold hover:underline">Voir plus →</Link>
                            </div>
                            <Link href="/kiosque" className="h-9 px-5 rounded-full bg-[#0A1931] text-white text-[12px] font-bold">Acheter ce numéro →</Link>
                          </div>
                        </div>
                        {/* Vignettes verticales 3 articles */}
                        <div className="col-span-4 space-y-3">
                          {[1,2,3].map(i=>(
                            <Link key={i} href="/article" className="flex gap-3 p-2 rounded-lg hover:bg-[#f6f3f2]">
                              <img src={`https://images.unsplash.com/photo-1497366811353-524cc3f3968e?w=100`} alt="" className="w-16 h-16 rounded object-cover" />
                              <div><div className="text-[11px] font-bold text-[#9e001f] uppercase">Finance</div><div className="text-[12px] font-semibold leading-tight line-clamp-2">Obligations vertes : Sénégal terrain favori {i}</div></div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 5 icônes + 3 boutons + menu réduit */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 border-r border-[#e5bdbb] pr-3">
                <Link href="/panier" className="relative w-9 h-9 rounded-full bg-[#f6f3f2] hover:bg-[#e5bdbb] flex items-center justify-center"><span className="material-symbols-outlined text-[20px]">shopping_cart</span>{cartCount>0 && <span className="absolute -top-1 -right-1 bg-[#9e001f] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">{cartCount}</span>}</Link>
                <button className="w-9 h-9 rounded-full bg-[#f6f3f2] hover:bg-[#e5bdbb] flex items-center justify-center"><span className="material-symbols-outlined text-[20px]">notifications</span></button>
                <Link href="/service" className="w-9 h-9 rounded-full bg-[#f6f3f2] hover:bg-[#e5bdbb] flex items-center justify-center"><span className="material-symbols-outlined text-[20px]">mail</span></Link>
                <Link href="/compte/favoris" className="w-9 h-9 rounded-full bg-[#f6f3f2] hover:bg-[#e5bdbb] flex items-center justify-center"><span className="material-symbols-outlined text-[20px]">favorite</span></Link>
                <button onClick={()=>setShowSearch(!showSearch)} className="w-9 h-9 rounded-full bg-[#f6f3f2] hover:bg-[#e5bdbb] flex items-center justify-center"><span className="material-symbols-outlined text-[20px]">search</span></button>
              </div>
              <div className="flex items-center gap-2">
                {user ? (
                  <Link href="/compte" className="px-3 py-2 rounded-full bg-[#303030] text-white text-[12px] font-medium flex items-center gap-1"><span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">{user.prenom?.[0]}</span>{user.prenom}</Link>
                ) : (
                  <>
                    <Link href="/auth/login" className="text-[12px] font-semibold px-3 py-2 hover:bg-[#f0eded] rounded">Se connecter</Link>
                    <Link href="/abonnement" className="text-[12px] font-bold px-4 py-2 bg-[#303030] text-white rounded hover:bg-black">S'abonner</Link>
                    <Link href="/don" className="text-[12px] font-bold px-4 py-2 border-2 border-[#9e001f] text-[#9e001f] rounded hover:bg-[#9e001f] hover:text-white">Faire un don</Link>
                  </>
                )}
              </div>
              <button onClick={()=>setSideMenuOpen(true)} className="ml-2 w-10 h-10 rounded-full bg-[#303030] text-white flex items-center justify-center hover:bg-black"><span className="material-symbols-outlined">menu</span></button>
            </div>
          </div>

          {showSearch && (
            <div className="border-t border-[#e5bdbb] bg-white p-4">
              <div className="max-w-[720px] mx-auto flex gap-2">
                <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Rechercher..." className="flex-1 h-11 rounded-lg border bg-[#f6f3f2] px-4" />
                <button onClick={(e)=>{e.preventDefault(); if(searchQuery) window.location.href=`/?q=${searchQuery}`}} className="h-11 px-6 rounded-lg bg-[#9e001f] text-white font-bold">Rechercher</button>
                <button onClick={()=>setShowSearch(false)} className="h-11 w-11 rounded-full border flex items-center justify-center">×</button>
              </div>
            </div>
          )}
        </header>

        {/* Ticker */}
        <section className="bg-[#f6f3f2] border-b border-[#e5bdbb] py-2 overflow-hidden flex items-center">
          <div className="px-[64px] flex items-center w-full">
            <span className="bg-[#9e001f] text-white text-[12px] px-3 py-1 mr-4 shrink-0 font-bold">À LA UNE</span>
            <div className="w-full overflow-hidden"><p className="scrolling-ticker text-[#5c403f] text-[13px]">• Transition énergétique Nigeria 12M$ • Sommet UA libre-échange • PIB continental prévisions 2025 • Fintech Kenya • ZLECAf 1,3Md • Cacao 50% transformation locale</p></div>
          </div>
        </section>
      </div>

      {/* ===== MOBILE HEADER ===== */}
      <div className="md:hidden">
        {/* Première ligne fixe au scroll mobile */}
        <div className="fixed top-0 inset-x-0 z-50 bg-[#fcf9f8] border-b border-[#e5bdbb] flex items-center justify-around py-2 px-2">
          {[
            { icon:"live_tv", label:"Live", href:"/" },
            { icon:"shopping_cart", label:"Panier", href:"/panier", count: cartCount },
            { icon:"favorite", label:"Favoris", href:"/compte/favoris" },
            { icon:"mail", label:"Message", href:"/service" },
            { icon:"notifications", label:"Notif", href:"/compte" },
            { icon:"translate", label:"Trad", href:"#", action:()=>{} },
            { icon:"person", label:"Profil", href:"/compte" },
          ].map(item=>(
            <Link key={item.label} href={item.href} className="flex flex-col items-center gap-0.5">
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span className="text-[9px] font-medium">{item.label}</span>
              {item.count ? <span className="absolute bg-[#9e001f] text-white text-[8px] w-3 h-3 rounded-full flex items-center justify-center -mt-8 ml-4">{item.count}</span> : null}
            </Link>
          ))}
        </div>

        {/* Deuxième ligne */}
        <div className="pt-[56px]">
          <header className="bg-[#fcf9f8] border-b border-[#e5bdbb] flex items-center justify-between px-4 h-[56px]">
            <div className="flex items-center gap-3">
              <img src="/logo-couleur-entete.png" alt="EAM" className="h-8 w-auto" />
              <div className="relative">
                <button onClick={()=>setDropdownOpen(!dropdownOpen)} className="flex items-center gap-1 text-[12px] font-semibold">Menu <span className="material-symbols-outlined text-[16px]">expand_more</span></button>
                {dropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white border rounded-xl shadow-xl p-2 z-50">
                    {dropdownMenus.map(m=><Link key={m.name} href={m.href} onClick={()=>setDropdownOpen(false)} className="block px-3 py-2 text-[13px] hover:bg-[#f6f3f2] rounded">{m.name}</Link>)}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={()=>setShowSearch(!showSearch)} className="w-9 h-9 rounded-full bg-[#f6f3f2] flex items-center justify-center"><span className="material-symbols-outlined">search</span></button>
              <button onClick={()=>setSideMenuOpen(true)} className="w-9 h-9 rounded-full bg-[#303030] text-white flex items-center justify-center"><span className="material-symbols-outlined">menu</span></button>
            </div>
          </header>

          {showSearch && (
            <div className="bg-white p-4 border-b">
              <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Rechercher..." className="w-full h-11 rounded-lg border bg-[#f6f3f2] px-4" />
            </div>
          )}
        </div>

        {/* Bottom bar fixe */}
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-[#e5bdbb] px-2 py-2">
          <div className="flex items-center justify-around">
            {[
              { name:"Accueil", href:"/", icon:"home" },
              { name:"Kiosque", href:"/kiosque", icon:"menu_book" },
              { name:"Jobs", href:"/emploi", icon:"work" },
              { name:"Crowdfunding", href:"/financement", icon:"volunteer_activism" },
              { name:"Marketplace", href:"/marketplace", icon:"storefront" },
              { name:"Awards", href:"/africa-awards", icon:"emoji_events" },
              { name:"WAB", href:"/wab", icon:"public" },
            ].map(item=>(
              <Link key={item.name} href={item.href} className={`flex flex-col items-center gap-1 ${pathname===item.href?"text-[#9e001f]":"text-[#5c403f]"}`}>
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span className="text-[9px] font-medium">{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Menu latéral droit - Desktop + Mobile */}
      {sideMenuOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setSideMenuOpen(false)}></div>
          <div className={`bg-white w-[360px] md:w-[420px] h-full overflow-y-auto shadow-2xl p-6 ${/* full screen on mobile */ ""} md:relative fixed inset-0 md:inset-auto md:ml-auto`}>
            <div className="flex items-center justify-between mb-6">
              <img src="/logo-couleur-entete.png" alt="Envol Africa Magazine" className="h-12 w-auto" />
              <button onClick={()=>setSideMenuOpen(false)} className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center">×</button>
            </div>
            <p className="text-[13px] leading-6 text-[#5c403f]">Une chaine regroupant toutes les valeurs pour votre succès en entreprises. Plus qu'un magazine, c'est le seul outil qui vous apporte tout pour réussir en affaires et prospérer à tout égard.</p>
            <Link href="/don" onClick={()=>setSideMenuOpen(false)} className="mt-6 w-full h-11 rounded-full bg-[#9e001f] text-white font-bold text-[13px] flex items-center justify-center">Soutenir ENVOL AFRICA</Link>
            
            <div className="mt-8 space-y-1">
              {sidePanelLinks.map(l=>(
                <a key={l.name} href={l.href} target="_blank" className="block py-2.5 px-3 rounded-lg hover:bg-[#f6f3f2] text-[13px] flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#9e001f]"></span>{l.name}</a>
              ))}
            </div>

            <div className="mt-8 rounded-[16px] bg-[#f0eded] border border-[#e5bdbb] p-5">
              <h4 className="font-bold text-[16px]" style={{ fontFamily: "Montserrat" }}>Osez la réussite! Lisez Envol Africa Magazine</h4>
              <p className="text-[13px] text-[#5c403f] mt-2 leading-5">Plus qu'un magazine, c'est le seul outil qui vous apporte tout pour réussir en affaires et prospérer à tout égard</p>
              <Link href="/abonnement" onClick={()=>setSideMenuOpen(false)} className="mt-4 w-full h-10 rounded-full bg-[#303030] text-white font-bold text-[12px] flex items-center justify-center">S'abonner</Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
