/* eslint-disable no-lonely-if */
import Phaser from 'phaser';

export default class TestDummy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, spriteKey) {
    super(scene, x, y, spriteKey);
    this.scene.add.existing(this);
    this.scene.physics.world.enable(this);

    this.flipX = !this.flipX;
    this.name = 'TestDummy';
    this.health = 100;
  }
}
