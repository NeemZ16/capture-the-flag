import webSocketService from '../utils/wsService';
import { BaseScene } from './BaseScene';


export class Game extends BaseScene {
    constructor() {
        super('Game');
    }

    /**
     * Creates a lined grid background across worldSize with cellSize 50
     */
    createBg() {
        const gridSize = this.worldSize;
        const cellSize = 50;

        this.cameras.main.setBackgroundColor(0x1e1e1e);
        this.cameras.main.setBounds(0, 0, this.worldSize, this.worldSize);
        this.physics.world.setBounds(0, 0, this.worldSize, this.worldSize);

        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0xcccccc, 0.3);

        for (let x = 0; x <= gridSize; x += cellSize) {
            graphics.lineBetween(x, 0, x, gridSize);
        }

        for (let y = 0; y <= gridSize; y += cellSize) {
            graphics.lineBetween(0, y, gridSize, y);
        }

        graphics.setDepth(-1);
    }

    /**
     * Creates player object with username above it
     */
    createPlayer(x=this.worldSize / 2, y=this.worldSize / 2, username = this.game.username, playerColor=0xff0000) {
        // TODO: remove default values after ws good
        // create player container
        this.player = this.add.container(x, y);

        // create player object with circle
        const radius = 20;
        this.playerSprite = this.add.graphics();
        this.playerSprite.fillStyle(playerColor, 1); // Red color, full opacity
        this.playerSprite.fillCircle(radius, radius, radius);

        // add player to player container
        this.player.add(this.playerSprite);

        // create player name centered over sprite
        this.playerName = this.add.bitmapText(radius, -radius, 'pixel', username, 12).setOrigin(0.5);
        this.player.add(this.playerName);

        // set player position and physics
        this.player.setPosition(x, y);
        this.physics.world.enable(this.player);
        this.player.body.setCircle(radius);
        this.player.body.setDrag(100, 100);

        // follow player
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

        // prevent the player from moving off the screen (world bounds)
        this.player.body.setCollideWorldBounds(true);
    }

    connectWS() {
        // dont create new if exists
        if (this.ws) return this.ws;
        this.ws = webSocketService;
        const stored = localStorage.getItem('playerId') || null;
        console.log("GAME USERNAME:", this.game.username);
        this.ws.init(stored, this.game.username, this.worldSize);

        this.ws.on('init', d => {
            localStorage.setItem('playerId', d.playerId);
            console.log("init called");
        })
    }

    /*
    [
    "init",
    {
        "playerId": "QnJvAfezNsFl1q2nAAAD",
        "players": {
            "QnJvAfezNsFl1q2nAAAD": {
                "username": "a",
                "team": "blue",
                "x": 900,
                "y": 121,
                "hasFlag": null
            }
        },
        "teamData": {
            "red": {
                "score": 5,
                "base": {
                    "x": 100,
                    "y": 100
                },
                "flagLocation": {
                    "x": 100,
                    "y": 100
                }
            },
            "blue": {
                "score": 5,
                "base": {
                    "x": 900,
                    "y": 100
                },
                "flagLocation": {
                    "x": 900,
                    "y": 100
                }
            },
            "green": {
                "score": 5,
                "base": {
                    "x": 100,
                    "y": 900
                },
                "flagLocation": {
                    "x": 100,
                    "y": 900
                }
            },
            "magenta": {
                "score": 5,
                "base": {
                    "x": 900,
                    "y": 900
                },
                "flagLocation": {
                    "x": 900,
                    "y": 900
                }
            }
        },
        "remainingTime": 599
    }
]
    */

    create() {
        this.worldSize = 2000;
        this.createBg();
        this.createPlayer();
        // this.connectWS();

        this.cursors = this.input.keyboard.createCursorKeys();
    }

    update() {
        /* SET MOVEMENT OF PLAYER SO THERE IS RESIDUAL VELOCITY ON MOVEMENT
         DIAGONALS ARE NORMALIZED TO PREVENT SPEEDUP */

        const accel = 600;
        let dirX = 0;
        let dirY = 0;

        if (this.cursors.left.isDown) dirX -= 1;
        if (this.cursors.right.isDown) dirX += 1;
        if (this.cursors.up.isDown) dirY -= 1;
        if (this.cursors.down.isDown) dirY += 1;

        const len = Math.hypot(dirX, dirY);

        if (len > 0) {
            // Normalize direction
            dirX /= len;
            dirY /= len;

            this.player.body.setAcceleration(dirX * accel, dirY * accel);
        } else {
            this.player.body.setAcceleration(0, 0);
        }

        // Optionally clamp total velocity (not just X/Y separately)
        const body = this.player.body;
        const maxSpeed = 200;
        const currentSpeed = Math.hypot(body.velocity.x, body.velocity.y);

        if (currentSpeed > maxSpeed) {
            // Rescale to max speed while keeping direction
            const scale = maxSpeed / currentSpeed;
            body.setVelocity(body.velocity.x * scale, body.velocity.y * scale);
        }
    }
}
