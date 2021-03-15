import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LabyrinthGameComponent } from './labyrinth-game/labyrinth-game.component';
import { SocketService } from './socket-service/socket.service';
import { NotInLobbyComponent } from './not-in-lobby/not-in-lobby.component';
import { MainMenuComponent } from './main-menu/main-menu.component';
import { SpaceshipGameComponent } from './spaceship-game/spaceship-game.component';
import { WhackAMoleGameComponent } from './whack-a-mole-game/whack-a-mole-game.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatButtonModule} from '@angular/material/button';
import {MatInputModule} from '@angular/material/input';
import {FormsModule} from '@angular/forms';
import {ToastrModule} from 'ngx-toastr';
import { VarianzTestComponent } from './varianz-test/varianz-test.component';

@NgModule({
  declarations: [
    AppComponent,
    LabyrinthGameComponent,
    NotInLobbyComponent,
    MainMenuComponent,
    SpaceshipGameComponent,
    WhackAMoleGameComponent,
    VarianzTestComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    MatButtonModule,
    MatInputModule,
    FormsModule,
    ToastrModule.forRoot()
  ],
  providers: [SocketService],
  bootstrap: [AppComponent]
})
export class AppModule { }
