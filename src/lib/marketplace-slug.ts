import { getSupabaseAdmin } from "@/lib/supabase-admin";

/**
 * Génère un slug d'URL propre pour une boutique
 * ex: "MAMAN FENOU" -> "maman-fenou"
 */
export function generateStoreSlug(name: string): string {
  if (!name) return "boutique";
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "boutique";
}

/**
 * Génère un slug d'URL pour le vendeur (prénom, nom, email ou pseudo)
 * ex: "Arminelle Nouatin" -> "arminelle" ou "arminelle-nouatin"
 */
export function generateVendorSlug(user: { prenom?: string | null; nom?: string | null; email?: string | null } | null): string {
  if (!user) return "vendeur";
  const pre = (user.prenom || "").trim();
  const nom = (user.nom || "").trim();
  const raw = pre ? pre : nom ? nom : user.email ? user.email.split("@")[0] : "vendeur";
  return generateStoreSlug(raw);
}

/**
 * Normalise un slug ou nom pour une comparaison insensible aux tirets, espaces et accents
 * ex: "maman-fenou", "MAMAN FENOU", "mamanfenou" -> "mamanfenou"
 */
export function normalizeStoreSlug(input: string): string {
  if (!input) return "";
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export type SupplierRecord = {
  id: string;
  user_id: string;
  business_name: string;
  description?: string | null;
  country_code?: string | null;
  city?: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  certification_status?: string | null;
  rating?: number | null;
  call_available?: boolean | null;
  created_at?: string;
  updated_at?: string;
  slug?: string;
  products_count?: number;
  vendor_slug?: string;
  vendor_name?: string;
};

/**
 * Recherche une boutique par l'association [vendeur]/[nom-boutique]
 * ex: vendorIdentifier = "arminelle", storeIdentifier = "mamanfenou"
 */
export async function findSupplierByVendorAndSlug(
  vendorIdentifier: string,
  storeIdentifier: string
): Promise<SupplierRecord | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase || !vendorIdentifier || !storeIdentifier) return null;

  const targetStoreNorm = normalizeStoreSlug(storeIdentifier);
  const targetVendorNorm = normalizeStoreSlug(vendorIdentifier);

  const { data: allSuppliers } = await supabase
    .from("marketplace_suppliers")
    .select("*, users(id, email, nom, prenom)")
    .order("created_at", { ascending: false });

  if (!allSuppliers || allSuppliers.length === 0) return null;

  const match = allSuppliers.find((s: any) => {
    const sNorm = normalizeStoreSlug(s.business_name);
    const sSlug = generateStoreSlug(s.business_name);
    const storeMatches = sNorm === targetStoreNorm || sSlug === generateStoreSlug(storeIdentifier) || s.id === storeIdentifier;
    if (!storeMatches) return false;

    // Vérifier si le vendeur correspond
    const u = s.users;
    if (!u) return true;
    const vPre = normalizeStoreSlug(u.prenom || "");
    const vNom = normalizeStoreSlug(u.nom || "");
    const vFull = normalizeStoreSlug(`${u.prenom || ""} ${u.nom || ""}`);
    const vEmail = normalizeStoreSlug(u.email ? u.email.split("@")[0] : "");

    return (
      vPre === targetVendorNorm ||
      vNom === targetVendorNorm ||
      vFull === targetVendorNorm ||
      vEmail === targetVendorNorm ||
      u.id === vendorIdentifier
    );
  });

  if (!match) {
    // Si la combinaison exacte n'est pas trouvée, recherche directe sur la boutique
    return findSupplierBySlugOrId(storeIdentifier);
  }

  const u = (match as any).users;
  const vendorName = u ? `${u.prenom || ""} ${u.nom || ""}`.trim() : "Vendeur";
  const vendorSlug = generateVendorSlug(u);

  return {
    ...match,
    slug: generateStoreSlug(match.business_name),
    vendor_slug: vendorSlug,
    vendor_name: vendorName,
  };
}

/**
 * Recherche une boutique par son slug (ex: "mamanfenou", "maman-fenou"), son nom commercial ou son ID UUID
 */
export async function findSupplierBySlugOrId(identifier: string): Promise<SupplierRecord | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase || !identifier) return null;

  const raw = decodeURIComponent(identifier).trim();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw);

  // Récupérer toutes les boutiques avec les infos utilisateurs pour le vendor_slug
  const { data: allSuppliers } = await supabase
    .from("marketplace_suppliers")
    .select("*, users(id, email, nom, prenom)")
    .order("created_at", { ascending: false });

  if (!allSuppliers || allSuppliers.length === 0) return null;

  // 1. Recherche directe par ID UUID
  if (isUuid) {
    const match = allSuppliers.find((s) => s.id === raw);
    if (match) {
      const u = (match as any).users;
      return {
        ...match,
        slug: generateStoreSlug(match.business_name),
        vendor_slug: generateVendorSlug(u),
        vendor_name: u ? `${u.prenom || ""} ${u.nom || ""}`.trim() : "Vendeur",
      };
    }
  }

  // 2. Recherche par normalisation du slug et du nom commercial
  const normalizedTarget = normalizeStoreSlug(raw);
  const hyphenTarget = generateStoreSlug(raw);

  const match = allSuppliers.find((s) => {
    if (s.id === raw) return true;
    const sSlug = generateStoreSlug(s.business_name);
    const sNorm = normalizeStoreSlug(s.business_name);
    return (
      sSlug === hyphenTarget ||
      sNorm === normalizedTarget ||
      (s.slug && (s.slug === raw || normalizeStoreSlug(s.slug) === normalizedTarget))
    );
  });

  if (!match) return null;

  const u = (match as any).users;
  return {
    ...match,
    slug: generateStoreSlug(match.business_name),
    vendor_slug: generateVendorSlug(u),
    vendor_name: u ? `${u.prenom || ""} ${u.nom || ""}`.trim() : "Vendeur",
  };
}

