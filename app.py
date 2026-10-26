"""Sheba Point Bogura - Python (Flask) backend.
Design for load: the whole directory is ONE small pre-compressed JSON held in memory (no database,
no per-request work), so a request costs microseconds and a CDN/nginx can absorb almost all traffic.
Run:  gunicorn -w 4 -k gthread --threads 8 -b 127.0.0.1:8000 app:app"""
import os, gzip, hashlib
from flask import Flask, Response, request, send_from_directory, abort
BASE = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__, static_folder=os.path.join(BASE, "static"), static_url_path="/static")
app.config.update(MAX_CONTENT_LENGTH=1024, SEND_FILE_MAX_AGE_DEFAULT=86400)
RAW = open(os.path.join(BASE, "data", "doctors.json"), "rb").read()
GZ, ETAG = gzip.compress(RAW, 9), '"%s"' % hashlib.sha256(RAW).hexdigest()[:20]
CSP = ("default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; "
       "font-src 'self'; manifest-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'")

@app.after_request
def secure(r):
    r.headers.update({"Content-Security-Policy": CSP, "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY", "Referrer-Policy": "no-referrer",
        "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
        "Permissions-Policy": "geolocation=(), camera=(), microphone=(), payment=()",
        "Cross-Origin-Opener-Policy": "same-origin", "Cross-Origin-Resource-Policy": "same-origin"})
    r.headers.pop("Server", None)
    return r

@app.get("/")
def index():
    r = send_from_directory(app.static_folder, "index.html")
    r.headers["Cache-Control"] = "public, max-age=300, stale-while-revalidate=86400"
    return r

@app.get("/api/doctors")
def doctors():
    h = {"ETag": ETAG, "Cache-Control": "public, max-age=300, stale-while-revalidate=86400", "Vary": "Accept-Encoding"}
    if request.headers.get("If-None-Match") == ETAG: return Response(status=304, headers=h)
    if "gzip" in request.headers.get("Accept-Encoding", ""):
        h["Content-Encoding"] = "gzip"; return Response(GZ, mimetype="application/json", headers=h)
    return Response(RAW, mimetype="application/json", headers=h)

@app.get("/healthz")
def health(): return "ok"

@app.errorhandler(404)
@app.errorhandler(405)
@app.errorhandler(413)
def deny(e): return Response("Not found", status=getattr(e, "code", 404), mimetype="text/plain")
if __name__ == "__main__": app.run("127.0.0.1", 8000)
