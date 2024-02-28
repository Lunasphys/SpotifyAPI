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
    name: String,
    users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    chief: { type: Schema.Types.ObjectId, ref: 'User' }
});

const User = mongoose.model('User', userSchema);
const Group = mongoose.model('Group', groupSchema);

module.exports = { User, Group };