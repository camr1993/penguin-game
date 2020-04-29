const express = require('express');
const app = express();
const path = require('path');
const createSocketListener = require('socket.io');

// app.listen() returns an http.Server object
const server = app.listen(3000, () => {
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

const players = {};
var pistol = {
  x: randCoord(),
  y: 50,
  id: newId(),
};

// .on listens for an emit (action), .emit sends an action
socketListener.on('connect', function (socket) {
  /* This function receives the newly connected socket.
     This function will be called for EACH browser that connects to our server. */
  console.log('Server Side: A new client has connected!');
  console.log(socket.id);

  // create player in players obj and send info back to client
  players[socket.id] = {
    x: randCoord(),
    y: 50,
    playerId: socket.id,
    team: Math.floor(Math.random() * 2) === 0 ? 'red' : 'blue',
  };

  // send the players object to the new player
  socket.emit('currentPlayers', players);
  // send the pistol object to the new player
  socket.emit('pistolLocation', pistol);
  // update all other players of the new player
  socket.broadcast.emit('newPlayer', players[socket.id]);

  // when a player disconnects, remove them from our players object
  socket.on('disconnect', () => {
    console.log('Server Side: We lost a client! Client down!');
    // remove from players object
    delete players[socket.id];
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
