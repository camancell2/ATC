const formidable = require('formidable');

const bugSpray = require('../utils/BugSpray');

const database = require('../utils/Database');

const HomeGetView = async (req, res) => {
    res.locals.showLines = true;

    let tweets = [];

    if (res.locals.isAuthenticated) {
        const username = req.session.username.toLowerCase();
        const viewer = req.session.username.toLowerCase();
        //tweets = await database.RetrieveFocusedTweetsByUsername(username, viewer);     
        tweets = await database.RetrieveTweetsAuthenticated(viewer);
        
        tweets = tweets.map(tweet => {
            tweet.isPostCreator = tweet.username.toLowerCase() === viewer;
            return tweet;
        });

        return res.render('home', { tweets, username, viewer, messages: req.flash() });
    }

    tweets = await database.RetrieveTweetsNotAuthenticated();

    res.render('home', { tweets, messages: req.flash() });
};

const TweetPostView = async (req, res) => {
    let form = new formidable.IncomingForm();

    try {
        const { fields } = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({ fields });
                }
            });
        });

        let content = fields.content[0];

        const sanitized = bugSpray.SanitizeHtml(content);
        const safe = bugSpray.SanitizeWords(sanitized);

        const username = req.session.username;

        await database.CreateTweet(username, safe);

        return res.redirect('/');

    } catch (err) {
        console.error('Error:', err);
    }
}

const SearchPostView = async(req, res) => {
    let form = new formidable.IncomingForm();

    try {
        const { fields } = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({ fields });
                }
            });
        });

        let query = fields.q[0];

        return res.redirect('/' + query)
    } catch (err) {
        console.error(err);
    }
}

module.exports = { 
    HomeGetView,
    
    TweetPostView,

    SearchPostView
};