import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/HeaderShell";
import Footer from "@/components/FooterShell";
import { getCurrentUserFromCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Envol Africa Magazine | Le magazine économique panafricain de référence",
  description: "Envol Africa Magazine est le futur site de presse économique consacré à l'Afrique. Analyses, enquêtes exclusives, Kiosque, abonnements, financement, emploi. Afrique qui gagne.",
};

async function getUserFromCookie() {
  try {
    return await getCurrentUserFromCookie();
  } catch {
    return null;
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getUserFromCookie();
  return (
    <html lang="fr" className="h-full antialiased">
      <script dangerouslySetInnerHTML={{ __html: `
        (function(){
          try {
            if (localStorage.getItem('eam_dark_mode') === 'dark') document.documentElement.classList.add('dark');
          } catch {}
        })();
      ` }} />
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&family=Inter:wght@400;500;600;700&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <style>{`
          .material-symbols-outlined {
            font-family: 'Material Symbols Outlined';
            font-weight: normal;
            font-style: normal;
            font-size: 24px;
            line-height: 1;
            letter-spacing: normal;
            text-transform: none;
            display: inline-block;
            white-space: nowrap;
            word-wrap: normal;
            direction: ltr;
            -webkit-font-feature-settings: 'liga';
            -webkit-font-smoothing: antialiased;
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
            vertical-align: middle;
          }
          :root {
            --font-geist-sans: 'Inter', system-ui, sans-serif;
            --font-playfair: 'Source Serif 4', Georgia, serif;
            --font-display: 'Montserrat', sans-serif;
          }
        `}</style>
      </head>
      <body className="min-h-full flex flex-col bg-[#fcf9f8]" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>
        <Header user={user ? { id: user.id, nom: user.nom, prenom: user.prenom, email: user.email, role: user.role, avatar: user.avatar } : undefined} />
        <main className="flex-1">{children}</main>
        <Footer />
        <script dangerouslySetInnerHTML={{__html: `
          (function(){
            try {
              const params = new URLSearchParams(window.location.search);
              const ref = params.get('ref') || params.get('affiliate') || params.get('parrain');
              if (ref) {
                localStorage.setItem('eam_affiliate', ref);
                document.cookie = 'eam_affiliate=' + ref + '; path=/; max-age=' + (30*24*60*60);
                fetch('/api/affiliate', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({code: ref})}).catch(()=>{});
              }
            } catch {}
          })();
        `}} />
      </body>
    </html>
  );
}
