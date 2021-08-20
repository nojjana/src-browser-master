import { verifyHostBindings } from '@angular/compiler';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { Component, destroyPlatform, OnDestroy, OnInit } from '@angular/core';
import Phaser from 'phaser';
import { SaftlimacherBaseGameComponent } from '../saftlimacher-base-game/saftlimacher-base-game-component';
//import { clearInterval } from 'timers';
import { SocketService } from '../socket-service/socket.service';
import Group = Phaser.GameObjects.Group;


@Component({
  selector: 'app-seesaw-game',
  templateUrl: './seesaw-game.component.html',
  styleUrls: ['./seesaw-game.component.css']
})
export class SeesawGameComponent extends SaftlimacherBaseGameComponent implements OnInit, OnDestroy {

  constructor(protected socketService: SocketService) {
    // TODO socketservice parameter anders übergeben?
    super(socketService);
  }

  startGameScene(levelData: any): void {
    this.phaserGame = new Phaser.Game(this.config);
    this.phaserGame.scene.add('seesawScene', SeesawScene);
    this.phaserGame.scene.start('seesawScene', { socketService: this.socketService, levelData: levelData });
  }

  removeGameSpecificListeners(): void {
    this.socketService.removeListener('seesaw1Position');
    this.socketService.removeListener('seesawBeam1Position');
    this.socketService.removeListener('seesaw2Position');
    this.socketService.removeListener('seesawBeam2Position');
    this.socketService.removeListener('updateIngredientLeft0');
    this.socketService.removeListener('updateIngredientLeft1');
    this.socketService.removeListener('updateIngredientLeft2');
    this.socketService.removeListener('updateIngredientRight0');
    this.socketService.removeListener('updateIngredientRight1');
    this.socketService.removeListener('updateIngredientRight2');
    this.socketService.removeListener('changeImageIngredientLeft0');
    this.socketService.removeListener('changeImageIngredientLeft1');
    this.socketService.removeListener('changeImageIngredientLeft2');
    this.socketService.removeListener('changeImageIngredientRight0');
    this.socketService.removeListener('changeImageIngredientRight1');
    this.socketService.removeListener('changeImageIngredientRight2');
  }
}

export default class SeesawScene extends Phaser.Scene {
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
  private ingredientLeft0: Phaser.GameObjects.Image;
  private ingredientLeft1: Phaser.GameObjects.Image;
  private ingredientLeft2: Phaser.GameObjects.Image;
  private ingredientRight0: Phaser.GameObjects.Image;
  private ingredientRight1: Phaser.GameObjects.Image;
  private ingredientRight2: Phaser.GameObjects.Image;
  /// seesaw
////  private seesaw1: Phaser.GameObjects.Image;
  private rectangle1: Phaser.GameObjects.Rectangle;
  private rectangleBeam1: Phaser.GameObjects.Rectangle;
  private rectangle2: Phaser.GameObjects.Rectangle;
  private rectangleBeam2: Phaser.GameObjects.Rectangle;

  //shakerContainers
  private shakerContainer: Phaser.GameObjects.Image;
  private garbageContainerLeft: Phaser.GameObjects.Image;
  private shakerContainerRight: Phaser.GameObjects.Image;
  private garbageContainerRight: Phaser.GameObjects.Image;

