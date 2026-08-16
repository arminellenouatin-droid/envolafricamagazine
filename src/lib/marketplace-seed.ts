export type MarketplaceProduct = {
  id: string;
  title: string;
  supplier: string;
  country: string;
  city: string;
  category: string;
  priceXof: number;
  image: string;
  accent: string;
  certified: boolean;
  boosted: boolean;
  installment: boolean;
  months: number;
  description: string;
};

export const marketplaceSeed: MarketplaceProduct[] = [
  { id: "seed-karite", title: "Beurre de karité brut premium — 25 kg", supplier: "Coopérative Naya Naturals", country: "BJ", city: "Parakou", category: "Beauté & bien-être", priceXof: 185000, image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=900&q=80", accent: "#b78238", certified: true, boosted: true, installment: true, months: 6, description: "Beurre de karité collecté et conditionné au Bénin, destiné aux marques et laboratoires." },
  { id: "seed-wax", title: "Wax imprimé artisanal — collection Harmattan", supplier: "Atelier Kora Textiles", country: "CI", city: "Abidjan", category: "Mode & textile", priceXof: 32000, image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=80", accent: "#9e001f", certified: true, boosted: true, installment: false, months: 0, description: "Série limitée de tissus imprimés pour créateurs, boutiques et maisons de mode." },
  { id: "seed-cafe", title: "Café arabica torréfié — carton de 12", supplier: "Monts du Cameroun Coffee", country: "CM", city: "Bafoussam", category: "Alimentation", priceXof: 78000, image: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=900&q=80", accent: "#5b3924", certified: false, boosted: false, installment: true, months: 3, description: "Café arabica de montagne, torréfaction moyenne et traçabilité par lot." },
  { id: "seed-basket", title: "Paniers tressés à la main — lot de 20", supplier: "Maison Sira Artisanat", country: "BF", city: "Ouagadougou", category: "Maison & artisanat", priceXof: 94000, image: "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=900&q=80", accent: "#d16a2a", certified: true, boosted: false, installment: false, months: 0, description: "Paniers durables réalisés par des artisanes locales, pour décoration et distribution." },
  { id: "seed-moringa", title: "Poudre de moringa bio — 10 kg", supplier: "Green Sahel Organics", country: "SN", city: "Thiès", category: "Alimentation", priceXof: 125000, image: "https://images.unsplash.com/photo-1515586000433-45406d8e6662?auto=format&fit=crop&w=900&q=80", accent: "#3b6b4d", certified: false, boosted: false, installment: true, months: 4, description: "Moringa séché à basse température, conditionnement professionnel et fiches de lot." },
  { id: "seed-leather", title: "Petite maroquinerie en cuir — série entreprise", supplier: "Bamako Leather Studio", country: "ML", city: "Bamako", category: "Mode & textile", priceXof: 215000, image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80", accent: "#7a4a36", certified: true, boosted: false, installment: true, months: 12, description: "Objets personnalisables pour cadeaux d’entreprise et revendeurs spécialisés." },
  { id: "seed-solar", title: "Kit solaire domestique — 120 W", supplier: "Sun Africa Solutions", country: "TG", city: "Lomé", category: "Énergie", priceXof: 169000, image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=900&q=80", accent: "#c68a00", certified: true, boosted: true, installment: true, months: 12, description: "Kit solaire avec panneau, batterie et éclairage pour petites activités et foyers." },
  { id: "seed-cocoa", title: "Fèves de cacao fermentées — sac de 50 kg", supplier: "Alliance Cacao Durable", country: "CI", city: "Daloa", category: "Alimentation", priceXof: 260000, image: "https://images.unsplash.com/photo-1575377427642-087cf684f04d?auto=format&fit=crop&w=900&q=80", accent: "#6d4327", certified: false, boosted: false, installment: true, months: 6, description: "Cacao de terroir pour chocolatiers, avec origine producteur et contrôle qualité." },
];

export const marketplaceCategories = ["Toutes les catégories", "Alimentation", "Beauté & bien-être", "Mode & textile", "Maison & artisanat", "Énergie"];
