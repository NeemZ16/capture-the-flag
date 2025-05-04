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

    scene.ws.on(SOCKET_EVENTS.FLAG_TAKEN, d => {
        onFlagGrab(d, scene);
    })

    scene.ws.on(SOCKET_EVENTS.FLAG_SCORED, d => {
        onFlagScore(d, scene);
    })
}

function onInit(d, scene) {
    const allPlayers = d.players;
    const teamData = d.teamData;

    // create players for d.players
    for (const username in allPlayers) {
        if (username !== scene.game.username && !(username in scene.otherPlayers)) {
            const player = allPlayers[username];
            scene.createOtherPlayer(
                player.position.x, 
                player.position.y, 
                username, 
                COLOR[player.color],
            );

            scene.playerScoreList.add(username, allPlayers[username].score, allPlayers[username].color);
        }
    }

    // update flags carried by players
    updatePlayerFlags(d.flagPossession, scene);

    // generate flags and scores
    for (const color in teamData) {
        const colorCode = COLOR[color];
        const data = teamData[color];

        // if flag not taken
        if (data.flagPosition) {
            scene.createFlag(data.flagPosition, color, colorCode);
        }

        // update team scores
        scene.teamScoreValues[color].setText(data.score.toString());
    }
}

function onJoin(d, scene) {
    // expecting d.color to be string color name
    if (d.username === scene.game.username) {
        scene.createPlayer(d.position.x, d.position.y, d.username, COLOR[d.color], d.color);
    } else if (!(d.username in scene.otherPlayers)) {
        scene.createOtherPlayer(d.position.x, d.position.y, d.username, COLOR[d.color]);
    }
    
    scene.playerScoreList.add(d.username, 0, d.color);
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

        // remove from player scoreboard
        scene.playerScoreList.remove(d.username);
    }

    // update flag position and score if needed
    for (const color in d.teamData) {
        const colorCode = COLOR[color];
        const data = d.teamData[color];

        // if flag not taken
        if (data.flagPosition) {
            scene.createFlag(data.flagPosition, color, colorCode);
        }

        scene.teamScoreValues[color].setText(data.score.toString());
    }
}

function onFlagGrab(d, scene) {
    scene.pickupFlag(d.color, d.username);
}

function onFlagScore(d, scene) {
    scene.dropoffFlag(d.color, d.username);
    scene.teamScoreValues[d.teamScore[0]].setText(d.teamScore[1].toString());
    scene.playerScoreList.updateScore(d.username, d.playerScore, d.color);
}

/**
 * If a player is carrying a flag and someone else refreshes, that player no longer has a flag on redraw.
 * This adds back the flags on refresh since backend is sending flagPossession dict on init
 * @param {*} flagData - flagPossession dict from backend. maps username to flag color if carried
 * @param {*} scene - game scene passed from onInit function
 */
function updatePlayerFlags(flagData, scene) {
    for (const [username, flagColor] of Object.entries(flagData)) {
        // if self then continue -- you already have the flag
        if (username === scene.game.username) continue;

        // get player to update
        const playerToUpdate = scene.otherPlayers[username]
        if (playerToUpdate.carriedFlag) continue;

        // update player object to have flag
        const flagSprite = scene.add.image(0, 0, 'flag')
            .setScale(1.2)
            .setTint(COLOR[flagColor])
            .setAngle(45)
            .setOrigin(0.5)
            .setPosition(40, 15);

        playerToUpdate.add(flagSprite);

        // store reference to flag
        playerToUpdate.carriedFlag = flagSprite;
    }
}
