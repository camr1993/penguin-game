/* eslint-disable no-lonely-if */
import Phaser from 'phaser';

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
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

const game = new Phaser.Game(config);

function preload() {
  this.load.image('sky', 'assets/sky.png');
  this.load.image('platform', 'assets/platform.png');
  this.load.image('pistol', 'assets/pistol.png');
  this.load.image('star', 'assets/star.png');
  this.load.image('bomb', 'assets/bomb.png');
  this.load.spritesheet('penguin', 'assets/penguin.png', {
    frameWidth: 64,
    frameHeight: 75,
  });
}

let platforms;
let player;
let cursors;
let stars;
let bombs;

let score = 0;
let scoreText;
let gameOver = false;
let facingLeft = false;
let holdingWeapon = false;
let currentWeapon = {
  holding: false,
  name: '',
};

function create() {
  // background:
  this.add.image(400, 300, 'sky');

  // platforms:
  platforms = this.physics.add.staticGroup();

  platforms.create(400, 568, 'platform').setScale(2).refreshBody();
  platforms.create(600, 400, 'platform');
  platforms.create(50, 250, 'platform');
  platforms.create(750, 200, 'platform');

  // player:
  player = this.physics.add.sprite(100, 450, 'penguin');
  player.setScale(0.75);
  player.setCollideWorldBounds(true);

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

  cursors = this.input.keyboard.createCursorKeys();

  // stars:
  stars = this.physics.add.group({
    key: 'star',
    repeat: 11,
    setXY: { x: 12, y: 0, stepX: 70 },
  });

  stars.children.iterate((child) => {
    child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
  });

  // score:
  scoreText = this.add.text(16, 16, 'score: 0', {
    fontSize: '32px',
    fill: '#000',
  });

  // bombs:
  bombs = this.physics.add.group();

  // pistols:
  let pistols = this.physics.add.group();
  let pistol = pistols.create(330, 300, 'pistol');

  // collisions:
  this.physics.add.collider(player, platforms);
  this.physics.add.collider(stars, platforms);
  this.physics.add.collider(bombs, platforms);
  this.physics.add.collider(pistols, platforms);

  this.physics.add.overlap(player, stars, collectStar, null, this);
  this.physics.add.overlap(player, pistols, pickupWeapon, null, this);
  this.physics.add.collider(player, bombs, hitBomb, null, this);
}

function update() {
  jumpFromGround(cursors, player);
  leftMovements(cursors, player);
  rightMovements(cursors, player);
  noMovements(cursors, player);
}

function collectStar(player, star) {
  star.disableBody(true, true);

  score += 10;
  scoreText.setText('Score: ' + score);

  // if we collect all the stars, re-enable them and create bombs
  if (stars.countActive(true) === 0) {
    stars.children.iterate((child) => {
      // keeps their x position and resets y position to 0
      child.enableBody(true, child.x, 0, true, true);
    });

    // find out where the player is and so we can put the bomb's x position on the other side
    const x =
      player.x < 400
        ? Phaser.Math.Between(400, 800)
        : Phaser.Math.Between(0, 400);

    // create bomb with x and y coords, add bounce/collision and set velocity
    const bomb = bombs.create(x, 16, 'bomb');
    bomb.setBounce(1);
    bomb.setCollideWorldBounds(true);
    bomb.setVelocity(Phaser.Math.Between(-400, 400), 20);
  }
}

function hitBomb(player, bomb) {
  this.physics.pause();
  player.setTint(0xff0000);
  player.anims.play('stop');
  gameOver = true;
}

// will need to change this to pickup Weapon to reuse it
function pickupWeapon(player, weapon) {
  currentWeapon.name = `${weapon.texture.key}`;
  weapon.disableBody(true, true);
  currentWeapon.holding = true;
}

function jumpFromGround(cursors, player) {
  if (cursors.up.isDown && player.body.touching.down) {
    player.setVelocityY(-500);
  }
}

function leftMovements(cursors, player) {
  if (cursors.left.isDown) {
    if (!facingLeft) {
      player.flipX = !player.flipX;
      facingLeft = true;
    }
    player.setVelocityX(-210);
    if (player.body.touching.down) {
      if (currentWeapon.holding) {
        player.anims.play(`run${currentWeapon.name}`, true);
      } else {
        player.anims.play('run', true);
      }
    } else {
      if (currentWeapon.holding) {
        player.anims.play(`jump${currentWeapon.name}`, true);
      } else {
        player.anims.play('jump');
      }
    }
  }
}

function rightMovements(cursors, player) {
  if (cursors.right.isDown) {
    if (facingLeft) {
      player.flipX = !player.flipX;
      facingLeft = false;
    }
    player.setVelocityX(210);
    if (player.body.touching.down) {
      if (currentWeapon.holding) {
        player.anims.play(`run${currentWeapon.name}`, true);
      } else {
        player.anims.play('run', true);
      }
    } else {
      if (currentWeapon.holding) {
        player.anims.play(`jump${currentWeapon.name}`, true);
      } else {
        player.anims.play('jump');
      }
    }
  }
}

function noMovements(cursors, player) {
  if (!cursors.left.isDown && !cursors.right.isDown) {
    player.setVelocityX(0);
    if (player.body.touching.down) {
      if (currentWeapon.holding) {
        player.anims.play(`stop${currentWeapon.name}`);
      } else {
        player.anims.play('stop');
      }
    } else {
      if (currentWeapon.holding) {
        player.anims.play(`jump${currentWeapon.name}`);
      } else {
        player.anims.play('jump');
      }
    }
  }
}
