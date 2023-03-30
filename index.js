// top tier requirements
const express = require('express');
const hbs = require('express-handlebars');
const path = require('path');

// 3rd party requirements
const passport = require('passport');
const session = require('express-session');
const mongoose = require('mongoose');
const hbMoment = require('handlebars-helper-moment')();
const hbHelpers = require('handlebars-helpers')();

// Database for users, tweets etc
const User = require('./model/user');

const { homeView } = require('./controllers/home');

const {
    loginGetView, 
    loginPostView, 
    registerGetView, 
    registerPostView, 
    logoutGetView, 
} = require('./controllers/auth');

const {
    profileGetView, 
    editProfileGetView, 
    saveProfilePostView 
} = require('./controllers/user');

const { postPostView, deleteGetView, likeGetView } = require('./controllers/post');

global.__basedir = __dirname;

// Setup express and router
const app = express();
const router = express.Router();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Setup session parameters for when users are logged in
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60 * 60 * 1000 } // Cookie lasts for one hour
}));

// Passport authentication initialization
app.use(passport.initialize());
app.use(passport.session());

// Serialization and deserialization for 'Users'
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

passport.use(User.createStrategy());

// Custom middle-ware to pass auth parameters to handlebars
app.use((req, res, next) => {
    // local variables within hbs
    res.locals.authenticated = req.isAuthenticated();

    if (req.isAuthenticated()) {
        res.locals.username = req.user.username;
        res.locals.admin = req.user.isAdmin;
    }

    res.locals.message = req.session.message;

    next();
});

// Connect to the mongodb!
mongoose.connect(process.env.DB_CONN, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

app.use('/', router);
app.use(express.static(path.join(__dirname, '/views/')));
app.use('/storage', express.static(path.join(__dirname, '/storage/')));
app.use('/css', express.static(path.join(__dirname, '/node_modules/bootstrap/dist/css')));

let hbsEngine = hbs.create({ extname: '.hbs', helpers: {hbHelpers, hbMoment}, partialsDir: path.join(__dirname, '/partials/') });

app.engine(hbsEngine.extname, hbsEngine.engine);

app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'hbs');

// Home Controller
router.get('/', homeView);

// Auth Controller
router.get('/logout', logoutGetView);
router.get('/register', registerGetView);
router.get('/login', loginGetView);

router.post('/login', loginPostView);
router.post('/register', registerPostView);

// User Controller
router.get('/profile/:username', profileGetView);
router.get('/profile', profileGetView);
router.get('/editprofile', editProfileGetView);

router.post('/saveprofile', saveProfilePostView);

// Post Controller
router.get('/delete/:id', deleteGetView);
router.get('/like/:id', likeGetView);

router.post('/post', postPostView);

app.listen(process.env.PORT);

console.log('ATC is listening on port 8080!');