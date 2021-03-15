import {Component, OnDestroy, OnInit} from '@angular/core';
import Phaser from 'phaser';
import {SocketService} from '../socket-service/socket.service';
import Group = Phaser.GameObjects.Group;
import { ExportToCsv } from 'export-to-csv';

@Component({
  selector: 'app-varianz-test',
  templateUrl: './varianz-test.component.html',
  styleUrls: ['./varianz-test.component.css']
})
export class VarianzTestComponent implements OnInit, OnDestroy {
  phaserGame: Phaser.Game;
  config: Phaser.Types.Core.GameConfig;
  public tutorial = true;
  public amountOfReadyPlayers = 0;
  public dots = 0;
  private dotInterval;

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
    clearInterval(this.dotInterval);
  }

  ngOnInit() {
    this.socketService.on('controllerEndedTutorial', () => {this.controllerReady(); });
    this.socketService.once('labyrinthData', (labyrinthData) => {this.initLabyrinth(labyrinthData); });

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
    this.phaserGame.scene.start('mainScene', {socketService: this.socketService, labyrinthData});
  }
}

export default class MainScene extends Phaser.Scene {
  private socketService: any;
  private ball: Phaser.GameObjects.Image;
  private background: Phaser.GameObjects.TileSprite;
  private holes: Phaser.GameObjects.Group;
  private walls: Phaser.GameObjects.Group;
  private finishField: Phaser.GameObjects.Sprite;
  private style = { font: '160px Arial', fill: '#000000', align: 'center' };
  private frames = 0;
  private framesArr = [];

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
  }

  create(data) {
    this.socketService = data.socketService;
    this.socketService.on('updateLabyrinth', (circle) => {
      this.ball.setPosition(circle[0], circle[1]);
      this.frames++;
    });

    this.createBackground();
    this.createLabyrinth(data.labyrinthData);

    this.socketService.once('gameOver', (win) => {
      console.log('gameOver');
      if (win) {
        this.showWin();
      } else {
        this.showGameOver();
      }
    });

    this.socketService.emit('labyrinthBuild');

    setInterval(() => {
      console.log(this.frames);
      this.framesArr.push({frames: this.frames, second: this.framesArr.length + 1});
      this.frames = 0;
    }, 1000);

    setTimeout(() => {
      this.downloadFile();
    }, 180000);
  }

  private createBackground(): void {
    this.background = this.add.tileSprite(0, 0, 2 * this.game.canvas.width, 2 * this.game.canvas.height, 'Noise Floor');
    this.background.scale = 2;
  }

  downloadFile() { 
    const options = { 
      fieldSeparator: ',',
      quoteStrings: '"',
      decimalSeparator: '.',
      showLabels: true, 
      useTextFile: false,
      useBom: true,
      useKeysAsHeaders: true,
    };
    const csvExporter = new ExportToCsv(options);
    csvExporter.generateCsv(this.framesArr);
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
    this.add.text(this.game.canvas.width / 5, (this.game.canvas.height / 3), text, this.style);
  }

  private showWin(): void {
    this.destroyAssets();
    const text = ['Congratulation!', 'You Won'];
    this.add.text(this.game.canvas.width / 5, (this.game.canvas.height / 3), text, this.style);
  }


  update() {
  }
}
