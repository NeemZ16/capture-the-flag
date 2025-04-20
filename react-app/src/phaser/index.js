import Phaser from 'phaser';
import GameScene     from './scenes/GameScene'
import { SIZE } from '../constants/gameConstants';

export function startGame(containerId) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: containerId,
    width: SIZE,
    height: SIZE,
    physics: {
      default: 'arcade',
      arcade: { gravity: { y: 0 }, debug: false },
    },
    scene: [ GameScene ]
  });
}