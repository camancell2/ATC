const aws = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

aws.config.update({
    //endpoint: process.env.DATABASE_ENDPOINT,
    region: process.env.DATABASE_REGION,
    accessKeyId: process.env.DATABASE_ACCESS_KEY,
    secretAccessKey: process.env.DATABASE_SECRET_KEY
});

const docClient = new aws.DynamoDB.DocumentClient();

function PostedTime(timestamp) {
    const currentTime = Math.floor(Date.now());
    const timeDifference = (currentTime - timestamp) / 1000;

    if (timeDifference < 1) {
        return 'Just now';
    } else if (timeDifference < 60) {
        return `${Math.round(timeDifference)}s ago`; // Seconds
    } else if (timeDifference < 3600) {
        return `${Math.floor(timeDifference / 60)}m ago`; // Minutes
    } else if (timeDifference < 86400) {
        return `${Math.floor(timeDifference / 3600)}hr ago`; // Hours
    } else {
        return `${Math.floor(timeDifference / 86400)}d ago`; // Days or more
    }
}

const CreateProfile = async(username) => {
    const params = {
        TableName: 'profiles',
        Item: {
            database_id: uuidv4(),
            profile_name: '',
            username: username.toLowerCase(),
            banner_img: 'https://elasticbeanstalk-us-west-1-726751925359.s3-us-west-1.amazonaws.com/default_banner.png',
            profile_img: 'https://elasticbeanstalk-us-west-1-726751925359.s3-us-west-1.amazonaws.com/default_profile.png',
            following: [],
            followers: [],
            profile_bio: 'Hello, I\'m new here!',
            join_date: Math.floor(Date.now())
        }
    }

    try {
        await docClient.put(params).promise();
    } catch (err) {
        console.error(err);
    }
}

class ProfileObj {
    constructor(profileName, username, bannerImg, profileImg, followers, following, bio) {
        this.profileName = profileName;
        this.username = username;
        this.bannerImg = bannerImg;
        this.profileImg = profileImg;
        this.followers = followers;
        this.following = following;
        this.bio = bio;
    }

    GetFollowersCount() {
        return this.followers.length;
    }

    GetFollowingCount() {
        return this.following.length;
    }
}

const RetrieveProfileByUsername = async(username) => {
    const params = {
        TableName: 'profiles',
        IndexName: 'username_index',
        KeyConditionExpression: 'username = :username',
        ExpressionAttributeValues: {
            ':username': username
        },
        ProjectionExpression: 'profile_name, username, banner_img, profile_img, followers, following, profile_bio, join_date',
    }

    try {
        const data = await docClient.query(params).promise();
        if (data.Items && data.Items.length > 0) {
            const userData = data.Items[0]; // Assuming one user is retrieved
            return userData;
        } else {
          return null; // User not found
        }
      } catch (err) {
        console.error('Unable to query. Error:', JSON.stringify(err, null, 2));
        return null;
      }
}

const RetrieveDatabaseIdByUsername = async (username) => {
    try {
        const params = {
            TableName: 'profiles',
            IndexName: 'username_index',
            KeyConditionExpression: 'username = :username',
            ExpressionAttributeValues: {
                ':username': username
            },
            ProjectionExpression: 'database_id'
        };

        const data = await docClient.query(params).promise();
        if (data.Items && data.Items.length > 0) {
            // Assuming one user is retrieved, returning the databaseId
            return data.Items[0].database_id;
        } else {
            return null; // User not found
        }
    } catch (err) {
        console.error('Unable to query. Error:', JSON.stringify(err, null, 2));
        throw err;
    }
};

const UpdateProfileByUsername = async (username, name, bannerImg, profileImg, bio) => {
    try {
        const userProfile = await RetrieveProfileByUsername(username);
        const databaseId = await RetrieveDatabaseIdByUsername(username);

        // Retain existing values if new ones are empty
        const updatedName = name !== '' ? name : userProfile.name || '';
        const updatedBannerImg = bannerImg !== '' ? bannerImg : userProfile.banner_img || '';
        const updatedProfileImg = profileImg !== '' ? profileImg : userProfile.profile_img || '';
        const updatedBio = bio !== '' ? bio : userProfile.bio || '';

        const params = {
            TableName: 'profiles',
            IndexName: 'username_index',
            KeyConditionExpression: 'username = :username',
            Key: {
                database_id: databaseId
            },
            UpdateExpression: 'SET #nm = :profile_name, banner_img = :banner_img, profile_img = :profile_img, #bi = :profile_bio',
            ExpressionAttributeNames: {
                '#nm': 'profile_name',
                '#bi': 'profile_bio'
            },
            ExpressionAttributeValues: {
                ':profile_name': updatedName,
                ':banner_img': updatedBannerImg,
                ':profile_img': updatedProfileImg,
                ':profile_bio': updatedBio
            },
            ReturnValues: 'UPDATED_NEW'
        };

        const data = await docClient.update(params).promise();
        return data.Attributes; // Return the updated profile attributes
    } catch (err) {
        console.error('Error updating profile:', err);
        throw err;
    }
};

