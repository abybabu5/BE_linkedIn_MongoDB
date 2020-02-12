const mongoose = require("mongoose");

const usersSchema = new mongoose.Schema({
    username: { 
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    profile: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'profiles'
    }
},
{
    timestamps: true
});

const usersCollection = mongoose.model("user", usersSchema);

module.exports = usersCollection;