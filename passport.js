const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const SpotifyStrategy = require('passport-spotify').Strategy;
const bcrypt = require('bcrypt');
const { User } = require('./model/User');

require('dotenv').config();


passport.use(new LocalStrategy(
    function(username, password, done) {
        User.findOne({ username: username }, function(err, user) {
            if (err) { return done(err); }
            if (!user) { return done(null, false); }
            bcrypt.compare(password, user.password, function(err, result) {
                if (err) { return done(err); }
                if (!result) { return done(null, false); }
                return done(null, user);
            });
        });
    }
));

passport.use(new SpotifyStrategy({
        clientID: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        callbackURL: 'http://localhost:3000/auth/spotify/callback'
    },
    function(accessToken, refreshToken, expires_in, profile, done) {
        User.findOrCreate({ spotifyId: profile.id }, function (err, user) {
            return done(err, user);
        });
    }
));

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});