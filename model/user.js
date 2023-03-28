const mongoose = require('mongoose');
const passportMongoose = require('passport-local-mongoose');

const Schema = mongoose.Schema;

const user = new Schema({
    username : {type: String, require: true, unique: true},
    email : {type: String, require: true, unique: true},
    isAdmin: {type: Boolean, require: true, unique: false, default: false},
    creationDate : {type: Date, require: true, unique: false, default: new Date()}
});

user.plugin(passportMongoose);

module.exports = mongoose.model('users', user);
