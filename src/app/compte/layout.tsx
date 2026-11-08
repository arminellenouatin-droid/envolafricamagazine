"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import SvgIcon from "@/components/ui/Icon";
import { getPlatformContext, PLATFORM_CONTEXTS, resolvePlatformRole, type PlatformKey } from "@/lib/platform-context";

export default function CompteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [platform, setPlatform] = useState<PlatformKey>("magazine");
  const context = PLATFORM_CONTEXTS[platform];
  const [role, setRole] = useState(context.roles[0].id);
  const currentRole = useMemo(() => context.roles.find((item) => item.id === role) ?? context.roles[0], [context.roles, role]);

  useEffect(() => { const params = new URLSearchParams(window.location.search); const nextPlatform = getPlatformContext(params.get("platform")); setPlatform(nextPlatform); const requestedRole = params.get("role"); setRole(requestedRole || PLATFORM_CONTEXTS[nextPlatform].roles[0].id); fetch("/api/auth/me").then((response) => response.json()).then((data) => { if (!data.user) router.push(`/auth/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`); else { setUser(data.user); setRole(resolvePlatformRole(nextPlatform, data.user.role)); } }); }, [router]);
  const changePlatform = (next: PlatformKey) => router.push(`/compte?platform=${next}`);
  const logout = async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/"); router.refresh(); };

  return <div className="min-h-screen bg-[#fcf9f8] pb-20">
    <div className="mx-auto max-w-[1280px] px-4 pt-8 sm:px-6 xl:px-8">
      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-xs">
        <span className="px-3 text-[11px] font-black uppercase tracking-wider text-slate-400">Espace Volet</span>
        {(Object.keys(PLATFORM_CONTEXTS) as PlatformKey[]).map((key) => <button key={key} onClick={() => changePlatform(key)} className={`rounded-xl px-3.5 py-2 text-[12px] font-bold transition ${platform === key ? "text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"}`} style={platform === key ? { backgroundColor: PLATFORM_CONTEXTS[key].accent } : undefined}>{PLATFORM_CONTEXTS[key].label}</button>)}
      </div>
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit lg:sticky lg:top-24">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-[#0A1931] font-bold text-white shadow-xs">{user?.avatar ? <img src={user.avatar} alt="" className="h-full w-full object-cover" /> : user ? `${user.prenom?.[0]}${user.nom?.[0]}` : "?"}</div><div><div className="text-[14px] font-bold text-[#0A1931]">{user ? `${user.prenom} ${user.nom}` : "Chargement..."}</div><div className="text-[12px] text-slate-500 truncate max-w-[170px]">{user?.email}</div></div></div>
            <div className="mt-4 rounded-xl px-3 py-2 text-center text-[11px] font-black uppercase" style={{ backgroundColor: `${context.accent}12`, color: context.accent }}>Espace {context.label}</div>
          </div>
          <nav className="mt-4 rounded-3xl border border-slate-200/80 bg-white p-3 shadow-xs space-y-1">
            <div className="mb-2 px-3 pt-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Navigation Espace</div>
            <Link href={`/compte?platform=${platform}`} className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${pathname === "/compte" ? "text-white shadow-xs" : "text-slate-700 hover:bg-slate-50"}`} style={pathname === "/compte" ? { backgroundColor: context.accent } : undefined}>
              <SvgIcon name="dashboard" className="w-4 h-4 shrink-0" />
              <span>{currentRole.dashboardLabel}</span>
            </Link>
            {currentRole.id === "admin" && <Link href={`/admin?platform=${platform}`} className="flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-black text-white shadow-xs transition hover:brightness-110" style={{ backgroundColor: context.accent }}>
              <SvgIcon name="settings" className="w-4 h-4 shrink-0" />
              <span>Administration</span>
            </Link>}
            {currentRole.links.map((item) => <Link key={item.href} href={item.href} className="flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition">
              <SvgIcon name="arrow_forward" className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>)}
            <div className="pt-2 border-t border-slate-100 my-1" />
            <Link href="/compte/wallet" className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${pathname === "/compte/wallet" ? "bg-amber-600 text-white shadow-xs" : "text-amber-800 hover:bg-amber-50"}`}>
              <SvgIcon name="payments" className="w-4 h-4 shrink-0" />
              <span>Mon Portefeuille (Wallet)</span>
            </Link>
            <Link href="/compte/kyc" className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${pathname === "/compte/kyc" ? "bg-[#9e001f] text-white shadow-xs" : "text-[#9e001f] hover:bg-red-50"}`}>
              <SvgIcon name="verified_user" className="w-4 h-4 shrink-0" />
              <span>Conformité KYC & Identité</span>
            </Link>
            <Link href="/affiliation" className="flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition">
              <SvgIcon name="workspace_premium" className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Programme d&apos;Affiliation</span>
            </Link>
            <Link href="/compte/parametres" className="flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition">
              <SvgIcon name="settings" className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Paramètres du compte</span>
            </Link>
            <button onClick={logout} className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 transition pt-2">
              <SvgIcon name="logout" className="w-4 h-4 shrink-0" />
              <span>Se déconnecter</span>
            </button>
          </nav>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  </div>;
}
