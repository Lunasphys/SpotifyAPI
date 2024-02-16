const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const bcrypt = require('bcrypt');
const session = require('express-session');
const { User, Group } = require('./model/User');

const app = express();

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.send('YSpotyAPI is running');
});

// TODO: Add routes for user registration, login, group management, etc.
require('dotenv').config();
app.listen(3000, () => {
    console.log('YSpotyAPI is running on port 3000');
    console.log(process.env.SPOTIFY_CLIENT_ID);
    console.log(process.env.SPOTIFY_CLIENT_SECRET);
});

// User registration
app.post('/register', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = new User({
            username: req.body.username,
            password: hashedPassword
        });
        await user.save();
        res.status(201).send('User registered');
    } catch {
        res.status(500).send('Error registering user');
    }
});

// User login
app.post('/login', passport.authenticate('local'), (req, res) => {
    res.send('User logged in');
});