/**
 * Recherche toutes les boutiques appartenant à un vendeur via son slug (ex: "arminelle") ou son UUID
 */
export async function findVendorStoresBySlug(
  vendorSlugOrId: string
): Promise<{
  vendor: { id: string; name: string; slug: string; email?: string } | null;
  stores: SupplierRecord[];
}> {
  const supabase = getSupabaseAdmin();
  if (!supabase || !vendorSlugOrId) return { vendor: null, stores: [] };

  const raw = decodeURIComponent(vendorSlugOrId).trim();
  const targetNorm = normalizeStoreSlug(raw);

  // 1. Charger toutes les boutiques avec les profils utilisateurs
  const { data: allSuppliers } = await supabase
    .from("marketplace_suppliers")
    .select("*, users(id, email, nom, prenom)")
    .order("created_at", { ascending: false });

  let matchedUser: any = null;
  const vendorStores: SupplierRecord[] = [];

  if (allSuppliers) {
    for (const s of allSuppliers) {
      const u = (s as any).users;
      if (!u) continue;
      const vPre = normalizeStoreSlug(u.prenom || "");
      const vNom = normalizeStoreSlug(u.nom || "");
      const vFull = normalizeStoreSlug(`${u.prenom || ""} ${u.nom || ""}`);
      const vEmail = normalizeStoreSlug(u.email ? u.email.split("@")[0] : "");
      const vSlug = generateVendorSlug(u);

      const isMatch =
        vSlug === targetNorm ||
        normalizeStoreSlug(vSlug) === targetNorm ||
        vPre === targetNorm ||
        vNom === targetNorm ||
        vFull === targetNorm ||
        vEmail === targetNorm ||
        u.id === raw;

      if (isMatch) {
        if (!matchedUser) matchedUser = u;
        vendorStores.push({
          ...s,
          slug: generateStoreSlug(s.business_name),
          vendor_slug: vSlug,
          vendor_name: `${u.prenom || ""} ${u.nom || ""}`.trim() || u.email || "Vendeur",
        });
      }
    }
  }

  // Si pas de boutique trouvée avec cet utilisateur, vérifier si l'utilisateur existe dans public.users
  if (!matchedUser) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw);
    if (isUuid) {
      const { data: uData } = await supabase.from("users").select("id, email, nom, prenom").eq("id", raw).maybeSingle();
      if (uData) matchedUser = uData;
    } else {
      const { data: allUsers } = await supabase.from("users").select("id, email, nom, prenom");
      if (allUsers) {
        matchedUser =
          allUsers.find((u: any) => {
            const vSlug = generateVendorSlug(u);
            const vPre = normalizeStoreSlug(u.prenom || "");
            const vNom = normalizeStoreSlug(u.nom || "");
            const vFull = normalizeStoreSlug(`${u.prenom || ""} ${u.nom || ""}`);
            const vEmail = normalizeStoreSlug(u.email ? u.email.split("@")[0] : "");
            return (
              vSlug === targetNorm ||
              normalizeStoreSlug(vSlug) === targetNorm ||
              vPre === targetNorm ||
              vNom === targetNorm ||
              vFull === targetNorm ||
              vEmail === targetNorm
            );
          }) || null;
      }
    }
  }

  if (!matchedUser) {
    return { vendor: null, stores: [] };
  }

  // Récupérer le nombre de produits pour chaque boutique
  if (vendorStores.length > 0) {
    const storeIds = vendorStores.map((s) => s.id);
    const { data: products } = await supabase
      .from("marketplace_products")
      .select("supplier_id")
      .in("supplier_id", storeIds);

    const countsMap: Record<string, number> = {};
    if (products) {
      for (const p of products) {
        countsMap[p.supplier_id] = (countsMap[p.supplier_id] || 0) + 1;
      }
    }
    for (const s of vendorStores) {
      s.products_count = countsMap[s.id] || 0;
    }
  }

  const vName = `${matchedUser.prenom || ""} ${matchedUser.nom || ""}`.trim() || matchedUser.email?.split("@")[0] || "Vendeur";
  const vSlug = generateVendorSlug(matchedUser);

  return {
    vendor: {
      id: matchedUser.id,
      name: vName,
      slug: vSlug,
      email: matchedUser.email,
    },
    stores: vendorStores,
  };
}

