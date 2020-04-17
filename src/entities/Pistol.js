import 'phaser';

// sprite is a built-in game object of phaser that can display both static and animated images
export default class Pistol extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, spriteKey) {
    super(scene, x, y, spriteKey);
    this.scene.add.existing(this);
    this.scene.physics.world.enable(this);
  }
}
