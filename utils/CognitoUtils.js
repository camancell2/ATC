const awsIdentity = require('amazon-cognito-identity-js');

const UserPoolId = process.env.USER_POOL_ID;
const ClientId = process.env.CLIENT_ID;

const poolData = {
    UserPoolId,
    ClientId
};

const userPool = new awsIdentity.CognitoUserPool(poolData);

const Login = async (username, password) => {
    const authData = {
        Username: username,
        Password: password
    };

    const authDetails = new awsIdentity.AuthenticationDetails(authData);

    const userData = {
        Username: username,
        Pool: userPool
    };

    const cognitoUser = new awsIdentity.CognitoUser(userData);

    return new Promise((resolve, reject) => {
        cognitoUser.authenticateUser(authDetails, {
            onSuccess: session => {
                const tokens = {
                    accessToken: session.getAccessToken().getJwtToken(),
                    idToken: session.getIdToken().getJwtToken(),
                    username: cognitoUser.getUsername()
                };
                resolve(tokens);
            },
            onFailure: err => {
                reject(err);
            },
            newPasswordRequired: (userAttributes, requiredAttributes) => {
                // Handle new password requirements if needed
            }
        });
    });
};

const Register = async (username, password, email) => {
    const attributeList = [
        new awsIdentity.CognitoUserAttribute({
            Name: 'email',
            Value: email
        }),
    ];

    return new Promise((resolve, reject) => {
        userPool.signUp(username, password, attributeList, null, (err, result) => {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
};

const SignOut = () => {
    const cognitoUser = userPool.getCurrentUser();

    if (cognitoUser) {
        cognitoUser.signOut();
    }
};

module.exports = {
    Login,
    Register,
    SignOut
}