import { io } from 'socket.io-client';
import { SOCKET_EVENTS } from '../constants/gameConstants';

class SocketService {
  socket = null;

  /**
   * Open (or reuse) the Socket.IO connection.
   * @param {string|null} existingPlayerId – value from localStorage
   * @param {string}      username         – logged‑in user’s name          
   */

  connect(existingPlayerId, username) {                                       
    if (this.socket) return this.socket;                                      // keep single instance

    this.socket = io('http://localhost:8000', {
      transports: ['websocket'],
      // pass both pieces of info so the backend can skip “Guest” names
      query: {                                                       
        playerKey: existingPlayerId || undefined,                        
        username,                                                           
      },
      withCredentials: true,                                                 // keep auth cookie
    });
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event, handler) {
    this.socket?.on(event, handler);
  }

  emit(event, data) {
    this.socket?.emit(event, data);
  }
}

export default new SocketService();