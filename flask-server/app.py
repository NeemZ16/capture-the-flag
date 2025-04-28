import os, logging, random, string, time, threading, math
from typing import Optional

# Try to enable eventlet if it is installable on this runtime
try:
    import eventlet
    eventlet.monkey_patch()
    _async_mode = "eventlet"
except Exception:
    _async_mode = "threading"

from flask import Flask, request
from flask_cors import CORS
from flask_restful import Api
from logging.handlers import RotatingFileHandler
from flask_socketio import SocketIO, emit

#non websocket imports
from util.auth import * #importing endpoints from auth.py

# Flask / Socket.IO setup
app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev_secret")
CORS(app, origins=["http://localhost:8080", "*"], supports_credentials=True)
api = Api(app)

#logging setup
os.makedirs("../logs", exist_ok=True)
file_handler = RotatingFileHandler("../logs/server.log",
                                   maxBytes=1_000_000, backupCount=5)
file_handler.setLevel(logging.INFO)
file_handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s: %(message)s"))
app.logger.setLevel(logging.INFO)
app.logger.addHandler(file_handler)

#flask REST/CRUD API endpoints
api.add_resource(Register, "/register")
api.add_resource(Login,    "/login")
api.add_resource(Logout,   "/logout")
api.add_resource(Me,       "/me")

socketio = SocketIO(app, cors_allowed_origins="*", async_mode=_async_mode)
app.logger.info("Socket.IO async_mode = %s", _async_mode) #for logging purposes

@app.after_request
def log_request(response):
    ip     = request.remote_addr or "-"
    method = request.method
    path   = request.path
    status = response.status_code

    app.logger.info(f"{ip} {method} {path} {status}")

    return response

#Game config and helpers below

# Game state
players = {}           # sid → {username, team, x, y, hasFlag}
sid_map   = {}        # sid        → playerKey
team_data = {
    "red":     {"score": 5, "base": {"x": 100, "y": 100},  "flagLocation": {"x": 100, "y": 100}},
    "blue":    {"score": 5, "base": {"x": 900, "y": 100},  "flagLocation": {"x": 900, "y": 100}},
    "green":   {"score": 5, "base": {"x": 100, "y": 900},  "flagLocation": {"x": 100, "y": 900}},
    "magenta": {"score": 5, "base": {"x": 900, "y": 900},  "flagLocation": {"x": 900, "y": 900}},
}
GAME_DURATION = 10 * 60            # 10 minutes
_game_start_ts: Optional[float] = None
_game_ended = False

# Utility helpers
def _remaining_time() -> int:
    if _game_start_ts is None:
        return GAME_DURATION
    return max(0, int(GAME_DURATION - (time.time() - _game_start_ts)))

def _decide_winner():
    return max(team_data.items(), key=lambda kv: kv[1]["score"])

# Timer threads (run once per game)
def _start_timers_if_needed():
    global _game_start_ts, _game_ended
    if _game_start_ts is not None:          # already running
        return
    _game_start_ts = time.time()
    _game_ended = False
    threading.Thread(target=_game_clock, daemon=True).start()
    threading.Thread(target=_time_sync_loop, daemon=True).start()

def _time_sync_loop():
    while not _game_ended and _remaining_time() > 0:
        socketio.emit("time_sync", {"remainingTime": _remaining_time()}, broadcast=True)
        time.sleep(1)

def _game_clock():
    global _game_ended
    time.sleep(GAME_DURATION)

    #now game_ended only emits if noone manually ended the game(aka being last player in lobby and disconnecting)
    if not _game_ended:
        _game_ended = True
        winner, info = _decide_winner()
        socketio.emit(
            "game_ended",
            {"winner": winner, "score": info["score"]},
            broadcast=True
        )


@socketio.on("connect")
def _on_connect():
    sid        = request.sid
    rawKey     = request.args.get("playerKey")

    playerKey = rawKey if rawKey in players else sid
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
            "frozen_until": 0.0
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


@socketio.on("disconnect")
def _on_disconnect():
    sid = request.sid
    key = sid_map.pop(sid, None)

    # only act if we actually had a playerKey mapped
    if key and key in players:
        # remove them from the game
        left_player = players.pop(key)                    # capture before pop
        socketio.emit("player_left",
                      {"playerId": key, "username": left_player["username"]},
                      broadcast=True)

        # if nobody’s left, tear down the round
        if len(players) == 0:
            global _game_ended, _game_start_ts, team_data
            _game_ended    = True
            _game_start_ts = None
            # reset all scores & flags to their bases
            team_data = {
                "red":     {"score": 5, "base": {"x": 100, "y": 100}, "flagLocation": {"x": 100, "y": 100}},
                "blue":    {"score": 5, "base": {"x": 900, "y": 100}, "flagLocation": {"x": 900, "y": 100}},
                "green":   {"score": 5, "base": {"x": 100, "y": 900}, "flagLocation": {"x": 100, "y": 900}},
                "magenta": {"score": 5, "base": {"x": 900, "y": 900}, "flagLocation": {"x": 900, "y": 900}},
            }

            # clear any leftover socket→player mappings
            sid_map.clear()

            # notify any connected UIs to destroy their Phaser instance
            socketio.emit("game_destroyed", broadcast=True)


