import Phaser from 'phaser';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  preload() {
    this.load.image('sky', 'assets/sky2.png');
    this.load.image('loading', 'assets/loading.png');
    this.load.image('start', 'assets/startButton.png');
    // this.load.image('tree', 'assets/tree2.png');
    this.load.image('platform', 'assets/ice-platform.png');
    this.load.image('platform-bottom', 'assets/bottom.png');
    this.load.spritesheet('penguin', 'assets/penguin.png', {
      frameWidth: 64,
      frameHeight: 75,
    });
  }
  create() {
    this.add.image(533.5, 300, 'sky').setScale(0.56);
    this.add.image(533.5, 260, 'loading');
    this.add.image(530, 260, 'penguin');
    this.add.text(420, 165, 'Welcome to Penguin Game!', {
      fontFamily: 'Luminari',
      fontSize: '18px',
      fill: '#000',
      // fontStyle: 'bold',
    });
    let startButton = this.add.image(530, 360, 'start');
    this.add.text(509, 351, 'Start', {
      fontFamily: 'Luminari',
      fontSize: '16px',
    });
    startButton.setInteractive({ useHandCursor: true });
    startButton.on('pointerdown', () => {
      this.sys.canvas.style.cursor = '';
      this.scene.switch('MainScene');
    });

    // platforms:
    this.platforms = this.physics.add.staticGroup();
    this.bottom = this.platforms.create(533.5, 585, 'platform-bottom');
    // this.bottom = this.platforms.create(533.5, 583, 'platform-bottom');
    // this.bottom.displayWidth = 1067;
    this.bottom.displayHeight = 40;
    this.platforms.create(600, 475, 'platform');
    this.platforms.create(50, 400, 'platform');
    this.platforms.create(1017, 325, 'platform');

    // this.trees = this.physics.add.staticGroup();
  }
}
