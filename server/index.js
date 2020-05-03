const express = require('express');
const app = express();
const path = require('path');
const createSocketListener = require('socket.io');

let port = process.env.PORT;
if (!port) {
  port = 3000;
}

// app.listen() returns an http.Server object
const server = app.listen(port, () => {
  console.log(port);
  console.log(`Listening on http://localhost:${server.address().port}`);
});

const socketListener = createSocketListener(server);

const randCoord = () => {
  return Math.floor(Math.random() * 700) + 50;
};

let id = 0;
const newId = () => {
  id++;
  return id;
};

let playerX = 20;
let connectCounter = 0;
const players = {};

// .on listens for an emit (action), .emit sends an action
socketListener.on('connect', function (socket) {
  /* This function receives the newly connected socket.
     This function will be called for EACH browser that connects to our server. */
  console.log('Server Side: A new client has connected!');
  console.log(socket.id);
  connectCounter++;
  // create player in players obj and send info back to client
  players[socket.id] = {
    x: playerX,
    y: 450,
    playerId: socket.id,
    team: Math.floor(Math.random() * 2) === 0 ? 'red' : 'blue',
  };
  if (playerX === 20) {
    playerX = 1047;
  } else {
    playerX = 20;
  }

  // send the players object to the new player
  socket.emit('currentPlayers', players);

  // update all other players of the new player
  socket.broadcast.emit('newPlayer', players[socket.id]);

  if (connectCounter === 1) {
    socket.emit('host');
  }
  if (connectCounter === 2) {
    socket.emit('player2');
  }
  socket.on('player2-ready', () => {
    socket.broadcast.emit('startGame');
  });
  socket.on('pistolCreated', (pistolInfo) => {
    socket.broadcast.emit('pistolLocation', pistolInfo);
  });
  socket.on('heartCreated', (heartInfo) => {
    socket.broadcast.emit('heartLocation', heartInfo);
  });

  // when a player disconnects, remove them from our players object
  socket.on('disconnect', () => {
    console.log('Server Side: We lost a client! Client down!');
    // remove from players object
    delete players[socket.id];
    connectCounter--;
    // emit a message to all players to remove this player
    socketListener.emit('disconnect', socket.id);
  });

  socket.on('playerMovement', (movementData) => {
    players[socket.id].x = movementData.x;
    players[socket.id].y = movementData.y;
    players[socket.id].facingLeft = movementData.facingLeft;
    players[socket.id].currentWeapon = movementData.currentWeapon;
    players[socket.id].run = movementData.run;
    socket.broadcast.emit('playerMoved', players[socket.id]);
  });
  socket.on('pistolPickedUp', (pistolId) => {
    socket.broadcast.emit('pistolDestroy', pistolId);
  });
  socket.on('bulletFired', (bulletData) => {
    socket.broadcast.emit('incomingBullet', bulletData);
  });
  socket.on('gameOver', () => {
    socketListener.emit('gameHasEnded');
  });
});

app.use(express.static(path.join(__dirname, '../public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

socketListener.on('SIGINT', function () {
  console.log('\nGracefully shutting down from SIGINT (Ctrl-C)');
  // some other closing procedures go here
  socketListener.exit(1);
});
