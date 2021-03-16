const socketio = require('socket.io');
const express = require('express');
const http = require('http');
const filterBadWords = require('bad-words')
const path = require('path');
const log = console.log;
const { generateLocationMessage, sendMessages } = require('./utils/timeStamps');
const {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
} = require('./utils/users');

const port = process.env.PORT || 3000; //get the port to run on
const publicDirectoryPath = path.join(__dirname, '../public'); //get path to the public folder
const app = express(); //init express server
const server = http.createServer(app); //connect express server to raw http
const io = socketio(server); //expects raw http server to create websockets

app.use(express.static(publicDirectoryPath)); //make use of the public folder


io.on('connection', (socket) => {

    //when soomeone joins a room
    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room });
        if (error) {
            return callback(error);
        }
        socket.join(user.room);

        //Send data. gotta match with the receiving/client side
        socket.emit('notificationMessage', `${user.username} welcome to the ${user.room} room!`);

        //send data to everyone on the server except the sender
        socket.broadcast.to(user.room).emit('notificationMessage', `${user.username} has joined the room!`);
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        });
        //let em know that user was successfully created or logged in
        callback();

    });

    //send data to everyone on the server including the send
    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);
        if (!user) {
            return callback('User not found!');
        }
        const filter = new filterBadWords();
        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed');
        }
        io.to(user.room).emit('receiveMessage', sendMessages(user.username, message));
        callback();
    });

    //send data to everyone on the server including the send
    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id);
        if (!user) {
            return callback('User not found!');
        }
        socket.to(user.room).emit('receiveLocation', generateLocationMessage(user.username, `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`));
        callback();
    });

    //check when a user leave or closes their browser
    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if (user) {
            //no need to broadcast since they've already left
            io.to(user.room).emit('notificationMessage', `${user.username} has left the room!`);
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            });
        };
    });
});

//start the http server on the specified port
server.listen(port, () => {
    log(`Server started on port ${port}!`);
});

//acknowledgement are sent from emit to on.. that is from sender to reciever