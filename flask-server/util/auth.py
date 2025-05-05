from util.database import user_collection, auth_token_collection
from flask_restful import Resource
from flask import request, make_response
import re
import bcrypt
import uuid
import secrets
import hashlib
import html

salt = bcrypt.gensalt()

class Register(Resource):

    def post(self):
        
        data = request.get_json()
        
        username = data["username"]
        password = data["password"]

        safe_username = html.escape(username)
        safe_password = html.escape(password)

        valid_username, msg, status_code = validate_username(safe_username)
        if not valid_username:
            return init_response(msg, status_code)

        valid_pw, msg, status_code = validate_pw(safe_password)
        if not valid_pw:
            return init_response(msg, status_code)

        hashed_pw = bcrypt.hashpw(safe_password.encode(), salt)

        id = str(uuid.uuid4())

        try:
            new_user = {
                "id": id,
                "username": username,
                "password": hashed_pw,
                "stats": {
                    "kills": 0,
                    "steals": 0
                }
            }

            user_collection.insert_one(new_user)
            return init_response("Registration Successful!", 200)

        except Exception as e:
            return init_response(str(e), 500)
            
    
class Login(Resource):

    def post(self):

        data = request.get_json()

        username = data["username"]
        password = data["password"]

        safe_username = html.escape(username)
        safe_password = html.escape(password)
        
        user_info = user_collection.find_one({"username": safe_username})

        if user_info is None or not bcrypt.checkpw(safe_password.encode(), user_info["password"]):
            return init_response("Incorrect username or password", 401)

        auth_token = secrets.token_urlsafe(32)
        hashed_token = hashlib.sha256(auth_token.encode()).hexdigest()

        # expire as int enough to set cookie
        expire = 3600
        try:
            auth_token_collection.insert_one({"id": user_info["id"], "auth_token": hashed_token})
        except Exception as e:
            return init_response(str(e), 500)

        res = init_response("Login Successful!", 200)
        res.set_cookie("auth_token", auth_token, httponly=True, max_age=expire, path="/")

        return res

class Logout(Resource):
    
    def post(self):

        auth_token = request.cookies.get("auth_token")

        if not auth_token:
            res = init_response("auth_token not found", 400)
            return res

        hashed_token = hashlib.sha256(auth_token.encode()).hexdigest()

        try:
            result = auth_token_collection.delete_one({"auth_token": hashed_token})
            if result.deleted_count == 0:
                res = init_response("auth_token not found in DB", 400)
                res.set_cookie("auth_token", max_age=0)

                return res

            res = init_response("Successfully logged out", 200)
            res.set_cookie("auth_token", max_age=0)
            return res

        except Exception as e:
            return init_response(str(e), 500)

# used to ping backend to check if user is logged in
class Me(Resource):

    def get(self):
        auth_token = request.cookies.get("auth_token")
        if not auth_token:
            return {"username": ""}, 200

        hashed = hashlib.sha256(auth_token.encode()).hexdigest()
        entry = auth_token_collection.find_one({"auth_token": hashed})
        if not entry:
            return {"username": ""}, 200

        user = user_collection.find_one({"id": entry["id"]})
        return {"username": user["username"] if user else ""}, 200

class PlayerStats(Resource):
    
    def get(self, username):
        userStats = user_collection.find_one(
            {"username": username},
            {"_id": 0, "stats": 1}
        )
        if not userStats:
            return {"error": "Player not found"}, 404
        return userStats['stats'], 200

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
    
    return True, "", 200


def validate_username(username):
    """
    constraints
    - length between range(1, 20)
    - only letters, digits, and underscore
    - underscore is optional
    """

    if not bool(re.fullmatch(r'^[A-Za-z0-9_]+$', username)):
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

    return True, "", 200


def init_response(text: str, status_code: int, content_type="text/plain"):
    res = make_response(text, status_code)
    res.headers["X-Content-Type-Options"] = "nosniff"
    res.headers["Connection"] = "keep-alive"

    if content_type == "text/plain":
        res.mimetype = content_type + "; charset=utf-8"
    res.mimetype = content_type

    return res