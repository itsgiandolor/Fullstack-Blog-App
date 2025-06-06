const mongoose = require('mongoose');
const{Schema, model} = mongoose;

// Stores users with unique usernames and hashed passwords
const UserSchema = new Schema({
    username: {type: String, require: true, min: 4, unique: true},
    password: {type: String, require: true},
});

const UserModel = model('User', UserSchema);

module.exports = UserModel;