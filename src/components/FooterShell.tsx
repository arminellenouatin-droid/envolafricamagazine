"use client";

import dynamic from "next/dynamic";

const InteractiveFooter = dynamic(() => import("./Footer"), { ssr: false });

export default function FooterShell() {
  return <InteractiveFooter />;
}
