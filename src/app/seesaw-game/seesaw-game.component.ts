import { verifyHostBindings } from '@angular/compiler';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { Component, destroyPlatform, OnDestroy, OnInit } from '@angular/core';
import Phaser from 'phaser';
//import { clearInterval } from 'timers';
import { SocketService } from '../socket-service/socket.service';
import Group = Phaser.GameObjects.Group;


@Component({
  selector: 'app-seesaw-game',
  templateUrl: './seesaw-game.component.html',
  styleUrls: ['./seesaw-game.component.css']
})
export class SeesawGameComponent implements OnInit, OnDestroy {

  // basic program setup
  phaserGame: Phaser.Game;
  config: Phaser.Types.Core.GameConfig;
  public building = false;
  public amountOfReadyPlayers = 0;

  // basic game setup
  public tutorial = true;
  public dots = 0;
  private dotInterval;
  public countdown: number = 5;
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
      /* physics: {
        default: 'matter',
        matter: {
            debug: false,
            gravity: { y: 150 }
        }
      }, */
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
    this.socketService.removeListener('checkIngredientOnList');
    // TODO: listeners vervollständigen

    clearInterval(this.dotInterval);
  }

  ngOnInit(): void {
    this.socketService.on('controllerEndedTutorial', () => { this.controllerReady(); });
    this.socketService.on('countdown', (number) => {
      // TODO countdown sound
      this.countdown = number;
    });
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
      this.phaserGame.scene.add('seesawScene', SeesawScene);
      this.phaserGame.scene.start('seesawScene', { socketService: this.socketService, levelData: levelData });
    }, 100);
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
  private garbageContainerLeftX = 700;
  private shakerContainerX = 1500; //800
  private garbageContainerRightX = 2250; //2400
  private shakerContainerY = 930;
  private garbageContainerY = 1000;

////only for testing reasons - circle for Ingredients 1-3
/*   private circleIng1: Phaser.GameObjects.Ellipse;
  private circleIng2: Phaser.GameObjects.Ellipse;
  private circleIng3: Phaser.GameObjects.Ellipse;
  private circleIng4: Phaser.GameObjects.Ellipse;
  private circleIng5: Phaser.GameObjects.Ellipse;
  private circleIng6: Phaser.GameObjects.Ellipse; */


  //private seesawBeam1: Phaser.GameObjects.Image;
