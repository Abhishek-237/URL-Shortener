const mongoose = require('mongoose');

const recschema = new mongoose.Schema({
    Userid : {
        type : mongoose.ObjectId,
        required : true
    },
    URL : {
        type : String,
        required : true
    },
    ShortURL : {
        type : String,
        required : true
    },
    CreatedOn : {
        type : Date,
    },
    Count : {
        type : Number,
        default : 0
    },
    Token : {
        type : String,
        required : true
    }
});

const records = mongoose.model('records', recschema);

module.exports = records;