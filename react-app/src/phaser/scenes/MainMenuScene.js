import Phaser from 'phaser'
import { SIZE } from '../../constants/gameConstants'

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene')
  }

  create() {
    // simple “click to start” screen
    this.add
      .text(SIZE / 2, SIZE / 2, 'Click to Start', {
        fontSize: '32px',
        fill: '#fff'
      })
      .setOrigin(0.5)

    // on pointer, go into the real game
    this.input.once('pointerdown', () => {
      this.scene.start('GameScene')
    })
  }
}