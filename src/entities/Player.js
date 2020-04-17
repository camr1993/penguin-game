/* eslint-disable no-lonely-if */
import Phaser from 'phaser';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, spriteKey) {
    super(scene, x, y, spriteKey);
    this.scene.add.existing(this);
    this.scene.physics.world.enable(this);

    this.facingLeft = false;
    this.currentWeapon = {
      holding: false,
      name: '',
    };
  }

  update(cursors) {
    this.jumpFromGround(cursors);
    this.leftMovements(cursors);
    this.rightMovements(cursors);
    this.noMovements(cursors);
  }

  jumpFromGround(cursors) {
    if (cursors.up.isDown && this.body.touching.down) {
      this.setVelocityY(-500);
    }
  }

  leftMovements(cursors) {
    if (cursors.left.isDown) {
      if (!this.facingLeft) {
        this.flipX = !this.flipX;
        this.facingLeft = true;
      }
      this.setVelocityX(-210);
      if (this.body.touching.down) {
        if (this.currentWeapon.holding) {
          this.anims.play(`run${this.currentWeapon.name}`, true);
        } else {
          this.anims.play('run', true);
        }
      } else {
        if (this.currentWeapon.holding) {
          this.anims.play(`jump${this.currentWeapon.name}`, true);
        } else {
          this.anims.play('jump');
        }
      }
    }
  }

  rightMovements(cursors) {
    if (cursors.right.isDown) {
      if (this.facingLeft) {
        this.flipX = !this.flipX;
        this.facingLeft = false;
      }
      this.setVelocityX(210);
      if (this.body.touching.down) {
        if (this.currentWeapon.holding) {
          this.anims.play(`run${this.currentWeapon.name}`, true);
        } else {
          this.anims.play('run', true);
        }
      } else {
        if (this.currentWeapon.holding) {
          this.anims.play(`jump${this.currentWeapon.name}`, true);
        } else {
          this.anims.play('jump');
        }
      }
    }
  }

  noMovements(cursors) {
    if (!cursors.left.isDown && !cursors.right.isDown) {
      this.setVelocityX(0);
      if (this.body.touching.down) {
        if (this.currentWeapon.holding) {
          this.anims.play(`stop${this.currentWeapon.name}`);
        } else {
          this.anims.play('stop');
        }
      } else {
        if (this.currentWeapon.holding) {
          this.anims.play(`jump${this.currentWeapon.name}`);
        } else {
          this.anims.play('jump');
        }
      }
    }
  }
}
