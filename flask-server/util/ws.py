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
        "flagPossession": helper.flagPossession
    })

@socketio.on("move")
def broadcastMove(data):
    socketio.emit("move", data, include_self=False)

@socketio.on("disconnect")
def broadcastLeave():
    socketio.emit("player_left", helper.removePlayer(request.sid))

@socketio.on("flag_taken")
def broadcastFlagTaken(data):

    # update game state
    helper.teamData[data["color"]]["flagPosition"] = None
    helper.players[data["username"]]["hasFlag"] = True
    helper.flagPossession[data["username"]] = data["color"]

    # broadcast client data
    socketio.emit("flag_taken", data, include_self=False)
    
@socketio.on("flag_scored")
def broadcastFlagScored(data):
    # update player score and hasFlag
    username = data["username"]
    helper.players[username]["score"] += 1
    helper.players[username]["hasFlag"] = False

    # update team score
    playerTeam = helper.players[username]["color"]
    helper.teamData[playerTeam]["score"] += 1
    data["teamScore"] = [playerTeam, helper.teamData[playerTeam]["score"]]
    data["playerScore"] = helper.teamData[playerTeam]["score"]

    # update flag possession and position
    flagColor = helper.flagPossession.pop(username)
    helper.resetFlag(flagColor)

    print(helper.teamData)
    # broadcast client data
    socketio.emit("flag_scored", data, include_self=False)
    
@socketio.on("player_killed")
def killPlayer(data):
    
    # if killed player has a flag, update following
    if data["hasFlag"]:
        username = data["username"]
        helper.players[username]["hasFlag"] = False
        flagColor = helper.flagPossession.pop(username)
        helper.resetFlag(flagColor)
    
    socketio.emit("player_killed", data, include_self=False)
    

@socketio.on("pass_flag")
def passFlag():
    pass
