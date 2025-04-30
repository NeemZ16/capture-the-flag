import { SOCKET_EVENTS } from '../utils/gameConstants';
import webSocketService from '../utils/wsService';
import { BaseScene } from './BaseScene';
import { connectWS } from '../utils/wsEvents';


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
        this.worldElements.add(graphics);
    }

    /**
     * Create top "nav" with logout btn
     */
    createNav() {
        const navHeight = 50;
        this.nav = this.add.graphics();
        this.nav.fillStyle(0x555555, 0.5);
        this.nav.fillRect(0, 0, this.dimensions.width, navHeight);
        this.uiElements.add(this.nav);

        // add logo to center of nav
        this.logo = this.add.image(this.dimensions.width / 2, navHeight / 2, 'logo');
        this.logo.setOrigin(0.5);
        this.logo.setScale(0.25);
        this.uiElements.add(this.logo);

        // add logout button to top right
        this.logoutBtn = this.createBtn(this.dimensions.width - 50, navHeight / 2, 'Logout', () => {
            this.handleLogout();
        })
        this.uiElements.add(this.logoutBtn);

        const welcomeText = this.add.text(50, navHeight / 2, `hi ${this.game.username}!`, {
            fontFamily: '"Jersey 10"',
            fontSize: 40
        })
            .setOrigin(0, 0.5); // left align
        this.uiElements.add(welcomeText);
    }

    repositionNavElements() {
        const navHeight = 50;

        // Update nav bar width
        this.nav.clear();
        this.nav.fillStyle(0x555555, 0.5);
        this.nav.fillRect(0, 0, this.dimensions.width, navHeight);  // Redraw with updated width

        // Update logo position (centered horizontally)
        this.logo.setPosition(this.dimensions.width / 2, navHeight / 2);

        // Update logout button position (top right)
        this.logoutBtn.setPosition(this.dimensions.width - 50, navHeight / 2);
    }

    handleLogout() {
        const url = import.meta.env.VITE_API_URL + "logout";
        fetch(url, {
            method: 'POST',
            credentials: 'include', // will include the auth_token cookie
        })
            .then((res) => res.text().then((text) => ({ status: res.status, text })))
            .then(({ status, text }) => {
                // reset username and reload should go to main menu
                this.game.username = null;
                window.location.reload();
            })
    }

    /**
     * Creates own player object with username above it.
     */
    createPlayer(x, y, username, playerColor) {
        // create player container
        this.player = this.add.container(x, y);

        // create player object with circle
        const radius = 20;
        this.playerSprite = this.add.graphics();
        this.playerSprite.lineStyle(4, 0xffffff, 1);  // 4px border, white color
        this.playerSprite.strokeCircle(radius, radius, radius);  // Draw the border
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

        this.worldElements.add(this.player);
    }

    createOtherPlayer(x, y, username, playerColor) {
        // create player container
        const otherPlayer = this.add.container(x, y);

        // create player object with circle
        const radius = 20;
        const sprite = this.add.graphics();
        sprite.fillStyle(playerColor, 1);
        sprite.fillCircle(radius, radius, radius);
        otherPlayer.add(sprite);

        // create player name centered over sprite
        const name = this.add.bitmapText(radius, -radius, 'pixel', username, 12).setOrigin(0.5);
        otherPlayer.add(name);

        // set player position and physics
        // this.physics.world.enable(otherPlayer);
        // otherPlayer.body.setCircle(radius);
        // otherPlayer.body.setCollideWorldBounds(true);

        // store in player group
        otherPlayer.username = username;
        this.otherPlayers.add(otherPlayer);
    }

    create() {
        // set up cameras containers and groups
        this.worldSize = 3000;
        this.uiCamera = this.cameras.add(0, 0, this.scale.width, this.scale.height);
        this.worldElements = this.add.container(0, 0);
        this.uiElements = this.add.container(0, 0);
        this.uiCamera.ignore(this.worldElements);
        this.cameras.main.ignore(this.uiElements);

        // initialize functions
        this.createBg();
        this.createNav();
        connectWS(this);

        // initialize interaction
        this.cursors = this.input.keyboard.createCursorKeys();
    }

    update() {
        // if no current player then early return
        if (!this.player) return;

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

        // if player moving broadcast position
        if (currentSpeed > 1) {
            this.ws.emit(SOCKET_EVENTS.MOVE, {})
        }
    }

    onResize() {
        this.repositionNavElements();
    }
}