////  private seesaw2: Phaser.GameObjects.Image;
  //private seesawBeam2: Phaser.GameObjects.Image; 
  /// catchers
  /* private catcherNet1: Phaser.GameObjects.Image;
  private catcherNet2: Phaser.GameObjects.Image;
  private catcherNet3: Phaser.GameObjects.Image;
  private shakerContainer: Phaser.GameObjects.Image; */
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
    super({ key: 'seesawScene' });
  }

  preload() {
    // säftlimacher visible objects
    this.load.image('Ground', '../../assets/catcher/Ground.png')
    ////this.load.image('CatcherNet1', '../../assets/catcher/NetOrange.png');
    ////this.load.image('CatcherNet2', '../../assets/catcher/NetLightGreen.png');
    ////this.load.image('CatcherNet3', '../../assets/catcher/NetBlue.png');
    this.load.image('ShakerContainer', '../../assets/shaker/ShakerContainer.png');
    this.load.image('GarbageContainer', '../../assets/seesaw/Garbage.png');
    this.load.image('IngredientList', '../../assets/shaker/IngredientList.png');
    this.load.image('Seesaw', '../../assets/seesaw/seesaw.png');
    this.load.image('SeesawBeam', '../../assets/seesaw/seesawBeam.png');

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
    this.load.audio('Bad', '../../assets/shaker/mixkit-small-hit.wav');
    this.load.audio('Start', '../../assets/catcher/mixkit-game-ball-tap.wav');
    this.load.audio('End', '../../assets/catcher/mixkit-bling-achievement.wav');
  }

  create(data) {
    this.socketService = data.socketService;

    // get level info from CatcherProgram (server)
    const levelData = data.levelData;
    this.allIngredientNumbersOnList = levelData[0];

  ////  let initSeesaw1X = levelData[1];
  ////  let initSeesaw1Y = levelData[2];

  ////  let initSeesaw2X = levelData[3];
  ////  let initSeesaw2Y = levelData[4];    


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
    this.ground.setVisible(true);

    //TEST RECTANGLE
    this.rectangle1 = this.add.rectangle(0, 0, 0, 0, 0xa83232)
    this.rectangleBeam1 = this.add.rectangle(0,0,0,0, 0xa83232)
    this.rectangle2 = this.add.rectangle(0,0,0,0, 0x9a32a6)
    this.rectangleBeam2 = this.add.rectangle(0,0,0,0, 0x9a32a6)
/*     this.circleIng1 = this.add.ellipse(0,0,100,100, 0xa83232)
    this.circleIng2 = this.add.ellipse(0,0,100,100, 0xa83232)
    this.circleIng3 = this.add.ellipse(0,0,100,100, 0xa83232)
    this.circleIng4 = this.add.ellipse(0,0,100,100, 0x9a32a6)
    this.circleIng5 = this.add.ellipse(0,0,100,100, 0x9a32a6)
    this.circleIng6 = this.add.ellipse(0,0,100,100, 0x9a32a6) */


     // seesaw
    /*  this.seesaw1 = this.add.image(
      initSeesaw1X,
      initSeesaw1Y,
      'Seesaw'
    )
    this.seesaw1.setDepth(80);

    // seesaw beam (balken)
    this.seesawBeam1 = this.add.image(
      initSeesaw1X,
      initSeesaw1Y+20,
      'SeesawBeam'
    )
    this.seesawBeam1.setDepth(80);

    // seesaw
    this.seesaw2 = this.add.image(
      initSeesaw2X,
      initSeesaw2Y,
      'Seesaw'
    )
    this.seesaw2.setDepth(80);

    // seesaw beam (balken)
    this.seesawBeam2 = this.add.image(
      initSeesaw2X,
      initSeesaw2Y+20,
      'SeesawBeam'
    )
    this.seesawBeam2.setDepth(80); */

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
      'Punkte: 0',
      28)
      .setOrigin(0.5)
      .setDepth(100);

    /// +/- score points text
    this.adjustedPointsText = this.add.bitmapText(
      this.screenWidth * 0.68,
      this.screenHeight * 0.7,
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

    this.loadIngredientsOnList(this.allIngredientNumbersOnList);

    // TODO: fix error which shows after restarting game
    // add sounds to scene
    this.initSoundEffects();

    // listeners on updates from server
    /// current shaker position
    this.socketService.on('seesaw1Position', (pos) => {

      if (Math.abs(this.rectangle1.rotation - pos[4]) > 0.1){
        this.rectangle1.setRotation(pos[4]);
      } if (this.rectangle1.x = 0) {
        this.rectangle1.setRotation(0);
      }
/*       console.log("seesaw1 X: "+pos[0]+" seesaw1 Y: "+pos[1]+" seesaw Angle: "+pos[4])
      this.rectangle1.setRotation(pos[4]); */

      this.rectangle1.setPosition(pos[0], pos[1]);
      this.rectangle1.setSize(pos[2], pos[3]);
      this.rectangle1.setOrigin(0.5);   

    });

    this.socketService.on('seesawBeam1Position', (pos) => {
      //  this.shakerContainer.setPosition(pos[0], pos[1]);
      ////  this.seesaw1.setPosition(pos[0], pos[1]);
    //    console.log("seesawBeam1 pos0: "+pos[0]+" seesawBeam1 pos1: "+pos[1])
    //    console.log("seesawBeam1 length: "+pos[2]+" seesawBeam1 height: "+pos[3])

        this.rectangleBeam1.setPosition(pos[0], pos[1]);
        this.rectangleBeam1.setSize(pos[2], pos[3]);
      });

      
    this.socketService.on('seesaw2Position', (pos) => {
      if (Math.abs(this.rectangle2.rotation - pos[4]) > 0.1){
        this.rectangle2.setRotation(pos[4]);
      } if (this.rectangle2.x = 0) {
        this.rectangle2.setRotation(0);
      }
    //  console.log("seesaw2 X: "+pos[0]+" seesaw2 Y: "+pos[1] +" seesaw2 Angle: "+pos[4])

      this.rectangle2.setPosition(pos[0], pos[1]);
      this.rectangle2.setSize(pos[2], pos[3]);
      this.rectangle2.setOrigin(0.5);   
    //  this.rectangle2.setRotation(pos[4]);
    });

    this.socketService.on('seesawBeam2Position', (pos) => {
      //  this.shakerContainers.setPosition(pos[0], pos[1]);
      ////  this.seesaw1.setPosition(pos[0], pos[1]);
    //    console.log("seesawBeam1 pos0: "+pos[0]+" seesawBeam1 pos1: "+pos[1])
    //    console.log("seesawBeam2 length: "+pos[2]+" seesawBeam2 height: "+pos[3])

        this.rectangleBeam2.setPosition(pos[0], pos[1]);
        this.rectangleBeam2.setSize(pos[2], pos[3]);
    });

    // /// current ingredient position

     /// current ingredient position left 0
     this.socketService.on('updateIngredientLeft0', (pos) => {
      if (this.ingredientLeft0 != null) {
        console.log("ingredientLeftPositionX: "+pos[0]+" ingredientY: "+pos[1]+" angle: "+pos[2])
        this.ingredientLeft0.setPosition(pos[0], pos[1]);
        this.ingredientLeft0.setAngle(pos[3]);
      }
    });
     /// current ingredient position left 1
     this.socketService.on('updateIngredientLeft1', (pos) => {
      if (this.ingredientLeft1 != null) {
        this.ingredientLeft1.setPosition(pos[0], pos[1]);
        this.ingredientLeft1.setAngle(pos[3]);
     }
    });

    /// current ingredient position left 2
    this.socketService.on('updateIngredientLeft2', (pos) => {
      if (this.ingredientLeft2 != null) {
        this.ingredientLeft2.setPosition(pos[0], pos[1]);
        this.ingredientLeft2.setAngle(pos[3]);
      }
    });

    this.socketService.on('updateIngredientRight0', (pos) => {
      if (this.ingredientRight0 != null) {
        this.ingredientRight0.setPosition(pos[0], pos[1]);
        this.ingredientRight0.setAngle(pos[3]);
      }
    });

    this.socketService.on('updateIngredientRight1', (pos) => {
      if (this.ingredientRight1 != null) {
        this.ingredientRight1.setPosition(pos[0], pos[1]);
        this.ingredientRight1.setAngle(pos[3]);
      }
    });

    this.socketService.on('updateIngredientRight2', (pos) => {
      if (this.ingredientRight2 != null) {
        this.ingredientRight2.setPosition(pos[0], pos[1]);
        this.ingredientRight2.setAngle(pos[3]);
      }
    });
   
    this.socketService.on('changeImageIngredientLeft0', (nr) => {
      if (this.ingredientLeft0 != null) {
       this.ingredientLeft0.destroy();
       this.ingredientLeft0 = this.add.image(
         this.screenCenterX,
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
      this.screenCenterX,
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
      this.screenCenterX,
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
      if (this.ingredientTouchedCollider){
    //    console.log("true / update playing called boolean: "+this.ingredientTouchedCollider);
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
    let glasses = score / 100;
    return glasses.toString();
  }


  private showLostPointsByIngredient(scoreDec: number, ingredientNr: number, x: number, y: number) {
    this.adjustedPointsText.setX(x);
    this.adjustedPointsText.setY(y);
    this.adjustedPointsText.setText(scoreDec + ' Punkte');
    this.adjustedPointsText.setVisible(true);
    this.adjustedPointsTextVisibleCounter = 0;
    // return this.adjustedPointsText;
  }

  private showCollectedPointsByIngredient(scoreInc: number, ingredientNr: number, x: number, y: number) {
    this.adjustedPointsText.setX(x);
    this.adjustedPointsText.setY(y);
    this.adjustedPointsText.setText('+' + scoreInc + ' Punkte');
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
  ////  this.seesaw1?.destroy();
   // this.seesawBeam1?.destroy();
  ////  this.seesaw2?.destroy();
   // this.seesawBeam2?.destroy();

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
  // HONEY,
  // BEE
}



