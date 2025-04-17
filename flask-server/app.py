# import os, logging, random, string, time, threading
# from flask import Flask, request
# from flask_cors import CORS
# from flask_restful import Api
# from logging.handlers import RotatingFileHandler
# from flask_socketio import SocketIO, emit

# app = Flask(__name__)
# app.config["SECRET_KEY"] = "your_secret_key_here"
# CORS(app, origins="http://localhost:8080", supports_credentials=True)
# api = Api(app)

# os.makedirs('../logs', exist_ok=True)
# file_handler = RotatingFileHandler('../logs/server.log', maxBytes=1_000_000, backupCount=5)
# file_handler.setLevel(logging.INFO)
# file_handler.setFormatter(logging.Formatter('%(asctime)s %(levelname)s: %(message)s'))
# app.logger.setLevel(logging.INFO)
# app.logger.addHandler(file_handler)

# socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

# players = {}  # { socketId: { username, team, x, y, hasFlag } }
# team_data = {
#     "red":     {"score": 5, "base": {"x": 100, "y": 100}, "flagLocation": {"x": 100, "y": 100}},
#     "blue":    {"score": 5, "base": {"x": 900, "y": 100}, "flagLocation": {"x": 900, "y": 100}},
#     "green":   {"score": 5, "base": {"x": 100, "y": 900}, "flagLocation": {"x": 100, "y": 900}},
#     "magenta": {"score": 5, "base": {"x": 900, "y": 900}, "flagLocation": {"x": 900, "y": 900}}
# }
# GAME_DURATION = 10 * 60  # 10 minutes
# game_start_time = None
# game_ended = False

# def get_remaining_time():
#     if not game_start_time:
#         return GAME_DURATION
#     elapsed = time.time() - game_start_time
#     remain = GAME_DURATION - elapsed
#     return max(0, int(remain))

# # HELPER FUNCTIONS
# def start_timers_if_needed():
#     """Start the game timer and the periodic time_sync if not already started."""
#     global game_start_time, game_ended
#     if not game_start_time:
#         game_start_time = time.time()
#         game_ended = False
#         threading.Thread(target=end_game_after_duration, daemon=True).start()
#         start_time_sync_thread()

# def start_time_sync_thread():
#     """ Emit 'time_sync' every second until the game ends. """
#     def sync_loop():
#         while not game_ended and get_remaining_time() > 0:
#             socketio.emit("time_sync", {"remainingTime": get_remaining_time()}, broadcast=True)
#             time.sleep(1)
#     threading.Thread(target=sync_loop, daemon=True).start()

# def end_game_after_duration():
#     global game_ended
#     time.sleep(GAME_DURATION)
#     game_ended = True
#     winning_team, best_score = decide_winner()
#     socketio.emit("game_ended", {
#         "winner": winning_team,
#         "score": best_score,
#         "teamData": team_data
#     }, broadcast=True)

# def decide_winner():
#     best_team = None
#     best_score = float('-inf')
#     for t, info in team_data.items():
#         if info["score"] > best_score:
#             best_score = info["score"]
#             best_team = t
#     return best_team, best_score

# # SOCKET.IO EVENTS

# @socketio.on('connect')
# def on_connect():
#     """
#     If the client provides an existingPlayerId that we still have,
#     re-map that player to the new socket ID.
#     Otherwise, create a new random user.
#     """
#     old_id = request.args.get('existingPlayerId')
#     new_sid = request.sid

#     if old_id and old_id in players:
#         # The user has refreshed but wants to continue as the same player
#         app.logger.info(f"Reusing existing player {old_id} -> new SID {new_sid}")
#         players[new_sid] = players.pop(old_id)  # re-map the dictionary entry
#         # No new random spawn, keep their old position
#         # We'll forcibly send them 'init' with the new SID
#     else:
#         # Create a brand new player
#         username = f"Guest_{''.join(random.choices(string.ascii_uppercase, k=5))}"
#         chosen_team = random.choice(list(team_data.keys()))
#         base_x = team_data[chosen_team]["base"]["x"]
#         base_y = team_data[chosen_team]["base"]["y"]
#         # Add random offset so not all are on top of each other
#         spawn_offset_x = random.randint(-30, 30)
#         spawn_offset_y = random.randint(-30, 30)
#         x = base_x + spawn_offset_x
#         y = base_y + spawn_offset_y

#         players[new_sid] = {
#             "username": username,
#             "team": chosen_team,
#             "x": x,
#             "y": y,
#             "hasFlag": None
#         }

