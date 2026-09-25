import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import Header from "@/components/HeaderShell";
import Footer from "@/components/FooterShell";
import PromoPopup from "@/components/PromoPopup";
import { LocaleProvider } from "@/components/LocaleProvider";
import AutoTranslator from "@/components/AutoTranslator";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getOrganizationSchema, getWebSiteSchema } from "@/lib/schema-org";
import GoogleOneTapPrompt from "@/components/GoogleOneTapPrompt";
import AssistanceChatWidget from "@/components/AssistanceChatWidget";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || "https://www.envolafrica.site";
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-SPMNFS3PD4";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },
  title: {
    default: "Envol Africa Magazine | Le magazine économique panafricain de référence",
    template: "%s | Envol Africa",
  },
  description: "Envol Africa Magazine est la plateforme de référence consacrée à l'économie et aux opportunités en Afrique : actualités, analyses exclusives, Kiosque numérique, Marketplace panafricaine, emploi et financement.",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "/",
    siteName: "Envol Africa",
    title: "Envol Africa Magazine | Le magazine économique panafricain de référence",
    description: "Analyses exclusives, enquêtes économiques, Kiosque numérique, Marketplace et opportunités panafricaines.",
    images: [
      {
        url: `${SITE_URL}/logo-couleur-entete-new.png`,
        width: 1200,
        height: 630,
        alt: "Envol Africa Magazine",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Envol Africa Magazine",
    description: "Le magazine économique panafricain de référence.",
    images: [
      {
        url: `${SITE_URL}/logo-couleur-entete-new.png`,
        width: 1200,
        height: 630,
        alt: "Envol Africa Magazine",
      },
    ],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/logo-reduit.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
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
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.getRegistrations().then(function(registrations) {
                registrations.forEach(function(reg) {
                  reg.update().catch(function(){});
                });
              }).catch(function(){});
            }
          } catch {}
        })();
      ` }} />
      <head>
        {/* Google tag (gtag.js) */}
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('consent', 'default', {
                'analytics_storage': 'denied',
                'ad_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied',
                'wait_for_update': 500
              });
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}');
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(getOrganizationSchema()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(getWebSiteSchema()) }}
        />
        <link rel="alternate" type="application/rss+xml" title="Flux RSS - Envol Africa Magazine" href="/feed.xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block" rel="stylesheet" />
        <style>{`
          .material-symbols-outlined {
            font-family: 'Material Symbols Outlined';
            font-weight: normal;
            font-style: normal;
            font-size: 24px;
            line-height: 1;
            letter-spacing: normal;
            text-transform: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 1em;
            height: 1em;
            overflow: hidden;
            white-space: nowrap;
            word-wrap: normal;
            direction: ltr;
            -webkit-font-feature-settings: 'liga';
            -webkit-font-smoothing: antialiased;
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
            vertical-align: middle;
            user-select: none;
          }
          :root {
            --font-geist-sans: 'Inter', system-ui, sans-serif;
            --font-playfair: 'Source Serif 4', Georgia, serif;
            --font-display: 'Montserrat', sans-serif;
          }
        `}</style>
      </head>
      <body className="min-h-full flex flex-col bg-[#fcf9f8]" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>
        <LocaleProvider>
          <AutoTranslator />
          <Header user={user ? { id: user.id, nom: user.nom, prenom: user.prenom, email: user.email, role: user.role, avatar: user.avatar } : undefined} />
          <PromoPopup />
          <CookieConsentBanner />
          <main className="flex-1">{children}</main>
          <Footer />
          <GoogleOneTapPrompt user={user ? { id: user.id } : null} />
          <AssistanceChatWidget />
        </LocaleProvider>
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
