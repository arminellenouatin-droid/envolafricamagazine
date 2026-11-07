"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SvgIcon } from "@/components/ui/Icon";

export default function BottomNav() {
  const pathname = usePathname() || "/";

  // Hide on admin routes or flipbook fullscreen reader if needed
  if (pathname.startsWith("/admin") || pathname.includes("/flipbook/")) {
    return null;
  }

  const tabs = [
    { label: "Magazine", href: "/", icon: "menu_book", isActive: pathname === "/" },
    { label: "Kiosque", href: "/kiosque", icon: "library_books", isActive: pathname.startsWith("/kiosque") },
    { label: "Boutique", href: "/marketplace", icon: "storefront", isActive: pathname.startsWith("/marketplace") },
    { label: "WAB", href: "/wab", icon: "public", isActive: pathname.startsWith("/wab") },
    { label: "Espace", href: "/compte", icon: "person", isActive: pathname.startsWith("/compte") || pathname.startsWith("/dashboard") },
  ];

  return (
    <nav
      aria-label="Navigation principale mobile"
      className="fixed bottom-0 left-0 right-0 z-40 block md:hidden border-t border-[#ead8d5] bg-[#fffdfd]/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(43,37,37,0.06)]"
    >
      <div className="mx-auto flex h-14 max-w-md items-center justify-around px-2">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex min-w-[56px] flex-col items-center justify-center gap-1 py-1 text-center transition-colors ${
              tab.isActive
                ? "text-[#9e001f] font-bold"
                : "text-[#5a4d4c] hover:text-[#1e1919]"
            }`}
          >
            <SvgIcon name={tab.icon} className={`h-5 w-5 ${tab.isActive ? "scale-110" : ""}`} />
            <span className="text-[10px] tracking-tight">{tab.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
