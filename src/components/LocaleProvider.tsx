"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { formatMoney, type CurrencyRates } from "@/lib/currency";
import { normalizeVisitorLocale, persistVisitorLocale, readPersistedVisitorLocale, type VisitorLocale } from "@/lib/visitor-locale";

type LocaleContextValue = {
  locale: VisitorLocale;
  rates: CurrencyRates;
  setLocale: (next: Partial<VisitorLocale>) => void;
  formatPrice: (amountInXof: number) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<VisitorLocale>(() => readPersistedVisitorLocale());
  const [rates, setRates] = useState<CurrencyRates>({ XOF: 1 });

  useEffect(() => {
    fetch("/api/locale/rates", { cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<{ rates?: CurrencyRates }> : Promise.reject(new Error("rates")))
      .then((payload) => setRates(payload.rates || { XOF: 1 }))
      .catch(() => setRates({ XOF: 1 }));
  }, []);

  useEffect(() => {
    const sync = (event: Event) => setLocaleState(normalizeVisitorLocale((event as CustomEvent<VisitorLocale>).detail));
    window.addEventListener("ea-locale-updated", sync);
    return () => window.removeEventListener("ea-locale-updated", sync);
  }, []);

  const setLocale = (next: Partial<VisitorLocale>) => {
    const normalized = normalizeVisitorLocale({ ...locale, ...next });
    setLocaleState(normalized);
    persistVisitorLocale(normalized);
  };

  const value = useMemo(() => ({ locale, rates, setLocale, formatPrice: (amountInXof: number) => formatMoney(amountInXof, locale.currency, locale.language, rates) }), [locale, rates]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale doit être utilisé dans LocaleProvider");
  return context;
}
