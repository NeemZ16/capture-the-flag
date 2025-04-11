from util.database import user_collection
from flask_restful import Resource
from flask import request

class Register(Resource):
    
    def post(self):
        data = request.get_json()
        
        username = data["username"]
        password = data["password"]

        return "to do", 501
class Login(Resource):


    def post(self):
        data = request.get_json()

        username = data["username"]
        password = data["password"]

        print("Username: ", username)
        print("Password: ", password)

        return "to do", 501

class Logout(Resource):
    
    def post(self):
        data = request.get_json()

        return "to do", 501
