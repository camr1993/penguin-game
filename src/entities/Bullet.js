/* eslint-disable max-params */
/* eslint-disable no-lonely-if */
import Phaser from 'phaser';

// sprite is a built-in game object of phaser that can display both static and animated images
export default class Bullet extends Phaser.Physics.Arcade.Sprite {
  constructor(
    scene,
    x,
    y,
    spriteKey,
    facingLeft,
    emitted,
    enemyBullet = false
  ) {
    super(scene, x, y, spriteKey);
    this.scene.add.existing(this);
    this.scene.physics.world.enable(this);

    this.speed = Phaser.Math.GetSpeed(800, 1); // distance in px, time in ms
    this.facingLeft = facingLeft;
    this.emitted = emitted;
    this.enemyBullet = enemyBullet;
  }

  reset(x, y, facingLeft) {
    this.setActive(true);
    this.setVisible(true);
    this.lifespan = 1500;
    this.facingLeft = facingLeft;
    this.setPosition(x, y);
    this.emitted = false;
    this.enemyBullet = false;
  }
  resetEmitted(x, y, facingLeft) {
    this.setActive(true);
    this.setVisible(true);
    this.lifespan = 1500;
    this.facingLeft = facingLeft;
    this.setPosition(x, y);
    this.emitted = true;
    this.enemyBullet = false;
  }

  // maybe can pass down a true/false that checks for collision?
  update(time, delta) {
    this.lifespan -= delta;
    const moveDistance = this.speed * delta;
    if (this.facingLeft) {
      this.x -= moveDistance;
    } else {
      this.angle = 180;
      this.x += moveDistance;
    }
    if (this.lifespan <= 0) {
      this.setActive(false);
      this.setVisible(false);
    }
  }
}
