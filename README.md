# Penguin Game

## Overview

- "Penguin Game is a 2 player online fighter game, built using the Phaser 3 game engine and Socket.IO"

## Setup

- "npm install"
- "npm run start-dev"
- "Open 2 browsers (or tabs) of localhost:3000"

## Getting Started

- "Once the game is running, click 'Start' to begin"
- "One player may run around and jump when they click 'Start,' but the game will not actually start (meaning no items will appear) until a second player has joined"
- "To test the game as a solo player, you can run the game in two separate browsers/tabs"
- "Once someone wins, both players need to refresh their browser in order to play again"

## Controls

- "Move and jump with the arrow keys"
- "Run over an item to pick it up"
- "Hit 'space' to fire a pistol after it is picked up"

### Additional Notes

- "The game has a max of 2 players, a 3rd will not be allowed to enter until the other players exit"
- "Players will timeout after 30 minutes of consecutive play. This is to ensure no one mistakenly leaves an instance of the game running, preventing others from playing"