#         # Notify everyone else about the new join (but not self)
#         emit("player_joined", {
#             "playerId": new_sid,
#             "username": username,
#             "team": chosen_team,
#             "x": x,
#             "y": y
#         }, broadcast=True, include_self=False)

#         app.logger.info(f"Socket {new_sid} created as {username} on team {chosen_team}.")

#     # Start timers if game not started
#     start_timers_if_needed()

#     # Send the initial full state to the new socket (or the reconnected one)
#     emit("init", {
#         "playerId": new_sid,
#         "players": players,
#         "teamData": team_data,
#         "remainingTime": get_remaining_time()
#     }, broadcast=False)

# @socketio.on('disconnect')
# def on_disconnect():
#     sid = request.sid
#     if sid in players:
#         username = players[sid]["username"]
#         del players[sid]
#         emit("player_left", {"playerId": sid, "username": username}, broadcast=True)
#         app.logger.info(f"{username} disconnected.")

# @socketio.on('move')
# def on_move(data):
#     sid = request.sid
#     if sid not in players:
#         app.logger.info(f"on_move: {sid} not in players dictionary!")
#         return

#     dx = data.get("dx", 0)
#     dy = data.get("dy", 0)
#     player = players[sid]

#     old_x, old_y = player["x"], player["y"]
#     player["x"] += dx
#     player["y"] += dy

#     # Keep in bounds
#     player["x"] = max(0, min(1000, player["x"]))
#     player["y"] = max(0, min(1000, player["y"]))

#     app.logger.info(
#         f"[on_move] Player {sid}: "
#         f"old=({old_x},{old_y}) dx={dx} dy={dy} -> new=({player['x']},{player['y']})"
#     )

#     # Check for flags
#     check_flags_and_score(sid)

#     # Broadcast updated position
#     socketio.emit("player_moved", {
#         "playerId": sid,
#         "x": player["x"],
#         "y": player["y"],
#         "username": player["username"],
#         "team": player["team"],
#         "hasFlag": player["hasFlag"]
#     }, broadcast=True)


# @socketio.on('kill')
# def on_kill(data):
#     sid = request.sid
#     target_id = data.get("targetId")
#     if not target_id or target_id not in players or sid not in players:
#         return

#     killer = players[sid]
#     victim = players[target_id]

#     if victim["hasFlag"]:
#         killer["hasFlag"] = victim["hasFlag"]
#         victim["hasFlag"] = None

#     # Respawn victim at base with offset
#     base = team_data[victim["team"]]["base"]
#     spawn_offset_x = random.randint(-30, 30)
#     spawn_offset_y = random.randint(-30, 30)
#     victim["x"] = base["x"] + spawn_offset_x
#     victim["y"] = base["y"] + spawn_offset_y

#     emit("player_killed", {
#         "killerId": sid,
#         "victimId": target_id,
#         "killerHasFlag": killer["hasFlag"]
#     }, broadcast=True)

# # GAME LOGIC
# def check_flags_and_score(sid):
#     p = players[sid]
#     px, py = p["x"], p["y"]
#     p_team = p["team"]

#     for t_name, info in team_data.items():
#         bx, by = info["base"]["x"], info["base"]["y"]
#         if abs(px - bx) < 20 and abs(py - by) < 20:
#             if t_name != p_team:
#                 if info["flagLocation"]:
#                     info["score"] -= 1
#                     p["hasFlag"] = t_name
#                     info["flagLocation"] = None
#                     emit("flag_taken", {
#                         "playerId": sid,
#                         "playerTeam": p_team,
#                         "flagTeam": t_name,
#                         "newScore": info["score"]
#                     }, broadcast=True)
#             else:
#                 if p["hasFlag"]:
#                     enemy_flag = p["hasFlag"]
#                     team_data[p_team]["score"] += 1
#                     team_data[enemy_flag]["flagLocation"] = {
#                         "x": team_data[enemy_flag]["base"]["x"],
#                         "y": team_data[enemy_flag]["base"]["y"]
#                     }
#                     p["hasFlag"] = None
#                     emit("flag_scored", {
#                         "playerId": sid,
#                         "playerTeam": p_team,
#                         "scoredFlag": enemy_flag,
#                         "teamScore": team_data[p_team]["score"]
#                     }, broadcast=True)

# if __name__ == "__main__":
#     # socketio.run(app, debug=True, host="0.0.0.0", port=8000)
#     socketio.run(app, debug=True, host="0.0.0.0", port=8000, allow_unsafe_werkzeug=True)


import os, logging, random, string, time, threading
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

# Flask / Socket.IO setup
app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev_secret")
CORS(app, origins="*", supports_credentials=True)
api = Api(app)

