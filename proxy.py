#!/usr/bin/env python3
"""
Torrent Search Proxy — bypass CORS cho Lampa
Chạy: python3 proxy.py
Port: 8585
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.request import urlopen, Request
from urllib.parse import urlparse, parse_qs, urlencode, quote
from urllib.error import URLError
import json
import re

PORT = 8585

SOURCES = {
    'knaben': {
        'url': 'https://knaben.eu/api/v1?search={q}&orderBy=seeders&orderDirection=desc&size=50&categories[]=200&categories[]=205&categories[]=207&categories[]=500&categories[]=501',
        'parser': 'knaben'
    },
    'apibay': {
        'url': 'https://apibay.org/q.php?q={q}&cat=0',
        'parser': 'apibay'
    },
    'yts': {
        'url': 'https://yts.mx/api/v2/list_movies.json?query_term={q}&sort_by=seeds&limit=20',
        'parser': 'yts'
    },
    'tcsv': {
        'url': 'https://torrents-csv.com/service/search?q={q}&size=50&page=1',
        'parser': 'tcsv'
    },
    'bitsearch': {
        'url': 'https://bitsearch.to/api/v1/search?q={q}&category=1&sort=seeders',
        'parser': 'bitsearch'
    },
    'solidtorrents': {
        'url': 'https://solidtorrents.to/api/v1/search?q={q}&category=Video&sort=seeders',
        'parser': 'solidtorrents'
    },
    'eztv': {
        'url': 'https://eztv.re/api/get-torrents?keywords={q}&limit=50',
        'parser': 'eztv'
    },
    'therarbg': {
        'url': 'https://therarbg.to/get-posts/keywords:{q}:category:Movies/',
        'parser': 'therarbg'
    },
}

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json, text/html, */*',
}

def fmt_bytes(b):
    b = int(b or 0)
    if b >= 1e12: return f'{b/1e12:.2f} TB'
    if b >= 1e9:  return f'{b/1e9:.2f} GB'
    if b >= 1e6:  return f'{b/1e6:.0f} MB'
    if b >= 1e3:  return f'{b/1e3:.0f} KB'
    return f'{b} B'

def make_magnet(hash_, name=''):
    trackers = [
        'udp://tracker.opentrackr.org:1337/announce',
        'udp://open.stealth.si:80/announce',
        'udp://tracker.torrent.eu.org:451/announce',
        'udp://tracker.tiny-vps.com:6969/announce',
        'udp://exodus.desync.com:6969/announce',
    ]
    tr = ''.join(f'&tr={quote(t)}' for t in trackers)
    return f'magnet:?xt=urn:btih:{hash_.lower()}&dn={quote(name)}{tr}'

def get_quality(title):
    m = re.search(r'\b(2160p|4K|UHD|1080p|720p|480p|BluRay|WEB-?DL|WEBRip|HDRip|REMUX|HDTV|DVDRip)\b', title, re.I)
    return m.group(1).upper() if m else ''

def norm(title, hash_, seeds, peers, size_bytes, tracker):
    hash_ = re.sub(r'[^a-f0-9]', '', (hash_ or '').lower())
    if len(hash_) not in (32, 40): return None
    if not title: return None
    sb = int(size_bytes or 0)
    return {
        'title':   title.strip(),
        'hash':    hash_,
        'seeds':   int(seeds  or 0),
        'peers':   int(peers  or 0),
        'size':    fmt_bytes(sb),
        'sizeNum': sb,
        'tracker': tracker,
        'quality': get_quality(title),
        'magnet':  make_magnet(hash_, title),
    }

def parse_knaben(data):
    hits = data.get('hits', [])
    if not isinstance(hits, list): hits = []
    out = []
    for h in hits:
        r = norm(
            h.get('title') or h.get('name',''),
            h.get('infohash') or h.get('info_hash') or h.get('hash',''),
            h.get('seeders') or h.get('seeds', 0),
            h.get('leechers') or h.get('peers', 0),
            h.get('bytes') or h.get('size_bytes', 0),
            'Knaben'
        )
        if r: out.append(r)
    return out

def parse_apibay(data):
    if not isinstance(data, list): return []
    out = []
    for r in data:
        if not r.get('info_hash') or r.get('id') == '0': continue
        res = norm(r.get('name',''), r.get('info_hash',''),
                   r.get('seeders',0), r.get('leechers',0),
                   r.get('size',0), 'TPB')
        if res: out.append(res)
    return out

def parse_yts(data):
    movies = (data.get('data') or {}).get('movies') or []
    out = []
    for movie in movies:
        for t in (movie.get('torrents') or []):
            title = f"{movie.get('title_english','')} ({movie.get('year','')}) {t.get('quality','')} {t.get('type','')} [YTS]"
            r = norm(title, t.get('hash',''),
                     t.get('seeds',0), t.get('peers',0),
                     t.get('size_bytes',0), 'YTS')
            if r: out.append(r)
    return out

def parse_tcsv(data):
    out = []
    for t in (data.get('torrents') or []):
        r = norm(t.get('name',''),
                 t.get('infohash') or t.get('info_hash',''),
                 t.get('seeders',0), t.get('leechers',0),
                 t.get('size_bytes') or t.get('size',0), 'TorrCSV')
        if r: out.append(r)
    return out

def parse_bitsearch(data):
    items = data.get('results', data if isinstance(data, list) else [])
    out = []
    for r in items:
        res = norm(r.get('name') or r.get('title',''),
                   r.get('info_hash') or r.get('infohash') or r.get('hash',''),
                   r.get('seeders') or r.get('seeds',0),
                   r.get('leechers') or r.get('peers',0),
                   r.get('size',0), 'Bitsearch')
        if res: out.append(res)
    return out

def parse_solidtorrents(data):
    out = []
    for r in (data.get('results') or []):
        swarm = r.get('swarm') or {}
        res = norm(r.get('title') or r.get('name',''),
                   r.get('infohash') or r.get('hash',''),
                   swarm.get('seeders') or r.get('seeders',0),
                   swarm.get('leechers') or r.get('leechers',0),
                   r.get('size',0), 'SolidTorr')
        if res: out.append(res)
    return out

def parse_eztv(data):
    out = []
    for r in (data.get('torrents') or []):
        res = norm(r.get('title') or r.get('filename',''),
                   r.get('hash',''),
                   r.get('seeds',0), r.get('peers',0),
                   r.get('size_bytes',0), 'EZTV')
        if res: out.append(res)
    return out

def parse_therarbg(data):
    out = []
    posts = data.get('posts') or data.get('data') or []
    for r in posts:
        hash_ = r.get('infohash') or r.get('hash','')
        res = norm(r.get('title') or r.get('name',''),
                   hash_,
                   r.get('seeders',0), r.get('leechers',0),
                   0, 'RARBG')
        if res: out.append(res)
    return out

PARSERS = {
    'knaben':       parse_knaben,
    'apibay':       parse_apibay,
    'yts':          parse_yts,
    'tcsv':         parse_tcsv,
    'bitsearch':    parse_bitsearch,
    'solidtorrents':parse_solidtorrents,
    'eztv':         parse_eztv,
    'therarbg':     parse_therarbg,
}

def fetch_source(source_key, query):
    src = SOURCES.get(source_key)
    if not src: return []
    url = src['url'].replace('{q}', quote(query))
    try:
        req  = Request(url, headers=HEADERS)
        resp = urlopen(req, timeout=15)
        data = json.loads(resp.read().decode('utf-8', errors='replace'))
        return PARSERS[src['parser']](data)
    except Exception as e:
        print(f'[{source_key}] Error: {e}')
        return []

class Handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # tắt log request mặc định

    def do_OPTIONS(self):
        self.send_response(200)
        self._cors()
        self.end_headers()

    def _cors(self):
        self.send_header('Access-Control-Allow-Origin',  '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')

    def do_GET(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)
        query  = (params.get('q') or params.get('query') or [''])[0].strip()

        if not query:
            self._json(400, {'error': 'missing q'})
            return

        # /search?q=avatar — search tất cả nguồn
        if parsed.path == '/search':
            sources = list(SOURCES.keys())
            results = []
            seen    = set()
            for src in sources:
                for r in fetch_source(src, query):
                    if r['hash'] not in seen:
                        seen.add(r['hash'])
                        results.append(r)
            results.sort(key=lambda x: (-x['seeds'], -x['sizeNum']))
            self._json(200, {'results': results, 'total': len(results)})

        # /search/knaben?q=avatar — search 1 nguồn cụ thể
        elif parsed.path.startswith('/search/'):
            src_key = parsed.path.split('/search/')[-1].strip('/')
            results = fetch_source(src_key, query)
            self._json(200, {'results': results, 'total': len(results)})

        # /sources — liệt kê nguồn
        elif parsed.path == '/sources':
            self._json(200, {'sources': list(SOURCES.keys())})

        else:
            self._json(404, {'error': 'not found'})

    def _json(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self._cors()
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', len(body))
        self.end_headers()
        self.wfile.write(body)

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', PORT), Handler)
    print(f'[Torrent Proxy] Chạy tại http://0.0.0.0:{PORT}')
    print(f'[Torrent Proxy] Nguồn: {", ".join(SOURCES.keys())}')
    print(f'[Torrent Proxy] Test: http://localhost:{PORT}/search?q=avatar')
    server.serve_forever()