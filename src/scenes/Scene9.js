/*global Phaser*/
import * as ChangeScene from './ChangeScene.js';
export default class Scene9 extends Phaser.Scene {
  constructor () {
    super('Scene9');
  }

  init (data) {
    // Initialization code goes here
  }

  preload () {
    // Declare variables for center of the scene
    this.centerX = this.cameras.main.width / 2;
    this.centerY = this.cameras.main.height / 2;
  }

  create() {
    //Add event listeners
    ChangeScene.addSceneEventListeners(this);

    this.playerSpeed = 200;
    var maxPowerups = 2;
    var powerUpVel = 50;

    this.background = this.add.tileSprite(0, 0, this.centerX, this.centerY, "backgroundScene9");
    this.background.setOrigin(0, 0);
    this.background.setScale(3.2);

    this.ship1 = this.add.sprite(this.centerX - 50, this.centerY, "ship");
    this.ship2 = this.add.sprite(this.centerX, this.centerY, "ship2");
    this.ship3 = this.add.sprite(this.centerX + 50, this.centerY, "ship3");

    this.enemies = this.physics.add.group();
    this.enemies.add(this.ship1);
    this.enemies.add(this.ship2);
    this.enemies.add(this.ship3);

    this.ship1.setScale(3.2);
    this.ship2.setScale(3.2);
    this.ship3.setScale(3.2);

    this.ship1.play("ship1_anim");
    this.ship2.play("ship2_anim");
    this.ship3.play("ship3_anim");

    this.ship1.setInteractive();
    this.ship2.setInteractive();
    this.ship3.setInteractive();

    this.input.on('gameobjectdown', this.destroyShip, this);

    this.physics.world.setBoundsCollision();

    this.powerUps = this.physics.add.group();


    for (var i = 0; i < maxPowerups; i++) {
      var powerUp = this.physics.add.sprite(16, 16, "power-up");
      powerUp.setScale(3.2);
      this.powerUps.add(powerUp);
      powerUp.setRandomPosition(0, 0, game.config.width, game.config.height);

      if (Math.random() > 0.5) {
        powerUp.play("red");
      } else {
        powerUp.play("gray");
      }

      powerUp.setVelocity(powerUpVel, powerUpVel);
      powerUp.setCollideWorldBounds(true);
      powerUp.setBounce(1);

    }


    this.player = this.physics.add.sprite(this.centerX - 8, this.centerY * 2 - 64, "playership");
    this.player.setScale(3.2);
    this.player.play("thrust");
    this.cursorKeys = this.input.keyboard.createCursorKeys();
    this.player.setCollideWorldBounds(true);



    this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.projectiles = this.add.group();

    this.physics.add.collider(this.projectiles, this.powerUps, function(projectile, powerUp) {
      projectile.destroy();
    });

    this.physics.add.overlap(this.player, this.powerUps, this.pickPowerUp, null, this);

    this.physics.add.overlap(this.player, this.enemies, this.hurtPlayer, null, this);

    this.physics.add.overlap(this.projectiles, this.enemies, this.hitEnemy, null, this);

    var graphics = this.add.graphics();
    graphics.fillStyle(0x000000, 1);
    graphics.beginPath();
    graphics.moveTo(0, 0);
    graphics.lineTo(this.centerX * 2, 0);
    graphics.lineTo(this.centerX * 2, 32);
    graphics.lineTo(0, 32);
    graphics.lineTo(0, 0);
    //
    graphics.closePath();
    graphics.fillPath();

    this.score = 0;
    var scoreFormated = this.zeroPad(this.score, 6);
    this.scoreLabel = this.add.bitmapText(10, 5, "pixelFont", "SCORE " + scoreFormated  , 32);

    // 1.2 create the sounds to be used
    this.beamSound = this.sound.add("audio_beam");
    this.explosionSound = this.sound.add("audio_explosion");
    this.pickupSound = this.sound.add("audio_pickup");

    // 2.1 create music
    this.music = this.sound.add("music");

    var musicConfig = {
      mute: false,
      volume: 1,
      rate: 1,
      detune: 0,
      seek: 0,
      loop: false,
      delay: 0
    }

    this.music.play(musicConfig);
  }

