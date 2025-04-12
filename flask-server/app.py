
from flask import Flask
from flask_cors import CORS
from flask_restful import Api
from util.auth import Register, Login, Logout


app = Flask(__name__)
CORS(app, origins="http://localhost:8080", supports_credentials=True)
api = Api(app)

api.add_resource(Register, "/register")
api.add_resource(Login, "/login")
api.add_resource(Logout, "/logout")
    
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8000)