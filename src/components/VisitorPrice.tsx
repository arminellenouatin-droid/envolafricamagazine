"use client";

import { useLocale } from "@/components/LocaleProvider";

export default function VisitorPrice({ amountInXof, className }: { amountInXof: number; className?: string }) {
  const { formatPrice } = useLocale();
  return <span className={className}>{formatPrice(amountInXof)}</span>;
}
