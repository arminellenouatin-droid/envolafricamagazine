from pathlib import Path
from collections import defaultdict

root = Path('/home/ubuntu/eam-full/public')
media_ext = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif', '.mp4', '.webm', '.mov', '.mp3', '.wav', '.ogg', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.csv'}
files = [p for p in root.rglob('*') if p.is_file() and p.suffix.lower() in media_ext]
print(f'COUNT {len(files)}')
print(f'TOTAL {sum(p.stat().st_size for p in files)}')
formats = defaultdict(int)
for p in files:
    formats[p.suffix.lower()] += p.stat().st_size
for ext, size in sorted(formats.items()):
    print(f'FORMAT {ext} {size}')
# Compare same stem in common image formats as an evidence-only estimate.
groups = defaultdict(dict)
for p in files:
    if p.suffix.lower() in {'.png', '.jpg', '.jpeg', '.webp'}:
        groups[p.with_suffix('').as_posix()][p.suffix.lower()] = p.stat().st_size
for stem, sizes in sorted(groups.items()):
    if '.webp' in sizes and any(ext in sizes for ext in ('.png', '.jpg', '.jpeg')):
        original = max(sizes.get(ext, 0) for ext in ('.png', '.jpg', '.jpeg'))
        webp = sizes['.webp']
        if original > webp:
            print(f'PAIR {stem} {original} {webp} {original-webp}')
