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
}

function onInit(d, scene) {
    // create players for d.players
    // generate flags
}

function onJoin(d, scene) {
    // expecting d.color to be string color name
    if (d.username === scene.game.username) {
        scene.createPlayer(d.position.x, d.position.y, d.username, COLOR[d.color]);
    } else {
        scene.createOtherPlayer(d.position.x, d.position.y, d.username, COLOR[d.color]);
    }

}

function onMove(d, scene) {

}

function onFlagGrab(d, scene) {

}

function onFlagScore(d, scene) {

}

function onDisconnect(d, scene) {

}