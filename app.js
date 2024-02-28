const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const passport = require('passport');
const { User, Group } = require('./model/User');
const bcrypt = require('bcrypt');
const session = require('express-session');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger');
mongoose.connect('mongodb://localhost:27017/SpotyAPI', { useNewUrlParser: true, useUnifiedTopology: true });

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

// registration
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
// Check if the username and password are provided
    if (!username || !password) {
        return res.status(400).send('Username and password are required');
    }

    // if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
        return res.status(400).send('User already exists');
    }

    // password hash
    const hashedPassword = await bcrypt.hash(password, 10);

    // new user
    const user = new User({ username, password: hashedPassword });
    await user.save();

    res.send('User registered successfully');
});

app.use(router);

app.use(function(req, res, next) {
    res.setHeader("Content-Security-Policy", "default-src 'none'; font-src 'self' http://localhost:3000; style-src 'self' http://fonts.googleapis.com;");
    return next();
});

app.get('/auth/spotify', passport.authenticate('spotify', {
    scope: ['user-read-email', 'user-read-private'],
    showDialog: true
}));

app.get('/auth/spotify/callback',
    passport.authenticate('spotify', { failureRedirect: '/login' }),
    function(req, res) {
        res.redirect('/');
    });

app.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return res.status(500).send('An error occurred: ' + err);
        }
        if (!user) {
            return res.status(400).send('Invalid login data: ' + info.message);
        }
        req.logIn(user, function(err) {
            if (err) {
                return res.status(500).send('An error occurred: ' + err);
            }
            return res.send('User logged in');
        });
    })(req, res, next);
});

app.listen(3000, () => {
    console.log('YSpotyAPI is running on port 3000');
    console.log(process.env.SPOTIFY_CLIENT_ID);
    console.log(process.env.SPOTIFY_CLIENT_SECRET);
});

module.exports = router;
app.use(function(req, res, next) {
    res.setHeader("Content-Security-Policy", "default-src 'none'; font-src 'self' http://localhost:3000; style-src 'self' http://fonts.googleapis.com;");
    return next();
});

app.get('/auth/spotify', passport.authenticate('spotify', {
    scope: ['user-read-email', 'user-read-private'],
    showDialog: true
}));

app.get('/auth/spotify/callback',
    passport.authenticate('spotify', { failureRedirect: '/login' }),
    function(req, res) {
        res.redirect('/');
    });

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *         password:
 *           type: string
 *
 */

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: user
 *         description: The user to create.
 *         schema:
 *           $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User registered successfully
 *       400:
 *         description: Username is already taken or username and password are required
 */

app.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return res.status(500).send('An error occurred: ' + err);
        }
        if (!user) {
            return res.status(400).send('Invalid login data: ' + info.message);
        }
        req.logIn(user, function(err) {
            if (err) {
                return res.status(500).send('An error occurred: ' + err);
            }
            return res.send('User logged in');
        });
    })(req, res, next);
});