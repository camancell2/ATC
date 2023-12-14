const awsIdentity = require('amazon-cognito-identity-js');

const UserPoolId = process.env.USER_POOL_ID;
const ClientId = process.env.CLIENT_ID;

const poolData = {
    UserPoolId,
    ClientId
}

const userPool = new awsIdentity.CognitoUserPool(poolData);

function RequireAuthorization(req, res, next) {
    // TODO: Verify token?
    const accessToken = req.headers['authorization'];

    const cognitoUser = userPool.getCurrentUser();

    if (!cognitoUser) {
        req.flash("error", "You must be logged in to do that!");
        return res.redirect('/login');
    }

    cognitoUser.getSession((err, session) => {
        if (err) {
            return res.redirect('/login');
        }

        if (!session.isValid()) {
            return res.redirect('/login');
        }

        req.user = {
            username: session.getIdToken().payload.username
        }

        next();
    });
}

module.exports = {
    RequireAuthorization
}