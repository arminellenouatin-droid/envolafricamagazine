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
    { label: "WAB", href: "/wab", icon: "public", isActive: pathname.startsWith("/wab") },
    { label: "Awards", href: "/africa-awards", icon: "emoji_events", isActive: pathname.startsWith("/africa-awards") },
    { label: "Finance", href: "/financement", icon: "volunteer_activism", isActive: pathname.startsWith("/financement") || pathname.startsWith("/crowdfunding") },
    { label: "Marketplace", href: "/marketplace", icon: "storefront", isActive: pathname.startsWith("/marketplace") },
    { label: "Jobs", href: "/emploi", icon: "work", isActive: pathname.startsWith("/emploi") || pathname.startsWith("/jobs") },
  ];

  return (
    <nav
      aria-label="Navigation principale mobile"
      className="fixed bottom-0 left-0 right-0 z-40 block md:hidden border-t border-[#ead8d5] bg-[#fffdfd]/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(43,37,37,0.06)]"
    >
      <div className="mx-auto flex h-14 max-w-lg items-center justify-around px-0.5">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-center transition-colors ${
              tab.isActive
                ? "text-[#9e001f] font-bold"
                : "text-[#5a4d4c] hover:text-[#1e1919]"
            }`}
          >
            <SvgIcon name={tab.icon} className={`h-4.5 w-4.5 transition-transform ${tab.isActive ? "scale-110 text-[#9e001f]" : ""}`} />
            <span className="text-[9px] tracking-tight leading-tight truncate max-w-full px-0.5">{tab.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
