from urllib.parse import urljoin, urlparse
import requests
from bs4 import BeautifulSoup

BASE = "https://envolafricamagazinealokpe.vercel.app"
SEEDS = ["/", "/kiosque", "/africa-awards", "/wab", "/emploi", "/marketplace", "/financement", "/salons", "/service", "/conditions", "/cookies"]
seen = set()
queue = list(SEEDS)
results = []
headers = {"User-Agent": "EnvolAfrica-production-link-audit/1.0"}
while queue and len(seen) < 90:
    path = queue.pop(0)
    if path in seen or not path.startswith("/") or path.startswith("//"):
        continue
    seen.add(path)
    try:
        response = requests.get(urljoin(BASE, path), headers=headers, timeout=20, allow_redirects=True)
        body = response.text
        soup = BeautifulSoup(body, "html.parser")
        is_next_error = any(marker in body for marker in ("Application error", "Internal Server Error", "Unhandled Runtime Error"))
        results.append((path, response.status_code, response.url, is_next_error))
        if response.status_code < 400:
            for anchor in soup.select("a[href]"):
                href = anchor.get("href", "").strip()
                parsed = urlparse(href)
                if href.startswith("/") and not href.startswith("//") and "?" not in href and "#" not in href:
                    if href not in seen and href not in queue:
                        queue.append(href)
    except requests.RequestException as exc:
        results.append((path, 0, str(exc), True))

for path, status, final_url, error_marker in results:
    if status >= 400 or status == 0 or error_marker:
        print(f"FAIL\t{status}\t{path}\t{final_url}\tmarker={error_marker}")
print(f"SUMMARY\tchecked={len(results)}\tfailures={sum(1 for row in results if row[1] >= 400 or row[1] == 0 or row[3])}")
