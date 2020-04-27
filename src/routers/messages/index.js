
const express = require("express");
const Message = require("../../models/messages");
const passport = require("passport");

const router = express.Router();

router.get("/", passport.authenticate("jwt"), async (req, res) => {
    res.send(await Message.find({ $or: [{ to: req.user.username}, {from: req.user.username}]}))
});

module.exports = router;