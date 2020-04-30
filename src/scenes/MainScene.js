import Phaser from 'phaser';
import Player from '../entities/Player';
import OtherPlayer from '../entities/OtherPlayer';
import Pistol from '../entities/Pistol';
import Bullet from '../entities/Bullet';

export default class MainScene extends Phaser.Scene {
  constructor() {
    super('MainSceneTest');

    this.gameOver = false;
    this.setupSockets = this.setupSockets.bind(this);
    this.movementSockets = this.movementSockets.bind(this);
    this.emitPlayerMovement = this.emitPlayerMovement.bind(this);
    this.emitBullets = this.emitBullets.bind(this);
    this.pistolSockets = this.pistolSockets.bind(this);
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
  }

  preload() {
    this.load.image('sky', 'assets/sky.png');
    this.load.image('tree', 'assets/tree.png');
    this.load.image('platform', 'assets/platform.png');
    this.load.image('pistol', 'assets/pistol.png');
    this.load.image('bullet', 'assets/bullet.png');
    this.load.image('healthbar-border', 'assets/healthbar-border.png');
    this.load.image('healthbar', 'assets/healthbar.png');
    this.load.spritesheet('penguin', 'assets/penguin.png', {
      frameWidth: 64,
      frameHeight: 75,
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
    });
    this.pistols = this.physics.add.group({ classType: Pistol });
    // bullet(s):
    this.bullets = this.physics.add.group({
      classType: Bullet,
      runChildUpdate: true, // auto run update() on bullet children!
      allowGravity: false,
    });

    // background:
    this.add.image(400, 300, 'sky');
    // tree
    // this.trees = this.physics.add.staticGroup();
    // this.trees.create(200, 493, 'tree').setScale(1.5);

    // platforms:
    this.platforms = this.physics.add.staticGroup();
    this.platforms.create(400, 568, 'platform').setScale(2).refreshBody();
    this.platforms.create(600, 400, 'platform');
    this.platforms.create(50, 250, 'platform');
    this.platforms.create(750, 200, 'platform');

    // healthbar:
    this.healthbar();

    // sockets:
    this.clientSocket = io(window.location.origin);
    this.roomName = window.location.pathname;

    this.setupSockets();
    this.movementSockets();
    this.pistolSockets();
    this.bulletSockets();
    this.gameOverSocket();

    // player things:
    this.createPlayerAnims();
    this.cursors = this.input.keyboard.createCursorKeys();

    // collisions:
    this.collisions();
  }

  update(time, delta) {
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
    if (this.bullets.getChildren().length) {
      this.emitBullets();
    }
  }

  collisions() {
    this.physics.add.collider(this.players, this.platforms);
    this.physics.add.collider(this.pistols, this.platforms);
    // this.physics.add.collider(this.player, this.trees);
    // this.physics.add.collider(this.pistols, this.trees);

    this.physics.add.collider(this.otherPlayers, this.platforms);
    // this.physics.add.collider(this.testDummy, this.trees);
    // this.physics.add.collider(this.testDummy, this.player);
    this.physics.add.overlap(this.otherPlayers, this.bullets, this.hit);
    this.physics.add.overlap(this.players, this.bullets, this.hit);

    this.physics.add.overlap(this.platforms, this.bullets, this.hit);
    // this.physics.add.overlap(this.trees, this.bullets, this.hit);
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
  bulletSockets() {
    this.clientSocket.on('incomingBullet', (bulletData) => {
      // incoming bullet
      let bullet = this.bullets.getFirstDead();
      if (!bullet) {
        bullet = new Bullet(
          this,
          bulletData.x,
          bulletData.y,
          'bullet',
          bulletData.facingLeft,
          true,
          true
        ).setScale(0.9);
        this.bullets.add(bullet);
      }

      bullet.resetEmitted(bulletData.x, bulletData.y, bulletData.facingLeft);
    });
  }
  gameOverSocket() {
    this.clientSocket.on('gameHasEnded', () => {
      this.physics.pause();
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
        y !== this.player.oldPosition.y ||
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
  emitBullets() {
    this.bullets.getChildren().forEach((bullet) => {
      if (bullet.emitted === false) {
        this.clientSocket.emit('bulletFired', {
          x: bullet.x,
          y: bullet.y,
          facingLeft: bullet.facingLeft,
        });
        bullet.emitted = true;
      }
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
      otherPlayer.setTint(0x0000ff);
    } else {
      otherPlayer.setTint(0xff0000);
    }
    otherPlayer.setScale(0.75);
    otherPlayer.setCollideWorldBounds(true);
    otherPlayer.playerId = playerInfo.playerId;
  }

  pickupWeapon(player, weapon) {
    player.currentWeapon.name = `${weapon.texture.key}`;
    player.currentWeapon.holding = true;
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
    bullet.reset(unitX, unitY, this.player.facingLeft);
  }

  hit(target, bullet) {
    // if (bullet.active && target.health) {
    //   target.health -= 10;
    //   if (target.name === 'TestDummy') {
    //     this.player2Health.displayWidth -= 13.8;
    //     this.player2Health.x -= 6.9;
    //   }
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
      if (target.health <= 0) {
        this.emitGameOver();
        this.physics.pause();
      }
    }
  }
  collisionEnemyToPlayer(target, bullet) {
    if (bullet.active) {
      target.health -= 10;
      this.playerHealth.displayWidth -= 13.8;
      this.playerHealth.x -= 6.9;
      if (target.health <= 0) {
        this.emitGameOver();
        this.physics.pause();
      }
    }
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
      .image(700, 40, 'healthbar-border')
      .setScale(3);
    this.otherPlayerHealthBorder.displayWidth = 150;
    this.otherPlayerHealth = this.add.image(700, 40, 'healthbar');
    this.otherPlayerHealth.displayWidth = 138;
    this.otherPlayerHealth.displayHeight = 6;
    this.add.text(675, 10, 'Enemy', {
      fontSize: '16px',
      fill: '#000',
    });
  }
}
