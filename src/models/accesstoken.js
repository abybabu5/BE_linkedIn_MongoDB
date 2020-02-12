const mongoose = require("mongoose");

const accessTokenSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    id: {
        type: String,
        required: true
    }
},
{
    timestamps: true
});

const accessTokenCollection = mongoose.model("accesstoken", accessTokenSchema);

module.exports = accessTokenCollection;