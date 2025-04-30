# Try to enable eventlet if it is installable on this runtime
try:
    import eventlet
    eventlet.monkey_patch()
    _async_mode = "eventlet"
except Exception:
    _async_mode = "threading"

import os, logging
from flask import Flask, request
from flask_cors import CORS
from flask_restful import Api
from logging.handlers import RotatingFileHandler
# from flask_socketio import SocketIO

from shared import socketio
from util.ws import *
from util.auth import *

# Flask / Socket.IO setup
app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev_secret")
CORS(app, origins=["http://localhost:8080"], supports_credentials=True)
api = Api(app)
# socketio = SocketIO(app, cors_allowed_origins="*", async_mode=_async_mode)
socketio.init_app(app, async_mode=_async_mode)

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


@app.after_request
def log_request(response):
    ip     = request.remote_addr or "-"
    method = request.method
    path   = request.path
    status = response.status_code

    app.logger.info(f"{ip} {method} {path} {status}")

    return response

# # Game state
# players = {}           # sid → {username, team, x, y, hasFlag}
# sid_map   = {}        # sid        → playerKey
# team_data = {
#     "red":     {"score": 5, "base": {"x": 100, "y": 100},  "flagLocation": {"x": 100, "y": 100}},
#     "blue":    {"score": 5, "base": {"x": 900, "y": 100},  "flagLocation": {"x": 900, "y": 100}},
#     "green":   {"score": 5, "base": {"x": 100, "y": 900},  "flagLocation": {"x": 100, "y": 900}},
#     "magenta": {"score": 5, "base": {"x": 900, "y": 900},  "flagLocation": {"x": 900, "y": 900}},
# }
# GAME_DURATION = 10 * 60            # 10 minutes
# _game_start_ts: Optional[float] = None
# _game_ended = False

# # Utility helpers
# def _remaining_time() -> int:
#     if _game_start_ts is None:
#         return GAME_DURATION
#     return max(0, int(GAME_DURATION - (time.time() - _game_start_ts)))

# def _decide_winner():
#     return max(team_data.items(), key=lambda kv: kv[1]["score"])

# # Timer threads (run once per game)
# def _start_timers_if_needed():
#     global _game_start_ts, _game_ended
#     if _game_start_ts is not None:          # already running
#         return
#     _game_start_ts = time.time()
#     _game_ended = False
#     threading.Thread(target=_game_clock, daemon=True).start()
#     threading.Thread(target=_time_sync_loop, daemon=True).start()

# def _time_sync_loop():
#     while not _game_ended and _remaining_time() > 0:
#         socketio.emit("time_sync", {"remainingTime": _remaining_time()}, broadcast=True)
#         time.sleep(1)

# def _game_clock():
#     global _game_ended
#     time.sleep(GAME_DURATION)

#     #now game_ended only emits if noone manually ended the game(aka being last player in lobby and disconnecting)
#     if not _game_ended:
#         _game_ended = True
#         winner, info = _decide_winner()
#         socketio.emit(
#             "game_ended",
#             {"winner": winner, "score": info["score"]},
#             broadcast=True
#         )


# @socketio.on("connect")
# def _on_connect():
#     sid        = request.sid
#     playerKey  = request.args.get("playerKey") or sid
#     username   = request.args.get("username")             # get the real username

#     # If no username was supplied, refuse the handshake
#     if not username:                                     
#         app.logger.warning("Rejected connection without username (sid=%s)", sid)  # ← MOD
#         return False                                      

#     old_id = playerKey in players

#     if old_id:                                            # reconnect – keep same data
#         sid_map[sid] = playerKey
#         app.logger.info("Re‑connect: %s (user=%s)", playerKey, players[playerKey]["username"])
#     else:                                                 # brand‑new player
#         team = random.choice(list(team_data.keys()))
#         bx, by = team_data[team]["base"].values()
#         players[playerKey] = {
#             "username": username,                         # no more Guest users
#             "team"    : team,
#             "x"       : bx + random.randint(-30, 30),
#             "y"       : by + random.randint(-30, 30),
#             "hasFlag" : None,
#         }
#         socketio.emit(
#             "player_joined",
#             {"playerId": playerKey, **players[playerKey]},
#             broadcast=True, include_self=False
#         )
#         sid_map[sid] = playerKey

