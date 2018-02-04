const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

// read client html file into memory
// __dirname in node is the current dictionary
// in this case same folder as the server file
const index = fs.readFileSync(`${__dirname}/../client/client.html`);

const onRequest = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(index);
  response.end();
};

const app = http.createServer(onRequest).listen(port);
console.log(`Listening on 127.0.0.1: ${port}`);

// pass in http server into socketio
const io = socketio(app);

const users = {};
let numUsers = 0;

const onJoined = (sock) => {
  const socket = sock;
  numUsers++;
  socket.on('join', (data) => {
    // message back to new user
    const joinMsg = {
      name: 'Server',
      msg: `There are ${Object.keys(users).length} other users online.`,
    };

    socket.name = data.name;
    socket.emit('msg', joinMsg);
    socket.join('room1');

    // announcement to everyone else in room
    const response = {
      name: 'Server',
      msg: `${data.name} has joined the room.`,
    };
    socket.broadcast.to('room1').emit('msg', response);
    users[`key${numUsers}`] = data.name;

    // success message to new user
    socket.emit('msg', { name: 'Server', msg: 'You have joined the room. Use "/commands" for some fun!' });
  });
};

const onMsg = (sock) => {
  const socket = sock;
    
  socket.on('msgToServer', (data) => {
    if(data.msg === "/date") {
        let d = new Date().toLocaleDateString();
        socket.emit('msg', {name: 'Server', msg: d});
    }
    else if(data.msg === '/commands') 
        socket.emit('msg', { name: 'Server', msg: 'Commands are /dances, /cries, /sleeping, /randomNum, and /date.' });
    else if(data.msg === '/dances')
        io.sockets.in('room1').emit('msg', { name: data.name, msg: 'is dancing!' });
    else if(data.msg === '/cries')
        io.sockets.in('room1').emit('msg', { name: data.name, msg: 'is crying!' });
    else if(data.msg === '/sleeping')
        io.sockets.in('room1').emit('msg', { name: data.name, msg: 'is sleeping!' });
    else if(data.msg === '/randomNum') {
        let num = Math.floor(Math.random() * 100) + 1;
        io.sockets.in('room1').emit('msg', { name: data.name, msg: 'Generated a random number between 1 and 100. It was ' + num + '!'});
    }
    else
        io.sockets.in('room1').emit('msg', { name: data.name, msg: data.msg });
  });
    
  socket.on('dcMsg', (data) => {
      io.sockets.in('room1').emit('msg', { name: data.name, msg: data.msg });
  });
      
};

const onDisconnect = (sock) => {
  const socket = sock;
  socket.on('disconnect', () => {
    delete users[`key${numUsers}`];
    numUsers--;
  });
};

io.sockets.on('connection', (socket) => {
  onJoined(socket);
  onMsg(socket);
  onDisconnect(socket);
});



