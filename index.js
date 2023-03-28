// top tier requirements
const express = require('express');
const path = require('path');

// 3rd party requirements
const passport = require('passport');
const session = require('express-session');

// Database for users, tweets etc
const User = require('./model/user');

const SITE_NAME = "A Twitter Clone";

// Setup express and router
const app = express();
const router = express.Router();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Setup session parameters for when users are logged in
app.use(session({
    secret: 'supersecret',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60 * 60 * 1000 } // Cookie lasts for one hour
}));

// Passport authentication initialization
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

passport.use(User.createStrategy());

app.use((req, res, next) => {
    res.locals.authenticated = req.isAuthenticated();

    if (req.isAuthenticated()) {
        res.locals.username = req.user.username;
    }
    next();
});

app.use('/', router);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

router.get('/', (req, res) => {
    res.render('index');
});

router.get('/logout', (req, res) => {
    req.logout((err) => {
        
    });
    res.redirect('/');
});

router.route('/register')
    .get((req, res) => {
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

app.listen(process.env.port || 8080);

console.log('ATC is listening on port 8080!');