#     _start_timers_if_needed()
#     emit("init", {
#         "playerId": playerKey,
#         "players" : players,
#         "teamData": team_data,
#         "remainingTime": _remaining_time(),
#     })


# @socketio.on("disconnect")
# def _on_disconnect():
#     sid = request.sid
#     key = sid_map.pop(sid, None)

#     # only act if we actually had a playerKey mapped
#     if key and key in players:
#         # remove them from the game
#         left_player = players.pop(key)                    # capture before pop
#         socketio.emit("player_left",
#                       {"playerId": key, "username": left_player["username"]},
#                       broadcast=True)

#         # if nobody’s left, tear down the round
#         if len(players) == 0:
#             global _game_ended, _game_start_ts, team_data
#             _game_ended    = True
#             _game_start_ts = None
#             # reset all scores & flags to their bases
#             team_data = {
#                 "red":     {"score": 5, "base": {"x": 100, "y": 100}, "flagLocation": {"x": 100, "y": 100}},
#                 "blue":    {"score": 5, "base": {"x": 900, "y": 100}, "flagLocation": {"x": 900, "y": 100}},
#                 "green":   {"score": 5, "base": {"x": 100, "y": 900}, "flagLocation": {"x": 100, "y": 900}},
#                 "magenta": {"score": 5, "base": {"x": 900, "y": 900}, "flagLocation": {"x": 900, "y": 900}},
#             }

#             # clear any leftover socket→player mappings
#             sid_map.clear()

#             # notify any connected UIs to destroy their Phaser instance
#             socketio.emit("game_destroyed", broadcast=True)


# @socketio.on("move")
# def _on_move(data):
#     sid       = request.sid
#     playerKey = sid_map.get(sid)                          # look‑up real key
#     if not playerKey or playerKey not in players:         
#         return
#     p = players[playerKey]
#     p["x"] = max(0, min(1000, p["x"] + data.get("dx", 0)))
#     p["y"] = max(0, min(1000, p["y"] + data.get("dy", 0)))
#     _check_flag_logic(playerKey)                         
#     socketio.emit("player_moved",
#                   {"playerId": playerKey, **p},           
#                   broadcast=True)


# @socketio.on("kill")
# def _on_kill(data):
#     sid, targetKey = request.sid, data.get("targetId")
#     killerKey      = sid_map.get(sid)

#     if not killerKey or targetKey not in players:
#         return

#     killer, victim = players[killerKey], players[targetKey]

#     if victim["hasFlag"]:
#         killer["hasFlag"] = victim["hasFlag"]
#         victim["hasFlag"] = None

#     bx, by = team_data[victim["team"]]["base"].values()
#     victim["x"], victim["y"] = bx + random.randint(-30, 30), by + random.randint(-30, 30)

#     socketio.emit("player_killed", {
#         "killerId"     : killerKey,
#         "victimId"     : targetKey,
#         "victimPos"    : {"x": victim["x"], "y": victim["y"]},
#         "killerHasFlag": killer["hasFlag"]
#     }, broadcast=True)


# # Flag & scoring logic
# def _check_flag_logic(sid):
#     p = players[sid]
#     for team, info in team_data.items():
#         bx, by = info["base"].values()
#         close_to_base = abs(p["x"] - bx) < 20 and abs(p["y"] - by) < 20

#         # pick up an enemy flag
#         if team != p["team"] and close_to_base and info["flagLocation"]:
#             info["score"] -= 1
#             info["flagLocation"] = None
#             p["hasFlag"] = team
#             socketio.emit("flag_taken", {
#                 "playerId": sid, "flagTeam": team, "newScore": info["score"]
#             }, broadcast=True)

#         # deliver a captured flag
#         elif team == p["team"] and close_to_base and p["hasFlag"]:
#             enemy_flag = p["hasFlag"]
#             team_data[p["team"]]["score"] += 1
#             team_data[enemy_flag]["flagLocation"] = dict(team_data[enemy_flag]["base"])
#             p["hasFlag"] = None
#             socketio.emit("flag_scored", {
#                 "playerId": sid, "playerTeam": p["team"],
#                 "scoredFlag": enemy_flag,
#                 "teamScore": team_data[p['team']]['score']
#             }, broadcast=True)

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=8000, log_output=True)