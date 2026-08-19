const ALLOWED_TAGS = new Set(["p", "br", "div", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "strong", "b", "em", "i", "u", "blockquote", "a", "sub", "sup"]);

export function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
}

export function plainTextToRichHtml(value: string) {
  return escapeHtml(value).replace(/\r?\n/g, "<br>");
}

export function sanitizeRichText(value: string) {
  const source = String(value ?? "");
  if (!/<[a-z][\s\S]*>/i.test(source)) return source;
  return source
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\s*(script|style|iframe|object|embed|form|input|textarea|button)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
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
        const href = hrefMatch?.[1] ?? "";
        if (!/^(https?:|mailto:)/i.test(href)) return "<a>";
        return `<a href="${escapeHtml(href)}" rel="noopener noreferrer" target="_blank">`;
      }
      return `<${tag}>`;
    })
    .replace(/\s+(style|class|id|title|align|face|color|size)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
}

export function isRichText(value: string) {
  return /<(p|br|div|h[1-6]|ul|ol|li|strong|b|em|i|u|blockquote|a)\b[^>]*>/i.test(value);
}
