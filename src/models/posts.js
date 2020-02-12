const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema({
    text: {
        type: String,
        required: [true, "Type in a comment!"],
        minlength: 3,
        maxlength: 50
    },
    username: {
        type: String,
    },
    user: {
        type: Object,
    },
    image: {
        type: String,
        //default: 'http://via.placeholder.com/640x360'
    },
    comments: [{
        type: Schema.Types.ObjectId,
        ref: "Comment"
    }],
    likes: [{
        type: Schema.Types.ObjectId,
        ref: "user"
    }]
}, {timestamps: true});

const postsCollection = mongoose.model('Post', postSchema);
module.exports = postsCollection;