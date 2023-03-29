// Utility functions to eliminate the need to rewrite the query functions

const Post = require('./model/post.js');
const User = require('./model/user.js');

async function GetPosts(sort = '', limit = 1) {
    let posts = await Post.find().sort(sort).limit(limit);

    for (post of posts) {
        const user = await User.findByUsername(post.username);
        post.picture = user.profile.picture.location;
    }

    const json = posts.map(obj => obj.toJSON());

    return json;
}

async function GetPostsByUsername(username, sort = '', limit = 1) {
    const posts = await Post.find({username: username}).sort(sort).limit(limit);

    for (post of posts) {
        const user = await User.findByUsername(post.username);
        post.picture = user.profile.picture.location;
    }

    const json = posts.map(obj => obj.toJSON())

    return json;
}

async function GetProfileByUsername(username) {
    const user = await User.findByUsername(username);

    return user.profile;
}

async function GetUserByUsername(username) {
    const user = await User.findByUsername(username);
    
    return user;
}

async function UpdateUserByUsername(username, update) {
    let user = await User.findByUsername(username);

    user = update;

    await user.save();
}

module.exports = {
    GetPosts,
    GetPostsByUsername,
    GetProfileByUsername,
    GetUserByUsername,
    UpdateUserByUsername
}