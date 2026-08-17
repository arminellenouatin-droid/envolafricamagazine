import fs from 'node:fs';
const audit = JSON.parse(fs.readFileSync('/tmp/eam-navigation-audit.json', 'utf8'));
const base = process.env.BASE_URL || 'http://127.0.0.1:3100';
const links = Object.keys(audit.hrefs).filter(h => !h.includes('__') && !h.includes('['));
for (const href of links) {
  const url = new URL(href, base);
  try {
    const res = await fetch(url, { redirect: 'manual' });
    console.log(`${res.status}\t${href}\t${res.headers.get('location') || ''}`);
  } catch (error) {
    console.log(`ERR\t${href}\t${error.message}`);
  }
}