const RetrieveFocusedTweetsByUsername = async (username, viewer) => {
    let focusedTweets = [];

    const tweetParams = {
        TableName: 'tweets',
        IndexName: 'username_index',
        KeyConditionExpression: 'username = :username',
        ExpressionAttributeValues: {
            ':username': username
        },
        ProjectionExpression: 'post_id, tweet, post_date, likes, comments', // Assuming 'post_date' is the attribute storing the timestamp
        ScanIndexForward: false // Sort in descending order based on 'post_date'
    };

    const profileParams = {
        TableName: 'profiles',
        IndexName: 'username_index',
        KeyConditionExpression: 'username = :username',
        ExpressionAttributeValues: {
            ':username': username,
        },
        ProjectionExpression: 'profile_name, username, profile_img, following',
    };

    try {
        // first we query for our tweets
        const [profileData, tweetData] = await Promise.all([
            docClient.query(profileParams).promise(),
            docClient.query(tweetParams).promise()
        ]);

        if (profileData.Items && tweetData.Items) {
            const profile = profileData.Items[0];

            tweetData.Items.map((tweet) => {
                const posted = PostedTime(tweet.post_date);

                focusedTweets.push({
                    post_id: tweet.post_id,
                    avatar: profile.profile_img,
                    name: profile.profile_name,
                    username: profile.username,
                    content: tweet.tweet,
                    posted: posted,
                    liked: tweet.likes.includes(viewer),
                    likesCount: tweet.likes.length,
                    comments: tweet.comments,
                    commentsCount: tweet.comments.length
                });
            });

            for (var user of profile.following) {
                const tweets = await RetrieveTweetsByUsername(user, viewer);
                tweets.map((tweet) => {
                    focusedTweets.push(tweet);
                });
            }
        }

        // now lets try and get the tweets of users who WE follow
    }
    catch (err) {
        console.error(err);
    }

    // focusedTweets.sort((a, b) => {
    //     const dateA = new Date(a.post_date).getTime();
    //     const dateB = new Date(b.post_date).getTime();
    //     return dateB - dateA;
    // });

    return focusedTweets;
};

const RetrieveTweetsAuthenticated = async(viewer) => {
    const tweets = [];

    const tweetParams = {
        TableName: 'tweets',
        Limit: 10,
    }

    try {
        const [TweetData] = await Promise.all([
            docClient.scan(tweetParams).promise()
        ]);

        if (TweetData.Items) {
            for (var tweet of TweetData.Items) {
                const profile = await RetrieveProfileByUsername(tweet.username);
                const posted = PostedTime(tweet.post_date);
                tweets.push({
                    post_id: tweet.post_id,
                    avatar: profile.profile_img,
                    name: profile.profile_name,
                    username: profile.username,
                    content: tweet.tweet,
                    posted: posted,
                    liked: tweet.likes.includes(viewer),
                    likesCount: tweet.likes.length,
                    comments: tweet.comments,
                    commentsCount: tweet.comments.length,
                    post_date: tweet.post_date
                })                
            }

            tweets.sort((a, b) => {
                const dateA = new Date(a.post_date).getTime();
                const dateB = new Date(b.post_date).getTime();
                return dateB - dateA;
            });

            return tweets;
        }
    } catch (err) {
        console.error(err);
    }

    return tweets;
}

const RetrieveTweetsNotAuthenticated = async() => {
    const tweets = [];

    const tweetParams = {
        TableName: 'tweets',
        Limit: 10,
    }

    try {
        const [TweetData] = await Promise.all([
            docClient.scan(tweetParams).promise()
        ]);

        if (TweetData.Items) {
            for (var tweet of TweetData.Items) {
                const profile = await RetrieveProfileByUsername(tweet.username);
                const posted = PostedTime(tweet.post_date);
                tweets.push({
                    post_id: tweet.post_id,
                    avatar: profile.profile_img,
                    name: profile.profile_name,
                    username: profile.username,
                    content: tweet.tweet,
                    posted: posted,
                    liked: false,
                    likesCount: tweet.likes.length,
                    comments: tweet.comments,
                    commentsCount: tweet.comments.length,
                    post_date: tweet.post_date
                })                
            }

            tweets.sort((a, b) => {
                const dateA = new Date(a.post_date).getTime();
                const dateB = new Date(b.post_date).getTime();
                return dateB - dateA;
            });

            return tweets;
        }
    } catch (err) {
        console.error(err);
    }

    return tweets;
}

