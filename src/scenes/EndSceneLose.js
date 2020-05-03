import Phaser from 'phaser';

export default class EndSceneLose extends Phaser.Scene {
  constructor() {
    super('EndSceneLose');
  }

  preload() {
    this.load.image('sky', 'assets/sky2.png');
    this.load.image('block', 'assets/block2.png');
    this.load.image('loading', 'assets/loading.png');
    this.load.image('start', 'assets/startButton.png');
    this.load.image('platform', 'assets/ice-platform.png');
    this.load.image('platform-bottom', 'assets/bottom.png');
    this.load.spritesheet('penguin', 'assets/penguin.png', {
      frameWidth: 64,
      frameHeight: 75,
    });
  }
  create() {
    this.add.image(533.5, 300, 'sky').setScale(0.56);

    // block
    this.blocks = this.physics.add.staticGroup();
    this.blocks.create(533.5, 538, 'block');
    this.blocks.create(533.5, 488, 'block');
    this.blocks.create(582.5, 538, 'block');
    this.blocks.create(484.5, 538, 'block');

    this.blocks.create(300, 200, 'block');
    this.blocks.create(767, 200, 'block');
    this.blocks.create(130, 290, 'block');
    this.blocks.create(937, 290, 'block');

    // platforms:
    this.platforms = this.physics.add.staticGroup();
    this.bottom = this.platforms.create(533.5, 585, 'platform-bottom');
    this.bottom.displayHeight = 40;
    this.bottom.refreshBody();
    this.platforms.create(800.25, 400, 'platform');
    this.platforms.create(266.75, 400, 'platform');
    this.platforms.create(533.5, 150, 'platform');

    this.add.image(533.5, 260, 'loading');
    this.add.image(530, 260, 'penguin');
    this.add.text(490, 165, 'You Lose!', {
      fontFamily: 'Luminari',
      fontSize: '18px',
      fill: '#000',
    });
    let startButton = this.add.image(530, 360, 'start');
    this.add.text(502, 351, 'Restart', {
      fontFamily: 'Luminari',
      fontSize: '16px',
    });
    startButton.setInteractive({ useHandCursor: true });
    startButton.on('pointerdown', () => {
      this.sys.canvas.style.cursor = '';
      this.scene.switch('MainScene');
    });
  }
}
