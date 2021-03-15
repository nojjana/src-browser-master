import {Injectable} from '@angular/core';
import {Socket} from 'ngx-socket-io';
import {Program} from '../interfaces';
import {AppComponent} from '../app.component';
import {environment} from '../../environments/environment';
import {ToastrService} from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class SocketService extends Socket {
  private appComponent: AppComponent;
  private connected: boolean = false;

  constructor(private toastr: ToastrService) {
    super({url: environment.socketUrl, options: {autoConnect: true}});

    /* Redirects to the init-state */
    this.on('disconnect', () => {
      this.appComponent.setProgram(Program.NOT_IN_LOBBY);
      this.connected = false;
    });

    this.on('connect', () => {
      this.connected = true;
    });

    /* Changes the current program displayed by the application */
    this.on('currentProgram', (program: Program) => {
      if (this.appComponent != null) {
        this.appComponent.setProgram(program);
      }
    });

    this.on('wrongLobbyCode', () => {
     if (this.appComponent != null) {
       this.toastr.error('The game code is not valid', null, {positionClass: 'toast-bottom-center', tapToDismiss: false, timeOut: 7000});
     }
    });

    this.on('wentToMainMenuDueToControllerLeft', () => {
      this.toastr.error('Controller disconnected', null, {positionClass: 'toast-bottom-center', tapToDismiss: false, timeOut: 7000});
    });

    this.on('gameRunning', () => {
      if (this.appComponent != null) {
        this.toastr.error('Game is already running. Wait until the lobby is in the main menu.', null, {positionClass: 'toast-bottom-center', tapToDismiss: false, timeOut: 7000});
      }
    });
  }

  public setAppComponent(appComponent: AppComponent): void {
    this.appComponent = appComponent;
  }

  public isConnected(): boolean {
    return this.connected;
  }
}
