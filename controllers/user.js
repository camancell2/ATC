const User = require('../model/user');
const passport = require('passport');

const loginGetView = (req, res) => {
    // If we are logged in the user should not be able to access this page
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }
    
    res.render('login', { title: 'A Twitter Clone | Log in' });
};

const loginPostView = (req, res) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return res.redirect('/login');
        if (!user) return res.redirect('/login');

        req.login(user, {session: true}, (err) => {
            return res.redirect('/');
        });
    })(req, res);
};

const registerGetView = (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }

    return res.render('register', { title: 'A Twitter Clone | Register'})
};

const registerPostView = (req, res) => {
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
};

const logoutView = (req, res) => {
    req.logout((err) => {
        if (err)
            // If the user is not signed in we throw them back to the home page
            res.redirect('/');
    });
    res.redirect('/');
};

module.exports = {
    loginGetView,
    loginPostView,
    registerGetView,
    registerPostView,
    logoutView
}