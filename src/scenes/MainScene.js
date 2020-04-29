import Phaser from 'phaser';
import Player from '../entities/Player';
import OtherPlayer from '../entities/OtherPlayer';
import Pistol from '../entities/Pistol';
import Bullet from '../entities/Bullet';

export default class MainScene extends Phaser.Scene {
  constructor() {
    super('MainSceneTest');

    this.currentPistols = [];

    this.gameOver = false;
    this.setupSockets = this.setupSockets.bind(this);
    this.movementSockets = this.movementSockets.bind(this);
    this.pistolSockets = this.pistolSockets.bind(this);
    this.addPlayer = this.addPlayer.bind(this);
    this.addOtherPlayers = this.addOtherPlayers.bind(this);
    this.pickupWeapon = this.pickupWeapon.bind(this);
    this.fireWeapon = this.fireWeapon.bind(this);
  }

  preload() {
    this.load.image('sky', 'assets/sky.png');
    this.load.image('tree', 'assets/tree.png');
    this.load.image('platform', 'assets/platform.png');
    this.load.image('pistol', 'assets/pistol.png');
    this.load.image('bullet', 'assets/bullet.png');
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

    // sockets:
    this.clientSocket = io(window.location.origin);
    this.roomName = window.location.pathname;

    this.setupSockets();
    this.movementSockets();
    this.pistolSockets();

    // player things:
    this.createPlayerAnims();
    this.cursors = this.input.keyboard.createCursorKeys();

    // collisions:
    this.collisions();
  }

  update(time, delta) {
    if (this.player) {
      this.player.update(this.cursors);

      // emit player movement
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

    if (this.currentPistols.length) {
      this.currentPistols.forEach((pistol) => {
        pistol.update(time, this.cursors, this.player, this.fireWeapon);
      });
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
    // this.physics.add.overlap(this.testDummy, this.bullets, this.hit);

    // this.physics.add.overlap(this.platforms, this.bullets, this.hit);
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
      this.currentPistols.push(pistol);
      console.log(pistol);
    });
    this.clientSocket.on('pistolDestroy', (pistolId) => {
      this.pistols.getChildren().forEach((pistol) => {
        if (pistol.id === pistolId) {
          pistol.disableBody(true, true);
        }
      });
    });
  }

  addPlayer(playerInfo) {
    this.player = this.players.create(playerInfo.x, playerInfo.y, 'penguin');
    // this.player = new Player(this, playerInfo.x, playerInfo.y, 'penguin');
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
        this.player.facingLeft
      ).setScale(0.9);
      this.bullets.add(bullet);
    }

    bullet.reset(unitX, unitY, this.player.facingLeft);
  }
}
