import os
import logging
from uuid import uuid4
from pathlib import Path
from flask import request, jsonify, g
from flask_restful import Resource
from werkzeug.utils import secure_filename

from util.database import user_collection
from shared import socketio

raw_logger = logging.getLogger("raw-http")

# define the base directory and ensure the avatars folder exists
BASE_DIR      = Path(__file__).resolve().parent.parent
UPLOAD_FOLDER = BASE_DIR / "static" / "avatars"
UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)

# allowed file extensions and max upload size (1 MB)
ALLOWED_EXT = {"png", "jpg", "jpeg", "gif"}
MAX_SIZE    = 1 * 1024 * 1024  # 1 MB

def _allowed(filename: str) -> bool:
    # check for a valid extension
    return "." in filename and \
           filename.rsplit(".", 1)[1].lower() in ALLOWED_EXT

def _new_filename(ext: str) -> str:
    # generate a random filename
    return f"{uuid4().hex}.{ext}"

class Profile(Resource):
    def get(self):
        # get the logged-in username from Flask's g
        username = getattr(g, "username", None)
        if not username:
            return {"message": "Not authenticated"}, 401

        # look up the user's avatar URL in MongoDB
        user = user_collection.find_one(
            {"username": username},
            {"_id": 0, "avatarUrl": 1}
        )
        avatar_url = user.get("avatarUrl") if user else None

        # return username and avatar URL
        return {"username": username, "avatarUrl": avatar_url}, 200

class AvatarUpload(Resource):
    def post(self):
        # ensure the user is authenticated
        username = getattr(g, "username", None)
        if not username:
            return "Not authenticated", 401

        # Get the uploaded file
        file = request.files.get("avatar")
        if not file or file.filename == "":
            return "No file uploaded", 400

        # validate
        if not _allowed(file.filename):
            return "Unsupported file type", 415

        # enforce size limit
        file.seek(0, os.SEEK_END)
        size = file.tell()
        file.seek(0)
        if size > MAX_SIZE:
            return f"File too large (> {MAX_SIZE} bytes)", 413

        ext   = secure_filename(file.filename).rsplit(".", 1)[1].lower()
        fname = _new_filename(ext)
        save_path = UPLOAD_FOLDER / fname
        file.save(save_path)

        url = f"/static/avatars/{fname}"

        # Record URL in MongoDB
        user_collection.update_one(
            {"username": username},
            {"$set": {"avatarUrl": url}}
        )

        # broadcast to all players
        socketio.emit(
            "player_avatar_updated",
            {"playerId": username, "avatarUrl": url},
            broadcast=True
        )

        # log the upload event for auditing
        raw_logger.info(f"avatar_uploaded user={username} url={url}")
        return jsonify({"avatarUrl": url})
