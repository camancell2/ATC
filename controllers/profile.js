const formidable = require('formidable');

const database = require('../utils/Database');

const s3Utils = require('../utils/S3Utils');

const fs = require('fs');

function convertTimestampToDate(unixTimestamp) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const date = new Date(unixTimestamp);
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${month} ${year}`;
}

const ProfileGetView = async (req, res) => {
    const username = req.params.username.toLowerCase();
    const viewer = req.session.username.toLowerCase();

    res.locals.showLines = true;
    res.locals.profileOwner = viewer === username;

    let profile = await database.RetrieveProfileByUsername(username);
    let profileTweets = await database.RetrieveTweetsByUsername(username, viewer);


    let isFollowing = await database.IsFollowing(viewer, username);

    if (profile == null) {
        req.flash("warning", "User was not found!");
        return res.redirect('/');
    }

    const userProfile = {
        bannerImage: profile.banner_img,
        profileImage: profile.profile_img,
        name: profile.profile_name,
        username: profile.username,
        bio: profile.profile_bio,
        followingCount: profile.following.length,
        followerCount: profile.followers.length,
        joinDate: convertTimestampToDate(profile.join_date)
    }

    profileTweets = profileTweets.map(tweet => {
        tweet.isPostCreator = tweet.username.toLowerCase() === viewer;
        return tweet;
    });

    const tweetsAvailable = profileTweets.length > 0;

    res.render('profile', { profileTweets, userProfile, isFollowing, viewer, tweetsAvailable, messages: req.flash() });
}

const defaultProfile = 'https://elasticbeanstalk-us-west-1-726751925359.s3.us-west-1.amazonaws.com/default_profile.png';
const defaultBanner = 'https://elasticbeanstalk-us-west-1-726751925359.s3.us-west-1.amazonaws.com/default_banner.png';

const EditProfilePostView = async (req, res) => {
    const username = req.session.username;

    let form = new formidable.IncomingForm({
        allowEmptyFiles: true,
        maxFileSize: 5 * 1024 * 1024 * 1024,
        minFileSize: 0
    });

    try {
        const { fields, files } = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({ fields, files });
                }
            });
        });

        const name = fields.name[0];
        const bio = fields.bio[0];

        let profileImageUrl = '';
        let bannerImageUrl = '';

        const profileImage = files.profileImageFile ? files.profileImageFile[0] : null;
        const bannerImage = files.bannerImageFile ? files.bannerImageFile[0] : null;

        if (profileImage && profileImage.size > 0) {
            const profileImageFs = fs.createReadStream(profileImage.filepath);
            profileImageUrl = await s3Utils.UploadImage(`${username}_profile.png`, profileImageFs);
        }

        if (bannerImage && bannerImage.size > 0) {
            const bannerImageFs = fs.createReadStream(bannerImage.filepath);
            bannerImageUrl = await s3Utils.UploadImage(`${username}_banner.png`, bannerImageFs);
        }

        await database.UpdateProfileByUsername(username, name, bannerImageUrl, profileImageUrl, bio);

    } catch (err) {
        console.error(err);
        // Handle error: e.g., display an error page or redirect
        res.status(500).send('Error updating profile');
        return;
    }

    res.redirect('/' + username);
};

const FollowProfilePostView = async (req, res) => {
    // Who are we following
    const { username } = req.query; 

    // The profile we are following
    const owner = req.session.username;
    
    try
    {
        await database.FollowUser(owner, username);
    }
    catch (err)
    {
        console.log(err);
    }

    res.redirect('/' + owner);
};

const UnfollowProfilePostView = async (req, res) => {
    // Who are we following
    const { username } = req.query; 

    // The profile we are following
    const owner = req.session.username;
    
    try
    {
        await database.UnfollowUser(owner, username);
    }
    catch (err)
    {
        console.log(err);
    }

    res.redirect('/' + owner);
};

module.exports = {
    ProfileGetView,
    EditProfilePostView,
    FollowProfilePostView,
    UnfollowProfilePostView
}