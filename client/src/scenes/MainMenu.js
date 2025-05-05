import { BaseScene } from './BaseScene';

export class MainMenu extends BaseScene {
    constructor() {
        super('MainMenu');
    }
    
    create() {
        if (this.game.username) {
            this.scene.start('Profile');
        }

        this.uiContainer = this.add.container(this.dimensions.width / 2, this.dimensions.height / 2);

        const logo = this.add.image(0, -100, 'logo');
        this.uiContainer.add(logo);

        this.loginText = this.add.bitmapText(0, 30, 'pixel', 'Log In', 25)
            .setOrigin(0.5)
            .setInteractive({ cursor: 'pointer' })
            .on('pointerdown', () => {
                this.scene.start('Login');
            });
        this.uiContainer.add(this.loginText);

        this.registerText = this.add.bitmapText(0, 30 + 25 + 30, 'pixel', 'Register', 25)
            .setOrigin(0.5)
            .setInteractive({ cursor: 'pointer' })
            .on('pointerdown', () => {
                this.scene.start('Register');
            })
        this.uiContainer.add(this.registerText);

        // Menu options
        this.menuOptions = [this.loginText, this.registerText];
        this.selectedIndex = 0;

        // Input keys
        this.cursors = this.input.keyboard.createCursorKeys();
        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

        // Function to update selected item
        this.updateSelectedIndex = (newIndex) => {
            // Clear tints from all
            this.menuOptions.forEach(option => option.clearTint());

            // Update index
            this.selectedIndex = newIndex;

            // Highlight selected
            this.menuOptions[this.selectedIndex].setTint(0xFFC20C);
        };

        // highlights work on hover too
        this.loginText.on('pointerover', () => {this.updateSelectedIndex(0)});
        this.registerText.on('pointerover', () => {this.updateSelectedIndex(1)});
        // this.guestText.on('pointerover', () => {this.updateSelectedIndex(2)});

        // Keyboard events
        this.input.keyboard.on('keydown-UP', () => {
            this.updateSelectedIndex((this.selectedIndex - 1 + this.menuOptions.length) % this.menuOptions.length);
        });

        this.input.keyboard.on('keydown-DOWN', () => {
            this.updateSelectedIndex((this.selectedIndex + 1) % this.menuOptions.length);
        });

        this.enterKey.on('down', () => {
            this.menuOptions[this.selectedIndex].emit('pointerdown');
        });

        // Initial highlight
        this.updateSelectedIndex(0);
    }

    onResize() {
        this.uiContainer.setPosition(
            this.dimensions.width / 2,
            this.dimensions.height / 2
        );
    }
}
