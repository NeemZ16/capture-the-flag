import Phaser from 'phaser';
import { COLOR } from '../../constants/gameConstants';

export default class BaseFlag {
  constructor(scene, team, x, y) {
    this.scene = scene;
    this.team  = team;
    this.text  = scene.add.text(x, y - 18, '⚑', {
      fontSize: '24px',
      fill: '#fff'
    }).setOrigin(0.5, 1)
      .setTint(COLOR[team]);
  }

  destroy() {
    this.text.destroy();
  }
}