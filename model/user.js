const mongoose = require('mongoose');
const passportMongoose = require('passport-local-mongoose');

const Schema = mongoose.Schema;

const user = new Schema({
    username : {type: String, require: true, unique: true},
    email : {type: String, require: true, unique: true},
    profile : {
        name : {type: String, require: false, unique: false, default: ''},
        description : {type: String, require: false, unique: false, default: ''},
        picture: {
            location: {type: String, require: false, unique: false, default: '/storage/default.png'},
            contentType: {type: String, require: false, unique: false, default: 'image/png'}
        }
    },
    isAdmin: {type: Boolean, require: true, unique: false, default: false},
    creationDate : {type: Date, require: true, unique: false, default: new Date()}
});

var options = {
    errorMessages: {
        UserExistsError: 'A user with the given username or email is already registered'
    }
}

user.plugin(passportMongoose, options);

module.exports = mongoose.model('users', user);
