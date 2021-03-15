import { Component, OnDestroy , OnInit } from '@angular/core';
import Phaser from 'phaser';
import {SocketService} from '../socket-service/socket.service';
import MainScene from '../labyrinth-game/labyrinth-game.component';

@Component({
  selector: 'app-spaceship-game',
  templateUrl: './spaceship-game.component.html',
  styleUrls: ['./spaceship-game.component.css']
})
export class SpaceshipGameComponent implements OnInit, OnDestroy {
  phaserGame: Phaser.Game;
  config: Phaser.Types.Core.GameConfig;
  public tutorial = true;
  public amountOfReadyPlayers = 0;
  private dotInterval;
  public dots = 0;
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
      backgroundColor: 0xFFFFFF,
      parent: 'gameContainer',
    };
  }

  ngOnDestroy() {
    if(this.phaserGame != null){
      this.phaserGame.destroy(true);
    }

    this.socketService.removeListener('spaceShipData');
    this.socketService.removeListener('updateSpaceShip');

    this.socketService.removeListener('controllerEndedTutorial');
    this.socketService.removeListener('gameOver');

    this.socketService.removeListener('countdown');

    clearInterval(this.dotInterval);
  }

  ngOnInit(): void {
    this.socketService.on('controllerEndedTutorial', () => {this.controllerReady();});
    this.socketService.once('spaceShipData', (spaceShipData) => {this.initSpaceShip(spaceShipData);});
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

  private initSpaceShip(spaceShipData): void {
    console.log('Now init Space ship');

    this.phaserGame = new Phaser.Game(this.config);
    this.phaserGame.scene.add('spaceScene', SpaceScene);
    this.phaserGame.scene.start('spaceScene', {socketService: this.socketService, spaceShipData: spaceShipData});
  }
}

export default class SpaceScene extends Phaser.Scene {
  private socketService: any;
  private spaceShip: Phaser.GameObjects.Image;
  private background: Phaser.GameObjects.TileSprite;
  private asteroid1: Phaser.GameObjects.Image;
  private asteroid2: Phaser.GameObjects.Image;
  private asteroid3: Phaser.GameObjects.Image;
  private asteroid4: Phaser.GameObjects.Image;
  private heart1: Phaser.GameObjects.Image;
  private heart2: Phaser.GameObjects.Image;
  private heart3: Phaser.GameObjects.Image;
  private scoreText: Phaser.GameObjects.BitmapText;
  private score: any;
  private finalScore: any;
  private finished = false;
  private screenCenterX: number;
  private screenCenterY: number;


  constructor() {
    super({ key: 'spaceScene' });
  }

  preload() {
    this.load.image('Ship', '../../assets/spaceship/ufoGreen.png');
    this.load.image('Meteor1', '../../assets/spaceship/meteorBrown_big1.png');
    this.load.image('Meteor2', '../../assets/spaceship/meteorBrown_big2.png');
    this.load.image('Meteor3', '../../assets/spaceship/meteorBrown_big3.png');
    this.load.image('Meteor4', '../../assets/spaceship/meteorBrown_big4.png');
    this.load.image('Background', '../../assets/spaceship/blue.png');
    this.load.image('Heart', '../../assets/Heart.png');
    this.load.bitmapFont('pressStart', '../../assets/font/PressStartWhite.png', '../../assets/font/PressStartWhite.fnt');
  }

  create(data) {
    this.socketService = data.socketService;
    const initData = data.spaceShipData;
    this.screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
    this.screenCenterY = this.cameras.main.worldView.y + this.cameras.main.height / 2;

    this.createBackground();
    this.createHearts();
    this.scoreText = this.add.bitmapText(this.screenCenterX, 32, 'pressStart', 'score: 0', 32)
      .setOrigin(0.5)
      .setDepth(100);

    this.spaceShip = this.add.image(initData[0], initData[1], 'Ship');
    this.asteroid1 = this.add.image(initData[2], initData[3], 'Meteor1');
    this.asteroid2 = this.add.image(initData[4], initData[5], 'Meteor1');
    this.asteroid3 = this.add.image(initData[6], initData[7], 'Meteor1');
    this.asteroid4 = this.add.image(initData[8], initData[9], 'Meteor1');


    this.socketService.on('updateSpaceShip', updateData => {
      this.spaceShip.setPosition(updateData[0], updateData[1]);
      this.asteroid1.setPosition(updateData[2], updateData[3]);
      this.asteroid2.setPosition(updateData[4], updateData[5]);
      this.asteroid3.setPosition(updateData[6], updateData[7]);
      this.asteroid4.setPosition(updateData[8], updateData[9]);
      this.asteroid1.rotation += 0.01;
      this.asteroid2.rotation -= 0.01;
      this.asteroid3.rotation -= 0.01;
      this.asteroid4.rotation += 0.01;
      this.scoreText.setText('Score: ' + updateData[10]);
      this.score = updateData[10];
      switch (updateData[11]) {
        case 2: { this.heart1.setVisible(false); break; }
        case 1: { this.heart2.setVisible(false); break; }
        case 0: { this.heart3.setVisible(false);
                  this.showGameOver();
                  break; }
        default: { break; }
      }
    });

    this.socketService.once('gameOver', () => {
      console.log('gameOver');
      this.showGameOver();
    });

    this.socketService.emit('spaceShipBuild');
  }

  private createBackground(): void {
    this.background = this.add.tileSprite(0, 0, 2 * this.game.canvas.width, 2 * this.game.canvas.height, 'Background');
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

  private showGameOver(): void {
    if (!this.finished) {
      this.finalScore = this.score;
      this.spaceShip.destroy();
      this.asteroid1.destroy();
      this.asteroid2.destroy();
      this.asteroid3.destroy();
      this.asteroid4.destroy();
      this.scoreText.destroy();
      const text = ['Game Over', 'You got: ' + this.finalScore + ' Points'];
      this.add.bitmapText(this.screenCenterX, this.screenCenterY, 'pressStart', text, 80).setOrigin(0.5, 0.5).setCenterAlign();
      this.finished = true;
    }
  }

  update() {
    console.log('update');
    this.background.tilePositionY -= 0.5;
  }

}


