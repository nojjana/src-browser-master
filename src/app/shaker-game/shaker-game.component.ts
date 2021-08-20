import { verifyHostBindings } from '@angular/compiler';
import { Component, destroyPlatform, OnDestroy, OnInit } from '@angular/core';
import Phaser from 'phaser';
import { SaftlimacherBaseGameComponent } from '../saftlimacher-base-game/saftlimacher-base-game-component';
//import { clearInterval } from 'timers';
import { SocketService } from '../socket-service/socket.service';
import Group = Phaser.GameObjects.Group;


@Component({
  selector: 'app-shaker-game',
  templateUrl: './shaker-game.component.html',
  styleUrls: ['./shaker-game.component.css']
})
export class ShakerGameComponent extends SaftlimacherBaseGameComponent implements OnInit, OnDestroy {

  constructor(protected socketService: SocketService) {
    super(socketService);
  }

  startGameScene(levelData: any): void {
    this.phaserGame = new Phaser.Game(this.config);
    this.phaserGame.scene.add('shakerScene', ShakerScene);
    this.phaserGame.scene.start('shakerScene', { socketService: this.socketService, levelData: levelData });
  }

  removeGameSpecificListeners(): void {
    this.socketService.removeListener('updateHammer');
    this.socketService.removeListener('updateShaking');
    this.socketService.removeListener('updateShakeCounter');
    this.socketService.removeListener('changeShakeObject');
    this.socketService.removeListener('updateFall');
  }
}

export default class ShakerScene extends Phaser.Scene {
  private socketService: any;
  private pixelSize = 128;
  private halfPixelSize = this.pixelSize / 2;
  private mole: Phaser.GameObjects.Image;
  private hammer: Phaser.GameObjects.Image;
  private shakeObject: Phaser.GameObjects.Image;
  private currentShakeObject: Phaser.GameObjects.Image;
  private shakeObjects: Phaser.GameObjects.Group;
  private appleTree: Phaser.GameObjects.Image;
  private bananaTree: Phaser.GameObjects.Image;
  private berryTree: Phaser.GameObjects.Image;
  private ingredientOnShakeObject: Phaser.GameObjects.Image;
  private ingredientFalling: Phaser.GameObjects.Image;
  private ingredientInShaker: Phaser.GameObjects.Image;
  private oldIngredientInShaker: Phaser.GameObjects.Image;
  private shakerContainer: Phaser.GameObjects.Image;

  private scoreText: Phaser.GameObjects.BitmapText;
  private score: any;
  private holes: Phaser.GameObjects.Group;
  private hit: Phaser.GameObjects.Image;
  private screenCenterX: number;
  private screenCenterY: number;
  private screenEndX: number;
  private screenEndY: number;
  private initShakeObjectX: number;
  private initShakeObjectY: number;
  private shakeObjectX: number;
  private shakeObjectY: number;
  private ingredientOnShakeObjectX: number;
  private ingredientOnShakeObjectY: number;
  private ingredientFallingX: number;
  private ingredientFallingY: number;
  private shakerContainerX: number;
  private shakerContainerY: number;
  private shakeEffectOnPlant = false;
  private shakeLeavesSound: any;

  private background: Phaser.GameObjects.TileSprite;
  private currentShakeObjectNumber = null;
  private numberOfShakingObjects = 2;
  private shakingObjectList: Array<number>;

  private maxAmountOfFallingObjects = 3;

  private currentRandomShakingObjectNumber = 0;
  private objectReachedShaker = false;
  private falling = false;
  private speedOfFalling: number = 30;  //+ y delta

  private shakingObjectNumber = 0;

  //IngredientList
  private ingredientList: Phaser.GameObjects.Image;
  private strikethroughObject: Phaser.GameObjects.Image;
  private ingredientListX: number;
  private ingredientListY: number;
  private ingredientOnListX: number;
  private ingredientOnListY: number;

