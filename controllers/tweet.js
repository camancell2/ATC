const database = require('../utils/Database');

const LikeTweetPostView = async (req, res) => {
    const { post_id, viewer } = req.query;

    await database.LikeTweet(post_id, viewer);

    res.sendStatus(200);
};

const UnLikeTweetPostView = async (req, res) => {
    const { post_id, viewer } = req.query;

    await database.UnlikeTweet(post_id, viewer);

    res.sendStatus(200);
};

const CommentsPostView = async (req, res) => {
    const { post_id } = req.query;

    res.render('comments', {});
}

const DeleteTweetPostView = async (req, res) => {
    const { post_id } = req.query;

    await database.DeleteTweet(post_id);

    res.sendStatus(200);
}

module.exports = {
    LikeTweetPostView,
    UnLikeTweetPostView,
    CommentsPostView,
    DeleteTweetPostView
}