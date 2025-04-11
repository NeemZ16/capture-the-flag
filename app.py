
from flask import Flask, request, jsonify
from flask_restful import Api, Resource
from pymongo import MongoClient
from util.database import user_collection
# from util.auth import Register, Login, Logout


app = Flask(__name__)
api = Api(app)

user_collection.insert_one({"user": 1})
# api.add_resource(Register, "/register")
# api.add_resource(Register, "/login")
# api.add_resource(Register, "/logout")

# def create_app():
#     app = Flask(__name__)

#     db.init_app(app)

#     return app


    




if __name__ == "__main__":
    app.run(debug=True)