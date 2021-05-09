import { verifyHostBindings } from '@angular/compiler';
import {Component, OnDestroy, OnInit} from '@angular/core';
import Phaser from 'phaser';
import {SocketService} from '../socket-service/socket.service';
import Group = Phaser.GameObjects.Group;


@Component({
  selector: 'app-shaker-game',
  templateUrl: './shaker-game.component.html',
  styleUrls: ['./shaker-game.component.css']
})
export class ShakerGameComponent implements OnInit, OnDestroy {
  phaserGame: Phaser.Game;
  config: Phaser.Types.Core.GameConfig;
  public tutorial = true;
  public building = false;
  public amountOfReadyPlayers = 0;
  public dots = 0;
  private dotInterval;
  public countdown: number = 3;

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
        //height: 572,
        //width: 640,
        height: 1440,
        width: 2560,
      },
      // backgroundColor: 0x0cb010,
      transparent: true,
      parent: 'gameContainer'
    };
  }


  ngOnDestroy() {
    if(this.phaserGame != null){
      this.phaserGame.destroy(true);
    }

    this.socketService.removeListener('shakerData');
    this.socketService.removeListener('updateHammer');
    this.socketService.removeListener('updateShaking');

    this.socketService.removeListener('reachedShaker');
    this.socketService.removeListener('updateFall');
    // this.socketService.removeListener('updateScore');

    this.socketService.removeListener('controllerEndedTutorial');
    this.socketService.removeListener('gameOver');

    this.socketService.removeListener('countdown');

    clearInterval(this.dotInterval);
  }

  ngOnInit(): void {
    this.socketService.on('controllerEndedTutorial', () => {this.controllerReady();});
    this.socketService.once('shakerData', (shakerData) => {this.initShaker(shakerData);});
    this.socketService.on('countdown', (number) => this.countdown = number);

    this.socketService.emit('displayReady');
  }

  private controllerReady(): void {
    this.amountOfReadyPlayers++;

    if (this.amountOfReadyPlayers === 2) {
      this.tutorial = false;
      console.log('finished tutorial');
    }
  }

  private initShaker(shakerData): void {
    console.log('Now init Shaker');
    this.building = true;
    setTimeout(() => {
      this.phaserGame = new Phaser.Game(this.config);
      this.phaserGame.scene.add('shakerScene', ShakerScene);
      this.phaserGame.scene.start('shakerScene', {socketService: this.socketService, shakerData: shakerData});
    }, 100);
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
  private shakeObjects: Phaser.GameObjects.Group;                  //groupe shakeObjects
  private appleTree: Phaser.GameObjects.Image;                     //Image appleTree
  private bananaTree: Phaser.GameObjects.Image;                    //Image bananaTree
  private berryTree: Phaser.GameObjects.Image;                     //Image bananaTree
  private beeHouse: Phaser.GameObjects.Image;
  private fallingObject: Phaser.GameObjects.Image;
  private shakerContainer: Phaser.GameObjects.Image;
  private ingredientList: Phaser.GameObjects.Image;
  private strikethroughObject: Phaser.GameObjects.Image;
  private ingredientListX: number;
  private ingredientListY: number;
  private ingredientOnListX: number;
  private ingredientOnListY: number;
  private progressbar: Phaser.GameObjects.Image;
  private progressbarX: number;
  private progressbarY: number;
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
  private fallingObjectX: number;
  private fallingObjectY: number;
  private shakerContainerX: number;
  private shakerContainerY: number;
  private background: Phaser.GameObjects.TileSprite;
  private currentShakeObjectNumber = null;
  private oldShakeObjectNumber = null;
  private numberOfShakingObjects = 2;
  private shakingObjectList: Array<number>;
  private maxAmountOfFallingObjects = 2;
  private randomShakingObjectNumber = Phaser.Math.Between(0,this.maxAmountOfFallingObjects);
  private shakingObjectNumber = 0;
  private objectReachedShaker = false;
  private falling = false;

  constructor() {
    super({ key: 'shakerScene' });
  }

  preload() {
    this.load.image('Mole', '../../assets/shaker/Mole.png');
    this.load.image('MoleHole', '../../assets/shaker/Mole Hole transparent.png');
    this.load.image('HammerArea', '../../assets/shaker/HammerArea.png');
    this.load.image('HammerHit', '../../assets/shaker/HammerHit.png');
    this.load.image('Grass', '../../assets/shaker/Grass.png');
    this.load.image('ShakeObject', '../../assets/shaker/ShakeObject-Apple.png');
    this.load.image('AppleTree', '../../assets/shaker/ShakeObject-Apple.png');
    this.load.image('BananaTree', '../../assets/shaker/ShakeObject-Banana.png');
    this.load.image('BerryTree', '../../assets/shaker/ShakeObject-Berry.png');
    this.load.image('BeeHome', '../../assets/shaker/ShakeObject-BeeHome.png');
    this.load.image('FallingObject', '../../assets/shaker/Apple.png');
    this.load.image('Apple', '../../assets/shaker/Apple.png');
    this.load.image('Banana', '../../assets/shaker/Banana.png');
    this.load.image('Berry', '../../assets/shaker/Berry.png');
    this.load.image('AppleTall', '../../assets/shaker/AppleTall.png');
    this.load.image('BananaTall', '../../assets/shaker/BananaTall.png');
    this.load.image('BerryTall', '../../assets/shaker/BerryTall.png');
    this.load.image('Strikethrough1', '../../assets/shaker/Strikethrough1.png');
    this.load.image('Strikethrough2', '../../assets/shaker/Strikethrough2.png');
    this.load.image('Strikethrough3', '../../assets/shaker/Strikethrough3.png');
    this.load.image('ShakerContainer', '../../assets/shaker/ShakerContainer.png');
    this.load.image('IngredientList', '../../assets/shaker/IngredientList.png');
    this.load.image('Progressbar', '../../assets/shaker/Progressbar.png');
    this.load.bitmapFont('pressStart', '../../assets/font/PressStartWhite.png', '../../assets/font/PressStartWhite.fnt');
  }

  create(data) {
    this.socketService = data.socketService;
    const shakerData = data.shakerData;
    this.screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
    this.screenCenterY = this.cameras.main.worldView.y + this.cameras.main.height / 2;
    this.screenEndX = this.cameras.main.worldView.x + this.cameras.main.width;
    this.screenEndY = this.cameras.main.worldView.y + this.cameras.main.height;
    this.initShakeObjectX = this.screenCenterX;
    this.initShakeObjectY = this.screenCenterY * 0.5;
    this.shakeObjectX = this.initShakeObjectX;
    this.shakeObjectY = this.initShakeObjectY;
    this.fallingObjectX = this.initShakeObjectX;
    this.fallingObjectY = this.initShakeObjectY;
    this.shakerContainerX = this.screenCenterX;
    this.shakerContainerY = this.screenEndY * 0.8;
    this.ingredientListX = this.screenCenterX * 0.2;
    this.ingredientListY = this.screenCenterY;
    this.ingredientOnListX = this.screenCenterX * 0.2;
    this.ingredientOnListY = this.screenCenterY * 0.5;
    this.progressbarX = this.screenCenterX * 1.6;
    this.progressbarY = this.screenCenterY * 0.2;

    // this.createBackground(shakerData[1], shakerData[0]);
    //this.initShakeObjects;
    //this.generateShakeObject();
    //this.createGameObject();
    //this.generateShakeObjectList(this.shakingObjectList);

    this.shakeObject = this.add.image(
      this.shakeObjectX,
      this.shakeObjectY,
      this.loadShakeObjectImage(this.randomShakingObjectNumber)
    );
    this.shakeObject.setDepth(70);

    this.fallingObject = this.add.image(
      // this.shakeObjectX,
      // this.shakeObjectY,
      this.fallingObjectX,
      this.fallingObjectY,
      this.loadFallingObjectImage(this.randomShakingObjectNumber)
    );
    this.shakeObject.setDepth(80);

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

    this.loadIngredientList(this.shakingObjectNumber);

    this.progressbar = this.add.image(
      this.progressbarX,
      this.progressbarY,
      'Progressbar'
    );

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

    this.scoreText = this.add.bitmapText(this.screenCenterX, 540, 'pressStart', 'Score: 0', 32)
      .setOrigin(0.5)
      .setDepth(100);

      // TODO shaking makes fruit fall ?
      // FROM SERVER SHAKERPROGRAM:
      // this.lobbyController.sendToDisplays('updateHammer',
      // [this.hammer.position.x, this.hammer.position.y,
      // this.mole.position.x, this.mole.position.y,
      // this.hit, this.score]);
    this.socketService.on('updateHammer', (hammer) => {
      this.hammer.setPosition(hammer[0], hammer[1]);
      this.mole.setPosition(hammer[2], hammer[3]);
      this.hammerHit(hammer[4]);
      this.scoreText.setText('Score: ' + hammer[5]);
      this.score = hammer[5];
    });

    this.socketService.on('updateShaking', (shakeEvent) => {
      this.shakeEvent(shakeEvent[0]);
    });

    // TODO NOT WORKING YET
    this.socketService.on('updateFall', (fallEvent) => {
      this.fallEvent(fallEvent[0]);
    });

    // this.socketService.on('updateScore', (scoreEvent) => {
    //   this.scoreText.setText('Score: ' + scoreEvent);
    //   this.score = scoreEvent;
    // });

    this.socketService.on('reachedShaker', (objectReachedShakerEvent) => {
      // TODO: event muss ggf gar nicht vom server kommen, da's in der view (browser) passiert?
      // ABER evtl sollte browser melden dass objekt angekommen ist und server gibt dann den befehlt zum wechseln?
        // this.objectReachedShaker = objectReachedShakerEvent;
        // this.updateShakeObject();
    });

    this.socketService.on('gameOver', finished => {
      if (finished === true) {
        this.showGameOver();
      }
    });

    this.socketService.emit('shakerBuild');
  }

  private createBackground(height: number, width: number): void {
    // this.holes = new Group(this);
    // for (let i = 0; i < height; i++) {
    //   for (let j = 0; j < width; j++) {
    //     this.holes.add(this.add.image(this.halfPixelSize + j * this.pixelSize, this.halfPixelSize + i * this.pixelSize, 'MoleHole')
    //       .setDepth(1));
    //   }
    // }
    // this.background = this.add.tileSprite(0, 0, 2 * this.game.canvas.width, 2 * this.game.canvas.height, 'Grass');
   //  this.background.setDepth(0);
  }

  private hammerHit(hammerElement: any): void {
    // console.log('hammerHit');
    if (hammerElement === true  && !this.hit.visible) {
      // console.log('hammerElement true');
        // TODO meldung von server, dass geschlagen wurde, hier soll anzeige dann geändert werden
      this.hit.setPosition(this.hammer.x, this.hammer.y);
      this.hit.setVisible(true);  // bild vom hammerschlag wird sichtbar
      this.time.addEvent({delay: 300, callback: () => this.hit.setVisible(false)});
      // TODO
      // this.fall();
    }
  }

  private shakeEvent(shakeElement: any): void {
    // console.log('shakeEvent');
    if (shakeElement === true) {
      // console.log('shakeEvent! -> true');
        // TODO meldung von server, dass geschlagen/geschüttelt wurde, hier soll anzeige dann geändert werden
        // TODO fortschrittsbalken (prio 2)
        // counter? im server?
        // fruit falls?
      // this.hammerHit(true);


      // TODO!
      //this.fall();
    }
  }

  private fallEvent(fallElement: any): void {
    // console.log('fallEvent');
    if (fallElement === true) {
      console.log('fallEvent -> true');
      // TODO meldung von server, dass genug geschüttelt wurde, damit eine frucht fallen kann
      // ingredient falls
      this.fall();
    }
  }

  private fall(): void {
    // TODO compare triggerFall branch
    console.log('fall() called');
    console.log('this.fallingObjectY = '+this.fallingObjectY);
    console.log('this.shakerContainerY = '+this.shakerContainerY);
    this.falling = true;
    // if (this.fallingObjectY < this.shakerContainerY && this.falling) {
    //   //this.keepFalling();

    //   this.fallingObjectY = this.fallingObjectY + 5;
    //   this.fallingObject.setPosition(this.fallingObjectX, this.fallingObjectY);
    //   //setTimeout(this.fall, 3000); // try again in 300 milliseconds

    // } else {
    //   console.log('object reached shaker (in fall() )');
    //   this.falling = false;
    //   // TODO event auslösen!
    // }
  }

  private keepFalling(): void  {
    console.log('keepFalling() called');
    // TODO compare triggerFall branch

    // console.log('increasing Y of object');
    // this.fallingObject.setPosition(this.shakeObjectX, updateY);
    // this.fallingObject.setVisible(true);
    if (this.fallingObjectY < this.shakerContainerY) {
      this.fallingObjectY = this.fallingObjectY + 10;
      this.fallingObject.setPosition(this.fallingObjectX, this.fallingObjectY);
      // setTimeout(this.keepFalling, 3000); // try again in 300 milliseconds
    } else {
      console.log('object reached shaker ( in keepFalling() )');
      this.falling = false;
      // TODO event an server schicken? anstatt selber auslösen...
      this.objectReachedShaker = true;
      //setTimeout(this.updateShakeObject, 300); // wait for 1 second and change tree
      this.strikethroughCatchedIngredient(this.randomShakingObjectNumber);
      this.updateShakeObject();
    }
  }

  private updateShakeObject(): void {
     if (this.objectReachedShaker == true) {
      console.log('updateShakeObject() called');
      this.shakeObject.destroy();                 //destroy old shake object
      this.fallingObject.destroy();
      this.shakeObjectX = this.initShakeObjectX,
      this.shakeObjectY = this.initShakeObjectY,
      this.fallingObjectX = this.initShakeObjectX,
      this.fallingObjectY = this.initShakeObjectY,

      this.randomShakingObjectNumber = Phaser.Math.Between(0,this.maxAmountOfFallingObjects);
      this.shakeObject = this.add.image(
        this.shakeObjectX,
        this.shakeObjectY,
        this.loadShakeObjectImage(this.randomShakingObjectNumber)
      );
      this.fallingObject = this.add.image(
        this.fallingObjectX,
        this.fallingObjectY,
        this.loadFallingObjectImage(this.randomShakingObjectNumber)
      );
      this.objectReachedShaker = false;
    }
  }

  private loadShakeObjectImage(randomShakingObjectNumber) {
    if (randomShakingObjectNumber == 0){
      return 'AppleTree'
    } else if (randomShakingObjectNumber == 1){
      return 'BananaTree'
    } else if (randomShakingObjectNumber == 2){
      return 'BerryTree'
    } 
  }
  private loadFallingObjectImage(randomShakingObjectNumber) {
    if (randomShakingObjectNumber == 0){
      return 'Apple'
    } else if (randomShakingObjectNumber == 1){
      return 'Banana'
    } else if (randomShakingObjectNumber == 2){
      return 'Berry'
    } 
  }

  private loadIngredientList(ingredientObjectNumber) {
    console.log("loadIngredientList started/ shakingObjectnumber: "+ingredientObjectNumber)
    while (ingredientObjectNumber <= this.maxAmountOfFallingObjects){
      this.fallingObject = this.add.image(
        this.ingredientOnListX,
        this.ingredientOnListY,
        this.loadFallingObjectImageTall(ingredientObjectNumber)
      );
      console.log("shakingObjectNumberInWhileLoop: "+ingredientObjectNumber)
      ingredientObjectNumber++;
      this.ingredientOnListY += 250;
      console.log("ingredientOnListY: "+this.ingredientOnListY)

    }
  }

  private loadFallingObjectImageTall(ingredientObjectNumber) {
    if (ingredientObjectNumber == 0){
      return 'AppleTall'
    } else if (ingredientObjectNumber == 1){
      return 'BananaTall'
    } else if (ingredientObjectNumber == 2){
      return 'BerryTall'
    } 
  }

  private strikethroughCatchedIngredient(currentShakeObjectNumber){
    console.log("strikethroughCatched called / currentShakeObjectNumber: "+currentShakeObjectNumber);
    this.ingredientOnListY = this.screenCenterY * 0.5;

    if (currentShakeObjectNumber == 0){
        this.strikethroughObject = this.add.image(
        this.ingredientOnListX,
        this.ingredientOnListY,
        'Strikethrough1'
        );
    } else if (currentShakeObjectNumber == 1){
        this.strikethroughObject = this.add.image(
        this.ingredientOnListX,
        this.ingredientOnListY+= 250,
        'Strikethrough2'
        );
    } else if (currentShakeObjectNumber == 2){
        this.strikethroughObject = this.add.image(
        this.ingredientOnListX,
        this.ingredientOnListY+= 250,
        'Strikethrough3'
        );
    }
  }

  
  private showGameOver(): void {
    this.hammer.destroy();
    this.mole.destroy();
    this.scoreText.destroy();
    // this.holes.destroy(true);
    this.shakeObject.destroy();
    // this.currentShakeObject.destroy();
    this.shakerContainer.destroy();
    this.fallingObject.destroy();
    const text = ['Game Over', 'You got: ' + this.score + ' Points'];
    this.add.bitmapText(this.screenCenterX, this.screenCenterY, 'pressStart', text, 32).setOrigin(0.5, 0.5).setCenterAlign();
  }

  update() {
    console.log('running');
    if (this.falling) {
      // test if working like that... not yet.
      this.keepFalling();
    }

  }

}



