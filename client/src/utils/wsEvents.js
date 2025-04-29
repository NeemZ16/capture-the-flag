import webSocketService from "./wsService";

export function connectWS(scene) {
    // dont create new if exists
    if (scene.ws) return;

    scene.ws = webSocketService;
    scene.ws.init(this.game.username, scene.worldSize);

    scene.ws.on('init', d => {
        console.log("init called");
    })
}

function initWS(d, scene) {

}

function onJoin(d, scene) {

}

function onMove(d, scene) {
    
}

function onEnd(d, scene) {
    
}

function onFlagGrab(d, scene) {
    
}

function onFlagScore(d, scene) {
    
}

function sendMove(d, scene) {
    
}

function disconnect(d, scene) {
    
}