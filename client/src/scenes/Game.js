import { BaseScene } from './BaseScene';

export class Game extends BaseScene {
    constructor() {
        super('Game');
    }

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

    createPlayer() {
        // create player object with circle
        const radius = 20;
        this.player = this.add.graphics();
        this.player.fillStyle(0xff0000, 1); // Red color, full opacity
        this.player.fillCircle(radius, radius, radius); // Draw circle at (0, 0) with radius 50

        // set player position and physics
        this.player.setPosition(this.worldSize / 2, this.worldSize / 2);
        this.physics.world.enable(this.player);
        this.player.body.setCircle(radius);
        this.player.body.setDrag(100, 100);

        // follow player
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

        // prevent the player from moving off the screen (world bounds)
        this.player.body.setCollideWorldBounds(true);
    }

    create() {
        this.worldSize = 2000;
        this.createBg();
        this.createPlayer();

        this.cursors = this.input.keyboard.createCursorKeys();

        // this.input.once('pointerdown', () => {
        //     this.scene.start('GameOver');
        // });
    }

    update() {
        // SET MOVEMENT OF PLAYER SO THERE IS RESIDUAL VELOCITY ON MOVEMENT
        // DIAGONALS ARE NORMALIZED TO PREVENT SPEEDUP

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

    onResize() {
        this.gameText.setPosition(
            this.dimensions.width / 2,
            this.dimensions.height / 2
        );
    }
}
