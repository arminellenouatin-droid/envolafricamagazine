import fs from 'node:fs';
const audit = JSON.parse(fs.readFileSync('/tmp/eam-navigation-audit.json', 'utf8'));
const endpoints = [...new Set(audit.apiCalls.map(x => x.endpoint).filter(e => e.startsWith('/api/')).map(e => e.split('?')[0]))].filter(e => !e.includes('${'));
const base = process.env.BASE_URL || 'http://127.0.0.1:3100';
for (const endpoint of endpoints) {
  try {
    const res = await fetch(base + endpoint, { redirect: 'manual' });
    if (res.status === 404 || res.status >= 500) console.log(`${res.status}\t${endpoint}`);
  } catch (e) { console.log(`ERR\t${endpoint}\t${e.message}`); }
}
console.log(`CHECKED\t${endpoints.length}`);
