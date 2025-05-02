import { BaseScene } from './BaseScene';

export class GameOver extends BaseScene {
    constructor() {
        super('GameOver');
    }

    create() {
        this.cameras.main.fadeIn(1000, 0, 0, 0);
        this.cameras.main.setBackgroundColor(0x000000);

        this.gameOverText = this.add.bitmapText(
            this.dimensions.width / 2, 
            this.dimensions.height / 2, 
            'pixel', 
            `game over player ${this.game.username}`
        ).setOrigin(0.5).setTint(0xff0000);
        
        this.input.once('pointerdown', () => {
            this.scene.start('MainMenu');
        });
    }

    onResize() {
        this.gameOverText.setPosition(
            this.dimensions.width / 2,
            this.dimensions.height / 2
        );
    }
}
