import { BaseScene } from './BaseScene';

export class Game extends BaseScene {
    constructor() {
        super('Game');
    }

    // createBg() {
    //     const scaleFactor = 3;
    //     const tileSize = 16 * scaleFactor;
        
    //     // create water background
    //     this.add.tileSprite(0, 0, this.dimensions.width, this.dimensions.height, 'waterSprites', 24)
    //         .setOrigin(0)
    //         .setTileScale(scaleFactor);
        
    //     // Add random tiles on top
    //     const cols = Math.ceil(this.dimensions.width / tileSize);
    //     const rows = Math.ceil(this.dimensions.height / tileSize);
    //     const frames = [44, 45, 46, 47, 56, 57, 58, 59, 68, 69, 70, 71, 108, 109, 110, 111, 112, 113]; // The alternate tiles to sprinkle in

    //     for (let y = 0; y < rows; y++) {
    //         for (let x = 0; x < cols; x++) {
    //             const baseTiles = [43, 55, 67]
    //             if (Math.random() < 0.05) {
    //                 // replace base with decor frame
    //                 const frame = Phaser.Utils.Array.GetRandom(frames);
    //                 this.add.sprite(x * tileSize, y * tileSize, 'waterSprites', frame).setOrigin(0).setScale(scaleFactor);
    //             } else if (Math.random() < 0.6) {
    //                 // replace base blank with base textured
    //                 const frame = Phaser.Utils.Array.GetRandom(baseTiles);
    //                 this.add.sprite(x * tileSize, y * tileSize, 'waterSprites', frame).setOrigin(0).setScale(scaleFactor);
    //             }
    //         }
    //     }
    // }

    create() {
        // this.createBg();
        this.gameText = this.add.bitmapText(this.dimensions.width / 2, this.dimensions.height / 2, 'pixel', `game page player ${this.game.username}`).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.scene.start('GameOver');
        });
    }

    onResize() {
        this.gameText.setPosition(
            this.dimensions.width / 2,
            this.dimensions.height / 2
        );
        // this.createBg();
    }
}
