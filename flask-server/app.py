import os, logging
from flask import Flask, request
from flask_cors import CORS
from flask_restful import Api
from util.auth import Register, Login, Logout
from logging.handlers import RotatingFileHandler

app = Flask(__name__)
CORS(app, origins="http://localhost:8080", supports_credentials=True)
api = Api(app)

## ===== LOGGING =====
# ensure logs dir exists
os.makedirs('../logs', exist_ok=True)

# create rotating file handler
file_handler = RotatingFileHandler('../logs/server.log', maxBytes=1_000_000, backupCount=5)
file_handler.setLevel(logging.INFO)
file_handler.setFormatter(logging.Formatter(
    '%(asctime)s %(levelname)s: %(message)s'
))

app.logger.setLevel(logging.INFO)
app.logger.addHandler(file_handler)

@app.before_request
def log_request_info():
    app.logger.info(f"{request.remote_addr} - {request.method} {request.path}")

## ===== ROUTES =====
api.add_resource(Register, "/register")
api.add_resource(Login, "/login")
api.add_resource(Logout, "/logout")
    
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8000)