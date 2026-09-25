"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function Badge({ count }: { count: number }) {
  return count > 0 ? (
    <span className="absolute -right-1 -top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-[#c1121f] px-1 text-[9px] font-extrabold leading-none text-white">
      {count > 99 ? "99+" : count}
    </span>
  ) : null;
}

export default function WabSocialHeader({ avatar }: { avatar?: string }) {
  const [messages, setMessages] = useState(0);
  const [notifications, setNotifications] = useState(0);
  const [followedLiveCount, setFollowedLiveCount] = useState(0);

  useEffect(() => {
    const load = () => {
      fetch("/api/wab/messages")
        .then((response) => response.json())
        .then((data) => setMessages(Number(data.unreadCount || 0)))
        .catch(() => undefined);

      fetch("/api/wab/notifications")
        .then((response) => response.json())
        .then((data) => setNotifications(Number(data.unreadCount || 0)))
        .catch(() => undefined);

      fetch("/api/wab/salons")
        .then((response) => response.json())
        .then((data) => setFollowedLiveCount(Number(data.followedLiveCount || 0)))
        .catch(() => undefined);
    };

    load();
    const timer = window.setInterval(load, 15000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-[#d1e9e6] bg-[#eefcfa]/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-4 md:px-10">
        <Link href="/wab" className="font-display text-2xl font-extrabold tracking-tight text-[#001325]">
          WAB
        </Link>
        <nav className="flex items-center gap-2" aria-label="Actions sociales">
          {/* Bouton Live avec Étiquette comptes suivis en direct */}
          <Link
            href="/wab/salons"
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600/10 hover:bg-red-600/20 text-red-700 font-extrabold text-xs transition-colors"
            aria-label={`Salons Live${followedLiveCount ? `, ${followedLiveCount} en direct` : ""}`}
            title="Salons et diffusions en direct"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
            </span>
            <span className="hidden sm:inline">Salons</span>
            <span>Live</span>
            {followedLiveCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-black leading-tight animate-pulse">
                {followedLiveCount} en direct
              </span>
            )}
          </Link>

          {/* Messages */}
          <Link
            href="/messages"
            className="relative grid h-10 w-10 place-items-center rounded-full text-[#006874] hover:bg-[#d7e5e3]"
            aria-label={`Messages${messages ? `, ${messages} non lus` : ""}`}
            title="Messagerie instantanée"
          >
            <span className="material-symbols-outlined">mail</span>
            <Badge count={messages} />
          </Link>

          {/* Notifications */}
          <Link
            href="/wab/notifications"
            className="relative grid h-10 w-10 place-items-center rounded-full text-[#006874] hover:bg-[#d7e5e3]"
            aria-label={`Notifications${notifications ? `, ${notifications} non lues` : ""}`}
            title="Notifications"
          >
            <span className="material-symbols-outlined">notifications</span>
            <Badge count={notifications} />
          </Link>

          {/* Profil */}
          <Link
            href="/wab/profil"
            className="grid h-9 w-9 overflow-hidden rounded-full border-2 border-white bg-[#d7e5e3]"
            aria-label="Mon profil"
            title="Mon profil WAB"
          >
            {avatar ? (
              <img src={avatar} alt="Mon profil" className="h-full w-full object-cover" />
            ) : (
              <span className="grid h-full w-full place-items-center text-xs font-bold text-[#006874]">W</span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
