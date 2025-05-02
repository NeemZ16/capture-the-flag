from flask_socketio import SocketIO

# shared socketio obj to avoid circular imports btwn app.py and ws.py
socketio = SocketIO(cors_allowed_origins="*")