  private ingredientOnList: Phaser.GameObjects.Image;
  private appleTall: Phaser.GameObjects.Image;
  private bananaTall: Phaser.GameObjects.Image;
  private berryTall: Phaser.GameObjects.Image;
  private catchedIngredientCounterText1: Phaser.GameObjects.BitmapText;
  private catchedIngredientCounterText2: Phaser.GameObjects.BitmapText;
  private catchedIngredientCounterText3: Phaser.GameObjects.BitmapText;

  private catchedShakeObjectCounter1 = 0;
  private catchedShakeObjectCounter2 = 0;
  private catchedShakeObjectCounter3 = 0;

  private progressbar: Phaser.GameObjects.Image;
  private progressbarX: number;
  private progressbarY: number;

  // lists to keep track of all game object images
  private allFallingIngredients: Phaser.GameObjects.Image[] = new Array();
  private allIngredientsInShaker: Phaser.GameObjects.Image[] = new Array();
  private allIngredientsOnList: Phaser.GameObjects.Image[] = new Array();

  private playing: boolean = false;
  private allIngredientNumbersOnList: number[];

  private adjustedPointsText: Phaser.GameObjects.BitmapText;
  goodBling: Phaser.Sound.BaseSound;
  badBling: Phaser.Sound.BaseSound;
  endBling: Phaser.Sound.BaseSound;

  shakeCounter = 0;
  shakePointsNeededForFalling = 5;
  bar: any;
  box: Phaser.GameObjects.Graphics;
  progressBarColor = 0x66CC33;
  adjustedPointsTextVisibleCounter: number;

  constructor() {
    super({ key: 'shakerScene' });
  }

  preload() {
    this.load.image('Mole', '../../assets/shaker/Mole.png');
    this.load.image('MoleHole', '../../assets/shaker/Mole Hole transparent.png');
    this.load.image('HammerArea', '../../assets/shaker/HammerArea.png');
    this.load.image('HammerHit', '../../assets/shaker/HammerHit.png');
    this.load.image('Grass', '../../assets/shaker/Grass.png');

    this.load.image('AppleTree', '../../assets/shaker/ShakeObject-Apple.png');
    this.load.image('BananaTree', '../../assets/shaker/ShakeObject-Banana.png');
    this.load.image('BerryTree', '../../assets/shaker/ShakeObject-Berry.png');
    this.load.image('BeatleTree', '../../assets/shaker/ShakeObject-Beatle.png');

    this.load.image('Apple', '../../assets/shaker/Apple.png');
    this.load.image('Banana', '../../assets/shaker/Banana.png');
    this.load.image('Berry', '../../assets/shaker/Berry.png');
    this.load.image('Beatle', '../../assets/shaker/Beatle.png');

    this.load.image('AppleTall', '../../assets/shaker/AppleTall.png');
    this.load.image('BananaTall', '../../assets/shaker/BananaTall.png');
    this.load.image('BerryTall', '../../assets/shaker/BerryTall.png');

    this.load.image('Strikethrough1', '../../assets/shaker/Strikethrough1.png');
    this.load.image('Strikethrough2', '../../assets/shaker/Strikethrough2.png');
    this.load.image('Strikethrough3', '../../assets/shaker/Strikethrough3.png');
    this.load.image('ShakerContainer', '../../assets/shaker/ShakerContainer.png');

    this.load.bitmapFont('pressStartWhite', '../../assets/font/PressStartWhite.png', '../../assets/font/PressStartWhite.fnt');
    this.load.bitmapFont('pressStartBlack', '../../assets/font/PressStart.png', '../../assets/font/PressStart.fnt');

    this.load.image('BeeHome', '../../assets/shaker/ShakeObject-BeeHome.png');
    this.load.image('FallingObject', '../../assets/shaker/Apple.png');

    this.load.image('IngredientList', '../../assets/shaker/IngredientList.png');
    this.load.image('ShakerMixing', '../../assets/shaker/ShakerMixing.png');
    this.load.image('ShakerMixed', '../../assets/shaker/ShakerMixed.png');
    this.load.image('GlassFull', '../../assets/shaker/glass-full.png');

    this.load.image('Progressbar', '../../assets/shaker/Progressbar.png');
    this.load.bitmapFont('pressStart', '../../assets/font/PressStartWhite.png', '../../assets/font/PressStartWhite.fnt');

    this.load.audio('ShakingLeaves', '../../assets/shaker/rustling-bushes.mp3');
    this.load.audio('Good', '../../assets/shaker/mixkit-bonus.wav');
    this.load.audio('Bad', '../../assets/shaker/mixkit-loosing.wav');
    this.load.audio('Bad2', '../../assets/shaker/mixkit-mechanical-bling.wav');
    this.load.audio('Bad3', '../../assets/shaker/mixkit-small-hit.wav');
    this.load.audio('End', '../../assets/catcher/mixkit-bling-achievement.wav');
  }

