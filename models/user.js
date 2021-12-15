const mongoose = require('mongoose');

const regschema = new mongoose.Schema({
    Name : {
        type : String,
        required : true
    },
    Email : {
        type : String,
        required : true,
        unique : true
    },
    Password : {
        type : String,
        required : true
    }
});

const registration = mongoose.model('registration', regschema);

module.exports = registration;