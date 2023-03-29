const User = require('../model/user');
const Post = require('../model/post');
const passport = require('passport');
const formidable = require('formidable');
const path = require('path');
const fs = require('fs');

const loginGetView = (req, res) => {
    // If we are logged in the user should not be able to access this page
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }
    
    return res.render('login', { title: 'A Twitter Clone | Log in' });
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
    let form = new formidable.IncomingForm();

    form.parse(req, function(err, fields, file) {
        let username = fields.username;
        let email = fields.email;
        let password = fields.password;
        let confirmPassword = fields.confirmPassword;

        console.log(fields);

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
};

const logoutGetView = (req, res) => {
    req.logout((err) => {
        if (err)
            // If the user is not signed in we throw them back to the home page
            return res.redirect('/');
    });
    return res.redirect('/');
};

// BUG: On session profile CSS does not apply correctly
const profileGetView = async (req, res) => {
    let username = req.params.username;

    if (!req.isAuthenticated())
        return res.redirect('/login');

    if (!username) {
        username = req.user.username;
    }

    let name = "";
    let description = "";
    let picture = "";

    await User.findByUsername(username).then(docObj => {
        const profile = docObj.profile;

        name = profile.name;
        description = profile.description;
        picture = profile.picture.location;
    });

    await Post.find({ username: username }).limit(10).then(docsObj => {
        const docs = docsObj.reverse().map(doc => doc.toJSON());

        return res.render('profile', { 
            title: 'A Twitter Clone | ' + username,
            profilePicture: picture,
            profileName: name,
            profileUsername: username,
            profileDescription: description,
            posts: docs 
        });
    });
};

const editProfileGetView = async (req, res) => {
    if (!req.isAuthenticated())
        return res.redirect('/login');
    
    const username = req.user.username;

    let name = "";
    let description = "";
    let picture = "";

    await User.findByUsername(username).then(docObj => {
        const profile = docObj.profile;

        name = profile.name;
        description = profile.description;
        picture = profile.picture;
    });

    return res.render('editprofile', {
        name: name,
        description: description,
        picture: picture
    })
};

const saveProfilePostView = async (req, res) => {
    if (!req.isAuthenticated())
        return res.redirect('/login');
    
    let form = new formidable.IncomingForm();

    let username = req.user.username;

    let name = '';
    let description = '';

    let location = '';
    let contentType = '';

    form.parse(req, function(err, fields, file) {
        console.log(file);

        let oldFilePath = file.picture.filepath;
        let newFilePath = path.join(__basedir, '/storage/', file.picture.newFilename);
        let fileLocation = path.join('/storage/', file.picture.newFilename);
        let fileContentType = file.picture.mimetype;

        fs.copyFile(oldFilePath, newFilePath, (err) => {
            if (err)
                console.log(err);
        });

        name = fields.name;
        description = fields.description;
        location = fileLocation;
        contentType = fileContentType
    });

    const user = await User.findByUsername(username);

    user.profile.name = name;
    user.profile.description = description;

    user.profile.picture.location = location;
    user.profile.picture.contentType = contentType;

    await user.save();

    return res.redirect('/profile');
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