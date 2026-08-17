"use client";

import dynamic from "next/dynamic";

type HeaderUser = { id: string; nom?: string; prenom?: string; email?: string; role?: string };

const Header = dynamic(() => import("./Header"), {
  ssr: false,
  loading: () => <div className="h-[112px] bg-[#fcf9f8]" aria-hidden="true" />,
});

export default function HeaderShell({ user }: { user?: HeaderUser }) {
  return <Header user={user} />;
}
