const mongoose = require("mongoose");

const experienceSchema = new mongoose.Schema({
    role: { 
        type: String,
        required: true
    },
    company: { 
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        required:true
    },
    endDate: {
        type: Date,
        required:false
    },
    description: { 
        type: String,
        required: true
    },
    area:{ 
        type: String,
        required: true
    },
    username:{ 
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    }
});

const experienceCollection = mongoose.model("experience", experienceSchema);

module.exports = experienceCollection