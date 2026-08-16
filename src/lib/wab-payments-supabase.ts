import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function createPendingWabBoost(postId: string, userId: string, budget: number, durationDays: number, countries: string[], industries: string[], paymentId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const, boost: null };

  const { data, error } = await supabase
    .from("wab_boosts")
    .insert({
      post_id: postId,
      user_id: userId,
      budget_xof: budget,
      duration_days: durationDays,
      target_countries: countries,
      target_industries: industries,
      provider_payment_id: paymentId,
      status: "pending"
    })
    .select()
    .single();

  if (error) return { configured: true as const, boost: null, error };
  return { configured: true as const, boost: data };
}

export async function activateWabBoostByPayment(userId: string, paymentId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const, activated: false };

  // 1. Mettre à jour le statut du boost dans wab_boosts
  const now = new Date();
  const endsAt = new Date(now.getTime() + 1000 * 60 * 60 * 24); // Temporaire si pas mis à jour via duration_days
  
  const { data: boost, error } = await supabase
    .from("wab_boosts")
    .update({
      status: "active",
      starts_at: now.toISOString(),
      ends_at: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7).toISOString() // Par défaut 7 jours ou calculer selon duration_days
    })
    .eq("user_id", userId)
    .eq("provider_payment_id", paymentId)
    .in("status", ["pending", "active"])
    .select()
    .maybeSingle();

  if (error || !boost) return { configured: true as const, activated: false, error };

  // Calculer ends_at réel en fonction de duration_days
  const duration = boost.duration_days || 7;
  const endsAtReal = new Date(now.getTime() + 1000 * 60 * 60 * 24 * duration);
  await supabase
    .from("wab_boosts")
    .update({ ends_at: endsAtReal.toISOString() })
    .eq("id", boost.id);

  // 2. Mettre à jour le post correspondant pour l'indiquer comme boosté
  await supabase
    .from("wab_posts")
    .update({
      is_boosted: true,
      boost_ends_at: endsAtReal.toISOString()
    })
    .eq("id", boost.post_id);

  return { configured: true as const, activated: true, boost };
}
