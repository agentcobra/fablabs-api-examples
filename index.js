var express = require('express'),
    app = express();

process.env.DEBUG = true;

// fablabs.io oAuth Registered App settings - https://www.fablabs.io/oauth/applications/
var config = {
    clientID: '7e9a2eb773cd40349efadd2ca363eb14aeb3956038fe1b961b9545910c0a1a9f',
    clientSecret: '88023adc59d5104d2dd37500fc1c593d1530acb4bc1d4049080cf7c3388e4d9e',
    callbackURL: 'http://quickdev.fablabbcn.org:3000/callback',
    appPort: 3000
}

// fablabs.io oAuth provider settings
var oauth2 = require('simple-oauth2')({
    clientID: config.clientID,
    clientSecret: config.clientSecret,
    site: 'https://api.fablabs.io',
    tokenPath: '/oauth/token',
    authorizationPath: '/oauth/authorize'
});

// Authorization uri definition
var authorization_uri = oauth2.authCode.authorizeURL({
    redirect_uri: config.callbackURL
});

// Initial page redirecting to Fablabs.io
app.get('/auth', function(req, res) {
    res.redirect(authorization_uri);
});

// End point to request the user data from the platform
app.get('/me', function(req, res) {
    checkToken(function() {
        oauth2.api('GET', '/v0/me.json', {
            access_token: token.token.access_token
        }, response);
    });

    function response(error, data) {
        if (error) {
            console.log('API Request Error', error.message);
            res.send(error.message);
        } else {
            res.send(data);
        }
    }

    function checkToken(callback) {
        if (typeof token !== 'undefined' && token.token.access_token) {
            callback();
        } else {
            res.redirect('/auth');
        }
    }
});

// Callback ending the session
app.get('/logout', function(req, res) {
    token.revoke('access_token', function(error) {
        // Session ended. But the refresh_token is still valid.
        // Revoke the refresh_token
        token.revoke('refresh_token', function(error) {
            console.log('Token revoked');
            res.redirect('/');
        });
    });
});

// Callback service parsing the authorization token and asking for the access token
app.get('/callback', function(req, res) {
    var code = req.query.code;

    oauth2.authCode.getToken({
        code: code,
        redirect_uri: config.callbackURL
    }, saveToken);

    function saveToken(error, result) {
        if (error) {
            // If fails redirect to home again
            console.log('Access Token Error', error.message);
            res.redirect('/');
        } else {
            // Redirect to '/me' to retrieve users personal data
            token = oauth2.accessToken.create(result);
            res.redirect('/me');
        }
    }
});

app.get('/', function(req, res) {
    // Very simple launch page
    res.send('<h1>Hello!</h1><p><a href="/auth">Log in with Fablabs.io</a></p><p><a href="/logout">Logout</a></p>');
});

app.listen(config.appPort);

console.log('Express server started with settings:\n', config);