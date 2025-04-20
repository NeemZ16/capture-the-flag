import Phaser from 'phaser'

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene')
  }

  preload() {
    // e.g. this.load.image('flag', 'assets/images/flag.png')
  }

  create() {
    // once any assets are loaded, go to menu
    this.scene.start('MainMenuScene')
  }
}