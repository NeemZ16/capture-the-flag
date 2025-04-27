import { io } from 'socket.io-client';

class WsService {
  constructor() {
    this.socket = null;
  }

  // Initialize the WebSocket connection
  init(existingPlayerId, username) {
    if (this.socket) return; // Avoid creating a new connection if one already exists

    
    // Initialize the WebSocket connection with the provided URL
    this.socket = io(import.meta.env.VITE_WS_URL, {
      transports: ['websocket'],
      withCredentials: true, // send cookies
      query: {                          
        playerKey: existingPlayerId || "",
        username,
      },
    });

    // // Add event listeners for specific socket events
    // this.socket.on('init', (d) => {
    //   localStorage.setItem('playerId', d.playerId);

    // });

    // this.socket.on('player_joined', () => {
    //   console.log('Disconnected from the server');
    // });

    // this.socket.on('player_left', () => {
    //   console.log("WS EVENT: player_left")
    // });

    // this.socket.on('player_moved', () => {
    //   console.log("WS EVENT: player_moved")
    // });

    // this.socket.on('flag_taken', () => {
    //   console.log("WS EVENT: flag_taken")
    // });

    // this.socket.on('flag_scored', () => {
    //   console.log("WS EVENT: flag_scored")
    // });

    // this.socket.on('time_sync', () => {
    //   console.log("WS EVENT: flag_scored")
    // });

    // this.socket.on('game_ended', () => {
    //   console.log("WS EVENT: flag_scored")
    // });

    // this.socket.on('move', () => {
    //   console.log("WS EVENT: flag_scored")
    // });

    // this.socket.on('kill', () => {
    //   console.log("WS EVENT: flag_scored")
    // });

    // this.socket.on('game_destroyed', () => {
    //   console.log("WS EVENT: flag_scored")
    // });
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
