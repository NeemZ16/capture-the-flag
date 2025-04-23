import { Scene } from 'phaser';

export class BaseScene extends Scene {
    constructor(key) {
        super(key);
        this.dimensions = { width: 0, height: 0 };
    }

    init() {
        // set dimensions
        this.dimensions.width = this.scale.width;
        this.dimensions.height = this.scale.height;

        this.scale.on('resize', this.handleResize, this);
    }

    /**
     * Reposition elements after resize in `onResize` function
     * @param {*} gameSize - automatically passed in
     */
    handleResize(gameSize) {
        this.dimensions.width = gameSize.width;
        this.dimensions.height = gameSize.height;

        if (this.onResize) {
            this.onResize(gameSize);
        }
    }

    /**
     * Utility function to create a button
     * @param {number} x - x position of the button
     * @param {number} y - y position of the button
     * @param {string} text - button label
     * @param {function} action - callback function for pointerdown event
     * @returns {Phaser.GameObjects.Text} - the created button
     */
    createBtn(x, y, text, action) {
        const btn = this.add.text(x, y, text, {
            fontFamily: '"Jersey 10"',
            backgroundColor: '#FFC20C',
            fontSize: '25px',
            color: '#000000'
        })
        .setPadding(10, 5)
        .setOrigin(0.5)
        .setInteractive({ cursor: 'pointer' });
    
        btn.on('pointerdown', action);
    
        btn.on('pointerover', () => {
            btn.setStyle({ backgroundColor: '#FFB000' });
        });
    
        btn.on('pointerout', () => {
            btn.setStyle({ backgroundColor: '#FFC20C' });
        });
    
        return btn;
    }
}
