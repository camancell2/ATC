const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const post = new Schema({
    post: {type: String, require: true, unique: false},
    username: {type: String, require: true, unique: false},
    postDate: {type: Date, require: true, unique: false}
});

module.exports = mongoose.model('posts', post);