os.makedirs("logs", exist_ok=True)
file_handler = RotatingFileHandler("logs/server.log",
                                   maxBytes=1_000_000, backupCount=5)
file_handler.setLevel(logging.INFO)
file_handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s: %(message)s"))
app.logger.setLevel(logging.INFO)
app.logger.addHandler(file_handler)

socketio = SocketIO(app, cors_allowed_origins="*", async_mode=_async_mode)
app.logger.info("Socket.IO async_mode = %s", _async_mode)

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
    _game_ended = True
    winner, info = _decide_winner()
    socketio.emit("game_ended", {"winner": winner, "score": info["score"]}, broadcast=True)

# Socket.IO event handlers
@socketio.on("connect")
def _on_connect():
    sid       = request.sid
    playerKey = request.args.get("playerKey") or sid          # <── NEW
    old_id    = playerKey in players

    if old_id:                           # ▸ welcome back – re‑attach sid
        sid_map[sid] = playerKey         #   remember the new transport id
        app.logger.info("Re‑connect: %s keeps same team %s",
                        playerKey, players[playerKey]["team"])

    else:                                # ▸ brand‑new player
        team   = random.choice(list(team_data.keys()))
        bx, by = team_data[team]["base"].values()
        players[playerKey] = {
            "username": f"Guest_{''.join(random.choices(string.ascii_uppercase, k=5))}",
            "team": team,
            "x": bx + random.randint(-30, 30),
            "y": by + random.randint(-30, 30),
            "hasFlag": None,
        }
        socketio.emit("player_joined",
                      {"playerId": playerKey, **players[playerKey]},
                      broadcast=True, include_self=False)
        sid_map[sid] = playerKey

    _start_timers_if_needed()
    emit("init", {
        "playerId": playerKey,
        "players": players,
        "teamData": team_data,
        "remainingTime": _remaining_time()
    })

@socketio.on("disconnect")
def _on_disconnect():
    sid = request.sid
    key = sid_map.pop(sid, None)
    if key and key in players:
        emit("player_left",
             {"playerId": key, "username": players[key]["username"]},
             broadcast=True)

@socketio.on("move")
def _on_move(data):
    sid = request.sid
    if sid not in players:
        return
    p = players[sid]
    p["x"] = max(0, min(1000, p["x"] + data.get("dx", 0)))
    p["y"] = max(0, min(1000, p["y"] + data.get("dy", 0)))
    _check_flag_logic(sid)
    socketio.emit("player_moved", {"playerId": sid, **p}, broadcast=True)

@socketio.on("kill")
def _on_kill(data):
    sid, targetKey = request.sid, data.get("targetId")
    killerKey      = sid_map.get(sid)

    if not killerKey or targetKey not in players:
        return

    killer, victim = players[killerKey], players[targetKey]

    if victim["hasFlag"]:
        killer["hasFlag"] = victim["hasFlag"]
        victim["hasFlag"] = None

    bx, by = team_data[victim["team"]]["base"].values()
    victim["x"], victim["y"] = bx + random.randint(-30, 30), by + random.randint(-30, 30)

    socketio.emit("player_killed", {
        "killerId"     : killerKey,
        "victimId"     : targetKey,
        "victimPos"    : {"x": victim["x"], "y": victim["y"]},
        "killerHasFlag": killer["hasFlag"]
    }, broadcast=True)


# Flag & scoring logic
def _check_flag_logic(sid):
    p = players[sid]
    for team, info in team_data.items():
        bx, by = info["base"].values()
        close_to_base = abs(p["x"] - bx) < 20 and abs(p["y"] - by) < 20

        # pick up an enemy flag
        if team != p["team"] and close_to_base and info["flagLocation"]:
            info["score"] -= 1
            info["flagLocation"] = None
            p["hasFlag"] = team
            socketio.emit("flag_taken", {
                "playerId": sid, "flagTeam": team, "newScore": info["score"]
            }, broadcast=True)

        # deliver a captured flag
        elif team == p["team"] and close_to_base and p["hasFlag"]:
            enemy_flag = p["hasFlag"]
            team_data[p["team"]]["score"] += 1
            team_data[enemy_flag]["flagLocation"] = dict(team_data[enemy_flag]["base"])
            p["hasFlag"] = None
            socketio.emit("flag_scored", {
                "playerId": sid, "playerTeam": p["team"],
                "scoredFlag": enemy_flag,
                "teamScore": team_data[p['team']]['score']
            }, broadcast=True)

if __name__ == "__main__":
    extra = {}
    if _async_mode == "threading":
        extra["allow_unsafe_werkzeug"] = True
    socketio.run(app, host="0.0.0.0", port=8000, **extra)