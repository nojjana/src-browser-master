export enum Program {
  NOT_IN_LOBBY,
  MAIN_MENU,
  LABYRINTH,
  SPACESHIP,
  WHACK_A_MOLE,
  SHAKER,
  CATCHER,
  VARIANZ_TEST,
  LAST_TEST
}

export interface MainMenuState {
  lobbyCode: number;
  displays: number;
  controllers: number;
  selectedGame: number;
  games: string[];
}
