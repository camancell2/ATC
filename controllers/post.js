const Post = require('../model/post');

const postPostView = (req, res) => {
    const body = req.body;

    if (req.isAuthenticated()) {
        const post = body['post'];
        const username = req.user.username;

        Post.create({post: post, username: username, postDate: new Date()});

        return res.redirect('/');
    }

    return res.redirect('/login');
};

const deleteGetView = async (req, res) => {
    const postId = req.params.id;

    if (req.isAuthenticated()) {
        await Post.findByIdAndDelete(postId);
        return res.redirect('/');
    }

    // TODO: Throw error if user attempts to delete while not in correct context
    return res.redirect('/');
};

module.exports = {
    postPostView,
    deleteGetView
};