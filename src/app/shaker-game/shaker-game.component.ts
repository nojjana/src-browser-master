import { verifyHostBindings } from '@angular/compiler';
import { Component, OnDestroy, OnInit } from '@angular/core';
import Phaser from 'phaser';
import { SocketService } from '../socket-service/socket.service';
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
      //backgroundColor: 0x0cb010,
      transparent: true,
      parent: 'gameContainer'
    };
  }


  ngOnDestroy() {
    if (this.phaserGame != null) {
      this.phaserGame.destroy(true);
    }

    this.socketService.removeListener('shakerData');
    this.socketService.removeListener('updateHammer');
    this.socketService.removeListener('updateShaking');

    this.socketService.removeListener('changeShakeObject');
    this.socketService.removeListener('updateFall');
    // this.socketService.removeListener('updateScore');

    this.socketService.removeListener('controllerEndedTutorial');
    this.socketService.removeListener('gameOver');

    this.socketService.removeListener('countdown');

    clearInterval(this.dotInterval);
  }

  ngOnInit(): void {
    this.socketService.on('controllerEndedTutorial', () => { this.controllerReady(); });
    this.socketService.once('shakerData', (shakerData) => { this.initShaker(shakerData); });
    this.socketService.on('countdown', (number) => this.countdown = number);

    this.socketService.emit('displayReady');
  }

  private controllerReady(): void {
    this.amountOfReadyPlayers++;

    if (this.amountOfReadyPlayers === 2) {
      this.tutorial = false;
      console.log('Finished tutorial');
    }
  }

  private initShaker(shakerData): void {
    console.log('Now init Shaker');
    this.building = true;
    setTimeout(() => {
      this.phaserGame = new Phaser.Game(this.config);
      this.phaserGame.scene.add('shakerScene', ShakerScene);
      this.phaserGame.scene.start('shakerScene', { socketService: this.socketService, shakerData: shakerData });
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
  private ingredientOnShakeObject: Phaser.GameObjects.Image;
  private ingredientFalling: Phaser.GameObjects.Image;
  private ingredientInShaker: Phaser.GameObjects.Image;
  private oldIngredientInShaker: Phaser.GameObjects.Image;
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
  private ingredientOnShakeObjectX: number;
  private ingredientOnShakeObjectY: number;
  private ingredientFallingX: number;
  private ingredientFallingY: number;
  private shakerContainerX: number;
  private shakerContainerY: number;
  private background: Phaser.GameObjects.TileSprite;
  private currentShakeObjectNumber = null;
  private oldShakeObjectNumber = null;
  private numberOfShakingObjects = 2;
  private shakingObjectList: Array<number>;

  private currentRandomShakingObjectNumber = Phaser.Math.Between(0, 2);
  private objectReachedShaker = false;
  private falling = false;
  private speedOfFalling: number = 12;  //+ y delta

  //TODO
  private beeHouse: Phaser.GameObjects.Image;
  private fallingObject: Phaser.GameObjects.Image;

  private maxAmountOfFallingObjects = 2;
  private randomShakingObjectNumber = Phaser.Math.Between(0,this.maxAmountOfFallingObjects);
  private shakingObjectNumber = 0;

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
    
    this.load.bitmapFont('pressStartWhite', '../../assets/font/PressStartWhite.png', '../../assets/font/PressStartWhite.fnt');
    this.load.bitmapFont('pressStartBlack', '../../assets/font/PressStart.png', '../../assets/font/PressStart.fnt');
    
    this.load.image('BeeHome', '../../assets/shaker/ShakeObject-BeeHome.png');
    this.load.image('FallingObject', '../../assets/shaker/Apple.png');
    
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
    this.progressbarX = this.screenCenterX * 1.6;
    this.progressbarY = this.screenCenterY * 0.2;

    // TODO create own background
    this.createBackground(shakerData[1], shakerData[0]);
    this.background.setVisible(false);
    this.holes.setVisible(false);

    //this.initShakeObjects;
    //this.generateShakeObject();
    //this.createGameObject();
    //this.generateShakeObjectList(this.shakingObjectList);


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
      this.shakerContainerX,
      this.shakerContainerY,
      this.loadIngredientImage(this.currentRandomShakingObjectNumber)
    );
    this.ingredientInShaker.setDepth(78);
    this.ingredientInShaker.setVisible(false);

    this.oldIngredientInShaker = this.add.image(
      this.shakerContainerX,
      this.shakerContainerY,
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

    this.scoreText = this.add.bitmapText(this.screenCenterX, 550, 'pressStartBlack', 'Punkte: 0', 16)
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
      this.scoreText.setText('Punkte: ' + hammer[5]);
      this.score = hammer[5];
    });

    this.socketService.on('updateShaking', (isShaking) => {
      this.shakeEffect(isShaking);
    });

    this.socketService.on('updateFall', (triggerFall) => {
      if (triggerFall === true) {
        this.triggerFallOfIngredient();
      }
      //this.fallEvent(fallEvent[0]);
    });

    // this.socketService.on('updateScore', (scoreEvent) => {
    //   this.scoreText.setText('Score: ' + scoreEvent);
    //   this.score = scoreEvent;
    // });

    this.socketService.on('changeShakeObject', (doChangeShakeObject) => {
      // TODO: event muss ggf gar nicht vom server kommen, da's in der view (browser) passiert?
      // sollte aber. matter collision?
      // evtl sollte browser melden dass objekt angekommen ist (geht das??) und server gibt dann den befehlt zum wechseln?
      // this.changeShakeObject();
      // this.objectReachedShaker = doChangeShakeObject;
      if (doChangeShakeObject === true) {
        this.updateShakeObject();
      }
    });

    this.socketService.on('gameOver', finished => {
      if (finished === true) {
        this.showGameOver();
      }
    });

    this.socketService.emit('shakerBuild');
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
      this.hit.setVisible(true);  // bild vom hammerschlag wird sichtbar
      this.time.addEvent({ delay: 300, callback: () => this.hit.setVisible(false) });
    }
  }

  private shakeEffect(isShaking: boolean): void {
    // meldung von server, ob geschlagen/geschüttelt wurde, hier view effekte zeigen
    if (isShaking === true) {
      console.log('Shaking');
      // TODO: make tree shake
      //this.shakeEffectOnPlant = true;
    }
  }

  private updateProgressBar(shakeScore: number): void {
    // TODO fortschrittsbalken
  }

  private triggerFallOfIngredient(): void {
    console.log('Ingredient falls!');

    // TODO: more than one ingredient should be falling - how?
    this.prepareFallingIngredient(this.currentRandomShakingObjectNumber);
    this.falling = true;
    setTimeout(() => { this.regrowIngredient(this.currentRandomShakingObjectNumber); }, 300);

  }

  private prepareFallingIngredient(shakingObjectNumber: number) {
    if (this.ingredientOnShakeObject != null) {
      this.ingredientOnShakeObject.destroy();
    }

    this.ingredientFallingX = this.initShakeObjectX,
      this.ingredientFallingY = this.initShakeObjectY,
      this.ingredientFalling = this.add.image(
        this.ingredientFallingX,
        this.ingredientFallingY,
        this.loadIngredientImage(shakingObjectNumber)
      );
    this.ingredientFalling.setDepth(88);
    this.ingredientFalling.setVisible(true);
  }

  private keepFalling(): void {
    if (this.ingredientFallingY < this.shakerContainerY - 10) {
      this.ingredientFallingY = this.ingredientFallingY + this.speedOfFalling;
      this.ingredientFalling.setPosition(this.ingredientFallingX, this.ingredientFallingY);
      // setTimeout(this.keepFalling, 3000); // try again in 300 milliseconds
    } else {
      console.log('Ingredient fell into shaker!');
      this.falling = false;
      // TODO event an server schicken? anstatt selber auslösen...
      this.objectReachedShaker = true;

      this.updateIngredientInShaker(this.currentRandomShakingObjectNumber);
      
      //todo
      //this.strikethroughCatchedIngredient(this.randomShakingObjectNumber);
      //this.updateShakeObject();
    }
  }

  private updateIngredientInShaker(shakingObjectNumber: number): void {
    //  console.log('updateIngredientInShaker() called');

    if (this.oldIngredientInShaker != null) {
      this.oldIngredientInShaker.destroy();
    }

    if (this.ingredientInShaker != null) {
      this.oldIngredientInShaker = this.ingredientInShaker;
      this.oldIngredientInShaker.setDepth(85);
      // this.ingredientInShaker.destroy();
    }

    if (this.ingredientFalling != null) {
      this.ingredientInShaker = this.ingredientFalling;
      this.ingredientInShaker.setPosition(this.ingredientFallingX, this.ingredientFallingY);

      // TODO: how to get image (bzw. number) of falling ingredient? (may change in the meantime! timer...)
      // this.ingredientInShaker = this.add.image(
      //   this.shakerContainerX,
      //   this.shakerContainerY,
      //   this.loadIngredientImage(shakingObjectNumber)
      // );
      this.ingredientInShaker.setDepth(87);
      this.ingredientInShaker.setVisible(true);

      // this.ingredientFalling.destroy();
    }

  }

  private regrowIngredient(shakingObjectNumber: number): void {
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

  private updateShakeObject(): void {
    // if (this.objectReachedShaker == true) {
      console.log('Here comes another plant.');

      this.oldShakeObjectNumber = this.currentRandomShakingObjectNumber;
      this.currentRandomShakingObjectNumber = Phaser.Math.Between(0, 2);
      while (this.oldShakeObjectNumber == this.currentRandomShakingObjectNumber) {
        // avoid changing to the same shakeObject (i.e. 2x apple tree)
        this.currentRandomShakingObjectNumber = Phaser.Math.Between(0, 2);
      }


    if (this.shakeObject != null) {
      this.shakeObject.destroy();                 //destroy old shake object
    }
      this.shakeObjectX = this.initShakeObjectX,
      this.shakeObjectY = this.initShakeObjectY,
      
      //TODO
      //this.fallingObjectX = this.initShakeObjectX,
      //this.fallingObjectY = this.initShakeObjectY,
       //      this.randomShakingObjectNumber = Phaser.Math.Between(0,this.maxAmountOfFallingObjects);

      
      this.shakeObject = this.add.image(
        this.shakeObjectX,
        this.shakeObjectY,
        this.loadShakeObjectImage(this.currentRandomShakingObjectNumber)
      );
      this.shakeObject.setDepth(70);

      this.regrowIngredient(this.currentRandomShakingObjectNumber);

      // this.objectReachedShaker = false;
    // }
  }

  private loadShakeObjectImage(randomShakingObjectNumber) {
    if (randomShakingObjectNumber == 0) {
      return 'AppleTree'
    } else if (randomShakingObjectNumber == 1) {
      return 'BananaTree'
    } else if (randomShakingObjectNumber == 2) {
      return 'BerryTree'
    } 
  }
  private loadIngredientImage(randomShakingObjectNumber) {
    if (randomShakingObjectNumber == 0) {
      return 'Apple'
    } else if (randomShakingObjectNumber == 1) {
      return 'Banana'
    } else if (randomShakingObjectNumber == 2) {
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
    this.holes.destroy(true);
    this.shakeObject.destroy();
    // this.currentShakeObject.destroy();
    this.shakerContainer.destroy();
    this.ingredientOnShakeObject.destroy();
    this.ingredientInShaker.destroy();
    this.oldIngredientInShaker.destroy();
    if (this.ingredientFalling != null) {
      this.ingredientFalling.destroy();
    }
    const text = ['Der Saft ist fertig!', 'Gesammelte Punkte: ' + this.score, 'Das macht ' + this.getNumberOfGlasses(this.score) + ' Portionen. Toll!'];
    this.add.bitmapText(this.screenCenterX, this.screenCenterY, 'pressStartBlack', text, 16).setOrigin(0.5, 0.5).setCenterAlign();
  }

  private getNumberOfGlasses(score: number) {
    // TODO: rechnung server überlassen!
    let glasses = score / 100;
    return glasses.toString();

  }

  update() {
    console.log('running');
    if (this.falling) {
      this.keepFalling();
    }
    if (this.objectReachedShaker) {
      // console.log('objectReachedShaker. in update()');
      // do sth here? or just send to server as soon as set true?
      this.objectReachedShaker = false;
    }

  }

}



