const User = require('../model/user');
const passport = require('passport');
const formidable = require('formidable');

const loginGetView = (req, res) => {
    req.session.message = ''; // Reset the error message

    // If we are logged in the user should not be able to access this page
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }
    
    return res.render('login', { title: 'A Twitter Clone | Log in' });
};


const loginPostView = async (req, res, next) => {
    // Passport uses pre set params with forms (such as username and password)
    // So we just authenticate using the 'local' strategy
    passport.authenticate('local', (err, user, info) => {
        // If any errors just redirect them to login
        if (err)
            return res.redirect('/login');

        // If invalid username or password
        // Set error message and redirect to login
        if (!user) {
            req.session.message = 'The username or password is incorrect';
            return res.redirect('/login');
        }

        // Finally we process the login and create the session along with the cookie
        req.login(user, {session: true}, (err) => {
            // Same as above
            if (err) {
                res.redirect('/login');
            }

            // Finally we redirect them to the home page
            return res.redirect('/');
        });
    })(req, res, next);
};

const registerGetView = (req, res) => {
    req.session.message = '';

    // If the user is already logged in just redirect to home page.. why are you even trying to register? >:(
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }

    // In any other case we just render the registration page
    return res.render('register', { title: 'A Twitter Clone | Register' })
};

const registerPostView = async (req, res) => {
    let form = new formidable.IncomingForm();

    // When the user clicks submit we fire it through a form parser
    form.parse(req, async (err, fields, file) => {
        // get our data from the form
        let username = fields.username;
        let email = fields.email;
        let password = fields.password;
        let confirmPassword = fields.confirmPassword;

        // Check if the passwords match
        if (password != confirmPassword) {
            req.session.message = 'Please make sure your passwords match';
            return res.redirect('/register');
        }

        // Passport provides a set of helper functions to create the user doc 
        // as well as salt and hash the password to be secure
        User.register(new User({username: username, email: email, creationDate: new Date()}), password, function(err, user) {
            // If registration fails set the predefined error message from passport and redirect
            // back to registration page
            if (err) {
                req.session.message = err.message;
                res.redirect('/register');
            } else {
                // Otherwise we just log the user in
                req.login(user, (err) => {
                    // If login fails just redirect back to login page
                    if (err) {
                        res.redirect('/login'); 
                    } else {
                        // Redirect back to home if success
                        res.redirect('/');
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
    // Take the user back to the home page
    return res.redirect('/');
};

module.exports = {
    loginGetView,
    loginPostView,
    registerGetView,
    registerPostView,
    logoutGetView,
}