from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

mongo_client = MongoClient(os.environ.get("MONGO_URL"))
db = mongo_client[os.environ.get("MONGO_DOCUMENT")]

user_collection = db["user"]
auth_token_collection = db["auth_token"]
salt_collection = db["salt"]