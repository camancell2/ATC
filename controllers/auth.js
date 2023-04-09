const User = require('../model/user');
const passport = require('passport');
const formidable = require('formidable');

const loginGetView = (req, res) => {
    req.session.message = '';

    // If we are logged in the user should not be able to access this page
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }
    
    return res.render('login', { title: 'A Twitter Clone | Log in' });
};


const loginPostView = async (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err)
            return res.redirect('/login');

        if (!user) {
            req.session.message = 'The username or password is incorrect';
            return res.redirect('/login');
        }

        req.login(user, {session: true}, (err) => {
            if (err) {
                res.redirect('/login');
            }

            return res.redirect('/');
        });
    })(req, res, next);
};

const registerGetView = (req, res) => {
    req.session.message = '';

    if (req.isAuthenticated()) {
        return res.redirect('/');
    }

    return res.render('register', { title: 'A Twitter Clone | Register' })
};

const registerPostView = async (req, res) => {
    let form = new formidable.IncomingForm();

    form.parse(req, async (err, fields, file) => {
        let username = fields.username;
        let email = fields.email;
        let password = fields.password;
        let confirmPassword = fields.confirmPassword;

        if (password != confirmPassword) {
            req.session.message = 'Please make sure your passwords match';
            return res.redirect('/register');
        }

        User.register(new User({username: username, email: email, creationDate: new Date()}), password, function(err, user) {
            if (err) {
                req.session.message = err.message;
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
};

const logoutGetView = (req, res) => {
    req.logout((err) => {
        if (err)
            // If the user is not signed in we throw them back to the home page
            return res.redirect('/');
    });
    return res.redirect('/');
};

module.exports = {
    loginGetView,
    loginPostView,
    registerGetView,
    registerPostView,
    logoutGetView,
}