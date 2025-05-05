import random
from util.database import user_collection

class Helper:
    def __init__(self):
        '''globally track game state in Helper object'''
        self.worldSize = 2000  # hardcoded from client/src/scenes/Game.js
        self.padding = 200  # padding between flag and world borders
        self.spawnOffset = 150  # max player spawn distance from base

        # connections: socketID -> username
        self.connections = {}

        # players: username -> score, position (x, y), color, hasFlag
        self.players = {}

        # flagPossession: username -> flagColor. to prevent bug of refresh --> flag disappears
        self.flagPossession = {}
        
        # team data: color -> numPlayers, totalScore, flagPosition
        self.teamData = {
            "red": {
                "numPlayers": 0, 
                "score": 0, 
                "flagPosition": {"x": self.padding, "y": self.padding}, 
                "basePosition": {"x": self.padding, "y": self.padding}
            },
            "blue": {
                "numPlayers": 0, 
                "score": 0, 
                "flagPosition": {"x": self.worldSize - self.padding, "y": self.padding}, 
                "basePosition": {"x": self.worldSize - self.padding, "y": self.padding}
            },
            "yellow": {
                "numPlayers": 0, 
                "score": 0, 
                "flagPosition": {"x": self.padding, "y": self.worldSize - self.padding}, 
                "basePosition": {"x": self.padding, "y": self.worldSize - self.padding}
            },
            "green": {
                "numPlayers": 0, 
                "score": 0, 
                "flagPosition": {"x": self.worldSize - self.padding, "y": self.worldSize - self.padding}, 
                "basePosition": {"x": self.worldSize - self.padding, "y": self.worldSize - self.padding}
            },
        }

    def leastPlayersTeam(self):
        'get team key with least number of players'
        return min(self.teamData, key=lambda team: self.teamData[team]['numPlayers'])
    
    def getSpawnPosition(self, teamKey):
        basePosition = self.teamData[teamKey]["basePosition"]

        # set x and y to some offset within self.padding from the team's base
        spawn = {"x": 0, "y": 0}
        spawn["x"] = random.randint(basePosition['x'] - self.spawnOffset, basePosition['x'] + self.spawnOffset)
        spawn["y"] = random.randint(basePosition['y'] - self.spawnOffset, basePosition['y'] + self.spawnOffset)

        return spawn
    
    def addNewPlayer(self, username, sid):
        '''
        Adds player to team with least players.
        Updates player and team data.
        Returns joinData for join ws event.
        '''
        teamToJoin = self.leastPlayersTeam() # color
        spawnPosition = self.getSpawnPosition(teamToJoin) # spawn position {"x", "y"}

        self.connections[sid] = username

        self.players[username] = {
            "score": 0,
            "hasFlag": False,
            "color": teamToJoin,
            "position": spawnPosition,
            "pfp": self.findAvatar(username),
            "kill_score": 0,
            "steal_score": 0,
        }

        self.teamData[teamToJoin]["numPlayers"] += 1 # increment number of teams
        
        joinData = {
            "username": username,
            "hasFlag": False,
            "color": teamToJoin,
            "position": spawnPosition,
            "pfp": self.findAvatar(username)
        }

        return joinData
    
    def removePlayer(self, sid):
        '''
        Remove player from players.  
        Update team count and score.  
        Reset flags if needed
        '''
        # remove player and connection
        disconnectedUsername = self.connections.pop(sid)
        disconnectedPlayer = self.players.pop(disconnectedUsername)

        # reset flag if player has
        if (disconnectedPlayer["hasFlag"]):
            print("FLAG POSSESSION:", self.flagPossession)
            self.resetFlag(self.flagPossession[disconnectedUsername])
            self.flagPossession.pop(disconnectedUsername)

        # update team data
        self.teamData[disconnectedPlayer["color"]]["score"] -= disconnectedPlayer["score"]
        self.teamData[disconnectedPlayer["color"]]["numPlayers"] -= 1

        # send username to delete and updated team data including flag positions
        leaveData = {
            "username": disconnectedUsername,
            "teamData": self.teamData
        }

        return leaveData

    def resetFlag(self, color):
        self.teamData[color]["flagPosition"] = self.teamData[color]["basePosition"]

    def findAvatar(self, username):
        user = user_collection.find_one(
            {"username": username},
            {"_id": 0, "avatarUrl": 1}
        )
        return user.get("avatarUrl") if user else None