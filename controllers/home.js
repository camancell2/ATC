const Post = require('../model/post');

const homeView = async (req, res) => {
    await Post.find().limit(10).then(docsObj => {
        const docs = docsObj.reverse().map(doc => doc.toJSON());

        res.render('index', { title: 'A Twitter Clone | Home', posts: docs });
    });
};

module.exports = {
    homeView
};