  create(data) {
    this.socketService = data.socketService;
    const levelData = data.levelData;
    this.allIngredientNumbersOnList = levelData[0];
    this.shakePointsNeededForFalling = levelData[1];

    this.screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
    this.screenCenterY = this.cameras.main.worldView.y + this.cameras.main.height / 2;
    this.screenEndX = this.cameras.main.worldView.x + this.cameras.main.width;
    this.screenEndY = this.cameras.main.worldView.y + this.cameras.main.height;
    this.initShakeObjectX = this.screenCenterX;
    this.initShakeObjectY = this.screenCenterY * 0.5;
    this.shakeObjectX = this.initShakeObjectX;
    this.shakeObjectY = this.initShakeObjectY;
    this.ingredientOnShakeObjectX = this.initShakeObjectX;
    this.ingredientOnShakeObjectY = this.initShakeObjectY;
    this.ingredientFallingX = this.initShakeObjectX;
    this.ingredientFallingY = this.initShakeObjectY;
    this.shakerContainerX = this.screenCenterX;
    this.shakerContainerY = this.screenEndY * 0.8;
    this.ingredientListX = this.screenCenterX * 0.2;
    this.ingredientListY = this.screenCenterY;
    this.ingredientOnListX = this.screenCenterX * 0.2;
    this.ingredientOnListY = this.screenCenterY * 0.5;
    this.progressbarX = this.screenEndX * 0.68;
    this.progressbarY = this.initShakeObjectY * 0.3;

    this.scoreText = this.add.bitmapText(
      this.screenEndX * 0.8,
      this.screenEndY * 0.9,
      'pressStartBlack',
      '0',
      32)
    .setOrigin(0.5)
    .setDepth(100);

    this.adjustedPointsText = this.add.bitmapText(
      this.shakerContainerX * 1.2,
      this.shakerContainerY * 0.9,
      'pressStartBlack',
      '',
      40)
      .setOrigin(0.5)
      .setDepth(100);

    this.adjustedPointsText.setVisible(false);
    this.adjustedPointsTextVisibleCounter = 0;

    this.createBackground(levelData[1], levelData[0]);
    this.background.setVisible(false);
    this.holes.setVisible(false);

    this.shakeObject = this.add.image(
      this.shakeObjectX,
      this.shakeObjectY,
      this.loadShakeObjectImage(this.currentRandomShakingObjectNumber)
    );
    this.shakeObject.setDepth(70);

    this.ingredientOnShakeObject = this.add.image(
      this.ingredientOnShakeObjectX,
      this.ingredientOnShakeObjectY,
      this.loadIngredientImage(this.currentRandomShakingObjectNumber)
    );
    this.ingredientOnShakeObject.setDepth(80);

    this.ingredientFalling = this.add.image(
      this.ingredientFallingX,
      this.ingredientFallingY,
      this.loadIngredientImage(this.currentRandomShakingObjectNumber)
    );
    this.ingredientFalling.setDepth(88);
    this.ingredientFalling.setVisible(false);

    this.ingredientInShaker = this.add.image(
      this.shakerContainerX * 1.1,
      this.shakerContainerY,
      this.loadIngredientImage(this.currentRandomShakingObjectNumber)
    );
    this.ingredientInShaker.setDepth(78);
    this.ingredientInShaker.setVisible(false);

    this.oldIngredientInShaker = this.add.image(
      this.shakerContainerX * 1.1,
      this.shakerContainerY * 0.5, // TODO??
      this.loadIngredientImage(this.currentRandomShakingObjectNumber)
    );
    this.oldIngredientInShaker.setDepth(75);
    this.oldIngredientInShaker.setVisible(false);

    this.shakerContainer = this.add.image(
      this.shakerContainerX,
      this.shakerContainerY,
      'ShakerContainer'
    );
    this.shakerContainer.setDepth(100);

    this.ingredientList = this.add.image(
      this.ingredientListX,
      this.ingredientListY,
      'IngredientList'
    );

    this.loadIngredientsOnList(this.allIngredientNumbersOnList);

    this.progressbar = this.add.image(
      this.progressbarX,
      this.progressbarY,
      'Progressbar'
    );
    this.progressbar.setVisible(false);

    this.initProgressBar(this.progressbarX, this.progressbarY, this.progressBarColor);
    this.setValueOfBar(0);

    this.hammer = this.add.image(
      this.shakeObjectX,
      this.shakeObjectY,
      'HammerArea'
    );
    this.hammer.setDepth(3);
    this.hammer.setVisible(false);

    this.hit = this.add.image(
      this.shakeObjectX,
      this.shakeObjectY,
      'HammerHit'
    );
    this.hit.setVisible(false);
    this.hit.setDepth(90);

    this.mole = this.add.image(
      this.shakeObjectX,
      this.shakeObjectY,
      'Mole'
    );
    this.mole.setDepth(2);
    this.mole.setVisible(false);

    this.initSoundEffects();

    this.socketService.on('updateHammer', (hammer) => {
      this.hammer.setPosition(hammer[0], hammer[1]);
      this.mole.setPosition(hammer[2], hammer[3]);
      this.hammerHit(hammer[4]);
    });

    this.socketService.on('updateShaking', (isShaking) => {
      if (isShaking){
        this.startShakeLoop();
      } else {
        this.stopShakeLoop();
      }
    });

    this.socketService.on('updateFall', (triggerFall) => {
      if (triggerFall) {
        this.triggerFallOfIngredient();
      }
    });

    this.socketService.on('updateScore', (score) => {
      this.score = score;
      this.scoreText.setText(score);
    });

    this.socketService.on('updateShakeCounter', (counter) => {
      if (counter > this.shakePointsNeededForFalling) {
        this.shakeCounter = this.shakePointsNeededForFalling
      } else {
        this.shakeCounter = counter;
      }
      this.setValueOfBar(100*(counter/this.shakePointsNeededForFalling));
    });

    this.socketService.on('checkIngredientOnList', (number) => {
      this.checkIngredientOnList(number);
    });

    this.socketService.on('adjustScoreByCatchedIngredient', (scoreInfo) => {
      if (scoreInfo[0] < 0) {
        this.playBadSound();
        this.showLostPointsByIngredient(scoreInfo[0], scoreInfo[1]);

      } else if (scoreInfo[0] > 0) {
        this.playGoodSound();
        this.showCollectedPointsByIngredient(scoreInfo[0], scoreInfo[1]);
      }

    });

    this.socketService.on('changeShakeObject', (newNumber) => {
      this.updateShakeObject(newNumber);
    });

    this.socketService.on('playing', playing => {
      this.playing = playing;
    });

    this.socketService.on('gameOver', finished => {
      if (finished === true) {
        this.showGameOver();
        this.playGameOverSound();
      }
    });

    this.socketService.emit('gameViewBuild');
  }

