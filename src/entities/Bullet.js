/* eslint-disable no-lonely-if */
import Phaser from 'phaser';

// sprite is a built-in game object of phaser that can display both static and animated images
export default class Bullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, spriteKey, facingLeft, midAir) {
    super(scene, x, y, spriteKey);
    this.scene.add.existing(this);
    this.scene.physics.world.enable(this);

    this.speed = Phaser.Math.GetSpeed(700, 1); // distance in px, time in ms
    this.facingLeft = facingLeft;
    this.midAir = midAir;
  }

  update(time, delta) {
    this.lifespan -= delta;
    const moveDistance = this.speed * delta;
    if (this.midAir) {
      this.angle = 270;
      this.y += moveDistance;
    } else {
      if (this.facingLeft) {
        this.x -= moveDistance;
      } else {
        this.angle = 180;
        this.x += moveDistance;
      }
    }
    if (this.lifespan <= 0) {
      this.setActive(false);
      this.setVisible(false);
    }
  }
}
