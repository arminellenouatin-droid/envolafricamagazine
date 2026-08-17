import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve('src/app');
const paths = new Set(['/']);
function walk(dir) { for (const entry of fs.readdirSync(dir, {withFileTypes:true})) { const full=path.join(dir,entry.name); if(entry.isDirectory()) walk(full); else if(entry.name==='page.tsx') { const rel=path.relative(root,dir).replaceAll('\\','/'); if(!rel.split('/').some(s=>s.startsWith('['))) paths.add('/'+rel); } } }
walk(root);
const base = process.env.BASE_URL || 'http://127.0.0.1:3100';
for (const p of [...paths].sort()) { try { const r=await fetch(base+p,{redirect:'manual'}); if(r.status===404||r.status>=500) console.log(`${r.status}\t${p}`); } catch(e) { console.log(`ERR\t${p}\t${e.message}`); } }
console.log(`CHECKED\t${paths.size}`);
