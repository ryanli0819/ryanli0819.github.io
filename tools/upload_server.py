"""Local helper server used only while generating explainer videos.

Serves the project folder on http://localhost:5174 and accepts
POST /save?name=<file> to write a rendered video into assets/video/.
Run from the project root:  python3 tools/upload_server.py
"""
import http.server
import os
import re
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "video")


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def do_POST(self):
        q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        name = (q.get("name") or [""])[0]
        if not re.fullmatch(r"[a-z0-9-]+\.(mp4|webm|json)", name):
            self.send_error(400, "bad name")
            return
        data = self.rfile.read(int(self.headers.get("Content-Length", 0)))
        out = os.path.join(ROOT, "tools") if name.endswith(".json") else OUT
        os.makedirs(out, exist_ok=True)
        with open(os.path.join(out, name), "wb") as f:
            f.write(data)
        self.send_response(200)
        self.end_headers()
        self.wfile.write(f"saved {name} ({len(data)} bytes)".encode())


if __name__ == "__main__":
    http.server.ThreadingHTTPServer(("127.0.0.1", 5174), Handler).serve_forever()
