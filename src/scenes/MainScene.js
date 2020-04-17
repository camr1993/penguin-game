import Phaser from 'phaser';
import Player from '../entities/Player';
import Pistol from '../entities/Pistol';
import Bullet from '../entities/Bullet';

// I think the purpose of having a separate entity is to set things on it's contructor and alter things that will specifically affect that entity

export default class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');

    this.pickupWeapon = this.pickupWeapon.bind(this);
    this.fireWeapon = this.fireWeapon.bind(this);
  }

  preload() {
    this.load.image('sky', 'assets/sky.png');
    this.load.image('platform', 'assets/platform.png');
    this.load.image('pistol', 'assets/pistol.png');
    this.load.image('bullet', 'assets/bullet.png');
    this.load.spritesheet('penguin', 'assets/penguin.png', {
      frameWidth: 64,
      frameHeight: 75,
    });
  }
  create() {
    // background:
    this.add.image(400, 300, 'sky');

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
      runChildUpdate: true, // auto run update() on bullet!
      allowGravity: false,
    });
    // this.bullet = this.bullets.create(350, 300, 'bullet').setScale(0.9);

    // collisions:
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.pistols, this.platforms);
    this.physics.add.collider(this.bullets, this.platforms);

    this.physics.add.overlap(
      this.player,
      this.pistols,
      this.pickupWeapon,
      null,
      this
    );
  }

  update(time, delta) {
    this.player.update(this.cursors);
    this.pistol.update(time, this.cursors, this.player, this.fireWeapon);
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

    let bullet = new Bullet(
      this,
      unitX,
      unitY,
      'bullet',
      this.player.facingLeft
    ).setScale(0.9);
    this.bullets.add(bullet);
  }
}
