const formidable = require('formidable');

const cognitoUtils = require('../utils/CognitoUtils');
const database = require('../utils/Database');

const LoginGetView = async (req, res) => {
    res.locals.showLines = false;

    res.render('login', { messages: req.flash() });
};

const LoginPostView = async (req, res) => {
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

        let username = fields.username[0];
        let password = fields.password[0];

        try {
            const tokens = await cognitoUtils.Login(username, password);
            req.session.accessToken = tokens.accessToken;
            req.session.idToken = tokens.idToken;
            req.session.username = tokens.username;
            res.redirect('/');
        } catch (err) {
            if (err.code) {
                req.flash('error', err.message);
                return res.redirect('/login');
            }
        }
    } catch (err) {
        // Handle form parsing errors
    }
};

const RegisterGetView = async (req, res) => {
    res.locals.showLines = false;

    res.render('register', { messages: req.flash() });
}

const RegisterPostView = async (req, res) => {
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

        let username = fields.username[0];
        let email = fields.email[0];
        let password = fields.password[0];

        try {
            await cognitoUtils.Register(username, password, email);
            await database.CreateProfile(username);
            req.flash("warning", "You must verify your email before logging in!");
            res.redirect('/');
        } catch (err) {
            console.log(err);

            switch (err.code) {
                case 'InvalidPasswordException':
                    req.flash('error', 'Password is not long enough.');
                    return res.redirect('/register');

                case 'UsernameExistsException':
                    req.flash('error', 'Username already in use.');
                    return res.redirect('/register');
            }
        }
    } catch (err) {
        console.log(err);
        // Handle other errors or form parsing issues
    }
};


const SignOutGetView = async (req, res) => {
    req.session.accessToken = null;
    req.session.idToken = null;

    cognitoUtils.SignOut();

    res.redirect('/login');
};

module.exports = {
    LoginGetView,
    LoginPostView,

    RegisterGetView,
    RegisterPostView,

    SignOutGetView
}