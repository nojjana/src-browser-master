import { verifyHostBindings } from '@angular/compiler';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { Component, destroyPlatform, OnDestroy, OnInit } from '@angular/core';
import Phaser from 'phaser';
//import { clearInterval } from 'timers';
import { SocketService } from '../socket-service/socket.service';
import Group = Phaser.GameObjects.Group;


@Component({
  selector: 'app-catcher-game',
  templateUrl: './catcher-game.component.html',
  styleUrls: ['./catcher-game.component.css']
})
export class CatcherGameComponent implements OnInit, OnDestroy {

  // basic program setup
  phaserGame: Phaser.Game;
  config: Phaser.Types.Core.GameConfig;
  public building = false;
  public amountOfReadyPlayers = 0;

  // basic game setup
  public tutorial = true;
  public dots = 0;
  private dotInterval;
  public countdown: number = 3;
  public gameOverCountdown: number = 0;
  public gameOver = false;

  constructor(private socketService: SocketService) {
    this.dotInterval = setInterval(() => {
      this.dots++;
      if (this.dots === 4) {
        this.dots = 0;
      }
    }, 500);

    this.config = {
      type: Phaser.AUTO,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        height: 1440,
        width: 2560,

      },
      transparent: true,
      parent: 'gameContainer',
      audio: { disableWebAudio: true },
      physics: {
        default: 'arcade',
        arcade: {
            debug: true,
            gravity: { y: 150 }
        }
      },
    };
  }


  ngOnDestroy() {
    if (this.phaserGame != null) {
      this.phaserGame.destroy(true);
    }

    this.socketService.removeListener('controllerEndedTutorial');
    this.socketService.removeListener('countdown');
    this.socketService.removeListener('gameOverCountdown');
    this.socketService.removeListener('gameOver');

    this.socketService.removeListener('levelData');
    this.socketService.removeListener('updateScore');

    clearInterval(this.dotInterval);
  }

  ngOnInit(): void {
    this.socketService.on('controllerEndedTutorial', () => { this.controllerReady(); });
    this.socketService.on('countdown', (number) => this.countdown = number);
    this.socketService.on('gameOverCountdown', (number) => {
      this.gameOverCountdown = number;
      console.log("Noch " + this.gameOverCountdown);
    });
    this.socketService.on('gameOver', (over) => this.gameOver = over);
    this.socketService.once('levelData', (levelData) => { this.buildGameView(levelData); });

    this.socketService.emit('displayReady');
  }

  private controllerReady(): void {
    this.amountOfReadyPlayers++;

    if (this.amountOfReadyPlayers === 2) {
      this.tutorial = false;
      console.log('Finished tutorial');
    }
  }

  private buildGameView(levelData): void {
    console.log('Now building game view (scene).');
    this.building = true;
    setTimeout(() => {
      this.phaserGame = new Phaser.Game(this.config);
      this.phaserGame.scene.add('catcherScene', CatcherScene);
      this.phaserGame.scene.start('catcherScene', { socketService: this.socketService, levelData: levelData });
    }, 100);
  }
}

export default class CatcherScene extends Phaser.Scene {
  private socketService: any;

  // basic game variables
  private playing: boolean = false;
  private score = 0;
  private background: Phaser.GameObjects.TileSprite;

  // säftlimacher world dimensions
  private screenCenterX: number;
  private screenCenterY: number;
  private screenEndX: number;
  private screenEndY: number;

  // säftlimacher visible game objects
  private ground: Phaser.GameObjects.Image;
  private ingredientFalling: Phaser.GameObjects.Image;
  private ingredientTest: Phaser.GameObjects.Image;
  private ingredientLeft: Phaser.GameObjects.Image;
  private ingredientCenter: Phaser.GameObjects.Image;
  private ingredientRight: Phaser.GameObjects.Image;

  private catcherNet1: Phaser.GameObjects.Image;
  private catcherNet2: Phaser.GameObjects.Image;
  private catcherNet3: Phaser.GameObjects.Image;
  private shakerContainer: Phaser.GameObjects.Image;
  private ingredientList: Phaser.GameObjects.Image;
  private ingredientOnList: Phaser.GameObjects.Image;
  private scoreText: Phaser.GameObjects.BitmapText;
  private adjustedPointsText: Phaser.GameObjects.BitmapText;

