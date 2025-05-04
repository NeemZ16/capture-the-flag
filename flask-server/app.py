try:
    import eventlet
    eventlet.monkey_patch()
    _async_mode = "eventlet"
except Exception:
    _async_mode = "threading"

import os, logging, io, time, traceback
from functools import wraps
from flask import Flask, request, g
from flask_cors import CORS
from flask_restful import Api
from logging.handlers import RotatingFileHandler

from shared import socketio
from util.ws import *
from util.auth import *
import hashlib
from util.database import auth_token_collection, user_collection
from util.avatar import Profile, AvatarUpload


# Flask / Socket.IO setup
app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev_secret")
CORS(app, origins=["http://localhost:8080"], supports_credentials=True)
api = Api(app)
socketio.init_app(app, async_mode=_async_mode)

os.environ['TZ'] = 'America/New_York'
time.tzset()

# logging setup
os.makedirs("../logs", exist_ok=True)
file_handler = RotatingFileHandler("../logs/server.log",
                                   maxBytes=1_000_000, backupCount=5)
file_handler.setLevel(logging.INFO)
file_handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s: %(message)s"))
app.logger.setLevel(logging.INFO)
app.logger.addHandler(file_handler)

# raw HTTP logger (first 2 KiB)
RAW_MAX = 2048
raw_handler = RotatingFileHandler("../logs/http_raw.log",
                                  maxBytes=5_000_000, backupCount=3)
raw_handler.setFormatter(logging.Formatter("%(asctime)s %(message)s"))
raw_handler.setLevel(logging.INFO)
raw_logger = logging.getLogger("raw-http")
raw_logger.setLevel(logging.INFO)
raw_logger.addHandler(raw_handler)

# Removes sensitive headers like Authorization and strips out auth_token from cookies
def _strip_auth(hdrs: dict[str, str]) -> dict[str, str]:
    out = {}
    for k, v in hdrs.items():
        # Convert header name to lowercase
        lk = k.lower()
        if lk in ("authorization", "set-cookie"):
            # skip Authorization header completely
            continue
        if lk == "cookie":
            # keep cookies but remove auth_token from them
            v = "; ".join(p for p in v.split(";") if "auth_token" not in p.lower())
        # keep other headers
        out[k] = v 
    return out

# Build a text dump of an HTTP request/response with headers and body
def _dump(prefix: str, hdrs: dict[str, str], body: bytes) -> str:
    # use in-memory text buffer
    sio = io.StringIO()
    sio.write(prefix + "\n")
    for k, v in hdrs.items():
        # write each header line
        sio.write(f"{k}: {v}\n")
    sio.write("\n")
    if body and body.isascii():
        # if body is text, decode and limit size to that of RAW_MAX
        sio.write(body.decode(errors="replace")[:RAW_MAX])
    elif body:
        # if body is binary, just track its size
        sio.write(f"[{len(body)} bytes binary body omitted]")
    return sio.getvalue()

# Attach username for JWT cookie
@app.before_request
def _attach_username():
    g.username = None
    tok = request.cookies.get("auth_token")
    if not tok:
        return

    hashed = hashlib.sha256(tok.encode()).hexdigest()
    entry  = auth_token_collection.find_one({"auth_token": hashed})
    if not entry:
        return

    user = user_collection.find_one({"id": entry["id"]})
    if user:
        g.username = user["username"]


# Raw-request logger
@app.before_request
def _log_raw_req():
    try:
        body = b"" if request.path in {"/register", "/login"} else request.get_data(cache=True)
    except RuntimeError:
        body = b"[response body not logged due to passthrough mode]"

    raw_logger.info(_dump(f">>> {request.method} {request.path}",
                          _strip_auth(dict(request.headers)), body))

# Augmented after_request
@app.after_request
def _log_access_and_raw_resp(resp):
    ip = request.remote_addr or "-"
    app.logger.info("%s %s %s %s %s",
                    ip, g.username, request.method, request.path, resp.status_code)

    try:
        body = b"" if request.path in {"/register", "/login"} else resp.get_data()
    except RuntimeError:
        body = b"[response body not logged due to passthrough mode]"

    raw_logger.info(_dump(f"<<< {resp.status_code} {request.path}",
                          _strip_auth(dict(resp.headers)), body))
    return resp

# Audit registration / login attempts with no plain-text password
def _audit_auth(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        uname = (request.json or {}).get("username", "-")
        try:
            resp = fn(*args, **kwargs)
            status = resp.status_code
            # grab the response text
            reason = resp.get_data(as_text=True).strip()
            if status < 400:
                app.logger.info("AUTH-SUCCESS user=%s ip=%s", uname, request.remote_addr)
            else:
                app.logger.warning("AUTH-FAIL    user=%s ip=%s reason=%s", 
                                   uname, request.remote_addr, reason)
            return resp
        except Exception:
            # log full stack trace if something goes wrong
            app.logger.error("AUTH-ERROR   user=%s ip=%s\n%s", 
                             uname, request.remote_addr, traceback.format_exc())
            raise
    return wrapper

# Patch the two Resource methods
Register.post = _audit_auth(Register.post)
Login.post    = _audit_auth(Login.post)

# Global stack-trace catcher
@app.errorhandler(Exception)
def _log_trace(e):
    app.logger.error("UNHANDLED %s %s\n%s",
                     request.method, request.path, traceback.format_exc())
    return {"error": "internal-server-error"}, getattr(e, "code", 500)

# auth endpoints
api.add_resource(Register, "/register")
api.add_resource(Login,    "/login")
api.add_resource(Logout,   "/logout")
api.add_resource(Me,       "/me")
# Profile endpoints
api.add_resource(Profile,      "/profile")
api.add_resource(AvatarUpload, "/avatar")

@app.after_request
def log_request(response):
    ip     = request.remote_addr or "-"
    method = request.method
    path   = request.path
    status = response.status_code

    app.logger.info(f"{ip} {method} {path} {status}")

    return response

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=8000, log_output=True)