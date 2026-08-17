import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve('src/app/api');
const routes = [];
function walk(dir) { for (const entry of fs.readdirSync(dir, {withFileTypes:true})) { const full=path.join(dir,entry.name); if(entry.isDirectory()) walk(full); else if(entry.name==='route.ts') routes.push('/api/'+path.relative(root,dir).replaceAll('\\','/')); } }
walk(root);
const normalize = p => p.replace(/\/[\[\]][^/]+/g, '/__PARAM__').replace(/\/\[\.+\]/g,'/__PARAM__');
const routeSet = new Set(routes.map(normalize));
const audit = JSON.parse(fs.readFileSync('/tmp/eam-navigation-audit.json','utf8'));
const refs = [...new Set(audit.apiCalls.map(x=>x.endpoint).filter(e=>e.startsWith('/api/')).map(e=>e.split('?')[0]).filter(e=>!e.includes('${')))].sort();
for (const ref of refs) { const n=normalize(ref); if(!routeSet.has(n)) console.log(`${ref}\t${audit.apiCalls.find(x=>x.endpoint===ref)?.file||''}`); }
console.log(`ROUTES\t${routes.length}\nREFERENCES\t${refs.length}`);