  // säftlimacher game variables
  private allIngredientNumbersOnList: number[];
  private adjustedPointsTextVisibleCounter: number;
  private ingredientFallingX: number;
  private ingredientFallingY: number;
  public ingredientTouchedCollider: boolean = false;

  // säftlimacher sounds
  private goodBling: Phaser.Sound.BaseSound;
  private badBling: Phaser.Sound.BaseSound;
  screenWidth: number;
  screenHeight: number;


  constructor() {
    super({ key: 'catcherScene' });
  }

  preload() {
    // säftlimacher visible objects
    this.load.image('Ground', '../../assets/catcher/Ground.png')
    this.load.image('CatcherNet1', '../../assets/catcher/NetBlue.PNG');
    this.load.image('CatcherNet2', '../../assets/catcher/NetLightGreen.PNG');
    this.load.image('CatcherNet3', '../../assets/catcher/NetOrange.PNG');
    this.load.image('ShakerContainer', '../../assets/shaker/ShakerContainer.png');
    this.load.image('IngredientList', '../../assets/shaker/IngredientList.png');

    /// ingredients falling
    this.load.image('Apple', '../../assets/shaker/Apple.png');
    this.load.image('Banana', '../../assets/shaker/Banana.png');
    this.load.image('Berry', '../../assets/shaker/Berry.png');
    /// ingredients on list (TODO: handle with scaling?)
    this.load.image('AppleTall', '../../assets/shaker/AppleTall.png');
    this.load.image('BananaTall', '../../assets/shaker/BananaTall.png');
    this.load.image('BerryTall', '../../assets/shaker/BerryTall.png');

    // fonts
    this.load.bitmapFont('pressStartWhite', '../../assets/font/PressStartWhite.png', '../../assets/font/PressStartWhite.fnt');
    this.load.bitmapFont('pressStartBlack', '../../assets/font/PressStart.png', '../../assets/font/PressStart.fnt');

    // sounds
    this.load.audio('Good', '../../assets/shaker/mixkit-bonus.wav');
    this.load.audio('Bad', '../../assets/shaker/mixkit-loosing.wav');
  }

