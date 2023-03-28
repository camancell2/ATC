// top tier requirements
const express = require('express');
const hbs = require('express-handlebars');
const path = require('path');

// 3rd party requirements
const passport = require('passport');
const session = require('express-session');
const mongoose = require('mongoose');
const datetime = require('date-and-time');
const hbHelpers = require('handlebars-helpers')();

// Database for users, tweets etc
const User = require('./model/user');
const Post = require('./model/post');

const SITE_NAME = "A Twitter Clone";

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

app.use((req, res, next) => {
    // local variables within hbs
    res.locals.authenticated = req.isAuthenticated();

    if (req.isAuthenticated()) {
        res.locals.username = req.user.username;
        res.locals.admin = req.user.isAdmin;
    }
    next();
});

mongoose.connect(process.env.DB_CONN, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

app.use('/', router);
app.use(express.static(path.join(__dirname, '/views/')));

let hbsEngine = hbs.create({ extname: '.hbs', helpers: Object.assign({}, hbHelpers) });

app.engine(hbsEngine.extname, hbsEngine.engine);

app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'hbs');

router.get('/', async (req, res, next) => {
    await Post.find().limit(10).then(docs => {
        const docJson = docs.map(doc=>doc.toJSON());
        res.render('index', {posts: docJson});
    });
});

router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err)
            // If the user is not signed in we throw them back to the home page
            res.redirect('/');
    });
    res.redirect('/');
});

router.route('/register')
    .get((req, res) => {
        // If we are logged in the user should not be able to access this page
        if (req.isAuthenticated()) {
            return res.redirect('/');
        }

        res.render('register', { title: SITE_NAME + ' | Sign Up' });
    }).post((req, res) => {
        const body = req.body;

        const username = body['username'];
        const email = body['email'];
        const password = body['password'];
        const confirmPassword = body['confirmPassword'];

        // TODO: verify data above ^

        User.register(new User({username: username, email: email, creationDate: new Date()}), password, function(err, user) {
           if (err) {
                console.log(err);
                res.redirect('/register');
           } else {
               req.login(user, (err) => {
                   if (err) {
                       res.redirect('/register'); 
                   } else {
                       res.redirect('/login');
                   }
               });
           }
        });
    });

router.route('/login')
    .get((req, res) => {
        // If we are logged in the user should not be able to access this page
        if (req.isAuthenticated()) {
            return res.redirect('/');
        }

        res.render('login', { title: SITE_NAME + ' | Sign In'});
    }).post(async (req, res, next) => {
        passport.authenticate('local', (err, user, info) => {
            if (err) return res.redirect('/login');
            if (!user) return res.redirect('/login');

            req.login(user, {session: true}, (err) => {
                return res.redirect('/');
            });
        })(req, res);
    });

router.post('/post', (req, res) => {
    const body = req.body;

    if (req.isAuthenticated()) {
        const post = body['post'];
        const username = req.user.username;

        Post.create({post: post, username: username, postDate: new Date()});

        return res.redirect('/');
    }

    return res.redirect('/login');
});

router.get('/delete/:id', async (req, res, next) => {
    const postId = req.params.id;

    if (req.isAuthenticated()) {
        await Post.findByIdAndDelete(postId);
        return res.redirect('/');
    }

    // TODO: Throw error if user attempts to delete while not in correct context
    return res.redirect('/');
});

app.listen(process.env.PORT);

console.log('ATC is listening on port 8080!');