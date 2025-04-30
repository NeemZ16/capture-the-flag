from shared import socketio
from flask import request
from util.wsHelpers import Helper

### WS EVENTS DEFINED IN THIS FILE

# global constants and helper methods defined in helper obj
helper = Helper()
print("WS PY HERE")

@socketio.on("connect")
def initWs():
    print("WS CONNECTED HERE :)")
    playerName = request.args.get("username")

    socketio.emit("join", helper.addNewPlayer(playerName))

    socketio.emit("init", {
        "players" : helper.players,
        "teamData": helper.teamData,
    })