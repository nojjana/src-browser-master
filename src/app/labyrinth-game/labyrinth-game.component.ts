import {Component, OnDestroy, OnInit} from '@angular/core';
import Phaser from 'phaser';
import {SocketService} from '../socket-service/socket.service';
import Group = Phaser.GameObjects.Group;
@Component({
  selector: 'app-labyrinth-game',
  templateUrl: './labyrinth-game.component.html',
  styleUrls: ['./labyrinth-game.component.css']
})
export class LabyrinthGameComponent implements OnInit, OnDestroy {
  phaserGame: Phaser.Game;
  config: Phaser.Types.Core.GameConfig;
  public tutorial = true;
  public amountOfReadyPlayers = 0;
  public dots = 0;
  private dotInterval: any;
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
        height: 1080,
        width: 1920,
      },
      backgroundColor: 0xAAAAAA,
      parent: 'gameContainer'
    };
  }

  ngOnDestroy() {
    if(this.phaserGame != null){
      this.phaserGame.destroy(true);
    }

    this.socketService.removeListener('labyrinthData');
    this.socketService.removeListener('updateLabyrinth');

    this.socketService.removeListener('controllerEndedTutorial');
    this.socketService.removeListener('gameOver');

    this.socketService.removeListener('countdown');

    clearInterval(this.dotInterval);
  }

  ngOnInit() {
    this.socketService.on('controllerEndedTutorial', () => {this.controllerReady();});
    this.socketService.once('labyrinthData', (labyrinthData) => {this.initLabyrinth(labyrinthData);});

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

  private initLabyrinth(labyrinthData): void {
    console.log('Now init Labyrinth');

    this.phaserGame = new Phaser.Game(this.config);
    this.phaserGame.scene.add('mainScene', MainScene);
    this.phaserGame.scene.start('mainScene', {socketService: this.socketService, labyrinthData: labyrinthData});
  }
}

export default class MainScene extends Phaser.Scene {
  private socketService: any;
  private ball: Phaser.GameObjects.Image;
  private heart1: Phaser.GameObjects.Image;
  private heart2: Phaser.GameObjects.Image;
  private heart3: Phaser.GameObjects.Image;
  private background: Phaser.GameObjects.TileSprite;
  private holes: Phaser.GameObjects.Group;
  private walls: Phaser.GameObjects.Group;
  private finishField: Phaser.GameObjects.Sprite;
  private screenCenterX: number;
  private screenCenterY: number;

  constructor() {
    super({ key: 'mainScene' });
  }

  preload() {
    this.load.image('Wall', '../../assets/labyrinth/Wall.png');
    this.load.image('Hole', '../../assets/labyrinth/Loch.png');
    this.load.image('Ball', '../../assets/labyrinth/Kugel.png');
    this.load.image('Floor', '../../assets/labyrinth/Floor.png');
    this.load.image('Noise Floor', '../../assets/labyrinth/laby noise floor.png');
    this.load.image('FinishField', '../../assets/labyrinth/FinishFlag.png');
    this.load.image('Heart', '../../assets/Heart.png');
    this.load.bitmapFont('pressStart', '../../assets/font/PressStartWhite.png', '../../assets/font/PressStartWhite.fnt');
  }

  create(data) {
    this.socketService = data.socketService;
    this.screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
    this.screenCenterY = this.cameras.main.worldView.y + this.cameras.main.height / 2;
    this.socketService.on('updateLabyrinth', (circle) => {
      this.ball.setPosition(circle[0], circle[1]);
      switch (circle[2]) {
        case 2: { this.heart1.setVisible(false); break; }
        case 1: { this.heart2.setVisible(false); break; }
        case 0: { this.heart3.setVisible(false); break; }
        default: { break; }
      }
    });

    this.createBackground();
    this.createLabyrinth(data.labyrinthData);
    this.createHearts();

    this.socketService.once('gameOver', (win) => {
      console.log('gameOver');
      if (win) {
        this.showWin();
      } else {
        this.showGameOver();
      }
    });

    this.socketService.emit('labyrinthBuild');
  }

  private createBackground(): void {
    this.background = this.add.tileSprite(0, 0, 2 * this.game.canvas.width, 2 * this.game.canvas.height, 'Noise Floor');
    this.background.scale = 2;
  }

  private createLabyrinth(labyrinthData: number[]): void {
    this.walls = new Group(this);
    while (labyrinthData.length !== 0 && labyrinthData[0] !== -1) {
      const wallData = labyrinthData.splice(0, 4);
      const wall = this.add.sprite(wallData[0] , wallData[1] , 'Wall');
      wall.setDisplaySize(wallData[2], wallData[3]);
      this.walls.add(wall);
    }

    labyrinthData.splice(0, 1);

    this.holes = new Group(this);
    while (labyrinthData.length !== 0 && labyrinthData[0] !== -1) {
      const holeData = labyrinthData.splice(0, 3);
      const hole = this.add.sprite(holeData[0], holeData[1], 'Hole');
      hole.setDisplaySize(holeData[2] * 3.8, holeData[2] * 3.8);
      this.holes.add(hole);
    }

    labyrinthData.splice(0, 1);
    const finishFieldData = labyrinthData.splice(0, 4);

    this.finishField = this.add.sprite(finishFieldData[0], finishFieldData[1], 'FinishField');
    this.finishField.setDisplaySize(finishFieldData[2], finishFieldData[3]);

    const ballData = labyrinthData.splice(0, 3);

    this.ball = this.add.image(ballData[0], ballData[1], 'Ball');
    this.ball.setDisplaySize(ballData[2] * 2, ballData[2] * 2);
  }

  private createHearts(): void {
    const heartXPos = 1700;
    const heartYPos = 32;
    this.heart1 = this.add.image(heartXPos, heartYPos, 'Heart');
    this.heart2 = this.add.image(heartXPos + 32, heartYPos, 'Heart');
    this.heart3 = this.add.image(heartXPos + 64, heartYPos, 'Heart');
    this.heart1.setDepth(1000);
    this.heart2.setDepth(1000);
    this.heart3.setDepth(1000);
  }

  private destroyAssets(): void {
    this.background.destroy();
    this.ball.destroy();
    this.holes.destroy(true);
    this.walls.destroy(true);
    this.finishField.destroy();
  }

  private showGameOver(): void {
    this.destroyAssets();
    const text = 'Game Over';
    this.add.bitmapText(this.screenCenterX, this.screenCenterY, 'pressStart', text, 80).setOrigin(0.5, 0.5).setCenterAlign();
  }

  private showWin(): void {
    this.destroyAssets();
    this.heart1.destroy();
    this.heart2.destroy();
    this.heart3.destroy();
    const text = ['Congratulation!', 'You Won'];
    this.add.bitmapText(this.screenCenterX, this.screenCenterY, 'pressStart', text, 80).setOrigin(0.5, 0.5).setCenterAlign();
  }


  update() {
    console.log('update method');
  }
}



