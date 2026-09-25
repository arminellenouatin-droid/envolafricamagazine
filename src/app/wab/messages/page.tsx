"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function WabMessagesRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const q = searchParams.toString();
    const destination = q ? `/messages?${q}` : "/messages";
    router.replace(destination);
  }, [router, searchParams]);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#f0f2f5] flex items-center justify-center">
      <div className="text-center p-6 bg-white rounded-2xl shadow-xl border border-gray-200">
        <div className="w-12 h-12 border-4 border-[#9e001f] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-display font-bold text-sm text-[#082843]">
          Ouverture de la messagerie...
        </p>
      </div>
    </div>
  );
}

export default function WabMessagesRedirectPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 z-[9999] bg-[#f0f2f5] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#9e001f] border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    }>
      <WabMessagesRedirectInner />
    </Suspense>
  );
}