  initSoundEffects() {
    this.goodBling = this.sound.add('Good');
    this.badBling = this.sound.add('Bad3');
    this.endBling = this.sound.add('End');
  }

  setValueOfBar(percentage: number) {
    if (percentage > 100) {
      percentage = 100;
    }
    this.bar.scaleX = percentage / 100;
  }

  initProgressBar(x: number, y: number, color: number): any {
    let box = this.add.graphics();
    box.fillStyle(0x808080, 0.5);
    box.fillRect(0, 0, 400, 50);
    box.x = x;
    box.y = y;
    this.box = box;

    //draw the bar
    let bar = this.add.graphics();

    //color the bar
    bar.fillStyle(color, 1);

    //fill the bar with a rectangle
    bar.fillRect(0, 0, 400, 50);


    //position the bar
    bar.x = x;
    bar.y = y;

    this.bar = bar;
  }

  playBadSound() {
    this.badBling.play();
  }

  playGoodSound() {
    this.goodBling.play();
  }

  private playGameOverSound() {
    this.endBling.play();
  }

  private showLostPointsByIngredient(scoreDec: number, ingredientNr: number) {
    this.adjustedPointsText.setText('' + scoreDec);
    this.adjustedPointsText.setTintFill(0xE50D0D);
    this.adjustedPointsText.setVisible(true);
    this.adjustedPointsTextVisibleCounter = 0;
    return this.adjustedPointsText;
  }

