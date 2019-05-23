var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

rooms = [];//keep track of amount of rooms created
users = [];//keep track of amount of users
connections = [];//keep track of sockets for debugging
currentRoom = 0;

var listener = server.listen(process.env.PORT || 3000);
console.log("server running on port: " + listener.address().port);
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.sockets.on('connection', function(socket){
  connections.push(socket);//store a socket in the connection array
  console.log('Connected: %s sockets', connections.length);//debugging mssg

  //disconnect
  socket.on('disconnect', function(data){
    users.splice(users.indexOf(socket.username),1);//remove user
    //updateUserNames();
    io.sockets.to(socket.room).emit('new message', {mssg: socket.username + " has left the room.", user: "System"});//alert users that a user disconnected
    connections.splice(connections.indexOf(socket),1);//remove socket
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

    //If there is a room set to the current user/socket then when they switch rooms the current room will be alerted
    if(socket.room){
      io.sockets.to(socket.room).emit('new message', {mssg: socket.username + " has left the room: " + socket.room, user: "System"});
    }

    //join new room and store new room number
    socket.join(data);
    socket.room = data;

    //alert of a new user joining
    io.sockets.to(socket.room).emit('new message', {mssg: socket.username + " has Joined the room: " + socket.room, user: "System"});

    console.log("%s has joined the room: %s", socket.username, data);
  });

  //created new room
  socket.on('created new room', function(data){
    rooms.push(data);
    updateRooms();
  });

  //this will push the rooms to the index so it can create a dropdown of rooms
  function updateRooms(){
    io.sockets.emit('get rooms', rooms);
  }
});
