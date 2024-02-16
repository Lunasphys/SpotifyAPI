const mongoose = require('mongoose');
const { Schema } = mongoose;

mongoose.connect('mongodb://localhost:27017/SpotyAPI');
const userSchema = new Schema({
    spotifyId: String,
    username: String,
    password: String,
    accessToken: String,
    refreshToken: String,
    profile: Object,
    group: { type: Schema.Types.ObjectId, ref: 'Group' }
});

const groupSchema = new Schema({
    name: String,
    users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    chief: { type: Schema.Types.ObjectId, ref: 'User' }
});

const User = mongoose.model('User', userSchema);
const Group = mongoose.model('Group', groupSchema);

module.exports = { User, Group };