@socketio.on("move")
def _on_move(data):
    sid       = request.sid
    playerKey = sid_map.get(sid)                          # look‑up real key
    if not playerKey or playerKey not in players:         
        return
    
    now = time.time() 
    if players[playerKey]["frozen_until"] > now:
        return   # player is frozen, ignore move

    p = players[playerKey]
    p["x"] = max(0, min(1000, p["x"] + data.get("dx", 0)))
    p["y"] = max(0, min(1000, p["y"] + data.get("dy", 0)))
    _check_flag_logic(playerKey)                         
    socketio.emit("player_moved",
                  {"playerId": playerKey, **p},           
                  broadcast=True)


def findClosestEnemy(playerKey):
    p = players[playerKey]
    closest = None
    minDist = 50
    for otherKey, other in players.items():
        if otherKey == playerKey or other["team"] == p["team"]:
            continue
        dist = math.hypot(p["x"] - other["x"], p["y"] - other["y"])
        if dist < minDist:
            minDist = dist
            closest = otherKey
    return closest

@socketio.on("kill")
def _on_kill(_data):
    sid       = request.sid
    killerKey = sid_map.get(sid)
    if not killerKey or killerKey not in players:
        return

    targetKey = findClosestEnemy(killerKey)
    if not targetKey:
        return

    killer, victim = players[killerKey], players[targetKey]
    had_flag = bool(victim["hasFlag"])


    # steal flag if victim had one
    if victim["hasFlag"]:
        killer["hasFlag"] = victim["hasFlag"]
        victim["hasFlag"] = None

    # freeze victim for 2.5s
    now = time.time()
    victim["frozen_until"] = now + 2.5
    # let the victim client show UI freeze
    # find victim’s socket id from sid_map
    vsid = next((s for s,k in sid_map.items() if k==targetKey), None)
    if vsid:
        socketio.emit("player_frozen", {"duration":2.5}, room=vsid)

    # respawn **only** if they did *not* have a flag stolen
    if not had_flag:
        bx, by = team_data[victim["team"]]["base"].values()
        victim["x"] = bx + random.randint(-30, 30)
        victim["y"] = by + random.randint(-30, 30)

    socketio.emit("player_killed", {
        "killerId":     killerKey,
        "victimId":     targetKey,
        "victimPos":    {"x": victim["x"], "y": victim["y"]},
        "killerHasFlag": killer["hasFlag"]
    }, broadcast=True)


# Flag & scoring logic
def _check_flag_logic(sid):
    p = players[sid]
    for team, info in team_data.items():
        bx, by = info["base"].values()
        close  = abs(p["x"]-bx)<20 and abs(p["y"]-by)<20

        # pick up enemy flag
        if team!=p["team"] and close and info["flagLocation"]:
            info["score"] -= 1
            info["flagLocation"]=None
            p["hasFlag"]= [team] if p["hasFlag"] is None else p["hasFlag"]+[team]
            socketio.emit("flag_taken", {"playerId":sid,"flagTeam":team,"newScore":info["score"]}, broadcast=True)

        # deliver captured flag
        elif team==p["team"] and close and p["hasFlag"]:
            for ef in p["hasFlag"]:
                team_data[p["team"]]["score"] += 1
                team_data[ef]["flagLocation"] = dict(team_data[ef]["base"])
                socketio.emit("flag_scored", {
                    "playerId": sid, "playerTeam": p["team"],
                    "scoredFlag": ef, "teamScore":team_data[p["team"]]["score"]
                }, broadcast=True)
            p["hasFlag"] = None

def findClosestTeammate(playerKey):
    p = players[playerKey]
    closest_player = None
    min_distance = 10
    for player_id, player in players.items():
        if player_id == playerKey or player["team"] != p["team"]:
            continue
        dx = p["x"] - player["x"]
        dy = p["y"] - player["y"]
        distance = math.sqrt(dx ** 2 + dy ** 2)

        if distance < min_distance:
            min_distance = distance
            closest_player = player_id

    return closest_player

if __name__ == "__main__":
    extra = {}
    if _async_mode == "threading":
        extra["allow_unsafe_werkzeug"] = True

    #can now see any requests made to the server in the console
    socketio.run(app, host="0.0.0.0", port=8000, log_output=True, **extra)