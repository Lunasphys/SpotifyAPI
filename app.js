const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const passport = require('passport');
const { User, Group } = require('./model/User');
const bcrypt = require('bcrypt');
const session = require('express-session');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger');
const SpotifyWebApi = require('spotify-web-api-node');
const app = express();
const cors = require('cors');
const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: 'http://localhost:3000/auth/spotify/callback'
});

mongoose.connect('mongodb://localhost:27017/SpotyAPI', { useNewUrlParser: true, useUnifiedTopology: true });

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}));

require('./passport');
app.use(cors({
    origin: 'http://localhost:3000'
}));
app.use(function(req, res, next) {
    res.setHeader("Content-Security-Policy", "default-src 'none'; connect-src 'self'; script-src 'self'; font-src 'self' http://localhost:3000; style-src 'self' http://fonts.googleapis.com;");
    return next();
});

app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(router);

// Routes
app.get('/', (req, res) => {
    res.send('YSpotyAPI is running');
});

// TODO: Add routes for user registration, login, group management, etc.
require('dotenv').config();

// registration
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    console.log('Received request to register user:', username);

    // Check if the username and password are provided
    if (!username || !password) {
        console.log('Username or password not provided');
        return res.status(400).send('Username and password are required');
    }

    // if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
        console.log('User already exists:', username);
        return res.status(400).send('User already exists');
    }

    // password hash
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');

    // new user
    const user = new User({ username, password: hashedPassword });
    await user.save();
    console.log('User saved successfully:', username);

    res.send('User registered successfully');
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

// Join a group

router.post('/joinGroup', async (req, res) => {
    const { groupName } = req.body;
    const currentUser = req.user;

    if (!groupName) {
        return res.status(400).send('Group name is required');
    }

    let group = await Group.findOne({ name: groupName });

    if (!group) {
        group = new Group({ name: groupName, chief: currentUser._id });
    } else {
        if (currentUser.group) {
            const oldGroup = await Group.findById(currentUser.group);
            oldGroup.users.pull(currentUser._id);
            if (oldGroup.chief.equals(currentUser._id)) {
                if (oldGroup.users.length > 0) {
                    oldGroup.chief = oldGroup.users[0];
                } else {
                    await Group.findByIdAndDelete(oldGroup._id);
                }
            }
            await oldGroup.save();
        }
        group.users.push(currentUser._id);
    }

    currentUser.group = group._id;
    await currentUser.save();
    await group.save();

    res.send('User joined the group successfully');
});

// CONSULT GROUPS
// Fetch all groups
router.get('/groups', async (req, res) => {
    const groups = await Group.find().populate('users', 'username');
    const groupsInfo = groups.map(group => ({
        groupName: group.name,
        numberOfUsers: group.users.length
    }));
    res.json(groupsInfo);
});

// Fetch all users in a specific group
router.get('/groupUsers/:groupId', async (req, res) => {
    const { groupId } = req.params;
    const group = await Group.findById(groupId).populate('users', 'username');
    if (!group) {
        return res.status(404).send('Group not found');
    }
    const usersInfo = group.users.map(user => ({
        username: user.username,
        isChief: user._id.equals(group.chief),
        spotifyUsername: user.profile ? user.profile.username : null,
        currentTrack: user.profile ? user.profile.currentTrack : null,
        activeDeviceName: user.profile ? user.profile.activeDeviceName : null
    }));
    res.json(usersInfo);
});

// Leaving group
router.post('/leaveGroup', async (req, res) => {
    const currentUser = req.user;

    if (!currentUser.group) {
        return res.status(400).send('User is not in a group');
    }

    const group = await Group.findById(currentUser.group);
    group.users.pull(currentUser._id);
    if (group.chief.equals(currentUser._id)) {
        if (group.users.length > 0) {
            group.chief = group.users[0];
        } else {
            await Group.findByIdAndDelete(group._id);
        }
    }
    await group.save();

    currentUser.group = null;
    await currentUser.save();

    res.send('User left the group successfully');
});

// Synchronization
router.post('/syncPlayback', async (req, res) => {
    const currentUser = req.user;

    if (!currentUser.group || !currentUser.group.chief.equals(currentUser._id)) {
        return res.status(400).send('User is not the chief of a group');
    }

    spotifyApi.setAccessToken(currentUser.accessToken);

    const playback = await spotifyApi.getMyCurrentPlaybackState();
    const trackUri = playback.body.item.uri;
    const positionMs = playback.body.progress_ms;

    const group = await Group.findById(currentUser.group).populate('users');
    for (const user of group.users) {
        if (!user.equals(currentUser)) {
            spotifyApi.setAccessToken(user.accessToken);
            await spotifyApi.play({ uris: [trackUri], position_ms: positionMs });
        }
    }

    res.send('Playback synchronized successfully');
});

// Playlist
router.post('/createPlaylist', async (req, res) => {
    const currentUser = req.user;
    const { targetUser } = req.body;

    const target = await User.findById(targetUser);
    if (!target || !target.group.equals(currentUser.group)) {
        return res.status(400).send('Target user is not in the same group');
    }

    spotifyApi.setAccessToken(target.accessToken);

    const topTracks = await spotifyApi.getMyTopTracks({ limit: 10 });
    const trackUris = topTracks.body.items.map(track => track.uri);

    spotifyApi.setAccessToken(currentUser.accessToken);

    const playlist = await spotifyApi.createPlaylist(currentUser.spotifyId, 'Top 10 Tracks', { public: false });
    await spotifyApi.addTracksToPlaylist(playlist.body.id, trackUris);

    res.send('Playlist created successfully');
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

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Log in a user
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: user
 *         description: The user to log in.
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
 *       400:
 *         description: Invalid login data
 */

/**
 * @swagger
 * /joinGroup:
 *   post:
 *     summary: Join a group
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: group
 *         description: The group to join.
 *         schema:
 *           type: object
 *           required:
 *             - groupName
 *           properties:
 *             groupName:
 *               type: string
 *     responses:
 *       200:
 *         description: User joined the group successfully
 *       400:
 *         description: Group name is required
 */

/**
 * @swagger
 * /groups:
 *   get:
 *     summary: Fetch all groups
 *     responses:
 *       200:
 *         description: List of all groups
 */

/**
 * @swagger
 * /groupUsers/{groupId}:
 *   get:
 *     summary: Fetch all users in a specific group
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of all users in the group
 *       404:
 *         description: Group not found
 */

/**
 * @swagger
 * /leaveGroup:
 *   post:
 *     summary: Leave a group
 *     responses:
 *       200:
 *         description: User left the group successfully
 *       400:
 *         description: User is not in a group
 */

/**
 * @swagger
 * /syncPlayback:
 *   post:
 *     summary: Synchronize playback
 *     responses:
 *       200:
 *         description: Playback synchronized successfully
 *       400:
 *         description: User is not the chief of a group
 */

/**
 * @swagger
 * /createPlaylist:
 *   post:
 *     summary: Create a playlist
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: targetUser
 *         description: The target user to create a playlist for.
 *         schema:
 *           type: object
 *           required:
 *             - targetUser
 *           properties:
 *             targetUser:
 *               type: string
 *     responses:
 *       200:
 *         description: Playlist created successfully
 *       400:
 *         description: Target user is not in the same group
 */