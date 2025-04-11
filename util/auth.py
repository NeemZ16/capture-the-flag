from util.database import user_collection
from flask_restful import Resource
from flask import request

class Register(Resource):
    
    def post(self):
        data = request.get_json()
        
        username = data["username"]
        password = data["password"]

        return
class Login(Resource):
    
    def post(self):
        data = request.get_json()

        username = data["username"]
        password = data["password"]

        return

class Logout(Resource):
    
    def post(self):
        data = request.get_json()

        return