  private showCollectedPointsByIngredient(scoreInc: number, ingredientNr: number) {
    this.adjustedPointsText.setText('+' + scoreInc);
    this.adjustedPointsText.setTintFill(0x37B400);
    this.adjustedPointsText.setVisible(true);
    return this.adjustedPointsText;
  }

  private checkIngredientOnList(numberOfIngredient: number) {
    this.updateCatchedIngredientCounterDisplay(numberOfIngredient);
  }

  private createBackground(height: number, width: number): void {
    this.holes = new Group(this);
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        this.holes.add(this.add.image(this.halfPixelSize + j * this.pixelSize, this.halfPixelSize + i * this.pixelSize, 'MoleHole')
          .setDepth(1));
      }
    }
    this.background = this.add.tileSprite(0, 0, 2 * this.game.canvas.width, 2 * this.game.canvas.height, 'Grass');
    this.background.setDepth(0);
  }

  private hammerHit(hammerElement: any): void {
    if (hammerElement === true && !this.hit.visible) {
      this.hit.setPosition(this.hammer.x, this.hammer.y);
      this.time.addEvent({ delay: 300, callback: () => this.hit.setVisible(false) });
    }
  }

  private getRandomInt(max: number): number {
    return Math.floor(Math.random() * Math.floor(max));
  }

  private startShakeLoop(): void{
    var shakeX = 10*this.getRandomInt(5);
    var shakeY = 10*this.getRandomInt(5);
    this.shakeObject.destroy();                
    this.shakeObject = this.add.image(
      this.shakeObjectX += shakeX,
      this.shakeObjectY = this.initShakeObjectY,
      this.loadShakeObjectImage(this.currentRandomShakingObjectNumber)
    );
    this.shakeObject.rotation += 0.2;
  }

  private stopShakeLoop(): void{
    this.shakeObject.destroy();
    this.shakeObject = this.add.image(
      this.shakeObjectX = this.initShakeObjectX,
      this.shakeObjectY = this.initShakeObjectY,
      this.loadShakeObjectImage(this.currentRandomShakingObjectNumber)
    );
    this.shakeObject.rotation == 0;
  }


  private triggerFallOfIngredient(): void {
    this.prepareFallingIngredient(this.currentRandomShakingObjectNumber);
    setTimeout(() => { this.regrowIngredient(this.currentRandomShakingObjectNumber); }, 300);
  }

  private prepareFallingIngredient(shakingObjectNumber: number) {

    if (this.ingredientOnShakeObject != null) {
      this.ingredientOnShakeObject.destroy();
    }

    this.ingredientFallingX = this.initShakeObjectX + 30,
      this.ingredientFallingY = this.initShakeObjectY,
      this.ingredientFalling = this.add.image(
        this.ingredientFallingX,
        this.ingredientFallingY,
        this.loadIngredientImage(shakingObjectNumber)
      );
    this.ingredientFalling.setDepth(88);
    this.ingredientFalling.setVisible(true);

    this.allFallingIngredients.push(this.ingredientFalling);

  }

  private keepFalling(): void {
    const allFallingIngredientsClone = this.allFallingIngredients;
    allFallingIngredientsClone?.forEach(i => {
      i.y += this.speedOfFalling;

      if (i.y >= this.shakerContainerY*0.985) {
        this.allFallingIngredients = allFallingIngredientsClone.filter(x => x !== i);
        this.allIngredientsInShaker.push(i);
      }
    });
  }


  private regrowIngredient(shakingObjectNumber: number): void {
    if (this.playing) {
      if (this.ingredientOnShakeObject != null) {
        this.ingredientOnShakeObject.destroy();
      }
      this.ingredientOnShakeObjectX = this.initShakeObjectX,
        this.ingredientOnShakeObjectY = this.initShakeObjectY,
        this.ingredientOnShakeObject = this.add.image(
          this.ingredientOnShakeObjectX,
          this.ingredientOnShakeObjectY,
          this.loadIngredientImage(shakingObjectNumber)
        );
      this.ingredientOnShakeObject.setDepth(80);
    }
  }

  private updateShakeObject(newNumber: number): void {
    this.currentRandomShakingObjectNumber = newNumber;

    if (this.shakeObject != null) {
      this.shakeObject.destroy();                 
    }
      this.shakeObjectX = this.initShakeObjectX,
      this.shakeObjectY = this.initShakeObjectY,

      this.shakeObject = this.add.image(
        this.shakeObjectX,
        this.shakeObjectY,
        this.loadShakeObjectImage(this.currentRandomShakingObjectNumber)
      );
    this.shakeObject.setDepth(70);

    this.regrowIngredient(this.currentRandomShakingObjectNumber);
  }

  private loadShakeObjectImage(randomShakingObjectNumber) {
    if (randomShakingObjectNumber == 0) {
      return 'AppleTree'
    } else if (randomShakingObjectNumber == 1) {
      return 'BananaTree'
    } else if (randomShakingObjectNumber == 2) {
      return 'BerryTree'
    } else if (randomShakingObjectNumber == 3) {
      return 'BeatleTree'
    }
  }

  private loadIngredientImage(randomShakingObjectNumber) {
    if (randomShakingObjectNumber == 0) {
      return 'Apple'
    } else if (randomShakingObjectNumber == 1) {
      return 'Banana'
    } else if (randomShakingObjectNumber == 2) {
      return 'Berry'
    } else if (randomShakingObjectNumber == 3) {
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


  private strikethroughCatchedIngredient(currentShakeObjectNumber) {
    this.ingredientOnListY = this.screenCenterY * 0.5;

    if (currentShakeObjectNumber == 0) {
      this.strikethroughObject = this.add.image(
        this.ingredientOnListX,
        this.ingredientOnListY,
        'Strikethrough1'
      );
    } else if (currentShakeObjectNumber == 1) {
      this.strikethroughObject = this.add.image(
        this.ingredientOnListX,
        this.ingredientOnListY += 250,
        'Strikethrough2'
      );
    } else if (currentShakeObjectNumber == 2) {
      this.strikethroughObject = this.add.image(
        this.ingredientOnListX,
        this.ingredientOnListY += 500,
        'Strikethrough3'
      );
    }
  }

  private updateCatchedIngredientCounterDisplay(ingredientObjectNumber) {
    this.increaseCounterForNumber(ingredientObjectNumber);
    if (this.getCounterForNumber(ingredientObjectNumber) > 1) {
      this.updateCounterTextForNumber(this.getCounterForNumber(ingredientObjectNumber).toString(), ingredientObjectNumber);
    } else {
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


  private showGameOver(): void {
    this.hammer.destroy();
    this.mole.destroy();
    this.scoreText.destroy();
    this.holes.destroy(true);
    this.shakeObject.destroy();
    this.shakerContainer.destroy();
    this.ingredientOnShakeObject.destroy();
    this.ingredientInShaker.destroy();
    this.oldIngredientInShaker.destroy();
    this.ingredientList.destroy();
    this.catchedIngredientCounterText1?.destroy();
    this.catchedIngredientCounterText2?.destroy();
    this.catchedIngredientCounterText3?.destroy();
    this.appleTall?.destroy();
    this.ingredientOnList?.destroy();             
    this.ingredientFalling?.destroy();

    this.allFallingIngredients.forEach(i => i.destroy());
    this.allIngredientsInShaker.forEach(i => i.destroy());
    this.allIngredientsOnList.forEach(i => i.destroy());

    this.adjustedPointsText?.destroy();

    this.bar?.destroy();
    this.box?.destroy();

    this.sound?.stopAll();

    this.showReachedScore();
  }

  private showReachedScore() {
    this.add.image(
      this.screenCenterX,
      this.screenCenterY*0.45,
      'ShakerMixed'
    );

    let glasses = this.getNumberOfGlasses(this.score);

    let glassesY = this.screenCenterY*1.25;
    let glassesXStart = this.screenCenterX*0.7;
    let glassesXAdd = 0;
    let glassesPerRow = 6;
    let scaleValue = 1;

    let textY = this.screenCenterY*0.98;
    let text = [''];
    if (glasses <= 0) {
      text = ['Der Saft ist fertig!\n\nIhr habt leider keinen\n\nleckeren Saft hergestellt...'];
      textY = this.screenCenterY*1.1;
    }
    if (glasses == 1) {
      text = ['Der Saft ist fertig! Ihr habt\n\n1 leckere Portion Saft hergestellt.\n\nImmerhin!'];
      textY = this.screenCenterY*1.1;
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
        glassesY = this.screenCenterY*1.5;
      }
      if (glasses > 12) {
        glassesPerRow = 10;
        glassesXStart = this.screenCenterX*0.4;
      }
      if (glasses > 30) {
        glassesPerRow = 15;
        glassesXStart = this.screenCenterX*0.3;
        scaleValue = 0.8;
      }
      if (glasses > 45) {
        glassesPerRow = 20;
        glassesXStart = this.screenCenterX*0.4;
        scaleValue = 0.5;
      }
      if (glasses > 100) {
        glassesXStart = this.screenCenterX*0.25;
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
        glassesXAdd = glassesXAdd + img.width*scaleValue*1.1;
        if (index % glassesPerRow == 0) {
          glassesY = glassesY + img.height*scaleValue*1.1;
          glassesXAdd = 0;
        }
      }
  }

  private getNumberOfGlasses(score: number) {
    let glasses = score / 10;
    glasses = Math.floor(glasses);
    return glasses;
  }

  update() {
    if (this.playing != undefined && this.playing) {
      this.keepFalling();
    }

    if (this.adjustedPointsText.visible) {
      this.adjustedPointsTextVisibleCounter++;
      if (this.adjustedPointsTextVisibleCounter > 50) {
        this.adjustedPointsText.setVisible(false);
        this.adjustedPointsTextVisibleCounter = 0;
      }
    }
  }

}

enum IngredientType {
  APPLE,
  BANANA,
  BERRY,
  BEATLE
}



