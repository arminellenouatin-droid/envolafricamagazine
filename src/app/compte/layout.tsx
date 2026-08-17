"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getPlatformContext, PLATFORM_CONTEXTS, type PlatformKey } from "@/lib/platform-context";

export default function CompteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [platform, setPlatform] = useState<PlatformKey>("magazine");
  const context = PLATFORM_CONTEXTS[platform];
  const [role, setRole] = useState(context.roles[0].id);
  const currentRole = useMemo(() => context.roles.find((item) => item.id === role) ?? context.roles[0], [context.roles, role]);

  useEffect(() => { const params = new URLSearchParams(window.location.search); const nextPlatform = getPlatformContext(params.get("platform")); setPlatform(nextPlatform); setRole(params.get("role") || PLATFORM_CONTEXTS[nextPlatform].roles[0].id); fetch("/api/auth/me").then((response) => response.json()).then((data) => { if (!data.user) router.push(`/auth/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`); else setUser(data.user); }); }, [router]);
  useEffect(() => { setRole(context.roles[0].id); }, [platform, context.roles]);
  const changeRole = (nextRole: string) => { setRole(nextRole); router.push(`/compte?platform=${platform}&role=${encodeURIComponent(nextRole)}`); };

  const changePlatform = (next: PlatformKey) => router.push(`/compte?platform=${next}`);
  const logout = async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/"); router.refresh(); };

  return <div className="min-h-screen bg-[#FFFCF5] pb-20">
    <div className="mx-auto max-w-[1280px] px-4 pt-8 sm:px-6 xl:px-8">
      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm">
        <span className="px-3 text-[11px] font-black uppercase tracking-wider text-zinc-500">Espace</span>
        {(Object.keys(PLATFORM_CONTEXTS) as PlatformKey[]).map((key) => <button key={key} onClick={() => changePlatform(key)} className={`rounded-full px-3 py-2 text-[12px] font-bold transition ${platform === key ? "text-white" : "text-zinc-600 hover:bg-zinc-100"}`} style={platform === key ? { backgroundColor: PLATFORM_CONTEXTS[key].accent } : undefined}>{PLATFORM_CONTEXTS[key].label}</button>)}
      </div>
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit lg:sticky lg:top-24">
          <div className="rounded-[20px] border border-zinc-100 bg-white p-5">
            <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0A1931] font-bold text-white">{user ? `${user.prenom?.[0]}${user.nom?.[0]}` : "?"}</div><div><div className="text-[14px] font-bold text-[#0A1931]">{user ? `${user.prenom} ${user.nom}` : "Chargement..."}</div><div className="text-[12px] text-zinc-500">{user?.email}</div></div></div>
            <div className="mt-4 rounded-xl px-3 py-2 text-center text-[11px] font-black uppercase" style={{ backgroundColor: `${context.accent}12`, color: context.accent }}>Dashboard {context.label}</div>
          </div>
          <nav className="mt-4 rounded-[20px] border border-zinc-100 bg-white p-3">
            <div className="mb-2 px-3 text-[10px] font-black uppercase tracking-wider text-zinc-400">Rôle dans ce volet</div>
            <select value={role} onChange={(event) => changeRole(event.target.value)} className="mb-3 h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-bold text-zinc-700">{context.roles.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
            <Link href={`/compte?platform=${platform}`} className={`flex items-center gap-3 rounded-full px-4 py-2.5 text-[13px] font-medium ${pathname === "/compte" ? "text-white" : "text-zinc-700 hover:bg-zinc-50"}`} style={pathname === "/compte" ? { backgroundColor: context.accent } : undefined}>⌂ {currentRole.dashboardLabel}</Link>
            {currentRole.links.map((item) => <Link key={item.href} href={item.href} className="mt-1 flex items-center gap-3 rounded-full px-4 py-2.5 text-[13px] font-medium text-zinc-700 hover:bg-zinc-50">→ {item.label}</Link>)}
            <Link href={`/compte/parrainage?platform=${platform}`} className="mt-1 flex items-center gap-3 rounded-full px-4 py-2.5 text-[13px] font-medium text-zinc-700 hover:bg-zinc-50">↗ Affiliation globale</Link>
            <Link href="/compte/parametres" className="mt-1 flex items-center gap-3 rounded-full px-4 py-2.5 text-[13px] font-medium text-zinc-700 hover:bg-zinc-50">⚙ Paramètres du compte</Link>
            <button onClick={logout} className="mt-2 flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-left text-[13px] font-medium text-red-600 hover:bg-red-50">↪ Se déconnecter</button>
          </nav>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  </div>;
}
