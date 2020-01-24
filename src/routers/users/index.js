

const express = require("express");
const router = express.Router();
const bcrypt = require('bcrypt');
var passport = require('passport');
const User = require("../../models/users");
const Profile = require("../../models/profiles");

router.get("/", async (req, res) => {
    try {
        const experience = await User.find({});
        res.status(200).send(experience)
    } catch (err) {
        res.send(err)
    }
});

router.get("/:id", async (req, res) => {
    try {
        const experience = await User.findOne({_id: req.params.id});
        res.status(200).send(experience)
    } catch (err) {
        res.status(500).send(err)
    }
});


router.post("/", async (req, res) => {
    try {
        const salt = await bcrypt.genSalt();
        const hachedPassword = await bcrypt.hash(req.body.password, salt);
        const obj = {
            username: req.body.username,
            password: hachedPassword
        };
        const user = await User.create(obj);
        // new need to create a profile for the new user
        const profile = await Profile.create({
            email: req.body.email,
            name: req.body.name,
            surname: req.body.surname,
            username: req.body.username
        });
        // we reference the profile on the user for later use
        user.profile = profile._id;
        user.save();
        res.status(200).send(user)
    } catch (err) {
        res.status(500).send(err)
    }
});

router.put("/:id", async (req, res) => {
    try {
        delete req.body._id;
        const data = {...req.body};
        if (req.body.password) {
            const salt = await bcrypt.genSalt();
            const hachedPassword = await bcrypt.hash(req.body.password, salt);
            data.password = hachedPassword;
        }
        const user = await User.findOneAndUpdate({_id: req.params.id}, {$set: data}, {useFindAndModify: false});
        if (user) res.status(200).send(user);
        else res.status(404).send("Not found")
    } catch (err) {
        console.log(err);
        res.send(err)
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const user = await User.findOneAndRemove({_id: req.params.id})
        if (user) res.send("Ok");
        else res.status(404).send("Not found")
    } catch (err) {
        res.send(err)
    }
});

module.exports = router;