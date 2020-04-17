/* eslint-disable no-lonely-if */
import Phaser from 'phaser';
import MainScene from './scenes/MainScene';

var config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  render: {
    pixelArt: true,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 600 },
      debug: false,
    },
  },
  // this is saying there is one scene, and you are importing preload/create/update for that one scene
  scene: [MainScene],
};

const game = new Phaser.Game(config);
