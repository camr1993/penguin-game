/* eslint-disable max-statements */
import Phaser from 'phaser';
import Player from '../entities/Player';
import OtherPlayer from '../entities/OtherPlayer';
import Pistol from '../entities/Pistol';
import Bullet from '../entities/Bullet';

export default class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');

    this.pistolId = 0;
    this.gameOver = false;
    this.setupSockets = this.setupSockets.bind(this);
    this.hostSockets = this.hostSockets.bind(this);
    this.itemSockets = this.itemSockets.bind(this);
    this.movementSockets = this.movementSockets.bind(this);
    this.emitPlayerMovement = this.emitPlayerMovement.bind(this);
    this.emitBullets = this.emitBullets.bind(this);
    this.pistolSockets = this.pistolSockets.bind(this);
    this.heartSockets = this.heartSockets.bind(this);
    this.bulletSockets = this.bulletSockets.bind(this);
    this.gameOverSocket = this.gameOverSocket.bind(this);
    this.addPlayer = this.addPlayer.bind(this);
    this.addOtherPlayers = this.addOtherPlayers.bind(this);
    this.pickupWeapon = this.pickupWeapon.bind(this);
    this.fireWeapon = this.fireWeapon.bind(this);
    this.hit = this.hit.bind(this);
    this.disableBullet = this.disableBullet.bind(this);
    this.collisionEnemyToPlayer = this.collisionEnemyToPlayer.bind(this);
    this.collisionPlayerToEnemy = this.collisionPlayerToEnemy.bind(this);
    this.emitGameOver = this.emitGameOver.bind(this);
    this.healthbar = this.healthbar.bind(this);
    this.collisions = this.collisions.bind(this);
    this.addHealth = this.addHealth.bind(this);
  }

  preload() {
    this.load.image('sky', 'assets/sky2.png');
    this.load.image('block', 'assets/block2.png');
    this.load.image('platform', 'assets/ice-platform.png');
    this.load.image('platform-bottom', 'assets/bottom.png');
    this.load.image('pistol', 'assets/pistol.png');
    this.load.image('bullet', 'assets/bullet.png');
    this.load.image('heart', 'assets/heart.png');
    this.load.image('healthbar-border', 'assets/healthbar-border.png');
    this.load.image('healthbar', 'assets/healthbar.png');
    this.load.spritesheet('penguin', 'assets/penguin.png', {
      frameWidth: 64,
      frameHeight: 75,
    });
    this.load.spritesheet('dots', 'assets/dots.png', {
      frameWidth: 32,
      frameHeight: 8,
    });
  }
  create() {
    // groups:
    this.players = this.add.group({
      classType: Player,
    });
    this.otherPlayers = this.add.group({
      classType: OtherPlayer,
      runChildUpdate: true,
      // allowGravity: false,
    });
    this.pistols = this.physics.add.group({ classType: Pistol });
    // bullet(s):
    this.bullets = this.physics.add.group({
      classType: Bullet,
      runChildUpdate: true, // auto run update() on bullet children!
      allowGravity: false,
    });

    // background:
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

    // heart:
    this.hearts = this.physics.add.group();

    // waiting text:
    this.waiting = this.add.text(430, 50, 'Waiting For Player 2', {
      fontSize: '18px',
      fill: '#000',
    });
    this.dots = this.add.sprite(659, 63, 'dots').setScale(0.5);
    this.anims.create({
      key: 'waiting',
      frames: this.anims.generateFrameNumbers('dots', { start: 0, end: 2 }),
      frameRate: 2,
      repeat: -1,
    });

    // Too many players text:
    this.tooMany = this.add.text(
      340,
      50,
      'Too Many Players...Try again later!',
      {
        fontSize: '18px',
        fill: '#000',
      }
    );
    this.tooMany.setVisible(false);

    // healthbar:
    this.healthbar();

    // sockets:
    this.clientSocket = io(window.location.origin);
    this.roomName = window.location.pathname;

    this.setupSockets();
    this.movementSockets();
    this.pistolSockets();
    this.heartSockets();
    this.bulletSockets();
    this.gameOverSocket();
    this.hostSockets();
    this.itemSockets();
    this.clientSocket.on('remove', () => {
      this.dots.setVisible(false);
      this.waiting.setVisible(false);
    });

    // player things:
    this.createPlayerAnims();
    this.cursors = this.input.keyboard.createCursorKeys();

    // collisions:
    this.collisions();
  }

  update(time, delta) {
    // console.log(this.anims);
    if (this.dots) {
      this.dots.anims.play('waiting', true);
    }
    // this.anims.play('waiting', true);
    if (this.player) {
      this.player.update(this.cursors);
      this.emitPlayerMovement();
    }

    // create bullets and emit bullet movement
    if (this.pistols.getChildren().length) {
      this.pistols.getChildren().forEach((pistol) => {
        pistol.update(time, this.cursors, this.player, this.fireWeapon);
      });
    }
  }

  collisions() {
    this.physics.add.collider(this.players, this.platforms);
    this.physics.add.collider(this.pistols, this.platforms);
    this.physics.add.collider(this.players, this.blocks);
    this.physics.add.collider(this.pistols, this.blocks);
    this.physics.add.collider(this.hearts, this.platforms);

    this.physics.add.collider(this.otherPlayers, this.platforms);
    this.physics.add.collider(this.otherPlayers, this.blocks);
    this.physics.add.overlap(this.otherPlayers, this.bullets, this.hit);
    this.physics.add.overlap(this.players, this.bullets, this.hit);

    this.physics.add.overlap(this.players, this.hearts, this.addHealth);
    this.physics.add.overlap(this.otherPlayers, this.hearts, this.addHealth);

    this.physics.add.overlap(this.platforms, this.bullets, this.hit);
    this.physics.add.overlap(this.blocks, this.bullets, this.hit);
    this.physics.add.overlap(
      this.players,
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

  setupSockets() {
    this.clientSocket.on('connect', function () {
      console.log(`client side connected with user`);
    });

    // Make the player from the info we get from the server:
    this.clientSocket.on('currentPlayers', (players) => {
      Object.keys(players).forEach((id) => {
        if (players[id].playerId === this.clientSocket.id) {
          this.addPlayer(players[id]);
        } else {
          this.addOtherPlayers(players[id]);
        }
      });
    });
    this.clientSocket.on('newPlayer', (playerInfo) => {
      this.addOtherPlayers(playerInfo);
    });
    this.clientSocket.on('disconnect', (playerId) => {
      this.otherPlayers.getChildren().forEach((enemy) => {
        if (playerId === enemy.playerId) {
          enemy.destroy();
        }
      });
    });
  }
  hostSockets() {
    this.clientSocket.on('host', () => {
      console.log('I am the host');
    });
    this.clientSocket.on('player2', () => {
      console.log('I am player2');
      this.clientSocket.emit('player2-ready');
    });
    this.clientSocket.on('tooManyPlayers', () => {
      this.dots.setVisible(false);
      this.waiting.setVisible(false);
      this.tooMany.setVisible(true);
      this.hearts.setVisible(false);
    });
  }
  itemSockets() {
    this.clientSocket.on('startGame', () => {
      setTimeout(() => {
        let x = Math.floor(Math.random() * 400) + 1;
        const pistol = this.pistols.create(x, 20, 'pistol');
        this.pistolId++;
        pistol.id = this.pistolId;
        this.clientSocket.emit('pistolCreated', {
          x: x,
          y: 20,
          id: pistol.id,
        });

        const pistol2 = this.pistols.create(1067 - x, 100, 'pistol');
        this.pistolId++;
        pistol2.id = this.pistolId;
        this.clientSocket.emit('pistolCreated', {
          x: 1067 - x,
          y: 100,
          id: pistol2.id,
        });
      }, 7000);

      setTimeout(() => {
        const heart1 = this.hearts.create(533.5, 10, 'heart').setScale(0.7);
        heart1.id = 1;
        this.clientSocket.emit('heartCreated', {
          x: 533.5,
          y: 10,
          id: heart1.id,
        });
      }, 15000);

      this.dots.setVisible(false);
      this.waiting.setVisible(false);
      this.clientSocket.emit('removeWaitingText');
    });
  }

  movementSockets() {
    this.clientSocket.on('playerMoved', (playerInfo) => {
      this.otherPlayers.getChildren().forEach((otherPlayer) => {
        if (playerInfo.playerId === otherPlayer.playerId) {
          otherPlayer.facingLeft = playerInfo.facingLeft;
          otherPlayer.setPosition(playerInfo.x, playerInfo.y);
          otherPlayer.currentWeapon = playerInfo.currentWeapon;
          otherPlayer.run = playerInfo.run;
        }
      });
    });
  }
  pistolSockets() {
    this.clientSocket.on('pistolLocation', (pistolInfo) => {
      const pistol = this.pistols.create(pistolInfo.x, pistolInfo.y, 'pistol');
      pistol.id = pistolInfo.id;
    });
    this.clientSocket.on('pistolDestroy', (pistolId) => {
      this.pistols.getChildren().forEach((pistol) => {
        if (pistol.id === pistolId) {
          pistol.disableBody(true, true);
        }
      });
    });
  }
  heartSockets() {
    this.clientSocket.on('heartLocation', (heartInfo) => {
      const heart = this.hearts
        .create(heartInfo.x, heartInfo.y, 'heart')
        .setScale(0.7);
      heart.id = heartInfo.id;
    });
  }
  bulletSockets() {
    this.clientSocket.on('incomingBullet', (bulletData) => {
      // incoming bullet
      let bullet = this.bullets.getFirstDead();
      if (bullet) {
        bullet.resetEmitted(bulletData.x, bulletData.y, bulletData.facingLeft);
      }
      if (!bullet) {
        bullet = new Bullet(
          this,
          bulletData.x,
          bulletData.y,
          'bullet',
          bulletData.facingLeft,
          true,
          bulletData.enemyBullet
        ).setScale(0.9);
        this.bullets.add(bullet);
      }
    });
  }
  gameOverSocket() {
    this.clientSocket.on('gameHasEnded', () => {
      this.physics.pause();
      this.clientSocket.emit('disconnectMe');
      if (this.player.health === 0) {
        this.scene.switch('EndSceneLose');
      } else {
        this.scene.switch('EndSceneWin');
      }
    });
  }

  emitPlayerMovement() {
    let x = this.player.x;
    let y = this.player.y;
    let facingLeft = this.player.facingLeft;
    let holdingWeapon = this.player.currentWeapon.holding;
    if (
      this.player.oldPosition &&
      (x !== this.player.oldPosition.x ||
        y.toFixed(3) !== this.player.oldPosition.y.toFixed(3) ||
        facingLeft !== this.player.oldPosition.facingLeft ||
        holdingWeapon !== this.player.oldPosition.holdingWeapon)
    ) {
      this.clientSocket.emit('playerMovement', {
        x: this.player.x,
        y: this.player.y,
        facingLeft: this.player.facingLeft,
        currentWeapon: this.player.currentWeapon,
        run: this.player.x !== this.player.oldPosition.x,
      });
    }

    // save old position data
    this.player.oldPosition = {
      x: this.player.x,
      y: this.player.y,
      facingLeft: this.player.facingLeft,
      holdingWeapon: this.player.currentWeapon.holding,
    };
  }
  emitBullets(bullet) {
    this.clientSocket.emit('bulletFired', {
      x: bullet.x,
      y: bullet.y,
      facingLeft: bullet.facingLeft,
      enemyBullet: true,
    });
  }
  emitGameOver() {
    this.clientSocket.emit('gameOver');
  }

  addPlayer(playerInfo) {
    this.player = this.players.create(playerInfo.x, playerInfo.y, 'penguin');
    this.player.setScale(0.75);
    this.player.setCollideWorldBounds(true);
  }

  addOtherPlayers(playerInfo) {
    const otherPlayer = this.otherPlayers.create(
      playerInfo.x,
      playerInfo.y,
      'penguin'
    );
    if (playerInfo.team === 'blue') {
      otherPlayer.setTint(0x00ffff); // 0x0000ff
      // otherPlayer.clearTint();
    } else {
      otherPlayer.setTint(0x00ffff); // 0xff0000
      // otherPlayer.clearTint();
    }
    otherPlayer.setScale(0.75);
    otherPlayer.setCollideWorldBounds(true);
    otherPlayer.playerId = playerInfo.playerId;
  }

  pickupWeapon(player, weapon) {
    player.currentWeapon.name = `${weapon.texture.key}`;
    player.currentWeapon.holding = true;
    player.currentWeapon.id = weapon.id;
    weapon.disableBody(true, true);

    this.clientSocket.emit('pistolPickedUp', weapon.id);
  }

  fireWeapon() {
    const offsetX = 10;
    const offsetY = 3;
    const unitX = this.player.x + (this.player.facingLeft ? -offsetX : offsetX);
    const unitY = this.player.y + offsetY;

    // Check if there are any dead bullets, if not then create a new one
    let bullet = this.bullets.getFirstDead();
    if (bullet) {
      bullet.reset(unitX, unitY, this.player.facingLeft);
    }
    if (!bullet) {
      bullet = new Bullet(
        this,
        unitX,
        unitY,
        'bullet',
        this.player.facingLeft,
        false
      ).setScale(0.9);
      this.bullets.add(bullet);
    }
    this.emitBullets(bullet);
  }

  hit(target, bullet) {
    if (target.body.immovable) {
      this.disableBullet(bullet);
    }

    // from Player perspective: if bullet is friendly and its hits an enemy, it should disappear
    // but if the bullet is an enemy bullet and fired from the other player, it shouldn't collide with other player
    if (!bullet.enemyBullet && target.name === 'OtherPlayer') {
      this.collisionPlayerToEnemy(target, bullet);
      this.disableBullet(bullet);
    }

    // if it is an enemy bullet and it hits the player, then bullet disappears
    if (bullet.enemyBullet && target.name === 'Player') {
      this.collisionEnemyToPlayer(target, bullet);
      this.disableBullet(bullet);
    }
  }
  disableBullet(bullet) {
    bullet.setActive(false);
    bullet.setVisible(false);
  }
  collisionPlayerToEnemy(target, bullet) {
    if (bullet.active) {
      target.health -= 10;
      this.otherPlayerHealth.displayWidth -= 13.8;
      this.otherPlayerHealth.x -= 6.9;
    }
  }
  collisionEnemyToPlayer(target, bullet) {
    if (bullet.active) {
      target.health -= 10;
      this.playerHealth.displayWidth -= 13.8;
      this.playerHealth.x -= 6.9;
      if (target.health <= 0) {
        this.emitGameOver();
      }
    }
  }

  addHealth(target, heart) {
    target.health = 100;
    if (heart.active) {
      if (target.name === 'Player') {
        this.playerHealth.displayWidth = 138;
        this.playerHealth.x = 100;
      } else {
        this.otherPlayerHealth.displayWidth = 138;
        this.otherPlayerHealth.x = 967;
      }
    }
    heart.setActive(false);
    heart.setVisible(false);
  }

  healthbar() {
    this.playerHealthBorder = this.add
      .image(100, 40, 'healthbar-border')
      .setScale(3);
    this.playerHealthBorder.displayWidth = 150;
    this.playerHealth = this.add.image(100, 40, 'healthbar');
    this.playerHealth.displayWidth = 138;
    this.playerHealth.displayHeight = 6;
    this.add.text(65, 10, 'Player 1', {
      fontSize: '16px',
      fill: '#000',
    });

    this.otherPlayerHealthBorder = this.add
      .image(967, 40, 'healthbar-border')
      .setScale(3);
    this.otherPlayerHealthBorder.displayWidth = 150;
    this.otherPlayerHealth = this.add.image(967, 40, 'healthbar');
    this.otherPlayerHealth.displayWidth = 138;
    this.otherPlayerHealth.displayHeight = 6;
    this.add.text(945, 10, 'Enemy', {
      fontSize: '16px',
      fill: '#000',
    });
  }
}
