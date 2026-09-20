const ALLOWED_TAGS = new Set(["p", "br", "div", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "strong", "b", "em", "i", "u", "blockquote", "a", "sub", "sup", "img"]);

export function fixMojibake(text: string): string {
  if (!text || typeof text !== "string") return "";
  return text
    // CP437 / Windows-1252 to UTF-8 mojibake
    .replace(/├®/g, "é")
    .replace(/├¿/g, "è")
    .replace(/├á/g, "à")
    .replace(/├¬/g, "ê")
    .replace(/├º/g, "ç")
    .replace(/├ë/g, "É")
    .replace(/├Ç/g, "À")
    .replace(/├«/g, "î")
    .replace(/├»/g, "ï")
    .replace(/├┤/g, "ô")
    .replace(/├╣/g, "ù")
    .replace(/├╗/g, "û")
    .replace(/├╝/g, "ü")
    .replace(/c├ó/g, "câ")
    .replace(/├ó/g, "â")
    .replace(/┬░/g, "°")
    .replace(/ÔÇó/g, "•")
    .replace(/Ôåù/g, "→")
    .replace(/ÔåÆ/g, "→")
    .replace(/┬À/g, "·")
    // Latin-1 (ISO-8859-1) to UTF-8 mojibake
    .replace(/Ã©/g, "é")
    .replace(/Ã¨/g, "è")
    .replace(/Ã /g, "à")
    .replace(/Ãª/g, "ê")
    .replace(/Ã§/g, "ç")
    .replace(/Ã‰/g, "É")
    .replace(/Ãˆ/g, "È")
    .replace(/Ã€/g, "À")
    .replace(/Ã®/g, "î")
    .replace(/Ã¯/g, "ï")
    .replace(/Ã´/g, "ô")
    .replace(/Ã¹/g, "ù")
    .replace(/Ã»/g, "û")
    .replace(/Ã¼/g, "ü")
    .replace(/dâ€™/g, "d’")
    .replace(/lâ€™/g, "l’")
    .replace(/nâ€™/g, "n’")
    .replace(/quâ€™/g, "qu’")
    .replace(/sâ€™/g, "s’")
    .replace(/jâ€™/g, "j’")
    .replace(/câ€™/g, "c’")
    .replace(/mâ€™/g, "m’")
    .replace(/tâ€™/g, "t’")
    .replace(/â€™/g, "’")
    .replace(/â€œ/g, "“")
    .replace(/â€\x9d/g, "”")
    .replace(/â€¢/g, "•")
    .replace(/â€¦/g, "…")
    .replace(/â‚¬/g, "€")
    .replace(/Å“/g, "œ")
    // Leaked HTML entity strings in text
    .replace(/&amp;#039;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&amp;quot;/g, '"')
    .replace(/&quot;/g, '"')
    .replace(/&amp;amp;/g, "&")
    .replace(/&amp;lt;/g, "<")
    .replace(/&amp;gt;/g, ">");
}

export function escapeHtml(value: string) {
  return fixMojibake(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function plainTextToRichHtml(value: string) {
  return escapeHtml(value).replace(/\r?\n/g, "<br>");
}

export function sanitizeRichText(value: string) {
  const source = String(value ?? "");
  if (!/<[a-z][\s\S]*>/i.test(source)) return source;
  return source
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\s*(script|style|iframe|object|embed|form|input|textarea|button|svg|math|base|link|meta)[\s\S]*?(?:<\s*\/\s*\1\s*>|\/?>)/gi, "")
    .replace(/<\s*([^>]+)>/g, (full, rawTag: string) => {
      const closing = /^\s*\//.test(rawTag);
      const tagMatch = rawTag.match(/^\s*\/?\s*([a-z0-9]+)/i);
      if (!tagMatch) return "";
      const tag = tagMatch[1].toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) return "";
      if (closing) return `</${tag}>`;
      if (tag === "br") return "<br>";
      if (tag === "a") {
        const hrefMatch = rawTag.match(/href\s*=\s*[\"']([^\"']+)[\"']/i);
        const href = (hrefMatch?.[1] ?? "").trim();
        if (!/^(https?:\/\/|mailto:)/i.test(href)) return "<a>";
        return `<a href="${escapeHtml(href)}" rel="noopener noreferrer" target="_blank">`;
      }
      if (tag === "img") {
        const srcMatch = rawTag.match(/src\s*=\s*[\"']([^\"']+)[\"']/i);
        const altMatch = rawTag.match(/alt\s*=\s*[\"']([^\"']*)[\"']/i);
        const src = (srcMatch?.[1] ?? "").trim();
        if (!/^(https?:\/\/|\/)/i.test(src)) return "";
        return `<img src="${escapeHtml(src)}" alt="${escapeHtml(altMatch?.[1] ?? "")}" loading="lazy" decoding="async">`;
      }
      return `<${tag}>`;
    })
    .replace(/\s+(style|class|id|title|align|face|color|size)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
}

export function isRichText(value: string) {
  return /<(p|br|div|h[1-6]|ul|ol|li|strong|b|em|i|u|blockquote|a|img)\b[^>]*>/i.test(value);
}
