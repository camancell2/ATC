const User = require('../model/user');
const passport = require('passport');
const formidable = require('formidable');
const path = require('path');
const fs = require('fs');

const utils = require('../utils.js');

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

const profileGetView = async (req, res) => {
    let username = req.params.username;

    if (!req.isAuthenticated())
        return res.redirect('/login');

    if (!username) {
        username = req.user.username;
    }

    const profile = await utils.GetProfileByUsername(username);

    if (!profile)
        return res.redirect('/profile');

    const name = profile.name;
    const description = profile.description;
    const picture = profile.picture.location;

    const profilePosts = await utils.GetPostsByUsername(username, {'postDate':1}, 10);

    return res.render('profile', { 
        title: 'A Twitter Clone | ' + username,
        profilePicture: picture,
        profileName: name,
        profileUsername: username,
        profileDescription: description,
        posts: profilePosts 
    });
};

const editProfileGetView = async (req, res) => {
    req.session.message = '';

    if (!req.isAuthenticated())
        return res.redirect('/login');
    
    const username = req.user.username;

    const profile = await utils.GetProfileByUsername(username);

    if (!profile)
        return res.redirect('/profile');

    const name = profile.name;
    const description = profile.description;
    const picture = profile.picture;

    return res.render('editprofile', {
        title: 'A Twitter Clone | Edit Profile',
        name: name,
        description: description,
        picture: picture
    })
};

const saveProfilePostView = async (req, res) => {
    res.locals.message = '';

    if (!req.isAuthenticated())
        return res.redirect('/login');
    
    let form = new formidable.IncomingForm();

    let username = req.user.username;

    let name = '';
    let description = '';

    let location = '';
    let contentType = '';

    form.parse(req, async function(err, fields, file) {
        let oldFilePath = file.picture.filepath;
        let fileSize = file.picture.size;
        let newFilePath = path.join(__basedir, '/storage/', file.picture.newFilename);
        let fileLocation = path.join('/storage/', file.picture.newFilename);
        let fileContentType = file.picture.mimetype;

        fs.copyFile(oldFilePath, newFilePath, (err) => {
            if (err)
                console.log(err);
        });

        if (fileSize <= 0) {
            fileLocation = '/storage/default.png';
            fileContentType = 'image/png';
        } else if (fileSize >= 2000000) {
            req.session.message = 'The picture uploaded is too large'
            return res.redirect('/editprofile');
        } else {
            name = fields.name;
            description = fields.description;
            location = fileLocation;
            contentType = fileContentType

            const user = await utils.GetUserByUsername(username);

            user.profile.name = name;
            user.profile.description = description;
        
            user.profile.picture.location = location;
            user.profile.picture.contentType = contentType;
        
            await utils.UpdateUserByUsername(username, user);
        
            return res.redirect('/profile');
        }
    });
}

module.exports = {
    loginGetView,
    loginPostView,
    registerGetView,
    registerPostView,
    logoutGetView,
    profileGetView,
    editProfileGetView,
    saveProfilePostView
}