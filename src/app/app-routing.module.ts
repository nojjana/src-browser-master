import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {NotInLobbyComponent} from './not-in-lobby/not-in-lobby.component';


const routes: Routes = [
  { path: '', component: NotInLobbyComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
