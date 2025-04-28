from flask_socketio import SocketIO, emit
from app import socketio
from flask import request

# keep track of players in game: username -> score, position (x, y), hasFlag
players = {}

# keep track of team data: color -> numPlayers, totalScore, flagTaken
teamData = {
    "red": {"numPlayers": 0, "score": 0, "flagTaken": False},
    "blue": {"numPlayers": 0, "score": 0, "flagTaken": False},
    "yellow": {"numPlayers": 0, "score": 0, "flagTaken": False},
    "green": {"numPlayers": 0, "score": 0, "flagTaken": False},
}

# hardcoded from client/src/scenes/Game.js
worldSize = 3000

# 

@socketio.on("connect")
def initWs():
    pass