  create(data) {
    this.socketService = data.socketService;

    // get level info from CatcherProgram (server)
    const levelData = data.levelData;
    this.allIngredientNumbersOnList = levelData[0];
    //TODO: link to levelData
    let initCatcherNetBottomX = levelData[1];
    let initCatcherNetBottomY = levelData[2];
    //TODO: link to levelData
    let initCatcherNetMiddleX = levelData[1];
    let initCatcherNetMiddleY = levelData[2];
    //TODO: link to levelData
    let initCatcherNetTopX = levelData[1];
    let initCatcherNetTopY = levelData[2];

    let initShakerPositionX = levelData[1];
    let initShakerPositionY = levelData[2];

    // screen dimensions
    // 2560 1440
    this.screenWidth = this.cameras.main.width;
    this.screenHeight = this.cameras.main.height;
    this.screenCenterX = this.screenWidth / 2;
    this.screenCenterY = this.screenHeight / 2;
    this.screenEndX =this.screenWidth;
    this.screenEndY = this.screenHeight;

    // this.socketService.emit('screenDimension', [this.screenWidth, this.screenHeight]);


    // add säftlimacher visible game objects to scene
    // ground
    this.ground = this.physics.add.staticImage(
      this.screenCenterX,
      this.screenEndY-39,
      'Ground'
    );

    // catcher net 1 - Bottom
    this.catcherNet1 = this.add.image(
      initCatcherNetBottomX,
      initCatcherNetBottomY,
      'CatcherNet1'
    )
    this.catcherNet1.setDepth(10);

/*     // catcher net 2 - Middle
    this.catcherNet2 = this.add.image(
      initCatcherNetMiddleX,
      initCatcherNetMiddleY,
      'CatcherNet2'
    )
    this.catcherNet2.setDepth(100);
    
    // catcher net 3 - Top
    this.catcherNet3 = this.add.image(
      initCatcherNetTopX,
      initCatcherNetTopY,
      //TODO: load color of controller
      'CatcherNet3'
    )
    this.catcherNet3.setDepth(100);

    /// shaker/mixer
    this.shakerContainer = this.add.image(
      initShakerPositionX,
      initShakerPositionY,
      'ShakerContainer'
    );
    this.shakerContainer.setDepth(100); */

    /// ingredient test
    this.ingredientTest = this.add.image(
      0,
      -100,
      'Apple'
    );
    this.ingredientTest.setDepth(80);

    /// ingredient left
    this.ingredientLeft = this.add.image(
      this.screenCenterX,
      -100,
      'Apple'
    );
    this.ingredientLeft.setDepth(80);

    /// ingredient right
    this.ingredientRight = this.add.image(
      this.screenCenterX,
      -100,
      'Banana'
    );
    this.ingredientRight.setDepth(80);

    /// ingredient center
    this.ingredientCenter = this.add.image(
      this.screenCenterX,
      -100,
      'Berry'
    );
    this.ingredientCenter.setDepth(80);

    /// score text
    this.scoreText = this.add.bitmapText(
      this.screenEndX * 0.8,
      this.screenEndY * 0.9,
      'pressStartBlack',
      'Punkte: 0',
      28)
      .setOrigin(0.5)
      .setDepth(100);

    /// +/- score points text
    this.adjustedPointsText = this.add.bitmapText(
      this.screenEndX * 0.68,
      this.screenEndY * 0.7,
      'pressStartBlack',
      '',
      28)
      .setOrigin(0.5)
      .setDepth(100);
    this.adjustedPointsText.setVisible(false);
    this.adjustedPointsTextVisibleCounter = 0;

    /// falling ingredient
    this.ingredientFalling = this.add.image(
      this.screenCenterX,
      -100,
      this.loadIngredientImage(IngredientType.APPLE)
    );
    this.ingredientFalling.setDepth(88);
    this.ingredientFalling.setVisible(false);

    /// ingredient list
    this.ingredientList = this.add.image(
      this.screenCenterX * 0.2,
      this.screenCenterY * 0.8,
      'IngredientList'
    );

    // add sounds to scene
    this.initSoundEffects();

    // listeners on updates from server
    /// current shaker position
    this.socketService.on('catcherNet1Position', (pos) => {
    //  this.shakerContainer.setPosition(pos[0], pos[1]);
      this.catcherNet1.setPosition(pos[0], pos[1]);
    });
    // /// current ingredient position
    // this.socketService.on('updateIngredientPosition', (pos) => {
    //   this.ingredientTest.setPosition(pos[0], pos[1]);
    // });
     /// current ingredient position left
     this.socketService.on('updateIngredientLeft', (pos) => {
      this.ingredientLeft.setPosition(pos[0], pos[1]);
    });
    /// current ingredient position right
    this.socketService.on('updateIngredientRight', (pos) => {
      // console.log("ingredientRight Nr:", pos[2]);
      this.ingredientRight.setPosition(pos[0], pos[1]);
    });
    /// current ingredient position center
    this.socketService.on('updateIngredientCenter', (pos) => {
      this.ingredientCenter.setPosition(pos[0], pos[1]);
    });


    // this.socketService.on('newIngredient', (ingr) => {
    //   // type, x, y, name
    //   console.log("newIngredient NR X Y: ", ingr[0], ingr[1], ingr[2]);
    //   let newIngr = this.add.image(
    //     ingr[1],
    //     ingr[2],
    //     this.loadIngredientImage(ingr[0])
    //     // 'Apple'
    //     // ingr[3]
    //   );
    //   newIngr.setDepth(80);
    //   // this.ingrFalling.push(newIngr);
    // });

    /// current score
    this.socketService.on('updateScore', (score) => {
      this.score = score;
      this.scoreText.setText('Punkte: ' + score);
    });

    /// on +/- score points
    this.socketService.on('adjustScoreByCatchedIngredient', (scoreInfo) => {
      if (scoreInfo[0] < 0) {
        this.showLostPointsByIngredient(scoreInfo[0], scoreInfo[1]);
        this.playBadSound();

      } else if (scoreInfo[0] > 0) {
        this.showCollectedPointsByIngredient(scoreInfo[0], scoreInfo[1]);
        this.playGoodSound();
      }
    });

    /// on playing status change
    this.socketService.on('playing', playing => {
      this.playing = playing;
      // let ingredients fall
      // this.letIngredientsFall(2);
    });

    /// on show game over
    this.socketService.on('gameOver', finished => {
      if (finished === true) {
        this.showGameOver();
      }
    });

    // game build finished
    this.socketService.emit('gameViewBuild');

  }


