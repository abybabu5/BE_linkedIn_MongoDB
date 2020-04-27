const express = require("express");
const listEndpoints = require("express-list-endpoints");
const FbStrategy = require("passport-facebook-token");
const http = require("http");
const socketio = require("socket.io");
const mongoose = require("mongoose");
const bodyParser = require('body-parser');
const session = require("express-session");
const profilesRouter = require("./src/routers/profiles/index");
const usersRouter = require("./src/routers/users/index");
const experienceRouter = require("./src/routers/experience/index");
const postsRouter = require("./src/routers/posts/index");
const dotenv = require("dotenv");
const server = express();
const cors = require("cors");
const Auth = require('./src/routers/utils/auth');
const utils = require('./src/routers/utils/utils');
const { configureIO } = require("./src/routers/utils/socketIo");
const moment = require("moment");

const PORT = process.env.PORT || 3333;

const app = express();
app.use(cors());
const socketServer = http.createServer(app).listen(5555);
const io = socketio(socketServer);
io.set('transports', ["websocket"]);
io.on("connection", async socket => {
    //console.log(socket.id)

    socket.on("broadcast", (message) => {
        message.date = moment().toISOString(true);
        console.log(message);
        socket.broadcast.emit("broadcast", message);
        socket.emit("broadcast", message)
    });

    socket.on("login", username => {
        socket.user = username
    });

    socket.on("private", message => {
        message.date = moment().toISOString(true);
        //search for the socket with the ID that we are interested in
        const connectedClientsIds = Object.keys(io.sockets.connected);
        for(let i = 0; i < connectedClientsIds.length; i++){
            const currentSocket = io.sockets.connected[connectedClientsIds[i]];
            if (currentSocket.user === message.to){
                currentSocket.emit("private", message) //deliver the message
            }
        }
        socket.emit("private", message) //auto send message
    })
});
dotenv.config();

const passport = require('passport');
const BasicStrategy = require('passport-http').BasicStrategy;

passport.use(new FbStrategy({
    clientID: process.env.FB_ID,
    clientSecret: process.env.FB_KEY
}, Auth.fbStrategy));


// function needed to serialize/deserialize the user
passport.serializeUser(Auth.serializeUser);
passport.deserializeUser(Auth.deserializeUser);

passport.use(new BasicStrategy(Auth.basicAuth));
// function chained on the request to verify if the user is loggedin
// the endpoints with this function chained will be not available to anonymous users
const isAuthenticated = (req, res, next) => {
    if (req.get("access_token")) {
        passport.authenticate('facebook-token', {session: false})(req, res, next);
    } else if (req.get("Authorization")) {
        passport.authenticate('basic', {session: false})(req, res, next);
    } else
        res.status(401).send();
};

const LoggerMiddleware = (req, res, next) => {
    console.log(`${req.method} ${req.url} -- ${new Date()}`);
    //console.log(req.session);
    next();
};

server.use(passport.initialize());
server.use(passport.session());
server.use(LoggerMiddleware);
server.use(cors());
server.use(express.json());
server.use(bodyParser.urlencoded({extended: false}));
server.use(bodyParser.json());
server.use(session({secret: '98213419263127', cookie: {maxAge: 600000}, saveUninitialized: true, resave: true}));
server.use("/img", express.static('img'));
server.use("/profile", isAuthenticated, profilesRouter);
server.use("/profile/:username/experiences", isAuthenticated, experienceRouter);
server.use("/users", usersRouter);
server.use("/posts", isAuthenticated, postsRouter);



server.options("/login");
// endpoint used on the frontend to login the user and retrieve the user information
server.post("/login", passport.authenticate('basic'), function (req, res) {
    // If this function gets called, authentication was successful.
    // `req.user` contains the authenticated user.
    res.redirect('/profile/' + req.user.username);
});

server.get("/facebookLogin", passport.authenticate(
    'facebook-token',
    {
        profileFields: ['id', 'displayName', 'name', 'emails', 'birthday', 'gender', 'location']
    }
), async (req, res) => {
    res.send({
        user: req.user
    })
});
utils.catchErrors(server);
console.log(listEndpoints(server));

console.log(process.env.LOCAL);
mongoose.connect(process.env.LOCAL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => {
            console.log("MongoDB connected.");
            server.listen(PORT, () => {
                console.log("We are running on localhost", PORT)
            })
        }
    )
    .catch(err => console.log(err));
