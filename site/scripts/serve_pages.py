# Local preview server that mimics GitHub Pages: directory index.html, trailing-slash
# redirects (keeping the query string) and 404.html for unknown paths.
# Usage: python3 scripts/serve_pages.py out 3000

import http.server, os, sys, urllib.parse
ROOT = os.path.abspath(sys.argv[1]); PORT = int(sys.argv[2])
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def log_message(self, *a): pass
    def send_head(self):
        path = urllib.parse.unquote(urllib.parse.urlsplit(self.path).path)
        fs = os.path.join(ROOT, path.lstrip('/'))
        if os.path.isdir(fs) and not path.endswith('/'):
            if os.path.exists(os.path.join(fs, 'index.html')):
                q = urllib.parse.urlsplit(self.path).query
                self.send_response(301); self.send_header('Location', path + '/' + ('?' + q if q else '')); self.end_headers(); return None
        if os.path.isdir(fs) and os.path.exists(os.path.join(fs, 'index.html')) or os.path.isfile(fs):
            return super().send_head()
        if os.path.isfile(fs + '.html'):
            self.path = path + '.html'; return super().send_head()
        f = open(os.path.join(ROOT, '404.html'), 'rb')
        self.send_response(404); self.send_header('Content-Type', 'text/html'); self.end_headers()
        return f
class S(http.server.ThreadingHTTPServer):
    request_queue_size = 256
    daemon_threads = True
S(('127.0.0.1', PORT), H).serve_forever()
