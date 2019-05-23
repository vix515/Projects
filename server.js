var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
rooms = [];
users = [];
connections = [];
currentRoom = 0;

var listener = server.listen(process.env.PORT || 3000);
//var listener = server.listen()
console.log("server running on port: " + listener.address().port);
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.sockets.on('connection', function(socket){
  //var date = new Date();
  connections.push(socket);
  console.log('Connected: %s sockets', connections.length);
  //console.log('Connected: %s sockets connected at %s:%s:%s', connections.length, date.getHours(), date.getMinutes(), date.getSeconds());

  //disconnect
  socket.on('disconnect', function(data){
    users.splice(users.indexOf(socket.username),1);
    //updateUserNames();
    io.sockets.to(socket.room).emit('new message', {mssg: socket.username + " has left the room.", user: "System"});
    connections.splice(connections.indexOf(socket),1);
    console.log('Disconnected: %s sockets left connected', connections.length)
  });

  //send mmsg
  socket.on('send message', function(data){
    io.sockets.to(socket.room).emit('new message', {mssg: data, user: socket.username});
  });

  //new user
  socket.on('new user', function(data, callback){
    callback(true);
    socket.username = data;
    users.push(socket.username);
    updateRooms();
  });

  //join room function
  socket.on('join room', function(data){
    if(socket.room){
      io.sockets.to(socket.room).emit('new message', {mssg: socket.username + " has left the room: " + socket.room, user: "System"});
    }

    socket.join(data);
    socket.room = data;
    io.sockets.to(socket.room).emit('new message', {mssg: socket.username + " has Joined the room: " + socket.room, user: "System"});

    console.log("%s has joined the room: %s", socket.username, data);
  });

  //created new room
  socket.on('created new room', function(data){
    rooms.push(data);
    updateRooms();
  });

  function updateRooms(){
    io.sockets.emit('get rooms', rooms);
  }
});
