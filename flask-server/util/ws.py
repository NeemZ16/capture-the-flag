from flask_socketio import SocketIO, emit
from app import socketio
from flask import request

# keep track of players in game: username -> score, position (x, y), hasFlag
players = {}

# keep track of team data: color -> numPlayers, totalScore, flagTaken
teamData = {}

# hardcoded from client/src/scenes/Game.js
worldSize = 2000

@socketio.on("connect")
def initWs():
    pass