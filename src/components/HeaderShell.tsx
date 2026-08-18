"use client";

import dynamic from "next/dynamic";

type HeaderUser = { id: string; nom?: string; prenom?: string; email?: string; role?: string; avatar?: string };

const InteractiveHeader = dynamic(() => import("./Header"), { ssr: false });

export default function HeaderShell({ user }: { user?: HeaderUser }) {
  return <InteractiveHeader user={user} />;
}
