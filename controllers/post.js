const Post = require('../model/post');
const User = require('../model/user');

const postPostView = async (req, res) => {
    const body = req.body;

    if (req.isAuthenticated()) {
        const post = body['post'];
        const username = req.user.username;

        const user = await User.findByUsername(username);

        if (!user)
            return res.redirect('/login');

        Post.create({post: post, picture: user.profile.picture.location, username: user.username, postDate: new Date()});

        // Redirect the user to the previous page they were at
        const previousUrl = req.headers.referer;

        return res.redirect(previousUrl);
    }

    return res.redirect('/login');
};

const deleteGetView = async (req, res) => {
    const postId = req.params.id;

    if (req.isAuthenticated()) {
        await Post.findByIdAndDelete(postId);

        const previousUrl = req.headers.referer;

        return res.redirect(previousUrl);
    }

    // TODO: Throw error if user attempts to delete while not in correct context
    return res.redirect('/login');
};

const likeGetView = async (req, res) => {
    const postId = req.params.id;

    if (req.isAuthenticated()) {
        const username = req.user.username;
        const post = await Post.findById(postId);

        // Check to see if user already liked the post
        if (!post.liked.includes(username)) {
            post.liked.push(username);
            await post.save();
        } else {
            // Else we see it as the user unliking the post and remove them
            const index = post.liked.indexOf(username);

            if (index > -1) {
                post.liked.splice(index, 1);
                await post.save();
            }
        }

        const previousUrl = req.headers.referer;

        return res.redirect(previousUrl);
    }

    return res.redirect('/login');
}

module.exports = {
    postPostView,
    deleteGetView,
    likeGetView
};