# Mobile Front End of Shared Remote Controller (SRC)

This project is one of three projects of the shared remote controller platform. It is responsible for displaying the starting page, the game lobby and the games.
It was generated with [Angular CLI](https://github.com/angular/angular-cli) version 9.0.5.
The starting page and the lobby are built with Angular and the games are Rendered with [Phaser.io](https://phaser.io/).
The image below shows, how the projects works together. The browser front end is displaying the platform and rendering the games. The game server sends update events to the browser front end. The game server receives sensor data from the mobile front end. It computes the games with this data. Furthermore the game server handles the websocket connections and is responsible for the lobby management.

![Image of the SRC Platform](https://github.com/andreasumbricht/src-browser/blob/master/src/assets/Plattform%20Aufbau.PNG)

## Installation
### Environment
First, you must install node, npm and Angular. The exact steps to install node and npm are platform dependent. 

You can install Angular with this [tutorial](https://cli.angular.io/).

The project was written with the following versions:
| Name          | Version        |
| ------------- |:-------------:|
| Node     | 10.14.2 |
| npm     | 6.4.1      |
| Angular CLI | 9.0.7 |

### Source code
You can get the source code of this repository with the command:

```bash
git clone https://github.com/andreasumbricht/src-browser.git
```

After that, install all packages assocciated with the project with the command:
```bash
npm install
```

### Verification
If you type `ng serve` in the terminal, inside your cloned repository, you should see a black screen on http://localhost:4200, with a white text "Connecting to service...".

At this stage, you should consider setting up the [src-db-server](https://github.com/andreasumbricht/src-db-server) repository.

If you already have the src-db-server repository up and running, change the url of the src-db-server inside the ./src/environments/environments.ts file. Now you should be able to see an input field and two button on your browser window.

## Development
You can start the development server with the command:
```bash
ng serve
```
This will start a live-reload server on your default browser.

## Deployment
Ensure that ./src/environments/environments.ts is set correctly.

To build the production files, you need to enter the following command:
```bash
ng build --prod
```

This will create a folder ./dist/phaser-angular-app.
Upload the content of this folder to your webserver (e.g. Apache).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
