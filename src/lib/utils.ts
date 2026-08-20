export function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function truncateToLines(text: string, lines: number): { preview: string, rest: string, blurLines: string } {
  const allLines = text.split('\n').flatMap(p => {
    // split paragraph into pseudo lines ~ 80 chars
    const sentences = p.split(/\. /);
    return sentences;
  });
  // Simpler: split by words then group
  const words = text.split(/\s+/);
  const wordsPerLine = 14;
  const previewWords = words.slice(0, lines * wordsPerLine);
  const blurWords = words.slice(lines * wordsPerLine, (lines+3) * wordsPerLine);
  const restWords = words.slice((lines+3) * wordsPerLine);
  return {
    preview: previewWords.join(' '),
    blurLines: blurWords.join(' '),
    rest: restWords.join(' '),
  };
}

import { formatMoney, type CurrencyRates } from "@/lib/currency";

export function formatPrice(amount: number, currency = "XOF", language = "fr", rates?: CurrencyRates) {
  return formatMoney(amount, currency, language, rates);
}

export function getExcerpt(text: string, length=160) {
  if (text.length <= length) return text;
  return text.substring(0,length).trim()+"...";
}

export function isSubscribed(user: any): boolean {
  if (!user?.subscription) return false;
  if (user.subscription.status !== 'active') return false;
  const end = new Date(user.subscription.endDate);
  return end > new Date();
}

export function affiliateRate(isSubscriber: boolean) {
  return isSubscriber ? 0.25 : 0.10;
}

export function calculateFirstMonthPrice(plan: any) {
  if (plan.firstMonthPrice) return plan.firstMonthPrice;
  return plan.price;
}

export function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
}
