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
    // Leaked HTML entity strings & non-breaking spaces in text
    .replace(/&amp;nbsp;?/gi, " ")
    .replace(/&nbsp;?/gi, " ")
    .replace(/\u00a0/g, " ")
    .replace(/\u202f/g, " ")
    .replace(/\u200b/g, "")
    .replace(/&amp;#160;?/gi, " ")
    .replace(/&#160;?/gi, " ")
    .replace(/&amp;#039;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&amp;#39;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;quot;/g, '"')
    .replace(/&quot;/g, '"')
    .replace(/&amp;amp;/g, "&")
    .replace(/&amp;lt;/g, "<")
    .replace(/&amp;gt;/g, ">");
}

export function cleanTextContent(text: string): string {
  if (!text || typeof text !== "string") return "";
  return fixMojibake(text)
    .replace(/&amp;nbsp;?/gi, " ")
    .replace(/&nbsp;?/gi, " ")
    .replace(/\u00a0/g, " ")
    .replace(/\u202f/g, " ")
    .replace(/\u200b/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function escapeHtml(value: string) {
  return cleanTextContent(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function plainTextToRichHtml(value: string) {
  return escapeHtml(value).replace(/\r?\n/g, "<br>");
}

function decodeProtocolEntities(url: string): string {
  return url
    .replace(/&#(\d+);?/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&colon;/gi, ":")
    .replace(/[\0\s\t\r\n]+/g, "");
}

export function sanitizeRichText(value: string) {
  let source = fixMojibake(String(value ?? ""))
    .replace(/\0/g, "")
    .replace(/&amp;nbsp;?/gi, " ")
    .replace(/&nbsp;?/gi, " ")
    .replace(/\u00a0/g, " ");

  if (!/<[a-z][\s\S]*>/i.test(source)) return cleanTextContent(source);

  // 1. Suppression multi-passes récursive des commentaires
  let prev = "";
  while (source !== prev) {
    prev = source;
    source = source.replace(/<!--[\s\S]*?-->/g, "");
  }

  // 2. Suppression multi-passes récursive des balises actives / exécutables
  const DANGEROUS_ELEMENTS = /<\s*(script|style|iframe|object|embed|form|input|textarea|button|svg|math|base|link|meta|applet|frameset|frame|audio|video|source|track|canvas)\b[\s\S]*?(?:<\s*\/\s*\1\s*>|\/?>)/gi;
  prev = "";
  while (source !== prev) {
    prev = source;
    source = source.replace(DANGEROUS_ELEMENTS, "");
  }

  // 3. Filtrage strict par liste blanche et régénération sécurisée des balises autorisées
  source = source.replace(/<\s*([^>]+)>/g, (_full, rawTag: string) => {
    const closing = /^\s*\//.test(rawTag);
    const tagMatch = rawTag.match(/^\s*\/?\s*([a-z0-9]+)/i);
    if (!tagMatch) return "";
    const tag = tagMatch[1].toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return "";
    if (closing) return tag === "br" || tag === "img" ? "" : `</${tag}>`;
    if (tag === "br") return "<br>";

    if (tag === "a") {
      const hrefMatch = rawTag.match(/href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const rawHref = (hrefMatch?.[1] || hrefMatch?.[2] || hrefMatch?.[3] || "").trim();
      const decodedHref = decodeProtocolEntities(rawHref);
      // Whitelist stricte : seuls http, https et mailto sont tolérés
      if (!/^(https?:\/\/|mailto:)/i.test(decodedHref) || /^(javascript|data|vbscript|file|blob):/i.test(decodedHref)) {
        return "<a>";
      }
      return `<a href="${escapeHtml(rawHref)}" rel="noopener noreferrer" target="_blank">`;
    }

    if (tag === "img") {
      const srcMatch = rawTag.match(/src\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const altMatch = rawTag.match(/alt\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const rawSrc = (srcMatch?.[1] || srcMatch?.[2] || srcMatch?.[3] || "").trim();
      const decodedSrc = decodeProtocolEntities(rawSrc);
      if ((!/^(https?:\/\/)/i.test(decodedSrc) && !/^\/[a-zA-Z0-9_\-\.\/]/.test(decodedSrc)) || /^(javascript|data|vbscript|file|blob):/i.test(decodedSrc)) {
        return "";
      }
      const alt = (altMatch?.[1] || altMatch?.[2] || altMatch?.[3] || "").trim();
      return `<img src="${escapeHtml(rawSrc)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async">`;
    }

    // Toutes les autres balises autorisées sont régénérées SANS aucun attribut
    return `<${tag}>`;
  });

  // 4. Nettoyage final des gestionnaires d'événements et styles résiduels
  return source
    .replace(/\s+(style|class|id|title|align|face|color|size)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
}

export function isRichText(value: string) {
  return /<(p|br|div|h[1-6]|ul|ol|li|strong|b|em|i|u|blockquote|a|img)\b[^>]*>/i.test(value);
}

export function linkifyHashtagsAndMentions(html: string): string {
  if (!html || typeof html !== "string") return "";
  let insideAnchor = false;
  return html.replace(/(<\/?a\b[^>]*>)|(<[^>]+>)|([^<]+)/gi, (match, anchorTag, otherTag, text) => {
    if (anchorTag) {
      if (/^<a\b/i.test(anchorTag)) insideAnchor = true;
      if (/^<\/a\b/i.test(anchorTag)) insideAnchor = false;
      return anchorTag;
    }
    if (otherTag) return otherTag;
    if (insideAnchor) return text;

    let processed = text;
    // Remplacer les hashtags (#tag) exactement comme sur Facebook
    processed = processed.replace(/(^|[\s\(\[\{.,;:!?])#([a-zA-Z0-9_\u00C0-\u017F]+)/g, (_m: string, prefix: string, tagWord: string) => {
      return `${prefix}<a href="/wab/recherche?q=%23${encodeURIComponent(tagWord)}" class="font-bold text-[#006874] hover:underline cursor-pointer">#${tagWord}</a>`;
    });
    // Remplacer les mentions (@user) exactement comme sur Facebook
    processed = processed.replace(/(^|[\s\(\[\{.,;:!?])@([a-zA-Z0-9_.\-\u00C0-\u017F]+)/g, (_m: string, prefix: string, userWord: string) => {
      return `${prefix}<a href="/wab/profil?user=${encodeURIComponent(userWord)}" class="font-bold text-[#006874] hover:underline cursor-pointer">@${userWord}</a>`;
    });
    return processed;
  });
}