  //placement of containers
  private garbageContainerLeftX = 650;
  private shakerContainerX = 1500; //800
  private garbageContainerRightX = 2300; //2400
  private shakerContainerY = 1050;
  private garbageContainerY = 1000;

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
    super({ key: 'seesawScene' });
  }

  preload() {
    // säftlimacher visible objects
    this.load.image('Ground', '../../assets/catcher/Ground.png')

    this.load.image('ShakerContainer', '../../assets/shaker/ShakerContainer.png');
    this.load.image('GarbageContainer', '../../assets/seesaw/Garbage.png');
    this.load.image('IngredientList', '../../assets/shaker/IngredientList.png');

    this.load.image('ShakerMixing', '../../assets/shaker/ShakerMixing.png');
    this.load.image('ShakerMixed', '../../assets/shaker/ShakerMixed.png');
    this.load.image('GlassFull', '../../assets/shaker/glass-full.png');

    this.load.image('Seesaw', '../../assets/seesaw/seesaw.png');
    this.load.image('SeesawBeam', '../../assets/seesaw/seesawBeam.png');

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

    // screen dimensions
    // 2560 1440
    this.screenWidth = this.cameras.main.width;
    this.screenHeight = this.cameras.main.height;
    this.screenCenterX = this.screenWidth / 2;
    this.screenCenterY = this.screenHeight / 2;
    this.ingredientOnListX = this.screenCenterX * 0.2;

    this.ground = this.add.image(
      this.screenCenterX,
      this.screenHeight-39,
      'Ground'
    );
    this.ground.setVisible(false);

    //Rectangle
    this.rectangle1 = this.add.rectangle(0, 0, 0, 0, 0xF38C2C)
    this.rectangleBeam1 = this.add.rectangle(0,0,0,0, 0xF38C2C)
    this.rectangle2 = this.add.rectangle(0,0,0,0, 0x4CAF50)
    this.rectangleBeam2 = this.add.rectangle(0,0,0,0, 0x4CAF50)

    this.shakerContainer = this.add.image(
      this.shakerContainerX,
      this.shakerContainerY,
      'ShakerContainer'
    );
    this.shakerContainer.setDepth(80);

    this.garbageContainerLeft = this.add.image(
      this.garbageContainerLeftX,
      this.garbageContainerY,
      'GarbageContainer'
    );
    this.garbageContainerLeft.setDepth(80);

    this.garbageContainerRight = this.add.image(
      this.garbageContainerRightX,
      this.garbageContainerY,
      'GarbageContainer'
    );
    this.garbageContainerRight.setDepth(80);


    /// ingredient left 0
    this.ingredientLeft0 = this.add.image(
      this.screenCenterX,
      -100,
      'Apple'
    );
    this.ingredientLeft0.setDepth(80);

    /// ingredient left 1
    this.ingredientLeft2 = this.add.image(
      this.screenCenterX,
      -100,
      'Banana'
    );
    this.ingredientLeft2.setDepth(80);

    /// ingredient left 1
    this.ingredientLeft1 = this.add.image(
      this.screenCenterX,
      -100,
      'Berry'
    );
    this.ingredientLeft1.setDepth(80);

    /// ingredient right 0
    this.ingredientRight0 = this.add.image(
      this.screenCenterX,
      -100,
      'Apple'
    );
    this.ingredientRight0.setDepth(80);

    /// ingredient right 1
    this.ingredientRight1 = this.add.image(
      this.screenCenterX,
      -100,
      'Banana'
    );
    this.ingredientRight1.setDepth(80);

    /// ingredient right 2
    this.ingredientRight2 = this.add.image(
      this.screenCenterX,
      -100,
      'Berry'
    );
    this.ingredientRight2.setDepth(80);


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

    // add sounds to scene
    this.initSoundEffects();

    // listeners on updates from server
    /// current shaker position
    this.socketService.on('seesaw1Position', (pos) => {

      if (Math.abs(this.rectangle1.rotation - pos[4]) > 0.1){
        this.rectangle1.setRotation(pos[4]);
      } if (this.rectangle1.x == 0) {
        // set at the beginning
        this.rectangle1.setPosition(pos[0], pos[1]);
        this.rectangle1.setSize(pos[2], pos[3]);
        this.rectangle1.setOrigin(0.5);
        this.rectangle1.setRotation(0);
      }
    });

    this.socketService.on('seesawBeam1Position', (pos) => {
        if (this.rectangleBeam1.x == 0) {
          this.rectangleBeam1.setPosition(pos[0], pos[1]);
          this.rectangleBeam1.setSize(pos[2], pos[3]);
        }
      });


    this.socketService.on('seesaw2Position', (pos) => {
      if (Math.abs(this.rectangle2.rotation - pos[4]) > 0.1){
        this.rectangle2.setRotation(pos[4]);
      } if (this.rectangle2.x == 0) {
        this.rectangle2.setPosition(pos[0], pos[1]);
        this.rectangle2.setSize(pos[2], pos[3]);
        this.rectangle2.setOrigin(0.5);
        this.rectangle2.setRotation(0);
      }
    });

    this.socketService.on('seesawBeam2Position', (pos) => {
      if (this.rectangleBeam2.x == 0) {
        this.rectangleBeam2.setPosition(pos[0], pos[1]);
        this.rectangleBeam2.setSize(pos[2], pos[3]);
      }
    });

    // /// current ingredient position
     /// current ingredient position left 0
     this.socketService.on('updateIngredientLeft0', (pos) => {
      if (this.ingredientLeft0 != null) {
        this.ingredientLeft0.setPosition(pos[0], pos[1]);
        this.ingredientLeft0.setAngle(pos[2]);
      }
    });
     /// current ingredient position left 1
     this.socketService.on('updateIngredientLeft1', (pos) => {
      if (this.ingredientLeft1 != null) {
        this.ingredientLeft1.setPosition(pos[0], pos[1]);
        this.ingredientLeft1.setAngle(pos[2]);
     }
    });

    /// current ingredient position left 2
    this.socketService.on('updateIngredientLeft2', (pos) => {
      if (this.ingredientLeft2 != null) {
        this.ingredientLeft2.setPosition(pos[0], pos[1]);
        this.ingredientLeft2.setAngle(pos[2]);
      }
    });

    this.socketService.on('updateIngredientRight0', (pos) => {
      if (this.ingredientRight0 != null) {
        this.ingredientRight0.setPosition(pos[0], pos[1]);
        this.ingredientRight0.setAngle(pos[2]);
      }
    });

    this.socketService.on('updateIngredientRight1', (pos) => {
      if (this.ingredientRight1 != null) {
        this.ingredientRight1.setPosition(pos[0], pos[1]);
        this.ingredientRight1.setAngle(pos[2]);
      }
    });

    this.socketService.on('updateIngredientRight2', (pos) => {
      if (this.ingredientRight2 != null) {
        this.ingredientRight2.setPosition(pos[0], pos[1]);
        this.ingredientRight2.setAngle(pos[2]);
      }
    });

    this.socketService.on('changeImageIngredientLeft0', (nr) => {
      if (this.ingredientLeft0 != null) {
       this.ingredientLeft0.destroy();
       this.ingredientLeft0 = this.add.image(
         1050,
         -100,
         this.loadIngredientImage(nr)
       );
       this.ingredientLeft0.setDepth(80);
      }
    });

    this.socketService.on('changeImageIngredientLeft1', (nr) => {
      if (this.ingredientLeft1 != null) {
      this.ingredientLeft1.destroy();
      this.ingredientLeft1 = this.add.image(
        this.screenCenterX, 
        -100,
        this.loadIngredientImage(nr)
      );
      this.ingredientLeft1.setDepth(80);
      }
    });

   this.socketService.on('changeImageIngredientLeft2', (nr) => {
    if (this.ingredientLeft2 != null) {
    this.ingredientLeft2.destroy();
    this.ingredientLeft2 = this.add.image(
      1050,
      -100,
      this.loadIngredientImage(nr)
    );
    this.ingredientLeft2.setDepth(80);
    }
  });

  this.socketService.on('changeImageIngredientRight0', (nr) => {
    if (this.ingredientRight0 != null) {
    this.ingredientRight0.destroy();
    this.ingredientRight0 = this.add.image(
      1950,
      -100,
      this.loadIngredientImage(nr)
    );
    this.ingredientRight0.setDepth(80);
    }
  });

  this.socketService.on('changeImageIngredientRight1', (nr) => {
    if (this.ingredientRight1 != null) {
    this.ingredientRight1.destroy();
    this.ingredientRight1 = this.add.image(
      this.screenCenterX, 
      -100,
      this.loadIngredientImage(nr)
    );
    this.ingredientRight1.setDepth(80);
    }
  });

  this.socketService.on('changeImageIngredientRight2', (nr) => {
    if (this.ingredientRight2 != null) {
    this.ingredientRight2.destroy();
    this.ingredientRight2 = this.add.image(
      this.screenCenterX,
      -100,
      this.loadIngredientImage(nr)
    );
    this.ingredientRight2.setDepth(80);
    }
  });

this.socketService.on('checkIngredientOnList', (number) => {
  this.checkIngredientOnList(number);
});

    /// current score
    this.socketService.on('updateScore', (score) => {
      this.score = score;
      this.scoreText.setText(score);
    });

    /// on +/- score points
    this.socketService.on('adjustScoreByCatchedIngredient', (scoreInfo) => {
      if (scoreInfo[0] < 0) {
        this.playBadSound();
        this.showLostPointsByIngredient(scoreInfo[0], scoreInfo[1], scoreInfo[2]+150, scoreInfo[3]-120);
      } else if (scoreInfo[0] > 0) {
        this.playGoodSound();
        this.showCollectedPointsByIngredient(scoreInfo[0], scoreInfo[1], scoreInfo[2]+150, scoreInfo[3]-120);
      }
    });

    /// on playing status change
    this.socketService.on('playing', playing => {
      this.playing = playing;
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
      if (this.ingredientTouchedCollider){
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
    ingredientNumbers.forEach(i => {
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
          break;
        case 1:
          this.catchedIngredientCounterText2?.destroy();
          this.catchedIngredientCounterText2 = counterBitmapText;
          break;
        case 2:
          this.catchedIngredientCounterText3?.destroy();
          this.catchedIngredientCounterText3 = counterBitmapText;
          break;
      }
    }

    updateCounterTextForNumber(counterText: string, ingredientObjectNumber: any) {
      switch (ingredientObjectNumber) {
        case 0:
          this.catchedIngredientCounterText1.setText(counterText);
          break;
        case 1:
          this.catchedIngredientCounterText2.setText(counterText);
          break;
        case 2:
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
  }

  private showCollectedPointsByIngredient(scoreInc: number, ingredientNr: number, x: number, y: number) {
    this.adjustedPointsText.setX(x);
    this.adjustedPointsText.setY(y);
    this.adjustedPointsText.setText('+' + scoreInc);
    // green
    this.adjustedPointsText.setTintFill(0x37B400);
    this.adjustedPointsText.setVisible(true);
    this.adjustedPointsTextVisibleCounter = 0;
  }

  private checkIngredientOnList(numberOfIngredient: number) {
    this.updateCatchedIngredientCounterDisplay(numberOfIngredient);
  }


  /* -------------------- BASIC GAME METHODS WITH INDIVIDUAL IMPLEMENTATION --------------------*/

  private showGameOver(): void {
    this.scoreText.destroy();
    this.adjustedPointsText?.destroy();

    this.ingredientLeft0?.destroy();
    this.ingredientLeft1?.destroy();
    this.ingredientLeft2?.destroy();
    this.ingredientRight0?.destroy();
    this.ingredientRight1?.destroy();
    this.ingredientRight2?.destroy();

    this.rectangle1.destroy();
    this.rectangle2.destroy();
    this.rectangleBeam1.destroy();
    this.rectangleBeam2.destroy();

    this.shakerContainer.destroy();
    this.garbageContainerLeft.destroy();
    this.garbageContainerRight.destroy();

    this.ingredientList?.destroy();
    this.catchedIngredientCounterText1?.destroy();
    this.catchedIngredientCounterText2?.destroy();
    this.catchedIngredientCounterText3?.destroy();
    this.allIngredientsOnList.forEach(i => i.destroy());

    this.sound?.stopAll();

    this.showReachedScore();
  }

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
      glassesPerRow = 15;
      glassesXStart = this.screenCenterX * 0.3;
      scaleValue = 0.8;
    }
    if (glasses > 45) {
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
      let img = this.add.image(
        glassesXStart + glassesXAdd,
        glassesY,
        'GlassFull'
      );
      img.setScale(scaleValue);
      glassesXAdd = glassesXAdd + img.width * scaleValue * 1.1;
      if (index % glassesPerRow == 0) {
        glassesY = glassesY + img.height * scaleValue * 1.1;
        glassesXAdd = 0;
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
}



