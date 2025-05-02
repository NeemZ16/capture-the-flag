# Try to enable eventlet if it is installable on this runtime
try:
    import eventlet
    eventlet.monkey_patch()
    _async_mode = "eventlet"
except Exception:
    _async_mode = "threading"

import os, logging
from flask import Flask, request
from flask_cors import CORS
from flask_restful import Api
from logging.handlers import RotatingFileHandler

from shared import socketio
from util.ws import *
from util.auth import *

# Flask / Socket.IO setup
app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev_secret")
CORS(app, origins=["http://localhost:8080"], supports_credentials=True)
api = Api(app)
socketio.init_app(app, async_mode=_async_mode)

# logging setup
os.makedirs("../logs", exist_ok=True)
file_handler = RotatingFileHandler("../logs/server.log",
                                   maxBytes=1_000_000, backupCount=5)
file_handler.setLevel(logging.INFO)
file_handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s: %(message)s"))
app.logger.setLevel(logging.INFO)
app.logger.addHandler(file_handler)

# auth endpoints
api.add_resource(Register, "/register")
api.add_resource(Login,    "/login")
api.add_resource(Logout,   "/logout")
api.add_resource(Me,       "/me")

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