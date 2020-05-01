import 'phaser';

// sprite is a built-in game object of phaser that can display both static and animated images
export default class Pistol extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, spriteKey) {
    super(scene, x, y, spriteKey);
    this.scene.add.existing(this);
    this.scene.physics.world.enable(this);

    this.fireDelay = 500;
    this.lastFired = 0;
  }

  update(time, cursors, player, fireWeaponFunc) {
    if (player.currentWeapon.name === 'pistol') {
      if (cursors.space.isDown && time > this.lastFired) {
        fireWeaponFunc();
        this.lastFired = time + this.fireDelay;
      }
    }
  }
}
