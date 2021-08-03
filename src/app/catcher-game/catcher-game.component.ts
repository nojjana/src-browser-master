import { verifyHostBindings } from '@angular/compiler';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { Component, destroyPlatform, OnDestroy, OnInit } from '@angular/core';
import Phaser from 'phaser';
import { SaftlimacherBaseGameComponent } from '../saftlimacher-base-game/saftlimacher-base-game-component';
//import { clearInterval } from 'timers';
import { SocketService } from '../socket-service/socket.service';
import Group = Phaser.GameObjects.Group;


@Component({
  selector: 'app-catcher-game',
  templateUrl: './catcher-game.component.html',
  styleUrls: ['./catcher-game.component.css']
})
export class CatcherGameComponent extends SaftlimacherBaseGameComponent implements OnInit, OnDestroy {

  constructor(protected socketService: SocketService) {
    // TODO socketservice parameter anders übergeben?
    super(socketService);
  }

  startGameScene(levelData: any): void {
    this.phaserGame = new Phaser.Game(this.config);
    this.phaserGame.scene.add('catcherScene', CatcherScene);
    this.phaserGame.scene.start('catcherScene', { socketService: this.socketService, levelData: levelData });
  }

  removeGameSpecificListeners(): void {
    this.socketService.removeListener('catcherNet1Position');
    this.socketService.removeListener('catcherNet2Position');
    this.socketService.removeListener('updateIngredientLeft');
    this.socketService.removeListener('updateIngredientRight');
    this.socketService.removeListener('updateIngredientCenter');
    this.socketService.removeListener('changeImageIngredientLeft');
    this.socketService.removeListener('changeImageIngredientCenter');
    this.socketService.removeListener('changeImageIngredientRight');
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
  private screenWidth: number;
  private screenHeight: number;
  private ingredientOnListX: number;

  // säftlimacher visible game objects
  /// ingredients falling
  private ingredientLeft: Phaser.GameObjects.Image;
  private ingredientCenter: Phaser.GameObjects.Image;
  private ingredientRight: Phaser.GameObjects.Image;
  /// catchers
  private catcherNet1: Phaser.GameObjects.Image;
  private catcherNet2: Phaser.GameObjects.Image;
  private catcherNet3: Phaser.GameObjects.Image;
  private shakerContainer: Phaser.GameObjects.Image;
  /// ingredient list and counters
  private ingredientList: Phaser.GameObjects.Image;
  private ingredientOnList: Phaser.GameObjects.Image;
  private allIngredientsOnList: Phaser.GameObjects.Image[] = new Array();
  private catchedIngredientCounterText1: Phaser.GameObjects.BitmapText;
  private catchedIngredientCounterText2: Phaser.GameObjects.BitmapText;
  private catchedIngredientCounterText3: Phaser.GameObjects.BitmapText;
  /// score text
  private scoreText: Phaser.GameObjects.BitmapText;
  private adjustedPointsText: Phaser.GameObjects.BitmapText;

  // säftlimacher game variables
  private allIngredientNumbersOnList: number[];
  private catchedShakeObjectCounter1 = 0;
  private catchedShakeObjectCounter2 = 0;
  private catchedShakeObjectCounter3 = 0;
  private adjustedPointsTextVisibleCounter = 0;

  // säftlimacher sounds
  private goodBling: Phaser.Sound.BaseSound;
  private badBling: Phaser.Sound.BaseSound;
  private startBling: Phaser.Sound.BaseSound;
  private endBling: Phaser.Sound.BaseSound;

  // not needed anymore? TODO delete
  private ingredientFallingX: number;
  private ingredientFallingY: number;
  public ingredientTouchedCollider: boolean = false;
  private ground: Phaser.GameObjects.Image;
  private ingredientFalling: Phaser.GameObjects.Image;
  private ingredientTest: Phaser.GameObjects.Image;

  constructor() {
    super({ key: 'catcherScene' });
  }

  preload() {
    // säftlimacher visible objects
    this.load.image('Ground', '../../assets/catcher/Ground.png')

    this.load.image('CatcherNet1', '../../assets/catcher/NetOrange.png');
    this.load.image('CatcherNet2', '../../assets/catcher/NetLightGreen.png');
    this.load.image('CatcherNet3', '../../assets/catcher/NetBlue.png');
    this.load.image('ShakerContainer', '../../assets/shaker/ShakerContainer.png');
    this.load.image('IngredientList', '../../assets/shaker/IngredientList.png');

    this.load.image('ShakerMixing', '../../assets/shaker/ShakerMixing.png');
    this.load.image('ShakerMixed', '../../assets/shaker/ShakerMixed.png');
    this.load.image('GlassFull', '../../assets/shaker/glass-full.png');

    /// ingredients falling
    this.load.image('Apple', '../../assets/shaker/Apple.png');
    this.load.image('Banana', '../../assets/shaker/Banana.png');
    this.load.image('Berry', '../../assets/shaker/Berry.png');
    this.load.image('Beatle', '../../assets/shaker/Beatle.png');
    /// ingredients on list (TODO: handle with scaling?)
    this.load.image('AppleTall', '../../assets/shaker/AppleTall.png');
    this.load.image('BananaTall', '../../assets/shaker/BananaTall.png');
    this.load.image('BerryTall', '../../assets/shaker/BerryTall.png');

    // fonts
    this.load.bitmapFont('pressStartWhite', '../../assets/font/PressStartWhite.png', '../../assets/font/PressStartWhite.fnt');
    this.load.bitmapFont('pressStartBlack', '../../assets/font/PressStart.png', '../../assets/font/PressStart.fnt');

    // sounds
    this.load.audio('Good', '../../assets/shaker/mixkit-bonus.wav');
    this.load.audio('Bad', '../../assets/shaker/mixkit-small-hit.wav');
    this.load.audio('Start', '../../assets/catcher/mixkit-game-ball-tap.wav');
    this.load.audio('End', '../../assets/catcher/mixkit-bling-achievement.wav');
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
    let initCatcherNetMiddleX = levelData[3];
    let initCatcherNetMiddleY = levelData[4];
    //TODO: link to levelData
    // let initCatcherNetTopX = levelData[1];
    // let initCatcherNetTopY = levelData[2];

    // let initShakerPositionX = levelData[1];
    // let initShakerPositionY = levelData[2];

    // screen dimensions
    // 2560 1440
    this.screenWidth = this.cameras.main.width;
    this.screenHeight = this.cameras.main.height;
    this.screenCenterX = this.screenWidth / 2;
    this.screenCenterY = this.screenHeight / 2;
    this.ingredientOnListX = this.screenCenterX * 0.2;
    // this.socketService.emit('screenDimension', [this.screenWidth, this.screenHeight]);

    // add säftlimacher visible game objects to scene
    // ground
    this.ground = this.add.image(
      this.screenCenterX,
      this.screenHeight-39,
      'Ground'
    );
    this.ground.setVisible(false);

    // catcher net 1 - Bottom
    this.catcherNet1 = this.add.image(
      initCatcherNetBottomX,
      initCatcherNetBottomY,
      'CatcherNet1'
    )
    this.catcherNet1.setDepth(80);

    // catcher net 2 - Middle
    this.catcherNet2 = this.add.image(
      initCatcherNetMiddleX,
      initCatcherNetMiddleY,
      'CatcherNet2'
    )
    this.catcherNet2.setDepth(80);

    // // catcher net 3 - Top
    // this.catcherNet3 = this.add.image(
    //   initCatcherNetTopX,
    //   initCatcherNetTopY,
    //   //TODO: load color of controller
    //   'CatcherNet3'
    // )
    // this.catcherNet3.setDepth(100);

    // /// shaker/mixer
    // this.shakerContainer = this.add.image(
    //   initShakerPositionX,
    //   initShakerPositionY,
    //   'ShakerContainer'
    // );
    // this.shakerContainer.setDepth(100);


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
      this.screenWidth * 0.8,
      this.screenHeight * 0.9,
      'pressStartBlack',
      '0',
      32)
      .setOrigin(0.5)
      .setDepth(100);

    /// +/- score points text
    this.adjustedPointsText = this.add.bitmapText(
      this.screenWidth * 0.68,
      this.screenHeight * 0.7,
      'pressStartBlack',
      '',
      40)
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

    this.loadIngredientsOnList(this.allIngredientNumbersOnList);

    // TODO: fix error which shows after restarting game
    // add sounds to scene
    this.initSoundEffects();

    // listeners on updates from server
    /// current shaker position
    this.socketService.on('catcherNet1Position', (pos) => {
      //  this.shakerContainer.setPosition(pos[0], pos[1]);
      this.catcherNet1.setPosition(pos[0], pos[1]);
    });
    this.socketService.on('catcherNet2Position', (pos) => {
      //  this.shakerContainer.setPosition(pos[0], pos[1]);
      this.catcherNet2.setPosition(pos[0], pos[1]);
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
    this.socketService.on('changeImageIngredientLeft', (nr) => {
      if (this.ingredientLeft != null) {
        this.ingredientLeft.destroy();
        this.ingredientLeft = this.add.image(
          this.screenCenterX,
          -100,
          this.loadIngredientImage(nr)
        );
        this.ingredientLeft.setDepth(80);
      }
    });
    this.socketService.on('changeImageIngredientCenter', (nr) => {
      if (this.ingredientCenter != null) {
        this.ingredientCenter.destroy();
        this.ingredientCenter = this.add.image(
          this.screenCenterX,
          -100,
          this.loadIngredientImage(nr)
        );
        this.ingredientCenter.setDepth(80);
      }
    });
    this.socketService.on('changeImageIngredientRight', (nr) => {
      if (this.ingredientRight != null) {
        this.ingredientRight.destroy();
        this.ingredientRight = this.add.image(
          this.screenCenterX,
          -100,
          this.loadIngredientImage(nr)
        );
        this.ingredientRight.setDepth(80);
      }
    });

    this.socketService.on('checkIngredientOnList', (number) => {
      this.checkIngredientOnList(number);
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
      this.scoreText.setText(score);
    });

    /// on +/- score points
    this.socketService.on('adjustScoreByCatchedIngredient', (scoreInfo) => {
      if (scoreInfo[0] < 0) {
        this.playBadSound();
        this.showLostPointsByIngredient(scoreInfo[0], scoreInfo[1], scoreInfo[2] + 150, scoreInfo[3] - 120);
      } else if (scoreInfo[0] > 0) {
        this.playGoodSound();
        this.showCollectedPointsByIngredient(scoreInfo[0], scoreInfo[1], scoreInfo[2] + 150, scoreInfo[3] - 120);
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
        this.playGameOverSound();
      }
    });

    // game build finished
    this.socketService.emit('gameViewBuild');

  }


  update() {

    if (this.playing != undefined && this.playing) {
      // this.keepFalling();
      // console.log("boolean for while: "+this.ingredientTouchedCollider);
      if (this.ingredientTouchedCollider) {
        console.log("true / update playing called boolean: " + this.ingredientTouchedCollider);
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

  private loadIngredientImage(randomIngredientNumber) {
    if (randomIngredientNumber == 0) {
      return 'Apple'
    } else if (randomIngredientNumber == 1) {
      return 'Banana'
    } else if (randomIngredientNumber == 2) {
      return 'Berry'
    } else if (randomIngredientNumber == 3) {
      return 'Beatle'
    }
  }

  private loadIngredientsOnList(ingredientNumbers: number[]) {
    console.log("init list with ingredients, numbers:");
    ingredientNumbers.forEach(i => {
      console.log(i);
    });
    this.allIngredientsOnList?.forEach(i => {
      i.destroy();
    });
    this.drawIngredientsOnList(ingredientNumbers, 0.5);

  }


  private drawIngredientsOnList(ingredientNumbers: number[], alphaNr: number) {
    for (let index = 0; index < ingredientNumbers.length; index++) {
      const ingredientObjectNumber = ingredientNumbers[index];
      this.drawIngredientOnList(ingredientObjectNumber, alphaNr);
    }
  }

  private drawIngredientOnList(ingredientObjectNumber: number, alphaNr: number) {
    let y = this.getYPosOnListForNumber(ingredientObjectNumber);
    let image = this.loadFallingObjectImageTall(ingredientObjectNumber);
    this.ingredientOnList = this.add.image(
      this.ingredientOnListX,
      y,
      image
    );
    this.ingredientOnList.alpha = alphaNr;
    this.ingredientOnList.setDepth(30);
    this.allIngredientsOnList.push(this.ingredientOnList);
    console.log("created ingredient on list with number: " + ingredientObjectNumber);
  }

  private getYPosOnListForNumber(ingredientObjectNumber: number) {
    let y = this.screenCenterY * 0.5;
    switch (ingredientObjectNumber) {
      case 0:
        y = y;
        break;
      case 1:
        y = y + 250;
        break;
      case 2:
        y = y + 500;
        break;
    }
    return y;
  }

  private loadFallingObjectImageTall(ingredientObjectNumber) {
    if (ingredientObjectNumber == 0) {
      return 'AppleTall';
    } else if (ingredientObjectNumber == 1) {
      return 'BananaTall'
    } else if (ingredientObjectNumber == 2) {
      return 'BerryTall'
    }
  }

  private updateCatchedIngredientCounterDisplay(ingredientObjectNumber) {
    console.log("updateCatchedIngredientCounterDisplay called. number: " + ingredientObjectNumber);
    this.increaseCounterForNumber(ingredientObjectNumber);
    if (this.getCounterForNumber(ingredientObjectNumber) > 1) {
      this.updateCounterTextForNumber(this.getCounterForNumber(ingredientObjectNumber).toString(), ingredientObjectNumber);
    } else {
      // first ingredient of this kind catched!
      this.drawIngredientOnList(ingredientObjectNumber, 1);
      this.drawIngredientCounter(ingredientObjectNumber);
    }
  }

  private drawIngredientCounter(ingredientObjectNumber: number) {
    let x = this.ingredientOnListX - 100;
    let y = this.getYPosOnListForNumber(ingredientObjectNumber) - 50;
    let currentCounter = this.getCounterForNumber(ingredientObjectNumber);
    let counterText = this.add.bitmapText(
      x,
      y,
      'pressStartBlack',
      currentCounter.toString(),
      25)
      .setOrigin(0.5, 0.5)
      .setCenterAlign();

    this.setCounterTextForNumber(counterText, ingredientObjectNumber);
  }

  setCounterTextForNumber(counterBitmapText: any, ingredientObjectNumber: any) {
    switch (ingredientObjectNumber) {
      case 0:
        this.catchedIngredientCounterText1?.destroy();
        this.catchedIngredientCounterText1 = counterBitmapText;
        // this.catchedIngredientCounterText1.setText = counterText;
        break;
      case 1:
        this.catchedIngredientCounterText2?.destroy();
        this.catchedIngredientCounterText2 = counterBitmapText;
        // this.catchedIngredientCounterText2.setText = counterText;
        break;
      case 2:
        this.catchedIngredientCounterText3?.destroy();
        this.catchedIngredientCounterText3 = counterBitmapText;
        // this.catchedIngredientCounterText3.setText = counterText;
        break;
    }
  }

  updateCounterTextForNumber(counterText: string, ingredientObjectNumber: any) {
    switch (ingredientObjectNumber) {
      case 0:
        // this.catchedIngredientCounterText1?.destroy();
        // this.catchedIngredientCounterText1 = counterText;
        this.catchedIngredientCounterText1.setText(counterText);
        break;
      case 1:
        // this.catchedIngredientCounterText2?.destroy();
        // this.catchedIngredientCounterText2 = counterText;
        this.catchedIngredientCounterText2.setText(counterText);
        break;
      case 2:
        // this.catchedIngredientCounterText3?.destroy();
        // this.catchedIngredientCounterText3 = counterText;
        this.catchedIngredientCounterText3.setText(counterText);
        break;
    }
  }

  getCounterForNumber(ingredientObjectNumber: number) {
    switch (ingredientObjectNumber) {
      case 0:
        return this.catchedShakeObjectCounter1;
      case 1:
        return this.catchedShakeObjectCounter2;
      case 2:
        return this.catchedShakeObjectCounter3;
    }
  }

  increaseCounterForNumber(ingredientObjectNumber: number) {
    switch (ingredientObjectNumber) {
      case 0:
        return this.catchedShakeObjectCounter1++;
      case 1:
        return this.catchedShakeObjectCounter2++;
      case 2:
        return this.catchedShakeObjectCounter3++;
    }
  }


  /* -------------------- SÄFTLIMACHER GAME METHODS WITH INDIVIDUAL IMPLEMENTATION --------------------*/

  private getNumberOfGlasses(score: number) {
    // TODO: rechnung server überlassen!
    // let glasses = score / 100;
    let glasses = score / 10;
    glasses = Math.floor(glasses);
    return glasses;
  }


  private showLostPointsByIngredient(scoreDec: number, ingredientNr: number, x: number, y: number) {
    this.adjustedPointsText.setX(x);
    this.adjustedPointsText.setY(y);
    this.adjustedPointsText.setText('' + scoreDec);
    // red
    this.adjustedPointsText.setTintFill(0xE50D0D);
    this.adjustedPointsText.setVisible(true);
    this.adjustedPointsTextVisibleCounter = 0;
    // return this.adjustedPointsText;
  }

  private showCollectedPointsByIngredient(scoreInc: number, ingredientNr: number, x: number, y: number) {
    this.adjustedPointsText.setX(x);
    this.adjustedPointsText.setY(y);
    this.adjustedPointsText.setText('+' + scoreInc);
    // green
    this.adjustedPointsText.setTintFill(0x37B400);
    this.adjustedPointsText.setVisible(true);
    this.adjustedPointsTextVisibleCounter = 0;
    // return this.adjustedPointsText;
  }

  private checkIngredientOnList(numberOfIngredient: number) {
    console.log("got one! checkIngredientOnList with number: " + numberOfIngredient);
    this.updateCatchedIngredientCounterDisplay(numberOfIngredient);
  }


  /* -------------------- BASIC GAME METHODS WITH INDIVIDUAL IMPLEMENTATION --------------------*/

  private showGameOver(): void {
    this.scoreText.destroy();
    this.adjustedPointsText?.destroy();

    this.ingredientLeft?.destroy();
    this.ingredientCenter?.destroy();
    this.ingredientRight?.destroy();
    this.catcherNet1?.destroy();
    this.catcherNet2?.destroy();

    this.ingredientList?.destroy();
    this.catchedIngredientCounterText1?.destroy();
    this.catchedIngredientCounterText2?.destroy();
    this.catchedIngredientCounterText3?.destroy();
    this.allIngredientsOnList.forEach(i => i.destroy());

    this.sound?.stopAll();

    this.showReachedScore();
  }

  // private showReachedScore() {
  // const text = ['Der Saft ist fertig!\n\n\n\nGesammelte Punkte: '
  //   + this.score + '\n\nDas macht ' + this.getNumberOfGlasses(this.score)
  //   + ' Glaser!'];

  // this.add.bitmapText(
  //   this.screenCenterX,
  //   this.screenCenterY*1.5,
  //   'pressStartBlack',
  //   text,
  //   40)
  //   .setOrigin(0.5, 0.5)
  //   .setCenterAlign();

  //   this.add.image(
  //     this.screenCenterX,
  //     this.screenCenterY*0.8,
  //     'ShakerMixing'
  //   );

  private showReachedScore() {
    // mixed juice in shaker
    this.add.image(
      this.screenCenterX,
      this.screenCenterY * 0.45,
      'ShakerMixed'
    );

    let glasses = this.getNumberOfGlasses(this.score);

    let glassesY = this.screenCenterY * 1.25;
    let glassesXStart = this.screenCenterX * 0.7;
    let glassesXAdd = 0;
    let glassesPerRow = 6;
    let scaleValue = 1;

    let textY = this.screenCenterY * 0.98;
    let text = [''];
    if (glasses <= 0) {
      text = ['Der Saft ist fertig!\n\nIhr habt leider keinen\n\nleckeren Saft hergestellt...'];
      textY = this.screenCenterY * 1.1;
    }
    if (glasses == 1) {
      text = ['Der Saft ist fertig! Ihr habt\n\n1 leckere Portion Saft hergestellt.\n\nImmerhin!'];
      textY = this.screenCenterY * 1.1;
    }
    if (glasses > 2) {
      text = ['Der Saft ist fertig! Ihr habt\n\n' + glasses.toString()
        + ' leckere Portionen hergestellt.'];
    }
    if (glasses > 12) {
      text = ['Der Saft ist fertig! Ihr habt\n\n' + glasses.toString()
        + ' leckere Portionen hergestellt. Toll!'];
    }
    if (glasses > 30) {
      text = ['Der Saft ist fertig! Ihr habt\n\n' + glasses.toString()
        + ' leckere Portionen hergestellt. Super!'];
    }
    if (glasses > 45) {
      text = ['Der Saft ist fertig! Ihr habt\n\n' + glasses.toString()
        + ' leckere Portionen hergestellt. Wow!'];
    }
    if (glasses > 100) {
      text = ['Der Saft ist fertig! Ihr habt\n\n' + glasses.toString()
        + ' leckere Portionen hergestellt. Unglaublich!'];
    }

    this.add.bitmapText(
      this.screenCenterX,
      textY,
      'pressStartBlack',
      text,
      40)
      .setOrigin(0.5, 0.5)
      .setCenterAlign();

    if (glasses == 1) {
      glassesXStart = this.screenCenterX;
      glassesY = this.screenCenterY * 1.5;
    }
    if (glasses > 12) {
      glassesPerRow = 10;
      glassesXStart = this.screenCenterX * 0.4;
    }
    if (glasses > 30) {
      // glassesY = this.screenCenterY*1.2;
      glassesPerRow = 15;
      glassesXStart = this.screenCenterX * 0.3;
      scaleValue = 0.8;
    }
    if (glasses > 45) {
      // TODO test...
      // glassesY = this.screenCenterY*1.2;
      glassesPerRow = 20;
      glassesXStart = this.screenCenterX * 0.4;
      scaleValue = 0.5;
    }
    if (glasses > 100) {
      glassesXStart = this.screenCenterX * 0.25;
      glassesPerRow = 30;
      scaleValue = 0.4;
    }
    for (let index = 1; index <= glasses; index++) {
      console.log("glassesY: " + glassesY);
      let img = this.add.image(
        glassesXStart + glassesXAdd,
        glassesY,
        'GlassFull'
      );
      img.setScale(scaleValue);
      // if (glasses > 45) {
      //   console.log("img.height before scaling: "+ img.height);
      //   scaleValue = 0.5;
      //   img.setScale(scaleValue);
      //   console.log("img.height after scaling: "+ img.height);
      // }
      glassesXAdd = glassesXAdd + img.width * scaleValue * 1.1;
      if (index % glassesPerRow == 0) {
        glassesY = glassesY + img.height * scaleValue * 1.1;
        glassesXAdd = 0;
        console.log("glassesY next: " + glassesY);
      }
    }
  }

  private initSoundEffects() {
    this.goodBling = this.sound.add('Good');
    this.badBling = this.sound.add('Bad');
    this.startBling = this.sound.add('Start');
    this.endBling = this.sound.add('End');
  }

  private playBadSound() {
    this.badBling.play();
  }

  private playGoodSound() {
    this.goodBling.play();
  }

  private playCountdownSound() {
    this.startBling.play();
  }

  private playGameOverSound() {
    this.endBling.play();
  }

}


/* -------------------- ENUM INGREDIENT TYPE --------------------*/

enum IngredientType {
  APPLE,
  BANANA,
  BERRY,
  BEATLE
  // HONEY,
  // BEE
}