  pickPowerUp(player, powerUp) {
    powerUp.disableBody(true, true);
    // 1.4 play sounds
    this.pickupSound.play();
  }

  hurtPlayer(player, enemy) {

    this.resetShipPos(enemy);

    if(this.player.alpha < 1){
        return;
    }

    var explosion = new Explosion(this, player.x, player.y);

    player.disableBody(true, true);

    this.time.addEvent({
      delay: 1000,
      callback: this.resetPlayer,
      callbackScope: this,
      loop: false
    });
  }

  resetPlayer(){
    var x = this.centerX - 8;
    var y = this.centerY * 2 + 64;
    this.player.enableBody(true, x, y, true, true);


    this.player.alpha = 0.5;

    var tween = this.tweens.add({
      targets: this.player,
      y: this.centerX * 2 - 64,
      ease: 'Power1',
      duration: 1500,
      repeat:0,
      onComplete: function(){
        this.player.alpha = 1;
      },
      callbackScope: this
    });
  }

  hitEnemy(projectile, enemy) {

    var explosion = new Explosion(this, enemy.x, enemy.y);

    projectile.destroy();
    this.resetShipPos(enemy);
    this.score += 15;

     var scoreFormated = this.zeroPad(this.score, 6);
     this.scoreLabel.text = "SCORE " + scoreFormated;

     // 1.4 play sounds
     this.explosionSound.play();
  }


  zeroPad(number, size){
      var stringNumber = String(number);
      while(stringNumber.length < (size || 2)){
        stringNumber = "0" + stringNumber;
      }
      return stringNumber;
  }




  update() {



    this.moveShip(this.ship1, 1);
    this.moveShip(this.ship2, 2);
    this.moveShip(this.ship3, 3);
    // for testing purpouses
    // this.ship1.destroy();
    // this.ship2.destroy();
    // this.ship3.destroy();

    this.background.tilePositionY -= 0.5;


    this.movePlayerManager();

    if (Phaser.Input.Keyboard.JustDown(this.spacebar)) {
      if(this.player.active){
          this.shootBeam();
      }
    }
    for (var i = 0; i < this.projectiles.getChildren().length; i++) {
      var beam = this.projectiles.getChildren()[i];
      beam.update();
    }


  }

  shootBeam() {
      var beam = new Beam(this);
      // 1.3 play sounds
      this.beamSound.play();
  }


  movePlayerManager() {

    this.player.setVelocity(0);

    if (this.cursorKeys.left.isDown) {
      this.player.setVelocityX(-this.playerSpeed);
    } else if (this.cursorKeys.right.isDown) {
      this.player.setVelocityX(this.playerSpeed);
    }

    if (this.cursorKeys.up.isDown) {
      this.player.setVelocityY(-this.playerSpeed);
    } else if (this.cursorKeys.down.isDown) {
      this.player.setVelocityY(this.playerSpeed);
    }
  }



  moveShip(ship, speed) {
    ship.y += speed;
    if (ship.y > this.centerX * 2) {
      this.resetShipPos(ship);
    }
  }

  resetShipPos(ship) {
    ship.y = 0;
    var randomX = Phaser.Math.Between(0, this.centerX * 2);
    ship.x = randomX;
  }



  destroyShip(pointer, gameObject) {
    gameObject.setTexture("explosion");
    gameObject.play("explode");
  }


}

class Explosion extends Phaser.GameObjects.Sprite{
  constructor(scene,x,y){
    super(scene, x, y, "explosion");
    scene.add.existing(this);
    this.play("explode");
  }
}

class Beam extends Phaser.GameObjects.Sprite{
  constructor(scene){

    var x = scene.player.x;
    var y = scene.player.y - 16;

    super(scene, x, y, "beam");

    scene.add.existing(this);

    this.play("beam_anim");
    scene.physics.world.enableBody(this);
    this.setScale(3.2);
    this.body.velocity.y = - 250;

    scene.projectiles.add(this);

  }

  update(){

    if(this.y < 32 ){
      this.destroy();
    }
  }
}
