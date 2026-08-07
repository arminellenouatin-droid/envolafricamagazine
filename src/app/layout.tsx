import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { readDB } from "@/lib/db";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Envol Africa Magazine | Le magazine économique panafricain de référence",
  description: "Envol Africa Magazine est le futur site de presse économique consacré à l'Afrique. Analyses, enquêtes exclusives, Kiosque, abonnements, financement, emploi. Afrique qui gagne.",
};

async function getUserFromCookie() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("eam_token")?.value;
    if (!token) return null;
    const decoded = verifyToken(token);
    if (!decoded) return null;
    const db = readDB();
    return db.users.find(u=>u.id===decoded.id) || null;
  } catch {
    return null;
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getUserFromCookie();
  return (
    <html lang="fr" className="h-full antialiased">
      <head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@400;600;700&display=swap');
          :root {
            --font-geist-sans: 'Inter', system-ui, sans-serif;
            --font-playfair: 'Playfair Display', Georgia, serif;
          }
        `}</style>
      </head>
      <body className="min-h-full flex flex-col bg-[#FFFCF5]" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
        <Header user={user ? { id: user.id, nom: user.nom, prenom: user.prenom, email: user.email, role: user.role } : undefined} />
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
