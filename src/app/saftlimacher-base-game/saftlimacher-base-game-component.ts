import { verifyHostBindings } from '@angular/compiler';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { Component, destroyPlatform, OnDestroy, OnInit } from '@angular/core';
import Phaser from 'phaser';
import { SocketService } from '../socket-service/socket.service';
import Group = Phaser.GameObjects.Group;


export abstract class SaftlimacherBaseGameComponent implements OnInit, OnDestroy {

  // basic program setup
  public phaserGame: Phaser.Game;
  public config: Phaser.Types.Core.GameConfig;
  public building = false;
  public amountOfReadyPlayers = 0;

  // basic game setup
  public tutorial = true;
  public dots = 0;
  protected dotInterval;
  public countdown: number = 5;
  public gameOverCountdown: number = 0;
  public gameOver = false;

  protected socketService: SocketService;

  constructor(socketService: SocketService) {
    this.socketService = socketService;

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

    this.socketService.removeListener('levelData');
    this.socketService.removeListener('gameViewBuild');
    this.socketService.removeListener('controllerEndedTutorial');
    this.socketService.removeListener('countdown');
    this.socketService.removeListener('gameOverCountdown');
    this.socketService.removeListener('playing');
    this.socketService.removeListener('gameOver');

    this.socketService.removeListener('updateScore');
    this.socketService.removeListener('checkIngredientOnList');
    this.socketService.removeListener('adjustScoreByCatchedIngredient');
    this.removeGameSpecificListeners();

    clearInterval(this.dotInterval);
  }
  ngOnInit(): void {
    this.socketService.on('controllerEndedTutorial', () => { this.controllerReady(); });
    this.socketService.on('countdown', (number) => {
      this.countdown = number;
    });
    this.socketService.on('gameOverCountdown', (number) => {
      this.gameOverCountdown = number;
    });
    this.socketService.on('gameOver', (over) => this.gameOver = over);
    this.socketService.once('levelData', (levelData) => { this.buildGameView(levelData); });

    this.socketService.emit('displayReady');
  }

  private controllerReady(): void {
    this.amountOfReadyPlayers++;

    if (this.amountOfReadyPlayers === 2) {
      this.tutorial = false;
    }
  }

  private buildGameView(levelData): void {
    this.building = true;
    setTimeout(() => {
      this.startGameScene(levelData);
    }, 100);
  }

  abstract removeGameSpecificListeners(): void;
  abstract startGameScene(levelData): void;

}
