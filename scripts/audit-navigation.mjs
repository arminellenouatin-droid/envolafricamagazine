import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('src/app');
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(tsx|ts)$/.test(entry.name)) files.push(full);
  }
}
walk(root);
const routes = new Set(['/']);
for (const f of files) {
  const rel = path.relative(root, f).replaceAll('\\', '/');
  if (rel.endsWith('/page.tsx')) {
    let r = '/' + rel.slice(0, -'/page.tsx'.length);
    r = r.replace(/\/\[[^/]+\]/g, '/__DYNAMIC__');
    if (r === '') r = '/';
    routes.add(r);
  }
}
const hrefs = new Map();
const buttons = [];
const apiCalls = [];
for (const f of files) {
  const text = fs.readFileSync(f, 'utf8');
  const rel = path.relative(process.cwd(), f).replaceAll('\\', '/');
  for (const m of text.matchAll(/href\s*=\s*["'`]([^"'`]+)["'`]/g)) {
    const href = m[1];
    if (href.startsWith('/')) {
      if (!hrefs.has(href)) hrefs.set(href, []);
      hrefs.get(href).push(rel);
    }
  }
  for (const m of text.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)) {
    const attrs = m[1];
    const label = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100);
    buttons.push({ file: rel, label, hasHandler: /onClick\s*=|type\s*=\s*["']submit|formAction\s*=/.test(attrs) });
  }
  for (const m of text.matchAll(/fetch\(\s*["'`]([^"'`]+)["'`]/g)) apiCalls.push({ file: rel, endpoint: m[1] });
}
const dynamic = href => href.replace(/\/[^/]+(?=\/|$)/g, seg => seg.startsWith('/__') ? seg : seg).replace(/\/[^/]+/g, seg => seg);
console.log(JSON.stringify({ routes: [...routes].sort(), hrefs: Object.fromEntries([...hrefs.entries()].sort()), buttons, apiCalls }, null, 2));
