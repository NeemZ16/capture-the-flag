import random

class Helper:
    def __init__(self):
        'globally track players and team data in Helper object'
        # hardcoded from client/src/scenes/Game.js
        self.worldSize = 3000
        self.padding = 200  # padding between flag and world borders
        self.spawnOffset = 150  # max player spawn distance from base

        # players: username -> score, position (x, y), color, hasFlag
        self.players = {}
        
        # team data: color -> numPlayers, totalScore, flagPosition
        self.teamData = {
            "red": {"numPlayers": 0, "score": 0, "flagPosition": {"x": self.padding, "y": self.padding}},
            "blue": {"numPlayers": 0, "score": 0, "flagPosition": {"x": self.worldSize - self.padding, "y": self.padding}},
            "yellow": {"numPlayers": 0, "score": 0, "flagPosition": {"x": self.padding, "y": self.worldSize - self.padding}},
            "green": {"numPlayers": 0, "score": 0, "flagPosition": {"x": self.worldSize - self.padding, "y": self.worldSize - self.padding}},
        }

    def leastPlayersTeam(self):
        'get team key with least number of players'
        return min(self.teamData, key=lambda team: self.teamData[team]['numPlayers'])
    
    def getSpawnPosition(self, teamKey):
        basePosition = self.teamData[teamKey]["flagPosition"]

        # set x and y to some offset within self.padding from the team's base
        spawn = {"x": 0, "y": 0}
        spawn["x"] = random.randint(basePosition['x'] - self.spawnOffset, basePosition['x'] + self.spawnOffset)
        spawn["y"] = random.randint(basePosition['y'] - self.spawnOffset, basePosition['y'] + self.spawnOffset)

        return spawn
    
    def addNewPlayer(self, username):
        '''
        Adds player to team with least players.
        Updates player and team data.
        Returns joinData for join ws event.
        '''
        teamToJoin = self.leastPlayersTeam()
        spawnPosition = self.getSpawnPosition(teamToJoin)

        self.players[username] = {
            "score": 0,
            "hasFlag": False,
            "color": teamToJoin,
            "position": spawnPosition
        }
        self.teamData[teamToJoin]["numPlayers"] += 1
        
        joinData = {
            "username": username,
            "hasFlag": False,
            "color": teamToJoin,
            "position": spawnPosition
        }

        return joinData