const User = require("../../models/users");
const Profile = require("../../models/profiles");
const bcrypt = require('bcrypt');

const basicAuth = function (username, password, done) {
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
};

const serializeUser = function (user, done) {
    done(null, user._id);
};

const deserializeUser = function (id, done) {
    User.findOne({_id: id}).then(user => {
        done(undefined, user);
    }, err => {
        done(err, null)
    });
};

const fbStrategy = async (accessToken, refreshToken, facebookProfile, next) => {
    // console.log(facebookProfile._raw);
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
}

module.exports = {
    basicAuth,
    fbStrategy,
    serializeUser,
    deserializeUser
};