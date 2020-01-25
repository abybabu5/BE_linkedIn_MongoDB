const listEndpoints = require("express-list-endpoints");
const express = require("express");
const fs = require('fs-extra');
const mongoose = require("mongoose");
const bodyParser = require('body-parser');
const session = require("express-session");
const profilesRouter = require("./src/routers/profiles/index");
const usersRouter = require("./src/routers/users/index");
const experienceRouter = require("./src/routers/experience/index");
// const commentsRouter = require("./src/routers/comments/index");
const postsRouter = require("./src/routers/posts/index");
const dotenv = require("dotenv");
const server = express();
const cookieParser = require("cookie-parser");
const User = require("./src/models/users");
const cors = require("cors");
const bcrypt = require('bcrypt');

const PORT = process.env.PORT || 3333;

dotenv.config();

var passport = require('passport')
    , BasicStrategy = require('passport-http').BasicStrategy;

// function needed to serialize/deserialize the user
passport.serializeUser(function (user, done) {
    done(null, user._id);
});

passport.deserializeUser(function (id, done) {
    User.findOne({_id: id}).then(user => {
        done(undefined, user);
    }, err => {
        done(err, null)
    });
});
// setup of passport to use the Basic Authentication and verify the password with one saved on the database
// using bcrypt to hash the password
passport.use(new BasicStrategy(
    function (username, password, done) {
        User.findOne({username: username}, async function (err, user) {

            if (err) {
                return done(err);
            }
            if (!user) {
                return done(null, false, {message: 'Incorrect username.'});
            }
            try {
                const result = await bcrypt.compare(password, user.password);
                //console.log(result);
                if (!result) {
                    return done(null, false, {message: 'Incorrect password.'});
                }
                return done(null, user);
            } catch (e) {
                console.log(e);
            }

        });
    }
));
// function chained on the request to verify if the user is loggedin
// the endpoints with this function chained will be not available to anonymous users
const isAuthenticated = (req, res, next) => {
    passport.authenticate('basic', {session: false})(req, res, next)
};

// mongoose.connect("mongodb://localhost:27017/linkedin-db",{useNewUrlParser: true})
//   .then(db => console.log("connected to mongodb"), err => console.log("error", err))
const LoggerMiddleware = (req, res, next) => {
    console.log(`${req.url} ${req.method} -- ${new Date()}`);
    //console.log(req.session);
    next();
};


server.use(LoggerMiddleware);
server.use(cors());
server.use(express.json());
// server.use(cookieParser());
server.use(bodyParser.urlencoded({extended: false}));
server.use(bodyParser.json());
server.use(session({secret: '98213419263127', cookie: {maxAge: 600000}, saveUninitialized: true, resave: true}));
server.use(passport.initialize());
server.use(passport.session());
server.use("/img", express.static('img'));
server.use("/profile", isAuthenticated, profilesRouter);
server.use("/profile/:username/experiences", isAuthenticated, experienceRouter);
server.use("/image", express.static('image'));
server.use("/users", usersRouter);
server.use("/posts", isAuthenticated, postsRouter);
// server.use("/comments", isAuthenticated, commentsRouter);


server.options("/login");
// endpoint used on the frontend to login the user and retrieve the user information
server.post("/login", passport.authenticate('basic'), function (req, res) {
    // If this function gets called, authentication was successful.
    // `req.user` contains the authenticated user.
    res.redirect('/profile/' + req.user.username);
});

const requireJSONContentOnlyMiddleware = () => {
    return (req, res, next) => {
        if (req.headers["content-type"] !== "application/json") {
            res
                .status(400)
                .send("Server requires application/json only as content type");
        } else {
            next();
        }
    };
};

//catch not found errors
server.use((err, req, res, next) => {
    if (err.httpStatusCode === 404) {
        console.log(err);
        res.status(404).send("Resource not found!");
    }
    next(err);
});
//catch not found errors
server.use((err, req, res, next) => {
    if (err.httpStatusCode === 401) {
        console.log(err);
        res.status(401).send("Unauthorized!");
    }
    next(err);
});
//catch forbidden errors
server.use((err, req, res, next) => {
    if (err.httpStatusCode === 403) {
        console.log(err);
        res.status(403).send("Operation Forbidden");
    }
    next(err);
});
//catch all
server.use((err, req, res, next) => {
    if (!res.headersSent) {
        res.status(err.httpStatusCode || 500).send(err);
    }
});

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
