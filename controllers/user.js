const formidable = require('formidable');
const path = require('path');
const fs = require('fs');

const utils = require('../utils.js');

const profileGetView = async (req, res) => {
    let username = req.params.username;

    if (!req.isAuthenticated())
        return res.redirect('/login');

    if (!username) {
        username = req.user.username;
    }

    // See utils.js:32
    const profile = await utils.GetProfileByUsername(username);

    if (!profile)
        return res.redirect('/profile');

    const name = profile.name;
    const description = profile.description;
    const picture = profile.picture.location;

    // See utils.js:19
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

    // See utils.js:32
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

    // Parse incoming form
    form.parse(req, async function(err, fields, file) {
        const user = await utils.GetUserByUsername(username);

        let fileLocation = '';
        let fileContentType = '';
        
        let fileSize = file.picture.size;

        const name = fields.name;
        const description = fields.description;

        user.profile.name = name;
        user.profile.description = description;

        // If file is empty just set to default profile picture
        if (fileSize <= 0) {
            fileLocation = '/storage/default.png';
            fileContentType = 'image/png';
        // If the file is larger than 2mb then throw error (we don't need 4k++++ photos)
        } else if (fileSize >= 2000000) {
            req.session.message = 'The picture uploaded is too large'
            return res.redirect('/editprofile');
        } else {
            // File is good
            let oldFilePath = file.picture.filepath;
            let newFilePath = path.join(__basedir, '/storage/', file.picture.newFilename);
            
            fileLocation = path.join('/storage/', file.picture.newFilename);
            fileContentType = file.picture.mimetype;
        
            // Move it to our local storage
            fs.copyFile(oldFilePath, newFilePath, (err) => {
                if (err)
                    console.log(err);
            });

            // update accordingly to the user database
            user.profile.picture.location = fileLocation;
            user.profile.picture.contentType = fileContentType;
        }

        await utils.UpdateUserByUsername(username, user);
        
        return res.redirect('/profile');
    });
}

module.exports = {
    profileGetView,
    editProfileGetView,
    saveProfilePostView
}