import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("5.4 — Base de Données, Contraintes et RLS", () => {
  const migrationPath = path.resolve(__dirname, "../../../../../supabase/migrations/20261005000000_agora_live.sql");
  const sql = fs.readFileSync(migrationPath, "utf8");

  it("la migration active la RLS sur les 3 tables (agora_live_channels, agora_live_participants, agora_event_log)", () => {
    expect(sql).toContain("alter table public.agora_live_channels     enable row level security;");
    expect(sql).toContain("alter table public.agora_live_participants enable row level security;");
    expect(sql).toContain("alter table public.agora_event_log         enable row level security;");
  });

  it("n'accorde la lecture qu'aux utilisateurs authentifiés avec isolation stricte (Anti-IDOR)", () => {
    // agora_live_channels : lecture seule accordée à authenticated
    expect(sql).toContain('create policy "agora_channels_read" on public.agora_live_channels');
    expect(sql).toContain("for select to authenticated using (true);");

    // agora_live_participants : un utilisateur ne peut voir que SA propre ligne
    expect(sql).toContain('create policy "agora_participants_read_own" on public.agora_live_participants');
    expect(sql).toContain("for select to authenticated using (user_id = auth.uid());");

    // agora_event_log : AUCUNE policy publique => accessible uniquement par le service role
    expect(sql).toContain("-- Aucune policy sur agora_event_log : accessible uniquement par le service role.");
    expect(sql).not.toContain('create policy "agora_event_log_read"');
  });

  it("la fonction agora_apply_event est strictement protégée et réservée à service_role", () => {
    expect(sql).toContain("revoke all on function public.agora_apply_event(text, text, integer) from public, anon, authenticated;");
    expect(sql).toContain("grant execute on function public.agora_apply_event(text, text, integer) to service_role;");
  });

  it("vérifie les contraintes d'intégrité : uid < 1e9, rôles privilégiés et statuts de session", () => {
    // Contrainte uid participant enregistré < 1 milliard
    expect(sql).toContain("check (uid < 1000000000)");

    // Contrainte sur les rôles Agora
    expect(sql).toContain("check (role in ('host','cohost','moderator'))");

    // Contrainte sur les statuts de session
    expect(sql).toContain("check (status in ('scheduled','live','ended'))");

    // Contrainte d'unicité et clés primaires
    expect(sql).toContain("unique (live_id, user_id)");
    expect(sql).toContain("notice_id     text primary key");
  });
});
