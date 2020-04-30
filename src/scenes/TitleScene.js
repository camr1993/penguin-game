import Phaser from 'phaser';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  preload() {
    this.load.image('sky', 'assets/sky3.png');
  }
  create() {
    this.add.image(533.5, 300, 'sky').setScale(0.56);
    let startButton = this.add.text(400, 300, 'Welcome homie');
    startButton.setInteractive({ useHandCursor: true });
    startButton.on('pointerdown', () => {
      this.sys.canvas.style.cursor = '';
      this.scene.switch('MainScene');
    });
  }
}
