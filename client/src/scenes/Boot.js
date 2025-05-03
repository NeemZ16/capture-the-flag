import { Scene } from 'phaser';

export class Boot extends Scene {
    constructor() {
        super('Boot');
    }

    preload() {
        //  The Boot Scene is typically used to load in any assets you require for your Preloader, such as a game logo or background.
        //  The smaller the file size of the assets, the better, as the Boot Scene itself has no preloader.
        this.load.bitmapFont('pixel', 'assets/fonts/carrier_command.png', 'assets/fonts/carrier_command.xml');
        this.load.font('Jersey 10', 'assets/fonts/Jersey10-Regular.ttf', 'truetype');

        this.load.image('logo', 'assets/logo.png');
    }

    create() {
        this.scene.start('Preloader');
    }
}