  update() {

    if (this.playing != undefined && this.playing) {
      // this.keepFalling();
      // console.log("boolean for while: "+this.ingredientTouchedCollider);
      if (this.ingredientTouchedCollider){
        console.log("true / update playing called boolean: "+this.ingredientTouchedCollider);
        //TODO: generate random number
        // TODO: has to come from server!?
        // this.letIngredientsFall(3);
        this.ingredientTouchedCollider = false;
      }
    }

    if (this.adjustedPointsText.visible) {
      this.adjustedPointsTextVisibleCounter++;
      if (this.adjustedPointsTextVisibleCounter > 50) {
        this.adjustedPointsText.setVisible(false);
        this.adjustedPointsTextVisibleCounter = 0;
      }
    }
}


  /* -------------------- SÄFTLIMACHER GAME METHODS --------------------*/

  private letIngredientsFall(randomIngredientNumber): void {
    console.log("let IngredientFall called");

    //TODO: should be random and changing from object to object
    this.ingredientFallingX = this.screenCenterX,
    this.ingredientFallingY = -100,

    this.ingredientFalling = this.physics.add.image(
      this.ingredientFallingX,
      this.ingredientFallingY,
      this.loadIngredientImage(randomIngredientNumber)
    );

    // when the fallingIngredients overlaps the ground collider is set to true
    this.physics.add.overlap(
        this.ingredientFalling,
        this.ground,
         //TODO: callback function cannot get the value of this.ingredientTouchedCollider
        function(ingredientTouchedCollider){
          console.log("collider touched   / ingredient Touched Collider: "+this.ingredientTouchedCollider);
          this.ingredientTouchedCollider = true;
          console.log("status of ingredient Touch: "+this.ingredientTouchedCollider);
          //return ingredientTouchedCollider;
        }
    )
  }


  private loadIngredientImage(randomIngredientNumber) {
    if (randomIngredientNumber == 0) {
      return 'Apple'
    } else if (randomIngredientNumber == 1) {
      return 'Banana'
    } else if (randomIngredientNumber == 2) {
      return 'Berry'
    }
  }

  /* -------------------- SÄFTLIMACHER GAME METHODS WITH INDIVIDUAL IMPLEMENTATION --------------------*/

  private getNumberOfGlasses(score: number) {
    // TODO: rechnung server überlassen!
    let glasses = score / 100;
    return glasses.toString();
  }


  private showLostPointsByIngredient(scoreDec: number, ingredientNr: number) {
    this.adjustedPointsText.setText('Oh nein!\n\n' + scoreDec + ' Punkte');
    this.adjustedPointsText.setVisible(true);
    this.adjustedPointsTextVisibleCounter = 0;
    return this.adjustedPointsText;
  }

  private showCollectedPointsByIngredient(scoreInc: number, ingredientNr: number) {
    this.adjustedPointsText.setText('Aufgefangen!\n\n+' + scoreInc + ' Punkte');
    this.adjustedPointsText.setVisible(true);
    return this.adjustedPointsText;
  }


  /* -------------------- BASIC GAME METHODS WITH INDIVIDUAL IMPLEMENTATION --------------------*/

  private showGameOver(): void {
    this.scoreText.destroy();
    this.adjustedPointsText?.destroy();

    this.shakerContainer.destroy();
    this.ingredientList.destroy();
    this.ingredientFalling?.destroy();
    this.ingredientLeft?.destroy();
    this.ingredientCenter?.destroy();
    this.ingredientRight?.destroy();

    this.sound?.stopAll();

    this.showReachedScore();
  }

  private showReachedScore() {
    const text = ['Der Saft ist fertig!\n\n\n\n\n\nGesammelte Punkte: '
      + this.score + '\n\nDas macht ' + this.getNumberOfGlasses(this.score)
      + ' Becher. Toll!'];

    this.add.bitmapText(
      this.screenCenterX,
      this.screenCenterY,
      'pressStartBlack',
      text,
      45)
      .setOrigin(0.5, 0.5)
      .setCenterAlign();
  }

  private initSoundEffects() {
    this.goodBling = this.sound.add('Good');
    this.badBling = this.sound.add('Bad');
  }

  private playBadSound() {
    this.badBling.play();
  }

  private playGoodSound() {
    this.goodBling.play();
  }

}


/* -------------------- ENUM INGREDIENT TYPE --------------------*/

enum IngredientType {
  APPLE,
  BANANA,
  BERRY,
  // HONEY,
  // BEE
}



