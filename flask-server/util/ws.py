from flask_socketio import SocketIO, emit
from app import socketio
from flask import request
from wsHelpers import Helper

### WS EVENTS DEFINED IN THIS FILE

# global constants and helper methods defined in helper obj
helper = Helper()

@socketio.on("connect")
def initWs():
    # get info from ws connect query
    playerName = request.args.get("username")

    # update team data and players
    

    helper.players[playerName] = {
        "score": 0,
        "position": {
            "x": 0,
            "y": 0
        },
        "hasFlag": False
    }

    # emit player join event
    emit("join", {
        "position": {
            "x": 0,
            "y": 0
        },
        "username": playerName
    })

    # 
    emit("init", {
        "players" : players,
        "teamData": teamData,
    })