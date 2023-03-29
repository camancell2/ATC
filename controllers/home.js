const utils = require('../utils.js');

const homeView = async (req, res) => {
    const recentPosts = await utils.GetPosts({"postDate": 'desc'}, 10);
    const mostLiked = await utils.GetPosts({"liked.length": 'asc'}, 5);
    
    res.render('index', { title: 'A Twitter Clone | Home', recentPosts: recentPosts, mostLiked: mostLiked});
};

module.exports = {
    homeView
};