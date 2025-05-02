import webSocketService from "./wsService";
import { SOCKET_EVENTS, COLOR } from "./gameConstants";

/**
 * Initializes websocket connection for scene and sets up event handlers
 * @param {Phaser.Scene} scene 
 */
export function connectWS(scene) {
    // dont create new if exists
    if (scene.ws) return;

    // initialize and create socketio connection
    scene.ws = webSocketService;
    scene.ws.init(scene.game.username);

    // add event listeners for specific socket events
    scene.ws.on(SOCKET_EVENTS.INIT, d => {
        onInit(d, scene);
    })

    scene.ws.on(SOCKET_EVENTS.PLAYER_JOINED, d => {
        onJoin(d, scene);
    })

    scene.ws.on(SOCKET_EVENTS.MOVE, d => {
        onMove(d, scene);
    })

    scene.ws.on(SOCKET_EVENTS.PLAYER_LEFT, d => {
        onLeave(d, scene);
    })
}

function onInit(d, scene) {
    const allPlayers = d.players;
    const teamData = d.teamData;
    
    // create players for d.players
    for (const username in allPlayers) {
        if (username !== scene.game.username && !(username in scene.otherPlayers)) {
            const player = allPlayers[username];
            scene.createOtherPlayer(player.position.x, player.position.y, username, COLOR[player.color]);
        }
    }

    // generate flags
}

function onJoin(d, scene) {
    // expecting d.color to be string color name
    if (d.username === scene.game.username) {
        scene.createPlayer(d.position.x, d.position.y, d.username, COLOR[d.color]);
    } else if (!(d.username in scene.otherPlayers)){
        scene.createOtherPlayer(d.position.x, d.position.y, d.username, COLOR[d.color]);
    }
}

function onMove(d, scene) {
    // get username and position from d
    const { username, position } = d;

    // update that player's position
    const playerToMove = scene.otherPlayers[username];
    if (playerToMove) {
        playerToMove.setPosition(position.x, position.y);
    }
}

function onLeave(d, scene) {
    // destroy disconnected player
    const player = scene.otherPlayers[d.username];
    if (player) {
        player.destroy(); // destroys container and its children
        delete scene.otherPlayers[d.username];

        // remove from world elements
        scene.worldElements.remove(player, true, true);
    }

    // update flag position if needed
}

function onFlagGrab(d, scene) {

}

function onFlagScore(d, scene) {

}
