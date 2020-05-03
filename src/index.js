/* eslint-disable no-lonely-if */
import Phaser from 'phaser';
import MainScene from './scenes/MainScene';
import TitleScene from './scenes/TitleScene';
import EndSceneWin from './scenes/EndSceneWin';
import EndSceneLose from './scenes/EndSceneLose';

var config = {
  type: Phaser.AUTO,
  width: 1067,
  height: 600,
  autoFocus: false,
  render: {
    pixelArt: true,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1000 },
      debug: false,
    },
  },
  // this is saying there is one scene, and you are importing preload/create/update for that one scene
  scene: [TitleScene, MainScene, EndSceneWin, EndSceneLose],
};

const game = new Phaser.Game(config);
