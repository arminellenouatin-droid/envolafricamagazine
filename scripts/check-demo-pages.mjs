const base = process.env.BASE_URL || 'http://127.0.0.1:3100';
const specs = [
  ['/api/articles', x => (x.articles || []).slice(0, 2).map(a => `/article/${a.slug}`), 'articles'],
  ['/api/jobs', x => (x.offers || []).slice(0, 2).map(a => `/emploi/offres/${a.id}`), 'jobs'],
  ['/api/crowdfunding/projects', x => (x.projets || []).slice(0, 2).map(a => `/financement/projets/${a.id}`), 'crowdfunding'],
  ['/api/awards/competitions', x => (x.competitions || []).slice(0, 2).map(a => `/africa-awards/competitions/${a.slug}`), 'awards'],
  ['/api/awards/candidates', x => (x.candidates || []).slice(0, 2).map(a => `/africa-awards/vote/${a.id}`), 'votes'],
  ['/api/marketplace/products', x => (x.products || []).slice(0, 2).map(a => `/marketplace/produits/${a.id}`), 'marketplace'],
  ['/api/wab/posts', x => (x.posts || []).slice(0, 2).map(a => `/wab`), 'wab'],
];
for (const [api, makePaths, label] of specs) {
  try {
    const apiRes = await fetch(base + api);
    const data = await apiRes.json();
    const paths = makePaths(data);
    for (const p of paths) {
      const r = await fetch(base + p, { redirect: 'manual' });
      console.log(`${label}\t${r.status}\t${p}\t${r.headers.get('location') || ''}`);
    }
    if (!paths.length) console.log(`${label}\tNO_DATA\t${api}`);
  } catch (e) { console.log(`${label}\tERR\t${api}\t${e.message}`); }
}
