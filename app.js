const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const { User, Group } = require('./model/User');
const bcrypt = require('bcrypt');
const session = require('express-session');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger');
module.exports = { User, Group };

const app = express();

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}));

require('./passport');

app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

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
app.use(function(req, res, next) {
    res.setHeader("Content-Security-Policy", "default-src 'none'; font-src 'self' http://localhost:3000; style-src 'self' http://fonts.googleapis.com;");
    return next();
});
app.get('/auth/spotify/callback',
    passport.authenticate('spotify', { failureRedirect: '/login' }),
    function(req, res) {
        // Successful authentication, redirect home.
        res.redirect('/');
    });

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Logs in a user
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: user
 *         description: The user to create.
 *         schema:
 *           type: object
 *           required:
 *             - username
 *             - password
 *           properties:
 *             username:
 *               type: string
 *             password:
 *               type: string
 *     responses:
 *       200:
 *         description: User logged in
 */
app.post('/login', passport.authenticate('local'), (req, res) => {
    res.send('User logged in');
});