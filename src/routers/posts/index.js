const express = require("express");
const Comment = require("../../models/comment");
const Post = require("../../models/posts");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const postsRouter = express.Router();


postsRouter.get("/", async (req, res) => {
    const posts = await Post.find({}).populate({
        path: "comments",
        populate: {path: 'postedBy', select: 'username profile', populate: {path: 'profile'}}
    }).populate({path: 'likes', populate: 'profile'});
    res.send(posts);
});

postsRouter.get("/:postId", async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId).populate({
            path: "comments",
            populate: {path: 'postedBy', select: 'username profile', populate: {path: 'profile'}}
        });
        if (post) {
            post.comments[0].populate("postedBy").execPopulate();
            res.send(post);
        } else {
            res.status(404).send("Not found");
        }
    } catch (error) {
        console.log();
        res.send(error)
    }
});
postsRouter.post("/", async (req, res) => {
    try {
        const post = {...req.body, username: req.user.username};
        const newPost = await Post.create(post);
        //console.log(req.body);
        newPost.save();
        res.send(newPost);
    } catch (error) {
        res.status(500).send(error);
    }
});

postsRouter.put("/:postId", async (req, res) => {

    try {
        const post = await Post.findOneAndUpdate(
            {_id: req.params.postId},
            {$set: {...req.body}},
            {new: true}
        );
        res.send(post);
    } catch (error) {
        res.status(400).send(error);
    }
});

postsRouter.delete("/:postId", async (req, res) => {
    try {
        const post = await Post.findOneAndDelete({_id: req.params.postId});
        res.send(post);
    } catch (error) {
        res.status(400).send(error);
    }
});
const upload = multer({});
postsRouter.post("/:postId/picture", upload.single("image"), async (req, res) => {
    //console.log(req);
    try {
        const imgDest = path.join(__dirname, "../../../img/posts/" + req.params.postId + req.file.originalname);
        const imgDestination = req.protocol + "://" + req.get("host") + "/img/posts/" + req.params.postId + req.file.originalname;
        await fs.writeFileSync(imgDest, req.file.buffer);
        console.log(imgDestination);
        const exp = await Post.findOneAndUpdate({_id: req.params.postId}, {image: imgDestination}, {
            new: true,
            useFindAndModify: false
        });
        res.send(exp)
    } catch (err) {
        console.log(err);
        res.send(err)
    }
});
postsRouter.get("/:id/comment", async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.comment);
        if (comment) {
            res.send(comment);
        } else {
            res.status(404).send("Not found");
        }
    } catch (error) {
        console.log();
        res.send(error)
    }
});
postsRouter.post("/:id/comment", async (req, res) => {
    try {
        const post = await Post.findOne({_id: req.params.id});

        const comment = await Comment.create({comment: req.body.comment, postedBy: req.user._id});
        // const comment = {...req.body, username: req.user.username};
        // const newComment = await Comment.create(comment);
        //console.log(req.body);
        post.comments.push(comment._id);
        console.log(post);
        post.save();
        res.send(post);
    } catch (error) {
        res.status(500).send(error);
    }
});
postsRouter.put("/:id/comment/:commentId", async (req, res) => {
    try {
        const comment = await Comment.findOneAndUpdate(
            {_id: req.params.commentId},
            {$set: {...req.body}},
            {new: true}
        );
        res.send(comment);
    } catch (error) {
        res.status(400).send(error);
    }
});

postsRouter.get("/:postId/like", async (req, res) => {
    const post = await Post.findOne({_id: req.params.postId, likes: req.user._id});

    let op = '$push';
    // console.log(post);
    if (post !== null) {
        op = '$pull';
    }
    const doc = {};
    doc[op] = {likes: req.user._id};
    Post.findOneAndUpdate(
        {_id: req.params.postId},
        doc,
        {new: true, useFindAndModify: false}
    ).then(post => {
        console.log(doc);
        res.send(post);
    }, error => {
        console.log(error);
        res.status(400).send(error);
    });
});

postsRouter.delete("/:postId/comment/:commentId", async (req, res) => {
    try {
        const comment = await Comment.findOneAndDelete({_id: req.params.commentId});
        const post = Post.findOneAndUpdate(
            {_id: req.params.postId},
            {$pull: {comments: req.params.commentId}},
            {new: true, useFindAndModify: false}
        ).then(post => {
            console.log(post);
            res.send(post);
        }, error => {
            console.log(error);
            res.status(400).send(error);
        });
    } catch (error) {
        res.status(400).send(error);
    }
});
module.exports = postsRouter;