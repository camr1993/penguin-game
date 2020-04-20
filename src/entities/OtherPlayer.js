/* eslint-disable no-lonely-if */
import Phaser from 'phaser';

export default class OtherPlayer extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, spriteKey) {
    super(scene, x, y, spriteKey);
    this.scene.add.existing(this);
    this.scene.physics.world.enable(this);

    this.facingLeft = false;
    this.updatedLeft = false;

    this.name = 'OtherPlayer';
    this.health = 100;
    this.currentWeapon = {
      holding: false,
      name: '',
    };
    this.run = false;
  }

  update() {
    // console.log(this.run);
    if (this.facingLeft !== this.updatedLeft) {
      this.flipX = !this.flipX;
      this.updatedLeft = this.facingLeft;
    }
    this.jumpMovements();
    this.noMovements();
    this.runMovements();
  }

  jumpMovements() {
    if (!this.body.touching.down) {
      if (!this.currentWeapon.holding) {
        this.anims.play('jump');
      } else {
        this.anims.play(`jump${this.currentWeapon.name}`, true);
      }
    }
  }
  noMovements() {
    if (!this.run && this.body.touching.down) {
      if (!this.currentWeapon.holding) {
        this.anims.play('stop', true);
      } else {
        this.anims.play(`stop${this.currentWeapon.name}`, true);
      }
    }
  }
  runMovements() {
    if (this.run && this.body.touching.down) {
      if (!this.currentWeapon.holding) {
        this.anims.play('run', true);
      } else {
        this.anims.play(`run${this.currentWeapon.name}`, true);
      }
    }
    this.run = false;
  }
}
