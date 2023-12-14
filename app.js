const express = require('express');
const expressHb = require('express-handlebars');
const hbHelpers = require('handlebars-helpers')();
const expressSession = require('express-session');
const path = require('path');
const cors = require('cors');
const flash = require('connect-flash');

require('dotenv').config()

const database = require('./utils/Database');

const { 
    HomeGetView, 
    TweetPostView,
    SearchPostView
} = require('./controllers/home');

const {
    LoginGetView,
    LoginPostView,

    RegisterGetView,
    RegisterPostView,

    SignOutGetView
} = require('./controllers/auth');

const {
    ProfileGetView,
    EditProfilePostView,
    FollowProfilePostView,
    UnfollowProfilePostView
} = require('./controllers/profile');

const {
    LikeTweetPostView,
    UnLikeTweetPostView,
    CommentsPostView,
    DeleteTweetPostView
} = require('./controllers/tweet');

const { RequireAuthorization } = require('./utils/AuthCheck');


const app = express();
const router = express.Router();

app.use(cors());
app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use(expressSession({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true
}));

app.use(flash());

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.accessToken && req.session.idToken;
    res.locals.username = req.session.username;
    next();
});

app.use('/', router);

app.use(express.static(path.join(__dirname, 'views')));
app.use(express.static(path.join(__dirname, 'public')));

let hbsEngine = expressHb.create({ extname: '.hbs', helpers: { hbHelpers }, partialsDir: path.join(__dirname, 'views', 'components')});

app.engine(hbsEngine.extname, hbsEngine.engine);

app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'hbs');

router.get('/', HomeGetView);

router.post('/tweet', RequireAuthorization, TweetPostView);

router.get('/login', LoginGetView);
router.post('/login', LoginPostView);

router.get('/register', RegisterGetView);
router.post('/register', RegisterPostView);

router.get('/signout', RequireAuthorization, SignOutGetView);

router.get('/:username(\\w+)', RequireAuthorization, ProfileGetView);

router.post('/search', RequireAuthorization, SearchPostView);

router.post('/editprofile', RequireAuthorization, EditProfilePostView)

router.post('/follow', RequireAuthorization, FollowProfilePostView);
router.post('/unfollow', RequireAuthorization, UnfollowProfilePostView);
router.post('/like', RequireAuthorization, LikeTweetPostView);
router.post('/unlike', RequireAuthorization, UnLikeTweetPostView);
router.post('/comments', RequireAuthorization, CommentsPostView);
router.post('/delete', RequireAuthorization, DeleteTweetPostView);

const port = process.env.PORT || 3000;

app.listen(port);

console.log(`ATC is now running on ${port}!`);