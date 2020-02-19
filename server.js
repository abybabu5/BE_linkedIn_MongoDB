const express = require("express");
const http = require('http').createServer(express);
const io = require('socket.io')(http);
const FbStrategy = require("passport-facebook-token");
const fs = require('fs-extra');
const BasicStrategy = require("passport-http").BasicStrategy;
const LocalStrategy = require("passport-local"); // strategy to verify username and password
const JwtStrategy = require("passport-jwt").Strategy; // strategy to verify the access token
const ExtractJwt = require("passport-jwt").ExtractJwt; // this is a helper to extract the info from the token
const {getToken, jwtOptions} = require("./src/auth");
const jwt = require("jsonwebtoken");
const morgan = require('morgan');
const listEndpoints = require("express-list-endpoints");
const mongoose = require("mongoose");
const bodyParser = require('body-parser');
const session = require("express-session");
const profilesRouter = require("./src/routers/profiles/index");
const usersRouter = require("./src/routers/users/index");
const experienceRouter = require("./src/routers/experience/index");
const postsRouter = require("./src/routers/posts/index");
const dotenv = require("dotenv");
const server = express();
const cookieParser = require("cookie-parser");
const User = require("./src/models/users");
const Profile = require("./src/models/profiles");
const AccessToken = require("./src/models/accesstoken");
const cors = require("cors");
const bcrypt = require('bcrypt');

const PORT = process.env.PORT || 3333;

dotenv.config();


const passport = require('passport'),
    AuthTokenStrategy = require('passport-auth-token').Strategy;

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


passport.use(new JwtStrategy(jwtOptions, (jwtPayload, callback) => { //this strategy will be used when we ask passport to passport.authenticate("jwt")
    User.findById(jwtPayload._id, (err, user) => { //looks into the collection
        if (err) return callback(err, false) // ==> Something went wrong getting the info from the db
        else if (user) return callback(null, user); // ==> Existing user, all right!
        else return callback(null, false) // ==> Non existing user
    })
}));

passport.use(new FbStrategy({
    clientID: process.env.FB_ID,
    clientSecret: process.env.FB_KEY
}, async (accessToken, refreshToken, facebookProfile, next) => {
    console.log(facebookProfile._raw);
    // console.log(accessToken, refreshToken, facebookProfile);
    try {
        const userFromFacebookId = await User.findOne({facebookId: facebookProfile.id});//search for a user with a give fbid
        // console.log(facebookProfile);
        if (userFromFacebookId) //if we have a user we return the user
            return next(null, userFromFacebookId);
        else //we create a user starting from facebook data!
        {
            const profile = await Profile.create({
                name: facebookProfile.name.givenName,
                surname: facebookProfile.name.familyName,
                username: facebookProfile.id,
                email: facebookProfile.id + "@facebook",
                image: facebookProfile.photos[0].value,
            });
            // console.log(profile);
            const newUser = await User.create({
                role: "User",
                profile: profile._id,
                facebookId: facebookProfile.id,
                username: facebookProfile.id,
                refreshToken: refreshToken
            });
            return next(null, newUser) // pass on the new user!
        }
        //return next(null, userFromFacebookId || false)
    } catch (exx) {
        console.log(exx);
        return next(exx) //report error
    }
}));


const isAuthenticated = (req, res, next) => {
    passport.authenticate('facebook-token')(req, res, next)
};
const LoggerMiddleware = (req, res, next) => {
    console.log(`${req.url} ${req.method} -${req.user}- ${new Date()}`);
    //console.log(req.session);
    next();
};



server.use(cors());
server.use(express.json());
server.use(morgan('combined'));
server.use(bodyParser.urlencoded({extended: false}));
server.use(bodyParser.json());
server.use(session({secret: '98213419263127', cookie: {maxAge: 600000}, saveUninitialized: true, resave: true}));
server.use(passport.initialize());
server.use(passport.session());

server.use("/img", express.static('img'));
server.use("/profile", passport.authenticate('basic'), profilesRouter);
server.use("/profile/:username/experiences", experienceRouter);
server.use("/users", usersRouter);
server.use("/posts",  passport.authenticate('basic'), postsRouter);


server.options("/login");
// endpoint used on the frontend to login the user and retrieve the user information
server.post('/login',
    passport.authenticate(
        'authtoken',
        {
            session: false,
            optional: false,
            headerFields: ['token']
        },
        // (...args) => {
        //     console.log(args);
        //     return true;
        // }
    ),
    function (req, res) {
        res.redirect('/profile/' + req.user);
    }
);


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
//server.post("/login", passport.authenticate('basic'), function (req, res) {
// If this function gets called, authentication was successful.
// `req.user` contains the authenticated user.

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

            http.listen(PORT, () => {
                console.log("Server is running on", PORT)
            })
        }
    )
    .catch(err => console.log(err));
