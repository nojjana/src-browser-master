import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import {SocketService} from '../socket-service/socket.service';

@Component({
  selector: 'app-not-in-lobby',
  templateUrl: './not-in-lobby.component.html',
  styleUrls: ['./not-in-lobby.component.css']
})
export class NotInLobbyComponent implements OnDestroy{
  public joinLobbyCode: string = "";
  public dots: number = 0;
  private dotInterval;
  public lobbyCreated = false;

  constructor(public socketService: SocketService) {
    this.dotInterval = setInterval(() => {
      this.dots++;
      if (this.dots === 4) {
        this.dots = 0;
      }
    }, 500);

    // TODO testing: skip "Spielen" button, create lobby automatically as soon as connected
    setInterval(() => {
      if (this.socketService.isConnected() && !this.lobbyCreated) {
        this.createLobby();
        this.lobbyCreated = true;
      }
    }, 3000);

  }

  /* Sends a request to create a lobby to the server */
  public createLobby(): void {
    this.socketService.emit('createLobby');
    // TODO testing: no full screen
    // this.toggleFullscreen();
  }

  private toggleFullscreen(): void {
    const docElmWithBrowsersFullScreenFunctions = document.documentElement as HTMLElement & {
      mozRequestFullScreen(): Promise<void>;
      webkitRequestFullscreen(): Promise<void>;
      msRequestFullscreen(): Promise<void>;
    };

    if (docElmWithBrowsersFullScreenFunctions.requestFullscreen) {
      docElmWithBrowsersFullScreenFunctions.requestFullscreen();
    } else if (docElmWithBrowsersFullScreenFunctions.mozRequestFullScreen) {
      docElmWithBrowsersFullScreenFunctions.mozRequestFullScreen();
    } else if (docElmWithBrowsersFullScreenFunctions.webkitRequestFullscreen) {
      docElmWithBrowsersFullScreenFunctions.webkitRequestFullscreen();
    } else if (docElmWithBrowsersFullScreenFunctions.msRequestFullscreen) {
      docElmWithBrowsersFullScreenFunctions.msRequestFullscreen();
    }
  }

  /* Sends a request to join a lobby to the server */
  public joinLobby(): void {
    this.socketService.emit('displayJoinsLobby', parseInt(this.joinLobbyCode, 0));
    this.toggleFullscreen();
  }

  ngOnDestroy(): void {
    clearInterval(this.dotInterval);
  }
}
