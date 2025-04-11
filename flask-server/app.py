
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_restful import Api, Resource
from util.auth import Register, Login, Logout


app = Flask(__name__)
CORS(app)
api = Api(app)

api.add_resource(Register, "/register")
api.add_resource(Login, "/login")
api.add_resource(Logout, "/logout")
    
if __name__ == "__main__":
    app.run(debug=True)