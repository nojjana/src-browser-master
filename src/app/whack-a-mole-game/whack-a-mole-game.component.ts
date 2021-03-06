import {Component, OnDestroy, OnInit} from '@angular/core';
import Phaser from 'phaser';
import {SocketService} from '../socket-service/socket.service';
import Group = Phaser.GameObjects.Group;


@Component({
  selector: 'app-whack-a-mole-game',
  templateUrl: './whack-a-mole-game.component.html',
  styleUrls: ['./whack-a-mole-game.component.css']
})
export class WhackAMoleGameComponent implements OnInit, OnDestroy {
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
        height: 572,
        width: 640,
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

    this.socketService.removeListener('whackData');
    this.socketService.removeListener('updateHammer');

    this.socketService.removeListener('controllerEndedTutorial');
    this.socketService.removeListener('gameOver');

    this.socketService.removeListener('countdown');

    clearInterval(this.dotInterval);
  }

  ngOnInit(): void {
    this.socketService.on('controllerEndedTutorial', () => {this.controllerReady();});
    this.socketService.once('whackData', (whackData) => {this.initWhack(whackData);});
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

  private initWhack(whackData): void {
    console.log('Now init Whack');
    this.building = true;
    setTimeout(() => {
      this.phaserGame = new Phaser.Game(this.config);
      this.phaserGame.scene.add('whackScene', WhackScene);
      this.phaserGame.scene.start('whackScene', {socketService: this.socketService, whackData: whackData});
    }, 100);
  }
}

export default class WhackScene extends Phaser.Scene {
  private socketService: any;
  private pixelSize = 128;
  private halfPixelSize = this.pixelSize / 2;
  private mole: Phaser.GameObjects.Image;
  private hammer: Phaser.GameObjects.Image;
  private scoreText: Phaser.GameObjects.BitmapText;
  private score: any;
  private holes: Phaser.GameObjects.Group;
  private hit: Phaser.GameObjects.Image;
  private screenCenterX: number;
  private screenCenterY: number;
  private background: Phaser.GameObjects.TileSprite;


  constructor() {
    super({ key: 'whackScene' });
  }

  preload() {
    this.load.image('Mole', '../../assets/whack-a-mole/Mole.png');
    this.load.image('MoleHole', '../../assets/whack-a-mole/Mole Hole transparent.png');
    this.load.image('HammerArea', '../../assets/whack-a-mole/HammerArea.png');
    this.load.image('HammerHit', '../../assets/whack-a-mole/HammerHit.png');
    this.load.image('Grass', '../../assets/whack-a-mole/Grass.png');
    this.load.bitmapFont('pressStart', '../../assets/font/PressStartWhite.png', '../../assets/font/PressStartWhite.fnt');
  }

  create(data) {
    this.socketService = data.socketService;
    const whackData = data.whackData;
    this.screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
    this.screenCenterY = this.cameras.main.worldView.y + this.cameras.main.height / 2;

    this.createBackground(whackData[1], whackData[0]);
    this.hammer = this.add.image(
      whackData[2],
      whackData[3],
      'HammerArea'
    );
    this.hammer.setDepth(3);
    this.hit = this.add.image(
      whackData[2],
      whackData[3],
      'HammerHit'
    );
    this.hit.setVisible(false);
    this.hit.setDepth(3);
    this.mole = this.add.image(
        whackData[4],
        whackData[5],
      'Mole'
    );
    this.mole.setDepth(2);

    this.scoreText = this.add.bitmapText(this.screenCenterX, 540, 'pressStart', 'Score: 0', 32)
      .setOrigin(0.5)
      .setDepth(100);

    this.socketService.on('updateHammer', (hammer) => {
      this.hammer.setPosition(hammer[0], hammer[1]);
      this.mole.setPosition(hammer[2], hammer[3]);
      this.hammerHit(hammer[4]);
      this.scoreText.setText('Score: ' + hammer[5]);
      this.score = hammer[5];
    });

    this.socketService.on('gameOver', finished => {
      if (finished === true) {
        this.showGameOver();
      }
    });

    this.socketService.emit('whackAMoleBuild');
  }

  private createBackground(height: number, width: number): void {
    this.holes = new Group(this);
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        this.holes.add(this.add.image(this.halfPixelSize + j * this.pixelSize, this.halfPixelSize + i * this.pixelSize, 'MoleHole')
          .setDepth(1));
      }
    }
    // this.background = this.add.tileSprite(0, 0, 2 * this.game.canvas.width, 2 * this.game.canvas.height, 'Grass');
   //  this.background.setDepth(0);
  }

  private hammerHit(hammerElement: any): void {
    if (hammerElement === true  && !this.hit.visible) {
      this.hit.setPosition(this.hammer.x, this.hammer.y);
      this.hit.setVisible(true);
      this.time.addEvent({delay: 300, callback: () => this.hit.setVisible(false)});
    }
  }

  private showGameOver(): void {
    this.hammer.destroy();
    this.mole.destroy();
    this.scoreText.destroy();
    this.holes.destroy(true);
    const text = ['Game Over', 'You got: ' + this.score + ' Points'];
    this.add.bitmapText(this.screenCenterX, this.screenCenterY, 'pressStart', text, 32).setOrigin(0.5, 0.5).setCenterAlign();
  }

  update() {
    console.log('running');
  }

}
