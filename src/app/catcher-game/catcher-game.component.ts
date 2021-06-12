import { verifyHostBindings } from '@angular/compiler';
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
      audio: { disableWebAudio: true }
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
  private ingredientFalling: Phaser.GameObjects.Image;
  private shakerContainer: Phaser.GameObjects.Image;
  private ingredientList: Phaser.GameObjects.Image;
  private ingredientOnList: Phaser.GameObjects.Image;
  private scoreText: Phaser.GameObjects.BitmapText;
  private adjustedPointsText: Phaser.GameObjects.BitmapText;

  // säftlimacher game variables
  private allIngredientNumbersOnList: number[];
  private adjustedPointsTextVisibleCounter: number;

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
    let initShakerPositionX = levelData[1];
    let initShakerPositionY = levelData[2];

    // screen dimensions
    this.screenWidth = this.cameras.main.width;
    this.screenHeight = this.cameras.main.height;
    this.screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
    this.screenCenterY = this.cameras.main.worldView.y + this.cameras.main.height / 2;
    this.screenEndX = this.cameras.main.worldView.x + this.cameras.main.width;
    this.screenEndY = this.cameras.main.worldView.y + this.cameras.main.height;

    // add säftlimacher visible game objects to scene
    /// shaker/mixer
    this.shakerContainer = this.add.image(
      initShakerPositionX,
      initShakerPositionY,
      // this.screenCenterX,
      // this.screenEndY * 0.8,
      'ShakerContainer'
    );
    this.shakerContainer.setDepth(100);

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
      0,
      this.loadIngredientImage(0)
    );
    this.ingredientFalling.setDepth(88);
    this.ingredientFalling.setVisible(false);

    /// ingredient list
    this.ingredientList = this.add.image(
      this.screenCenterX * 0.2,
      this.screenCenterY * 0.5,
      'IngredientList'
    );

    // add sounds to scene
    this.initSoundEffects();

    // listeners on updates from server
    /// current shaker position
    this.socketService.on('updateShakerPosition', (pos) => {
      this.shakerContainer.setPosition(pos[0], pos[1]);
    });
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
    });

    /// on show game over
    this.socketService.on('gameOver', finished => {
      if (finished === true) {
        this.showGameOver();
      }
    });

    // game build finished
    this.socketService.emit('gameViewBuild');
    // test dimensions TODO delete
    console.log(this.cameras.main.worldView.centerX, this.screenCenterX, this.cameras.main.worldView.centerY, this.screenCenterY);
    console.log(this.cameras.main.worldView.height, this.screenHeight, this.cameras.main.worldView.width, this.screenWidth);

  }


  update() {
    if (this.playing != undefined && this.playing) {
      // this.keepFalling();
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

  private loadIngredientImage(randomShakingObjectNumber) {
    if (randomShakingObjectNumber == 0) {
      return 'Apple'
    } else if (randomShakingObjectNumber == 1) {
      return 'Banana'
    } else if (randomShakingObjectNumber == 2) {
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



