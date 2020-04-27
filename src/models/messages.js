const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
    from: {
        type: String,
        required : true
    },
    to: {
        type: String,
        required : true
    },
    text: {
        type: String,
        required : true
    },
    created: {
        type: Date,
        required: true
    }
});

const messageList = mongoose.model("message", messageSchema);

module.exports = messageList;