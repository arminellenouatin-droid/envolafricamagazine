import { z } from "zod";

// Shared Zod schemas front/back §9.2 - validation avant toute logique métier

export const signupSchema = z.object({
  nom: z.string().min(2),
  prenom: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  affiliateRef: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const articleCreateSchema = z.object({
  title: z.string().min(5),
  summary: z.string().optional(),
  content: z.string().min(50),
  category: z.string().optional(),
  image: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isSentinelle: z.boolean().optional(),
  isEssor: z.boolean().optional(),
  isOmbreDouce: z.boolean().optional(),
});

export const magazineCreateSchema = z.object({
  numero: z.coerce.number().int().positive(),
  title: z.string().min(3),
  cover: z.string().url().optional(),
  year: z.coerce.number().int().min(2020).max(2030).optional(),
  description: z.string().optional(),
  featured: z.boolean().optional(),
});

export const cartAddSchema = z.object({
  type: z.enum(["magazine", "subscription", "don"]),
  magazineId: z.string().uuid().optional(),
  format: z.enum(["cd_audio","numerique","papier","audio_pdf","audio_papier"]).optional(),
  language: z.string().optional(),
  planId: z.enum(["mensuel","annuel","chef_entreprise","soutien"]).optional(),
  amount: z.number().positive().optional(),
});

export const donationCreateSchema = z.object({
  amount: z.number().positive(),
  full_name: z.string().min(2),
  payment_method: z.enum(["mobile_money","carte","autre"]),
  phone_number: z.string().optional(),
  payment_reference: z.string().optional(),
  comment: z.string().optional(),
  email: z.string().email(),
}).refine(data => {
  if (data.payment_method === "mobile_money" && !data.phone_number) return false;
  if ((data.payment_method === "carte" || data.payment_method === "autre") && !data.payment_reference) return false;
  return true;
}, { message: "phone_number requis si mobile_money, payment_reference requis si carte/autre (§4.3)" });

export const serviceRequestSchema = z.object({
  nom: z.string().min(2),
  email: z.string().email(),
  service: z.enum(["emploi","marketplace","financement","awards","salons","wab","pub","autre","montage_plan_affaires","conseils_externalisation","recrutement","formation_recyclage","levee_fonds","services_digitaux","marketing_strategie_vente","audit_gestion","gestion_projet","courtage"]),
  message: z.string().min(10),
});

export const affiliateGenerateLinkSchema = z.object({
  target_type: z.enum(["general","magazine_numero"]),
  magazine_id: z.string().uuid().optional(),
});

export const affiliatePayoutRequestSchema = z.object({
  method: z.enum(["mobile_money","virement","carte"]),
  details: z.record(z.string(), z.any()).optional(),
});

export const commentSchema = z.object({
  articleId: z.string().uuid(),
  content: z.string().min(1).max(1000),
});

export const searchSchema = z.object({
  q: z.string().min(1).max(100),
  scope: z.enum(["articles","kiosque","all"]).optional(),
});
