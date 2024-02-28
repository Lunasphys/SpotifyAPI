const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { Schema } = mongoose;

mongoose.connect('mongodb://localhost:27017/SpotyAPI');
const userSchema = new Schema({
    spotifyId: String,
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    accessToken: String,
    refreshToken: String,
    profile: {
        username: String,
        currentTrack: {
            title: String,
            artist: String,
            album: String
        },
        activeDeviceName: String
    },
    group: { type: Schema.Types.ObjectId, ref: 'Group' }
});

userSchema.statics.findOrCreate = async function findOrCreate(profile, cb) {
    var userObj = new this();
    try {
        let result = await this.findOne({spotifyId : profile.id});
        if(!result){
            userObj.username = profile.displayName;
            userObj.spotifyId = profile.id;
            await userObj.save();
            cb(null, userObj);
        }else{
            cb(null, result);
        }
    } catch(err) {
        cb(err, null);
    }
};

const groupSchema = new Schema({
    name: { type: String, unique: true, required: true },
    users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    chief: { type: Schema.Types.ObjectId, ref: 'User' }
});

const User = mongoose.model('User', userSchema);
const Group = mongoose.model('Group', groupSchema);

// const createUser = async (username, password) => {
//     // Check if a user with the given username already exists
//     const existingUser = await User.findOne({ username });
//     if (existingUser) {
//         console.log('User with this username already exists');
//         return;
//     }
//
//     // Hash the password
//     const hashedPassword = await bcrypt.hash(password, 10);
//
//     // Create a new user
//     const user = new User({
//         username,
//         password: hashedPassword,
//     });
//
//     // Save the user to the database
//     await user.save();
//
//     console.log('User created successfully');
// }
//
// async function main() {
//     try {
//         await createUser('laurie', 'nami');
//         console.log('User created successfully');
//     } catch (error) {
//         console.error('Error creating user:', error);
//     }
// }
//
// main();

module.exports = { User, Group };