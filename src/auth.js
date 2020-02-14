const ExtractJwt = require("passport-jwt").ExtractJwt; // this is a helper to extract the info from the token
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), //Authorization: Bearer TOKEN
    secretOrKey: process.env.TOKEN_PASSWORD //
};
module.exports = {
    getToken: (user) => jwt.sign(user, jwtOptions.secretOrKey, { expiresIn: 3600 }),
    jwtOptions //this is just an helper to have a central point for token generation
};