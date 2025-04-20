import { io } from 'socket.io-client';
import { SOCKET_EVENTS } from '../constants/gameConstants';

class SocketService {
  socket = null;

  connect(existingPlayerId) {
    this.socket = io('http://localhost:8000', {
      transports: ['websocket'],
      query: { existingPlayerId: existingPlayerId || undefined }
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