const RetrieveTweetsByUsername = async (username, viewer) => {
    const tweetParams = {
        TableName: 'tweets',
        IndexName: 'username_index',
        KeyConditionExpression: 'username = :username',
        ExpressionAttributeValues: {
            ':username': username
        },
        ProjectionExpression: 'post_id, tweet, post_date, likes, comments', // Assuming 'post_date' is the attribute storing the timestamp
        ScanIndexForward: false // Sort in descending order based on 'post_date'
    };

    const profileParams = {
        TableName: 'profiles',
        IndexName: 'username_index',
        KeyConditionExpression: 'username = :username',
        ExpressionAttributeValues: {
            ':username': username,
        },
        ProjectionExpression: 'profile_name, username, profile_img',
    };

    try {
        const [profileData, tweetData] = await Promise.all([
            docClient.query(profileParams).promise(),
            docClient.query(tweetParams).promise()
        ]);

        if (tweetData.Items && tweetData.Items.length > 0) {
            const profile = profileData.Items[0];
            const tweets = tweetData.Items.map((tweet) => {
                const posted = PostedTime(tweet.post_date);
                return {
                    post_id: tweet.post_id,
                    avatar: profile.profile_img,
                    name: profile.profile_name,
                    username: profile.username,
                    content: tweet.tweet,
                    posted: posted,
                    liked: tweet.likes.includes(viewer),
                    likesCount: tweet.likes.length,
                    comments: tweet.comments,
                    commentsCount: tweet.comments.length

                };
            });

            return tweets;
        } else {
            return [];
        }
    } catch (err) {
        console.error('Unable to query. Error:', JSON.stringify(err, null, 2));
        return null;
    }
};

const DeleteTweet = async (postId) => {
    const params = {
        TableName: 'tweets',
        Key: {
            post_id: postId
        }
    };

    try {
        await docClient.delete(params).promise();
    } catch (err) {
        console.error(`Error deleting tweet with ID ${postId}:`, err);
    }
};

const CreateTweet = async(username, tweet) => {
    const params = {
        TableName: 'tweets',
        Item: {
            post_id: uuidv4(),
            username: username,
            tweet: tweet,
            images: [],
            post_date: new Date().getTime(),
            likes: [],
            comments: []
        }
    }

    try {
        await docClient.put(params).promise();
    } catch (err) {
        console.error(err);
    }
}

const IsFollowing = async (username, followUsername) => {
    try {
        // Retrieve potential users with the specified username
        const paramsInitiatingUser = {
            TableName: 'profiles',
            IndexName: 'username_index',
            KeyConditionExpression: 'username = :username',
            ExpressionAttributeValues: {
                ':username': username
            },
            ProjectionExpression: 'following',
        };

        const usersWithUsername = await docClient.query(paramsInitiatingUser).promise();

        // Check each potential user found in the index for the specific user
        for (const user of usersWithUsername.Items) {
            if (user.following && user.following.includes(followUsername)) {
                return true;
            }
        }

        return false; // FollowUsername not found in any 'following' list
    } catch (err) {
        console.error(err);
        return false; // Error occurred during database operation
    }
};

const RetrieveFollowers = async (username) => {
    try {
        const params = {
            TableName: 'profiles',
            IndexName: 'username_index',
            KeyConditionExpression: 'username = :username',
            ExpressionAttributeValues: {
                ':username': username
            },
            ProjectionExpression: 'followers'
        };

        const data = await docClient.query(params).promise();
        if (data.Items && data.Items.length > 0) {
            const followers = data.Items[0].followers;
            return followers;
        } else {
            return null; // User not found
        }
    } catch (err) {
        console.error('Unable to query. Error:', JSON.stringify(err, null, 2));
        throw err;
    }
}

const FollowUser = async (username, followUsername) => {
    const databaseId1 = await RetrieveDatabaseIdByUsername(username);
    const databaseId2 = await RetrieveDatabaseIdByUsername(followUsername);

    const paramsInitiatingUser = {
        TableName: 'profiles',
        Key: {
            database_id: databaseId1
        },
        UpdateExpression: 'SET following = list_append(if_not_exists(following, :empty_list), :followUsername)',
        ExpressionAttributeValues: {
            ':followUsername': [followUsername],
            ':empty_list': []
        }
    };

    const paramsFollowedUser = {
        TableName: 'profiles',
        Key: {
            database_id: databaseId2
        },
        UpdateExpression: 'SET followers = list_append(if_not_exists(followers, :empty_list), :username)',
        ExpressionAttributeValues: {
            ':username': [username],
            ':empty_list': [] 
        }
    };

    try {
        await docClient.update(paramsInitiatingUser).promise();

        await docClient.update(paramsFollowedUser).promise();
    } catch (err) {
        console.error(err);
    }
};

