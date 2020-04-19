import Phaser from 'phaser';
import Player from '../entities/Player';
import TestDummy from '../entities/TestDummy';
import Pistol from '../entities/Pistol';
import Bullet from '../entities/Bullet';

const players = {};

export default class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');

    this.gameOver = false;
    this.pickupWeapon = this.pickupWeapon.bind(this);
    this.fireWeapon = this.fireWeapon.bind(this);
    this.hit = this.hit.bind(this);
  }

  preload() {
    this.load.image('sky', 'assets/sky.png');
    this.load.image('tree', 'assets/tree.png');
    this.load.image('platform', 'assets/platform.png');
    this.load.image('healthbar-border', 'assets/healthbar-border.png');
    this.load.image('healthbar', 'assets/healthbar.png');
    this.load.image('pistol', 'assets/pistol.png');
    this.load.image('bullet', 'assets/bullet.png');
    this.load.spritesheet('penguin', 'assets/penguin.png', {
      frameWidth: 64,
      frameHeight: 75,
    });
    this.load.spritesheet('testDummy', 'assets/testDummy.png', {
      frameWidth: 64,
      frameHeight: 75,
    });
  }
  create() {
    this.socket = io();

    // background:
    this.add.image(400, 300, 'sky');

    // healthbar:
    this.healthbar();

    // tree
    this.trees = this.physics.add.staticGroup();
    this.trees.create(200, 493, 'tree').setScale(1.5);

    // platforms:
    this.platforms = this.physics.add.staticGroup();

    this.platforms.create(400, 568, 'platform').setScale(2).refreshBody();
    this.platforms.create(600, 400, 'platform');
    this.platforms.create(50, 250, 'platform');
    this.platforms.create(750, 200, 'platform');

    // player:

    // this is the same as saying we are adding a sprite (with Physics.Arcade properties/method) to (thisScene, xVal = 100, yVal = 400, using spriteKey='penguin')
    this.player = new Player(this, 100, 400, 'penguin');
    this.player.setScale(0.75);
    this.player.setCollideWorldBounds(true);
    this.createPlayerAnims();

    this.cursors = this.input.keyboard.createCursorKeys();

    // pistol(s):
    this.pistols = this.physics.add.group({ classType: Pistol });
    this.pistol = this.pistols.create(330, 300, 'pistol');

    // bullet(s):
    this.bullets = this.physics.add.group({
      classType: Bullet,
      runChildUpdate: true, // auto run update() on bullet children!
      allowGravity: false,
    });

    // test dummy:
    this.testDummy = new TestDummy(this, 500, 400, 'penguin');
    this.testDummy.setScale(0.75);
    this.testDummy.setCollideWorldBounds(true);
    this.testDummy.setTint(0x00ffff);

    // collisions:
    this.collisions();
  }

  update(time, delta) {
    this.player.update(this.cursors);
    this.pistol.update(time, this.cursors, this.player, this.fireWeapon);
  }

  collisions() {
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.pistols, this.platforms);
    this.physics.add.collider(this.player, this.trees);
    this.physics.add.collider(this.pistols, this.trees);

    this.physics.add.collider(this.testDummy, this.platforms);
    this.physics.add.collider(this.testDummy, this.trees);
    // this.physics.add.collider(this.testDummy, this.player);
    this.physics.add.overlap(this.testDummy, this.bullets, this.hit);

    this.physics.add.overlap(this.platforms, this.bullets, this.hit);
    this.physics.add.overlap(this.trees, this.bullets, this.hit);
    this.physics.add.overlap(
      this.player,
      this.pistols,
      this.pickupWeapon,
      null,
      this
    );
  }

  createPlayerAnims() {
    this.anims.create({
      key: 'stop',
      frames: [{ key: 'penguin', frame: 0 }],
      frameRate: 20,
    });
    this.anims.create({
      key: 'run',
      frames: this.anims.generateFrameNumbers('penguin', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: 'jump',
      frames: [{ key: 'penguin', frame: 4 }],
      frameRate: 20,
    });

    this.anims.create({
      key: 'stoppistol',
      frames: [{ key: 'penguin', frame: 7 }],
      frameRate: 20,
    });
    this.anims.create({
      key: 'runpistol',
      frames: this.anims.generateFrameNumbers('penguin', { start: 7, end: 10 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: 'jumppistol',
      frames: [{ key: 'penguin', frame: 11 }],
      frameRate: 20,
    });
  }

  pickupWeapon(player, weapon) {
    player.currentWeapon.name = `${weapon.texture.key}`;
    player.currentWeapon.holding = true;
    weapon.disableBody(true, true);
  }

  fireWeapon() {
    const offsetX = 10;
    const offsetY = 3;
    const unitX = this.player.x + (this.player.facingLeft ? -offsetX : offsetX);
    const unitY = this.player.y + offsetY;

    // Check if there are any dead bullets, if not then create a new one
    let bullet = this.bullets.getFirstDead();
    if (!bullet) {
      bullet = new Bullet(
        this,
        unitX,
        unitY,
        'bullet',
        this.player.facingLeft
      ).setScale(0.9);
      this.bullets.add(bullet);
    }

    bullet.reset(unitX, unitY, this.player.facingLeft);
  }

  healthbar() {
    this.player1HealthBorder = this.add
      .image(100, 40, 'healthbar-border')
      .setScale(3);
    this.player1HealthBorder.displayWidth = 150;
    this.player1Health = this.add.image(100, 40, 'healthbar');
    this.player1Health.displayWidth = 138;
    this.player1Health.displayHeight = 6;
    this.add.text(65, 10, 'Player 1', {
      fontSize: '16px',
      fill: '#000',
    });

    this.player2HealthBorder = this.add
      .image(700, 40, 'healthbar-border')
      .setScale(3);
    this.player2HealthBorder.displayWidth = 150;
    this.player2Health = this.add.image(700, 40, 'healthbar');
    this.player2Health.displayWidth = 138;
    this.player2Health.displayHeight = 6;
    this.add.text(665, 10, 'Player 2', {
      fontSize: '16px',
      fill: '#000',
    });
  }

  hit(target, bullet) {
    if (bullet.active && target.health) {
      target.health -= 10;
      if (target.name === 'TestDummy') {
        this.player2Health.displayWidth -= 13.8;
        this.player2Health.x -= 6.9;
      }
      if (target.health <= 0) {
        this.physics.pause();
        target.clearTint();
        target.setTint(0xff0000);
        this.gameOver = true;
      }
    }
    bullet.setActive(false);
    bullet.setVisible(false);
  }
}
