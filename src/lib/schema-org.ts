/**
 * Utilitaires Schema.org JSON-LD pour Envol Africa Magazine
 * Conformes aux spécifications Google Search Central & GEO/AEO
 */

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://envolafrica.site";

export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    name: "Envol Africa Magazine",
    alternateName: ["Envol Africa", "EAM", "Envol Africa Groupe"],
    url: BASE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${BASE_URL}/mobile-header-logo.png`,
      width: 512,
      height: 512,
    },
    description: "Le magazine économique panafricain de référence : actualités, analyses exclusives, Kiosque numérique, Marketplace panafricaine, emploi et financement.",
    foundingDate: "2024",
    areaServed: {
      "@type": "Continent",
      name: "Africa",
    },
    knowsLanguage: ["fr", "en", "es", "sw", "fon", "wo"],
    sameAs: [
      "https://twitter.com/envolafrica",
      "https://facebook.com/envolafrica",
      "https://linkedin.com/company/envol-africa",
    ],
  };
}

export function getWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Envol Africa Magazine",
    url: BASE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/recherche?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function getNewsArticleSchema(article: {
  title: string;
  slug: string;
  summary?: string;
  content?: string;
  image?: string;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  author?: string;
  category?: string;
  isAccessibleForFree?: boolean;
}) {
  const isFree = article.isAccessibleForFree ?? false;
  const url = `${BASE_URL}/article/${encodeURIComponent(article.slug)}`;
  const datePublished = article.publishedAt || article.createdAt || new Date().toISOString();
  const dateModified = article.updatedAt || datePublished;

  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    headline: article.title,
    description: (article.summary || article.content || "").replace(/<[^>]*>/g, "").slice(0, 200).trim(),
    image: [article.image || `${BASE_URL}/mobile-header-logo.png`],
    datePublished,
    dateModified,
    author: {
      "@type": "Person",
      name: article.author || "Rédaction Envol Africa",
    },
    publisher: {
      "@type": "NewsMediaOrganization",
      name: "Envol Africa Magazine",
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/mobile-header-logo.png`,
      },
    },
    articleSection: article.category || "Économie",
    inLanguage: "fr",
    isAccessibleForFree: isFree,
    ...(isFree
      ? {}
      : {
          hasPart: {
            "@type": "WebPageElement",
            isAccessibleForFree: false,
            cssSelector: ".paywall-protected-content",
          },
        }),
  };
}

export function getMagazineProductSchema(magazine: {
  id: string;
  title: string;
  numero?: number;
  description?: string;
  cover?: string;
  price?: number;
  prices?: Record<string, number>;
}) {
  const url = `${BASE_URL}/kiosque/${encodeURIComponent(magazine.id)}`;
  const price = magazine.price || magazine.prices?.numerique || 5000;

  return {
    "@context": "https://schema.org",
    "@type": "Book",
    name: magazine.title,
    url,
    image: magazine.cover ? (magazine.cover.startsWith("http") ? magazine.cover : `${BASE_URL}${magazine.cover}`) : undefined,
    description: (magazine.description || "").replace(/<[^>]*>/g, "").slice(0, 200).trim(),
    inLanguage: "fr",
    publisher: {
      "@type": "Organization",
      name: "Envol Africa Magazine",
      url: BASE_URL,
    },
    offers: {
      "@type": "Offer",
      price: price,
      priceCurrency: "XOF",
      availability: "https://schema.org/InStock",
      url,
      seller: {
        "@type": "Organization",
        name: "Envol Africa Magazine",
      },
    },
  };
}

export function getMarketplaceProductSchema(product: {
  id: string;
  title: string;
  description?: string;
  image?: string;
  media?: unknown;
  price_xof?: number;
  priceXof?: number;
  category?: string;
  marketplace_suppliers?: { business_name?: string } | Array<{ business_name?: string }>;
  supplier?: string;
}) {
  const url = `${BASE_URL}/marketplace/produits/${encodeURIComponent(product.id)}`;
  const price = product.price_xof ?? product.priceXof ?? 0;
  const image = product.image || (Array.isArray(product.media) && typeof product.media[0] === "string" ? product.media[0] : `${BASE_URL}/mobile-header-logo.png`);
  const supplierObj = Array.isArray(product.marketplace_suppliers) ? product.marketplace_suppliers[0] : product.marketplace_suppliers;
  const supplierName = supplierObj?.business_name || product.supplier || "Marchand Vérifié Envol Africa";

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: (product.description || "").replace(/<[^>]*>/g, "").slice(0, 200).trim(),
    image: [image],
    url,
    category: product.category,
    offers: {
      "@type": "Offer",
      price: price,
      priceCurrency: "XOF",
      availability: "https://schema.org/InStock",
      url,
      seller: {
        "@type": "Organization",
        name: supplierName,
      },
    },
  };
}

export function getJobPostingSchema(job: {
  id: string;
  title: string;
  description: string;
  sector?: string;
  contractType?: string;
  city?: string;
  country?: string;
  companyName?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  createdAt?: string;
  publishedAt?: string;
  updatedAt?: string;
  validThrough?: string;
}) {
  const url = `${BASE_URL}/emploi/offres/${encodeURIComponent(job.id)}`;
  const datePosted = job.publishedAt || job.createdAt || new Date().toISOString();
  const validThrough = job.validThrough || new Date(Date.now() + 60 * 86400000).toISOString();

  // EmploymentType mapping
  let employmentType = "FULL_TIME";
  const typeLower = (job.contractType || "").toLowerCase();
  if (typeLower.includes("cdi")) employmentType = "FULL_TIME";
  else if (typeLower.includes("cdd")) employmentType = "TEMPORARY";
  else if (typeLower.includes("stage")) employmentType = "INTERN";
  else if (typeLower.includes("freelance") || typeLower.includes("prestation")) employmentType = "CONTRACTOR";
  else if (typeLower.includes("temps partiel")) employmentType = "PART_TIME";

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: (job.description || "").replace(/<[^>]*>/g, "").slice(0, 500).trim(),
    identifier: {
      "@type": "PropertyValue",
      name: "Envol Africa Jobs",
      value: job.id,
    },
    datePosted,
    validThrough: new Date(Date.now() + 60 * 86400000).toISOString(),
    employmentType,
    hiringOrganization: {
      "@type": "Organization",
      name: job.companyName || "Entreprise Partenaire Envol Africa",
      sameAs: BASE_URL,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.city || "Afrique",
        addressCountry: job.country || "BJ",
      },
    },
    url,
    ...(job.salaryMin
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: job.currency || "XOF",
            value: {
              "@type": "QuantitativeValue",
              minValue: job.salaryMin,
              maxValue: job.salaryMax || job.salaryMin,
              unitText: "MONTH",
            },
          },
        }
      : {}),
  };
}

export function getBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${BASE_URL}${item.url}`,
    })),
  };
}