const UnfollowUser = async (username, followUsername) => {
    const databaseId1 = await RetrieveDatabaseIdByUsername(username);
    const databaseId2 = await RetrieveDatabaseIdByUsername(followUsername);

    try {
        // Retrieve the 'following' list of the initiating user
        const initiatingUser = await docClient.get({
            TableName: 'profiles',
            Key: {
                database_id: databaseId1
            },
            ProjectionExpression: 'following'
        }).promise();

        // Retrieve the 'followers' list of the followed user
        const followedUser = await docClient.get({
            TableName: 'profiles',
            Key: {
                database_id: databaseId2
            },
            ProjectionExpression: 'followers'
        }).promise();

        if (initiatingUser.Item && followedUser.Item) {
            // Update 'following' list of the initiating user
            const newFollowing = new Set(initiatingUser.Item.following);
            newFollowing.delete(followUsername);

            // Update 'followers' list of the followed user
            const newFollowers = new Set(followedUser.Item.followers);
            newFollowers.delete(username);

            // Update the profiles with modified sets
            await docClient.update({
                TableName: 'profiles',
                Key: { database_id: databaseId1 },
                UpdateExpression: 'SET following = :newFollowing',
                ExpressionAttributeValues: {
                    ':newFollowing': Array.from(newFollowing)
                }
            }).promise();

            await docClient.update({
                TableName: 'profiles',
                Key: { database_id: databaseId2 },
                UpdateExpression: 'SET followers = :newFollowers',
                ExpressionAttributeValues: {
                    ':newFollowers': Array.from(newFollowers)
                }
            }).promise();
        } else {
            console.log('User data not found');
        }
    } catch (err) {
        console.error(err);
    }
};

const LikeTweet = async (post_id, username) => {
    const paramsLikeTweet = {
        TableName: 'tweets',
        Key: {
            post_id: post_id
        },
        UpdateExpression: 'SET likes = list_append(if_not_exists(likes, :empty_list), :username)',
        ExpressionAttributeValues: {
            ':username': [username],
            ':empty_list': [] // Ensures 'followers' exists and is an array
        }
    };

    try {
        await docClient.update(paramsLikeTweet).promise();
    } catch (err) {
        console.error(err);
    }
}

const UnlikeTweet = async (post_id, username) => {
    const tweetLikes = await docClient.get({
        TableName: 'tweets',
        Key: {
            post_id: post_id
        },
        ProjectionExpression: 'likes'
    }).promise();

    if (tweetLikes.Item) {
        const newLikes = new Set(tweetLikes.Item.likes);
        newLikes.delete(username);

        await docClient.update({
            TableName: 'tweets',
            Key: { post_id: post_id },
            UpdateExpression: 'SET likes = :newLikes',
            ExpressionAttributeValues: {
                ':newLikes': Array.from(newLikes)
            }
        }).promise();
    }
}

const GetTweetLikesCount = async(post_id) => {
    const tweetLikes = await docClient.get({
        TableName: 'tweets',
        Key: {
            post_id: post_id
        },
        ProjectionExpression: 'likes'
    }).promise();

    try {
        const tweetLikesData = await docClient.get(tweetLikes).promise();

        if (tweetLikesData.Items) {
            return tweetLikesData.Items.likes.length;
        }

        console.log('Successfully updated likes lists');
    } catch (err) {
        console.error(err);
    }
}

const GetTweetCommentsCount = async(post_id) => {
    const tweetComments = await docClient.get({
        TableName: 'tweets',
        Key: {
            post_id: post_id
        },
        ProjectionExpression: 'comments'
    }).promise();

    try {
        const tweetLikesData = await docClient.get(tweetLikes).promise();

        if (tweetLikesData.Items) {
            return tweetLikesData.Items.comments.length;
        }
    } catch (err) {
        console.error(err);
    }
}

module.exports = {
    CreateProfile,
    CreateTweet,
    DeleteTweet,

    RetrieveProfileByUsername,
    RetrieveTweetsByUsername,
    RetrieveFocusedTweetsByUsername,
    RetrieveTweetsNotAuthenticated,
    RetrieveTweetsAuthenticated,

    UpdateProfileByUsername,
    FollowUser,
    UnfollowUser,
    IsFollowing,

    LikeTweet,
    UnlikeTweet,

    GetTweetLikesCount,
    GetTweetCommentsCount
}