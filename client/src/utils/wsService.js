import { io } from 'socket.io-client';

class WsService {
  constructor() {
    this.socket = null;
  }

  // Initialize the WebSocket connection
  init(username) {
    if (this.socket) return; // Avoid creating a new connection if one already exists

    
    // Initialize the WebSocket connection with the provided URL
    this.socket = io(import.meta.env.VITE_WS_URL, {
      transports: ['websocket'],
      withCredentials: true, // send cookies
      query: {                          
        username
      },
    });
  }

  // Emit an event to the server
  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    } else {
      console.error('Socket is not initialized');
    }
  }

  // Listen for an event from the server
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    } else {
      console.error('Socket is not initialized');
    }
  }

  // Disconnect the WebSocket connection
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      console.log('Disconnected from WebSocket');
    }
  }
}

const webSocketService = new WsService();

export default webSocketService;
