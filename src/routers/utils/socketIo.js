const { checkToken } = require('./auth');
const Message = require('../../models/messages');

module.exports = {
    configureIO: (io) => {
        io.on('connection', async socket => {
            socket.on("login", (payload) => {
                const token = checkToken(payload.token);
                const username = payload.username;
                socket.username =  username;// <== here we are setting the property!!
                const connectedUsers = [];
                Object.keys(io.sockets.connected).forEach(socketKey => { //we are searching in the connected sockets
                    if (io.sockets.connected[socketKey].username)
                        connectedUsers.push(io.sockets.connected[socketKey].username)
                });
                socket.emit("login", {
                    newUser: username,
                    connectedUsers: connectedUsers
                });
                socket.broadcast.emit("login", {
                    newUser: username,
                    connectedUsers: connectedUsers
                })
            });

            socket.on('message', message => {
                socket.broadcast.emit("message", message);
                Object.keys(io.sockets.connected).forEach(async key => {
                    if (message.from === io.sockets.connected[key].username) {
                        const msg = await Message.create({
                            from: message.from,
                            to: message.to,
                            text: message.text,
                            created: new Date
                        });
                        io.sockets.connected[key].emit("message", message)
                    }
                })
            })
        })
    }
};