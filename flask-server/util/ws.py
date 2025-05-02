from shared import socketio
from flask import request
from util.wsHelpers import Helper

### WS EVENTS DEFINED IN THIS FILE

# global constants and helper methods defined in helper obj
helper = Helper()

@socketio.on("connect")
def initWs():
    playerName = request.args.get("username")

    socketio.emit("player_joined", helper.addNewPlayer(playerName, request.sid))

    socketio.emit("init", {
        "players" : helper.players,
        "teamData": helper.teamData,
    })

@socketio.on("move")
def broadcastMove(data):
    socketio.emit("move", data, include_self=False)

@socketio.on("disconnect")
def broadcastLeave():
    socketio.emit("player_left", helper.removePlayer(request.sid))

@socketio.on("flag_taken")
def broadcastFlagTaken(data):
    

    # TODO: update teamData flag position
    # TODO: update players hasFlag
    socketio.emit("flag_taken", data, include_self=False)
    
    