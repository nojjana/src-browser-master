import {Component} from '@angular/core';
import {SocketService} from './socket-service/socket.service';
import {Program} from './interfaces';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'SRC';
  /* Default Program */
  public program: Program = Program.NOT_IN_LOBBY;
  public Program = Program;

  constructor(private socketService: SocketService) {
    socketService.setAppComponent(this);
  }

  /* Sets the current program */
  public setProgram(program: Program) {
    this.program = program;
  }
}
