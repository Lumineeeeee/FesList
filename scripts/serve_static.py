"""静态预览服务器：把 expo export 的静态路由映射成干净的 URL。

/list        -> list.html
/booth/A05   -> booth/[id].html
"""

import os
import posixpath
import re
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = r"D:\Feser_\fes-list\dist"


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def translate_path(self, path):
        clean = posixpath.normpath(path.split("?", 1)[0].split("#", 1)[0])
        fs = os.path.join(ROOT, clean.lstrip("/"))

        if os.path.isfile(fs):
            return fs
        if os.path.isfile(fs + ".html"):
            return fs + ".html"
        if re.match(r"^/booth/[^/]+/?$", clean):
            dynamic = os.path.join(ROOT, "booth", "[id].html")
            if os.path.isfile(dynamic):
                return dynamic
        if clean in ("", "/"):
            return os.path.join(ROOT, "index.html")
        return fs


if __name__ == "__main__":
    ThreadingHTTPServer(("127.0.0.1", 8100), Handler).serve_forever()
