// import { Scene } from 'phaser';

import { BaseScene } from "./BaseScene";

export class Preloader extends BaseScene {
    constructor() {
        super('Preloader');
    }

    init() {
        //  We loaded this image in our Boot Scene, so we can display it here
        // this.add.image(512, 384, 'background');

        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(this.cameras.main.centerX, this.cameras.main.centerY, 468, 20).setStrokeStyle(1, 0xffffff).setOrigin(0.5);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(this.cameras.main.centerX - 230, this.cameras.main.centerY, 4, 18, 0xffffff);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress) => {

            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + (460 * progress);

        });
    }

    preload() {
        //  Load the assets for the game - Replace with your own assets
        this.load.setPath('assets');
        this.load.image('logo', 'logo.png');
    }

    create() {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.
        this.isLoggedIn().then(([isLoggedIn, username]) => {
            console.log("Logged in:", isLoggedIn, "as", username);

            if (isLoggedIn) {
                this.game.username = username;
                this.scene.start('Game');
            } else {
                this.scene.start('MainMenu');
            }
        });
    }
}
