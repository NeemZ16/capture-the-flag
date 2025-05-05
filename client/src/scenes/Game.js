import { SOCKET_EVENTS, COLOR } from '../utils/gameConstants';
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
        const padding = 200; // base padding defined in wsHelpers.py

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

        // Draw base squares
        const baseSize = 50;
        const halfSize = baseSize / 2;

        this.basePositions = {
            red: { x: padding, y: padding },
            blue: { x: this.worldSize - padding, y: padding },
            yellow: { x: padding, y: this.worldSize - padding },
            green: { x: this.worldSize - padding, y: this.worldSize - padding }
        };

        const baseColors = {
            red: 0xff5555,
            blue: 0x5555ff,
            yellow: 0xffff55,
            green: 0x55ff55
        };

        for (const [color, pos] of Object.entries(this.basePositions)) {
            graphics.fillStyle(baseColors[color], 0.5);
            graphics.fillRect(pos.x - halfSize, pos.y - halfSize, baseSize, baseSize);
            graphics.lineStyle(2, 0x777777, 1); // Gray border
            graphics.strokeRect(pos.x - halfSize, pos.y - halfSize, baseSize, baseSize);
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

    /**
     * Creates own player object with username above it.
     */
    createPlayer(x, y, username, playerColor, teamColor) {

        // create player container
        this.player = this.add.container(x, y);
        this.player.teamColor = teamColor;
        this.player.hasFlag = false;

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

    createOtherPlayer(x, y, username, playerColor, teamColor) {
        // create player container
        const otherPlayer = this.add.container(x, y);
        otherPlayer.teamColor = teamColor;
        otherPlayer.hasFlag = false;
        // create player object with circle
        const radius = 20;
        const sprite = this.add.graphics();
        sprite.fillStyle(playerColor, 1);
        sprite.fillCircle(radius, radius, radius);
        otherPlayer.add(sprite);

        // create player name centered over sprite
        const name = this.add.bitmapText(radius, -radius, 'pixel', username, 12).setOrigin(0.5);
        otherPlayer.add(name);

        // store in player dict
        otherPlayer.username = username;
        this.otherPlayers[username] = otherPlayer;
        this.worldElements.add(otherPlayer);
    }

    createFlag(position, color, colorCode) {
        // if flag already exists do not create
        if (this.flags[color]) return;
        
        const flag = this.add.image(position.x, position.y, 'flag')
            .setScale(2).setTint(colorCode);
        this.flags[color] = flag;
        this.worldElements.add(flag);
    }

    /**
     * Check whether own player is within flag pickup distance.
     * Call pickup method and emit `flag_taken` event.
     */
    checkFlagPickup() {
        // set threshold distance for pickup
        const pickupThreshold = 40;

        // iterate through this.flags
        for (const [color, flag] of Object.entries(this.flags)) {
            // if own flag do nothing
            if (color === this.player.teamColor) continue;

            // compare player position to flag position within threshold
            const dx = flag.x - this.player.x;
            const dy = flag.y - this.player.y;
            const distance = Math.hypot(dx, dy);
            if (distance < pickupThreshold) {
                this.pickupFlag(color, this.game.username);

                // if within then pick up and send flag pickup event
                this.ws.emit('flag_taken', {
                    color: color,
                    username: this.game.username,
                })
            }
        }
    }

    /**
     * Handles rendering changes for flag pickup
     * @param {string} color - of flag
     * @param {string} username - of player with flag
     */
    pickupFlag(color, username) {
        // remove flag
        const flag = this.flags[color];
        if (!flag) return;
        flag.destroy();
        delete this.flags[color];

        // get player with username
        let playerToUpdate;
        if (username === this.game.username) {
            playerToUpdate = this.player;
        } else {
            playerToUpdate = this.otherPlayers[username];
        }

        // update player object to have flag
        const flagSprite = this.add.image(0, 0, 'flag')
            .setScale(1.2)
            .setTint(COLOR[color])
            .setAngle(45)
            .setOrigin(0.5)
            .setPosition(40, 15);

        playerToUpdate.add(flagSprite);

        // store reference to flag
        playerToUpdate.carriedFlag = flagSprite;
        playerToUpdate.flagColor = color;
        playerToUpdate.hasFlag = true;
    }

    /**
     * Check whether own player is within flag dropoff distance from home base.
     * Call dropoff method and emit `flag_scored` event.
     */
    checkFlagDropoff() {
        const dropoffThreshold = 40;

        // get player base position
        const homeBase = this.basePositions[this.player.teamColor];

        // check this.player distance from home base
        const dx = this.player.x - homeBase.x;
        const dy = this.player.y - homeBase.y;
        const distance = Math.hypot(dx, dy);
        if (distance < dropoffThreshold) {
            // send username to backend, which should then 
            // calculate which flag was scored through flagPossessions
            this.ws.emit('flag_scored', {
                color: this.player.flagColor,
                username: this.game.username
            });
            
            this.dropoffFlag(this.player.flagColor, this.game.username);
        }
    }

    /**
     * Handles rendering changes for flag pickup
     * @param {string} color - of flag
     * @param {string} username - of player dropping off flag
     */
    dropoffFlag(color, username) {
        // get player with username
        let playerToUpdate;
        if (username === this.game.username) {
            playerToUpdate = this.player;
        } else {
            playerToUpdate = this.otherPlayers[username];
        }
        
        // remove flag sprite
        playerToUpdate.carriedFlag.destroy();
        playerToUpdate.carriedFlag = null;
        playerToUpdate.flagColor = null;
        playerToUpdate.hasFlag = false;

        // create flag at base
        this.createFlag(this.basePositions[color], color, COLOR[color])
    }

    checkKillAttempt() {
        const killThreshold = 40;
    
        for (const [targetUsername, targetPlayer] of Object.entries(this.otherPlayers)) {
            
            // if targetPlayer is the same team, skip
            if (targetPlayer.teamColor === this.player.teamColor) continue;

            // evaluate if any player is in target range
            const x = targetPlayer.x - this.player.x;
            const y = targetPlayer.y - this.player.y;
            const distance = Math.hypot(x, y);
        
            if (distance < killThreshold) {

                const targetColor = targetPlayer.teamColor;
                const targetBasePosition = this.basePositions[targetColor];

                // if target player has a flag, drop the flag
                let flagColor = null;
                let hasFlag = false;
                if (targetPlayer.hasFlag){
                    flagColor = targetPlayer.flagColor;
                    hasFlag = targetPlayer.hasFlag;
                    this.dropoffFlag(targetPlayer.flagColor, targetUsername);
                }

                // send targeted player info to update data through websocket
                this.ws.emit('player_killed', {
                    username: targetUsername,
                    hasFlag: hasFlag,
                    flagColor: flagColor,
                    color: targetColor,
                    position: targetBasePosition
                });
                
                // respawn killed player
                this.respawnPlayer(targetUsername, targetBasePosition);
            
                break;  // only kill one player per key press
            }
        }
    }

    respawnPlayer(targetUsername, targetBasePosition) {
        let playerToUpdate;
        if (targetUsername === this.game.username) {
            playerToUpdate = this.player;
        } else {
            playerToUpdate = this.otherPlayers[targetUsername];
        }
        
        playerToUpdate.setPosition(targetBasePosition.x, targetBasePosition.y)
    }

    create() {
        // set up cameras containers and groups
        this.worldSize = 2000;
        this.uiCamera = this.cameras.add(0, 0, this.scale.width, this.scale.height);
        this.worldElements = this.add.container(0, 0);
        this.uiElements = this.add.container(0, 0);
        this.uiCamera.ignore(this.worldElements);
        this.cameras.main.ignore(this.uiElements);
        this.otherPlayers = {};
        this.flags = {};
        this.killKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);

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
        const maxSpeed = 250;
        const currentSpeed = Math.hypot(body.velocity.x, body.velocity.y);

        if (currentSpeed > maxSpeed) {
            // Rescale to max speed while keeping direction
            const scale = maxSpeed / currentSpeed;
            body.setVelocity(body.velocity.x * scale, body.velocity.y * scale);
        }

        // if player moving broadcast position
        if (currentSpeed > 1) {
            this.ws.emit(SOCKET_EVENTS.MOVE, {
                username: this.game.username,
                position: {
                    x: this.player.x,
                    y: this.player.y
                }
            })

            // check flag logic
            if (this.player.carriedFlag) {
                this.checkFlagDropoff();
            } else {
                this.checkFlagPickup();
            }
        }

        // when K pressed, check if any opponent player is in range
        if (Phaser.Input.Keyboard.JustDown(this.killKey)) {
            this.checkKillAttempt();
        }
    }

    onResize() {
        this.repositionNavElements();
    }
}