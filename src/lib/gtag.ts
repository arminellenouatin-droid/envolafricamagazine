export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-SPMNFS3PD4";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackPageView(url: string) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("config", GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
}

export function trackEvent({
  action,
  category,
  label,
  value,
  params = {},
}: {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  params?: Record<string, unknown>;
}) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value,
      ...params,
    });
  }
}
