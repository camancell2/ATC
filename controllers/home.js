const Post = require('../model/post');

const homeView = async (req, res) => {
    await Post.find().limit(10).then(docsObj => {
        const docs = docsObj.map(doc => doc.toJSON());

        res.render('index', { posts: docs });
    });
};

module.exports = {
    homeView
};