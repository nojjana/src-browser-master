import {Component, OnDestroy, OnInit} from '@angular/core';
import {MainMenuState} from '../interfaces';
import {SocketService} from '../socket-service/socket.service';

@Component({
  selector: 'app-main-menu',
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.css']
})
export class MainMenuComponent implements OnDestroy {
  public mainMenuState: MainMenuState;

  constructor(private socketService: SocketService) {
    /* Listener gets created, every time the program changes to MAIN_MENU */
    this.socketService.on('mainMenuState', (mainMenuState: MainMenuState) => {
      this.mainMenuState = mainMenuState;
    });

    this.socketService.emit('displayMainMenuReady');
  }

  /* Listener gets removed, once the program changes, so that later on there aren't two listeners */
  ngOnDestroy(): void {
    this.socketService.removeListener('mainMenuState');
  }

  showConnectControllerError(): void {
    alert('Connect with your phone to this game-lobby via the app as a controller. The controller then can navigate through the menu and select a game.');
  }
}
