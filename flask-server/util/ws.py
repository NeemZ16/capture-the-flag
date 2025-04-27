from flask_socketio import SocketIO, emit
from app import app, socketio
from flask import request

# Game state
players = {}           # sid → {username, team, x, y, hasFlag}
sid_map   = {}        # sid        → playerKey
team_data = {
    "red":     {"score": 5, "base": {"x": 100, "y": 100},  "flagLocation": {"x": 100, "y": 100}},
    "blue":    {"score": 5, "base": {"x": 900, "y": 100},  "flagLocation": {"x": 900, "y": 100}},
    "green":   {"score": 5, "base": {"x": 100, "y": 900},  "flagLocation": {"x": 100, "y": 900}},
    "magenta": {"score": 5, "base": {"x": 900, "y": 900},  "flagLocation": {"x": 900, "y": 900}},
}

@socketio.on("connect")
def _on_connect():
    sid        = request.sid
    playerKey  = request.args.get("playerKey") or sid
    username   = request.args.get("username")             # get the real username

    # If no username was supplied, refuse the handshake
    if not username:                                     
        app.logger.warning("Rejected connection without username (sid=%s)", sid)  # ← MOD
        return False                                      

    old_id = playerKey in players

    if old_id:                                            # reconnect – keep same data
        sid_map[sid] = playerKey
        app.logger.info("Re‑connect: %s (user=%s)", playerKey, players[playerKey]["username"])
    else:                                                 # brand‑new player
        team = random.choice(list(team_data.keys()))
        bx, by = team_data[team]["base"].values()
        players[playerKey] = {
            "username": username,                         # no more Guest users
            "team"    : team,
            "x"       : bx + random.randint(-30, 30),
            "y"       : by + random.randint(-30, 30),
            "hasFlag" : None,
        }
        socketio.emit(
            "player_joined",
            {"playerId": playerKey, **players[playerKey]},
            broadcast=True, include_self=False
        )
        sid_map[sid] = playerKey

    _start_timers_if_needed()
    emit("init", {
        "playerId": playerKey,
        "players" : players,
        "teamData": team_data,
        "remainingTime": _remaining_time(),
    })