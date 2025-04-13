from util.database import user_collection, auth_token_collection
from flask_restful import Resource
from flask import request, make_response
import re
import bcrypt
import uuid
import secrets
import hashlib
import html
from datetime import datetime, timedelta

salt = b'$2b$12$ZN.yq1rc10ttyUtJENwquO'

class Register(Resource):

    def post(self):
        
        data = request.get_json()
        
        username = data["username"]
        password = data["password"]

        valid_username, msg, status_code = validate_username(username)
        if not valid_username:
            return init_response(msg, status_code)

        valid_pw, msg, status_code = validate_pw(password)
        if not valid_pw:
            return init_response(msg, status_code)

        hashed_pw = bcrypt.hashpw(password.encode(), salt)

        id = str(uuid.uuid4())

        try:
            user_collection.insert_one({"id": id, "username": username, "password": hashed_pw})
            return init_response("Registration Successful!", 200)

        except Exception as e:
            return init_response(str(e), 500)
            
    
class Login(Resource):

    def post(self):

        data = request.get_json()

        username = data["username"]
        password = data["password"]

        safe_username = html.escape(username)
        
        hashed_pw = bcrypt.hashpw(password.encode(), salt)

        user_info = user_collection.find_one({"username": safe_username, "password": hashed_pw})

        if user_info is None:
            return init_response("Incorrect username or password", 401)

        auth_token = secrets.token_hex(16)
        hashed_token = hashlib.sha256(auth_token.encode()).hexdigest()

        try:
            auth_token_collection.insert_one({"id": user_info["id"], "auth_token": hashed_token})
        except Exception as e:
            return init_response(str(e), 500)

        expire = 3600
        current_time = datetime.now()
        expiration_time = current_time + timedelta(seconds=expire)

        current_time = datetime.now()
        max_age = int((expiration_time - current_time).total_seconds())

        res = init_response("Login Successful!", 200)
        res.set_cookie("auth_token", auth_token, httponly=True, max_age=max_age, path="/")

        return res

class Logout(Resource):
    
    def post(self):

        auth_token = request.cookies.get("auth_token")

        if not auth_token:
            res = init_response("auth_token not found", 400)
            return res

        hashed_token = hashlib.sha256(auth_token.encode()).hexdigest()

        try:
            auth_token_collection.delete_one({"auth_token": hashed_token})
            res = init_response("Successfully logged out", 302)
            res.headers["Location"] = "/"
            res.set_cookie("auth_token", max_age=0)
            return res

        except Exception as e:
            return init_response(str(e), 500)


def validate_pw(password):
    """
    constraints:
    - length is at least 8
    - contains at least 1 lowercase
    - contains at least 1 uppercase
    - contains at least 1 number
    - contains at least 1 special characters
    - does not contain any invalid characters (eg. any character that is not an alphanumeric or one of the special characters)
    """

    special_chars = set("!@#$%^&*()-_=+[]{}|;:',.<>?/`~")

    if len(password) < 8:
        msg = "Password must be at least 8 characters long"
        return False, msg, 401
    
    if not any(char.islower() for char in password):
        msg = "Password must contain at least 1 lowercase character"
        return False, msg, 401

    if not any(char.isupper() for char in password):
        msg = "Password must contain at least 1 uppercase character"
        return False, msg, 401

    if not any(char.isdigit() for char in password):
        msg = "Password must contain at least 1 number"
        return False, msg, 401

    if not any(char in special_chars for char in password):
        msg = "Password must contain at least 1 special character"
        return False, msg, 401
    
    if not all(char.isalnum() or char in special_chars for char in password):
        msg = "Password can only contain alphanumeric characters and special characters"
        return False, msg, 401
    
    return True


def validate_username(username):
    """
    constraints
    - only allow lowercase, uppercase characters, numbers, and underscore
    - only allow username in range(1, 20)
    """
    if not bool(re.fullmatch(r'[a-zA-Z0-9_]', username)):
        msg = "Username can only contain alphabet characters, numbers, and underscore"
        return False, msg, 401

    if len(username) < 1:
        msg = "Username is not provided"
        return False, msg, 401
    
    if len(username) > 20:
        msg = "Username can't be larger than 20 characters"
        return False, msg, 401

    try:
        result = user_collection.find_one({"username": username})
        if result:
            msg = "Username already taken"
            return False, msg, 401

    except Exception as e:
        return False, str(e), 500

    return True


def init_response(text: str, status_code: int, content_type="text/plain"):
    res = make_response(text, status_code)
    res.headers["X-Content-Type-Options"] = "nosniff"
    res.headers["Connection"] = "keep-alive"

    if content_type == "text/plain":
        res.mimetype = content_type + "; charset=utf-8"
    res.mimetype = content_type

    return res
