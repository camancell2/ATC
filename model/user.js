const mongoose = require('mongoose');
const passportMongoose = require('passport-local-mongoose');

mongoose.connect('mongodb://camancell:vertigorocks@ac-pzno9ki-shard-00-00.hajgylv.mongodb.net:27017,ac-pzno9ki-shard-00-01.hajgylv.mongodb.net:27017,ac-pzno9ki-shard-00-02.hajgylv.mongodb.net:27017/?ssl=true&replicaSet=atlas-tre0rs-shard-0&authSource=admin&retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const Schema = mongoose.Schema;

const user = new Schema({
    username : {type: String, require: true, unique: true},
    email : {type: String, require: true, unique: true},
    creationDate : {type: Date, require: true, unique: false}
});

user.plugin(passportMongoose);

module.exports = mongoose.model('users', user);
