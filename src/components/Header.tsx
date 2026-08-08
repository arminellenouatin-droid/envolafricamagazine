"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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

const platformMap: Record<string, string> = {
  "/": "Envol Africa Magazine",
  "/kiosque": "Kiosque",
  "/emploi": "Jobs",
  "/marketplace": "Marketplace",
  "/financement": "Crowdfunding",
  "/africa-awards": "Africa Awards",
  "/salons": "Salons",
  "/wab": "World Africa Business",
  "/abonnement": "Envol Africa Magazine",
  "/article": "Envol Africa Magazine",
  "/panier": "Kiosque",
  "/don": "Envol Africa Magazine",
  "/affiliation": "Envol Africa Magazine",
  "/service": "Envol Africa Magazine",
  "/compte": "Envol Africa Magazine",
  "/admin": "Envol Africa Magazine",
};

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
  const [darkMode, setDarkMode] = useState(false);
  const [cityWeather, setCityWeather] = useState<{ city: string, temp: string, icon: string }>({ city: "Cotonou", temp: "28°C", icon: "⛅" });
  const pathname = usePathname();

  const getCurrentPlatform = () => {
    if (pathname.startsWith("/kiosque")) return "Kiosque";
    if (pathname.startsWith("/emploi")) return "Jobs";
    if (pathname.startsWith("/marketplace")) return "Marketplace";
    if (pathname.startsWith("/financement")) return "Crowdfunding";
    if (pathname.startsWith("/africa-awards")) return "Africa Awards";
    if (pathname.startsWith("/salons")) return "Salons";
    if (pathname.startsWith("/wab")) return "World Africa Business";
    if (pathname.startsWith("/article")) return "Envol Africa Magazine";
    if (pathname.startsWith("/abonnement")) return "Envol Africa Magazine";
    if (pathname.startsWith("/panier")) return "Kiosque";
    if (pathname.startsWith("/don")) return "Envol Africa Magazine";
    if (pathname.startsWith("/affiliation")) return "Envol Africa Magazine";
    if (pathname.startsWith("/service")) return "Envol Africa Magazine";
    if (pathname.startsWith("/compte")) return "Envol Africa Magazine";
    if (pathname.startsWith("/admin")) return "Envol Africa Magazine";
    return "Envol Africa Magazine";
  };

  useEffect(() => {
    const saved = localStorage.getItem("eam_cart");
    if (saved) { try { setCartCount(JSON.parse(saved).length); } catch {} }
    const interval = setInterval(() => {
      const s = localStorage.getItem("eam_cart");
      if (s) { try { setCartCount(JSON.parse(s).length); } catch {} }
    }, 1000);

    // Mode sombre/clair
    const savedMode = localStorage.getItem("eam_dark_mode");
    if (savedMode === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }

    // Ville + météo automatique
    const fetchWeather = async () => {
      try {
        // Essai IP geolocation via ipapi.co (gratuit)
        const ipRes = await fetch("https://ipapi.co/json/").then(r=>r.json()).catch(()=>null);
        if (ipRes && ipRes.city) {
          setCityWeather({ city: ipRes.city, temp: "28°C", icon: "⛅" });
          // Optionnel: fetch météo réelle via open-meteo
          // const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${ipRes.latitude}&longitude=${ipRes.longitude}&current_weather=true`).then(r=>r.json());
          // if (weatherRes.current_weather) setCityWeather(prev=>({...prev, temp: Math.round(weatherRes.current_weather.temperature)+"°C"}));
        } else {
          // Fallback géolocalisation navigateur
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos)=>{
              setCityWeather({ city: "Cotonou", temp: "28°C", icon: "🌤️" });
            }, ()=>{});
          }
        }
      } catch {}
    };
    fetchWeather();

    return () => clearInterval(interval);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("eam_dark_mode", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("eam_dark_mode", "light");
    }
  };

  return (
    <>
      {/* ===== DESKTOP HEADER - PREMIÈRE LIGNE - Century Gothic ===== */}
      <nav className="bg-[#303030] text-white py-2 px-5 lg:px-[64px] hidden md:flex justify-between items-center z-50 border-b border-white/10" style={{ fontFamily: "Century Gothic, Inter, sans-serif" }}>
        <div className="flex items-center gap-5 text-[12px] font-medium">
          {firstLineMenus.map(m=>(
            <Link key={m.name} href={m.href} className="hover:text-[#ffdad8] flex items-center gap-1.5 transition-colors" style={{ fontFamily: "Century Gothic, sans-serif" }}>
              <span className="material-symbols-outlined text-[16px]">{m.icon}</span> {m.name}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center" title="Traduction"><span className="material-symbols-outlined text-[18px]">translate</span></button>
          <button className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center" title="Devise"><span className="material-symbols-outlined text-[18px]">payments</span></button>
          <button onClick={toggleDarkMode} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center" title={darkMode?"Mode clair":"Mode sombre"}>
            <span className="material-symbols-outlined text-[18px]">{darkMode?"light_mode":"dark_mode"}</span>
          </button>
        </div>
      </nav>

      {/* DEUXIÈME LIGNE - STICKY - LOGO + DROPDOWN PLATEFORME EN GRAS + MEGA MENU + 5 ICONES + 3 BOUTONS + MENU RÉDUIT */}
      <header className="bg-[#fcf9f8] sticky top-0 z-40 border-b border-[#e5bdbb] shadow-sm">
        <div className="max-w-[1280px] mx-auto px-5 lg:px-[64px] flex items-center justify-between h-[76px]">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo-couleur-entete.png" alt="Envol Africa" className="h-[48px] w-auto object-contain hidden lg:block" />
              <span className="font-black tracking-tighter text-[#9e001f] text-[24px] lg:hidden" style={{ fontFamily: "Montserrat" }}>Envol Africa</span>
            </Link>

            {/* Menu déroulant plateforme - affiche nom plateforme en gras au lieu de "menu" */}
            <div className="relative hidden lg:block">
              <button onClick={()=>setDropdownOpen(!dropdownOpen)} className="flex items-center gap-1 text-[14px] font-black px-3 py-2 rounded hover:bg-[#f0eded] transition-colors" style={{ fontFamily: "Century Gothic, sans-serif" }}>
                {getCurrentPlatform()} <span className="material-symbols-outlined text-[18px]">expand_more</span>
              </button>
              {dropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-[#e5bdbb] rounded-xl shadow-xl p-2 z-50">
                  {dropdownMenus.map(m=>(
                    <Link key={m.name} href={m.href} onClick={()=>setDropdownOpen(false)} className={`block px-4 py-2.5 text-[13px] rounded-lg hover:bg-[#f6f3f2] hover:text-[#9e001f] transition-colors ${getCurrentPlatform()===m.name?"bg-[#f0eded] font-bold text-[#9e001f]":""}`}>{m.name}</Link>
                  ))}
                </div>
              )}
            </div>

            {/* Méga menu Nouveau numéro - luxueux */}
            <div className="relative hidden lg:block">
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
                      <div className="col-span-8">
                        <div className="grid grid-cols-3 gap-4">
                          {[1,2,3].map(i=>(
                            <Link key={i} href="/kiosque" className="group">
                              <div className="aspect-[4/3] rounded-lg overflow-hidden bg-[#eae7e7]"><img src={`https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=300`} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" /></div>
                              <div className="mt-2 text-[11px] font-bold uppercase text-[#9e001f]">Économie • Vedette {i}</div>
                              <div className="text-[13px] font-semibold leading-tight mt-1 line-clamp-2">ZLECAf : le grand tournant {i}</div>
                            </Link>
                          ))}
                        </div>
                        <div className="mt-6 flex items-center justify-between border-t border-[#e5bdbb] pt-4">
                          <div className="flex gap-2 text-[11px]"><span className="px-2 py-1 rounded-full bg-[#f0eded]">Economie</span><span className="px-2 py-1 rounded-full bg-[#f0eded]">Finance</span><span className="px-2 py-1 rounded-full bg-[#f0eded]">Tech</span><Link href="/kiosque" className="text-[#9e001f] font-bold hover:underline">Voir plus →</Link></div>
                          <Link href="/kiosque" className="h-9 px-5 rounded-full bg-[#0A1931] text-white text-[12px] font-bold">Acheter ce numéro →</Link>
                        </div>
                      </div>
                      <div className="col-span-4 space-y-3">
                        {[1,2,3].map(i=>(
                          <Link key={i} href="/article" className="flex gap-3 p-2 rounded-lg hover:bg-[#f6f3f2]">
                            <img src={`https://images.unsplash.com/photo-1497366811353-524cc3f3968e?w=100`} alt="" className="w-16 h-16 rounded object-cover" />
                            <div><div className="text-[11px] font-bold text-[#9e001f] uppercase">Finance</div><div className="text-[12px] font-semibold leading-tight line-clamp-2">Obligations vertes : Sénégal {i}</div></div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-1 border-r border-[#e5bdbb] pr-3">
              <Link href="/panier" className="relative w-9 h-9 rounded-full bg-[#f6f3f2] hover:bg-[#e5bdbb] flex items-center justify-center"><span className="material-symbols-outlined text-[20px]">shopping_cart</span></Link>
              <button className="w-9 h-9 rounded-full bg-[#f6f3f2] hover:bg-[#e5bdbb] flex items-center justify-center"><span className="material-symbols-outlined text-[20px]">notifications</span></button>
              <Link href="/service" className="w-9 h-9 rounded-full bg-[#f6f3f2] hover:bg-[#e5bdbb] flex items-center justify-center"><span className="material-symbols-outlined text-[20px]">mail</span></Link>
              <Link href="/compte/favoris" className="w-9 h-9 rounded-full bg-[#f6f3f2] hover:bg-[#e5bdbb] flex items-center justify-center"><span className="material-symbols-outlined text-[20px]">favorite</span></Link>
              <button onClick={()=>setShowSearch(!showSearch)} className="w-9 h-9 rounded-full bg-[#f6f3f2] hover:bg-[#e5bdbb] flex items-center justify-center"><span className="material-symbols-outlined text-[20px]">search</span></button>
            </div>

            <div className="hidden lg:flex items-center gap-2">
              <Link href="/auth/login" className="text-[12px] font-bold px-4 py-2 bg-[#dc2626] text-white rounded hover:bg-[#b91c1c] transition-colors">Se connecter</Link>
              <Link href="/abonnement" className="text-[12px] font-bold px-4 py-2 bg-[#303030] text-white rounded hover:bg-black">S'abonner</Link>
              <Link href="/don" className="text-[12px] font-bold px-4 py-2 bg-[#16a34a] text-white rounded hover:bg-[#15803d] transition-colors">Faire un don</Link>
            </div>

            <button onClick={()=>setSideMenuOpen(true)} className="ml-2 w-10 h-10 rounded-full bg-[#303030] text-white flex items-center justify-center hover:bg-black"><span className="material-symbols-outlined">menu</span></button>
          </div>
        </div>

        {showSearch && (
          <div className="border-t border-[#e5bdbb] bg-white p-4">
            <div className="max-w-[720px] mx-auto flex gap-2">
              <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Rechercher..." className="flex-1 h-11 rounded-lg border bg-[#f6f3f2] px-4" />
              <button onClick={()=>setShowSearch(false)} className="h-11 w-11 rounded-full border flex items-center justify-center">×</button>
            </div>
          </div>
        )}
      </header>

      {/* Troisième ligne - À la Une - fond gris clair + texte noir Century Gothic black + ville météo droite */}
      <section className="bg-[#f0eded] border-b border-[#e5bdbb] py-2 overflow-hidden hidden md:flex items-center">
        <div className="px-5 lg:px-[64px] flex items-center w-full">
          <span className="bg-[#9e001f] text-white text-[12px] px-3 py-1 mr-4 shrink-0 font-bold tracking-wider">À LA UNE</span>
          <div className="flex-1 overflow-hidden">
            <p className="scrolling-ticker text-black text-[13px] font-black" style={{ fontFamily: "Century Gothic, sans-serif", fontWeight: 900 }}>
              • Transition énergétique Nigeria 12M$ • Sommet UA libre-échange • PIB continental prévisions 2025 • Fintech Kenya • ZLECAf 1,3Md • Cacao 50% transformation locale • Wave 20M utilisateurs
            </p>
          </div>
          <div className="ml-4 flex items-center gap-2 text-[12px] font-bold text-black whitespace-nowrap" style={{ fontFamily: "Century Gothic, sans-serif" }}>
            <span className="material-symbols-outlined text-[16px]">location_on</span> {cityWeather.city} • {cityWeather.temp} {cityWeather.icon}
          </div>
        </div>
      </section>

      {/* ===== MOBILE HEADER ===== */}
      <div className="md:hidden">
        {/* Première ligne fixe */}
        <div className="fixed top-0 inset-x-0 z-50 bg-[#fcf9f8] border-b border-[#e5bdbb] flex items-center justify-around py-2 px-2">
          {[
            { icon:"live_tv", label:"Live", href:"/" },
            { icon:"shopping_cart", label:"Panier", href:"/panier" },
            { icon:"favorite", label:"Favoris", href:"/compte/favoris" },
            { icon:"mail", label:"Message", href:"/service" },
            { icon:"notifications", label:"Notif", href:"/compte" },
            { icon:"translate", label:"Trad", href:"#" },
            { icon:"person", label:"Profil", href:"/compte" },
          ].map(item=>(
            <Link key={item.label} href={item.href} className="flex flex-col items-center gap-0.5">
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span className="text-[9px] font-medium">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Deuxième ligne */}
        <div className="pt-[56px]">
          <header className="bg-[#fcf9f8] border-b border-[#e5bdbb] flex items-center justify-between px-4 h-[56px]">
            <div className="flex items-center gap-3">
              <img src="/logo-couleur-entete.png" alt="EAM" className="h-8 w-auto" />
              <div className="relative">
                <button onClick={()=>setDropdownOpen(!dropdownOpen)} className="flex items-center gap-1 text-[13px] font-black" style={{ fontFamily: "Century Gothic, sans-serif" }}>
                  {getCurrentPlatform()} <span className="material-symbols-outlined text-[16px]">expand_more</span>
                </button>
                {dropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white border rounded-xl shadow-xl p-2 z-50">
                    {dropdownMenus.map(m=><Link key={m.name} href={m.href} onClick={()=>setDropdownOpen(false)} className={`block px-3 py-2 text-[13px] rounded ${getCurrentPlatform()===m.name?"bg-[#f0eded] font-bold text-[#9e001f]":"hover:bg-[#f6f3f2]"}`}>{m.name}</Link>)}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={()=>setShowSearch(!showSearch)} className="w-9 h-9 rounded-full bg-[#f6f3f2] flex items-center justify-center"><span className="material-symbols-outlined">search</span></button>
              <button onClick={()=>setSideMenuOpen(true)} className="w-9 h-9 rounded-full bg-[#303030] text-white flex items-center justify-center"><span className="material-symbols-outlined">menu</span></button>
            </div>
          </header>

          {/* Méga menu mobile */}
          {megaMenuOpen && (
            <div className="bg-white border-b border-[#e5bdbb] p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-[14px]">Nouveau numéro - N°25</h3>
                <button onClick={()=>setMegaMenuOpen(false)} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">×</button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[1,2,3].map(i=><Link key={i} href="/kiosque" className="group"><div className="aspect-[3/4] rounded bg-[#eae7e7] overflow-hidden"><img src={`https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200`} alt="" className="w-full h-full object-cover" /></div><div className="text-[11px] font-bold mt-1">Article {i}</div></Link>)}
              </div>
              <Link href="/kiosque" className="mt-4 w-full h-10 rounded-full bg-[#0A1931] text-white text-[12px] font-bold flex items-center justify-center">Acheter ce numéro →</Link>
            </div>
          )}

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

      {/* Menu latéral droit - Desktop + Mobile full screen */}
      {sideMenuOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setSideMenuOpen(false)}></div>
          <div className="bg-white w-[360px] md:w-[420px] h-full overflow-y-auto shadow-2xl p-6 fixed inset-y-0 right-0 md:relative">
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
