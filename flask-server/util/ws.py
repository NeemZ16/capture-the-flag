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

    # broadcast client data
    socketio.emit("flag_scored", data, include_self=False)
    
@socketio.on("player_killed")
def killPlayer(data):
    # data = {killer, targetUsername, hasFlag, flagColor, targetBasePosition}

    helper.players[data["killer"]]["kill_score"] += 1

    print(helper.players)
    
    # if killed player has a flag, update following
    if data["hasFlag"]:
        username = data["targetUsername"]
        helper.players[username]["hasFlag"] = False
        flagColor = helper.flagPossession.pop(username)
        helper.resetFlag(flagColor)

    socketio.emit("player_killed", data, include_self=False)

@socketio.on("steal_flag")
def stealFlag(data):
    # data = {stealer, targetUsername, flagColor, freeze_time}

    helper.players[data["stealer"]]["steal_score"] += 1

    helper.players[data["stealer"]]["hasFlag"] = True
    helper.flagPossession[data["stealer"]] = data["flagColor"]

    helper.players[data["targetUsername"]]["hasFlag"] = False
    helper.flagPossession.pop(data["targetUsername"])

    socketio.emit("steal_flag", data, include_self=False)

@socketio.on("pass_flag")
def passFlag(data):
    # data = {sender, targetUsername, flagColor}
    # update receiver with flag
    helper.players[data["targetUsername"]]["hasFlag"] = True
    helper.flagPossession[data["targetUsername"]] = data["flagColor"]

    # update sender without flag
    helper.players[data["sender"]]["hasFlag"] = False
    helper.flagPossession.pop(data["sender"])

    socketio.emit("pass_flag", data, include_self=False)
    
