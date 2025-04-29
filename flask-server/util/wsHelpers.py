class Helper:
    def __init__(self):
        '''globally track players and team data in Helper object'''
        # username -> score, position (x, y), hasFlag
        self.players = {}
        
        # team data: color -> numPlayers, totalScore, flagPosition
        self.teamData = {
            "red": {"numPlayers": 0, "score": 0, "flagPosition": {"x": 0, "y": 0}},
            "blue": {"numPlayers": 0, "score": 0, "flagPosition": {"x": 0, "y": 0}},
            "yellow": {"numPlayers": 0, "score": 0, "flagPosition": {"x": 0, "y": 0}},
            "green": {"numPlayers": 0, "score": 0, "flagPosition": {"x": 0, "y": 0}},
        }

        # hardcoded from client/src/scenes/Game.js
        self.worldSize = 3000

    def leastPlayersTeam(self):
        '''get team key with least number of players'''
        return min(self.teamData, key=lambda team: self.teamData[team]['numPlayers'])