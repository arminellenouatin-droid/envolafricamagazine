"use client";

import Header from "./Header";

type HeaderUser = { id: string; nom?: string; prenom?: string; email?: string; role?: string };

export default function HeaderShell({ user }: { user?: HeaderUser }) {
  return <Header user={user} />;
}
