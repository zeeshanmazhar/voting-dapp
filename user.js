const mongoose = require('mongoose');

var uniqueValidator = require('mongoose-unique-validator');

const Status = Object.freeze({
  Active: 'active',
  Deactive: 'deactive',
  Blocked: 'blocked'
});

const userType = Object.freeze({
  User: 'user',
  Admin: 'admin',
});

const UserSchema = mongoose.Schema({
  
  username: {
    type: String,
    unique: true,
    required: [true, "can't be blank"],
  },
  email: {
    type: String,
    required: true,
    unique: true,
    required: [true, "can't be blank"],
  },
  mobile: {
    type: String,
    default: ''
  },
  salt: {
    type: String,
    default: ''
  },
  password: {
    type: String,
    required: true
  },
  picture: {
    type: String,
    default: "placeholder.jpg"
  },
  created: {
    type: Date,
    default: Date.now,
    required: true
  },
  status: {
    type: String,
    enum: Object.values(Status),
    default: 'active'
  },
  user_type: {
    type: String,
    enum: Object.values(userType),
    default: 'user'
  }
});

Object.assign(UserSchema.statics, {
  Status,
});

Object.assign(UserSchema.statics, {
  userType,
});

UserSchema.plugin(uniqueValidator, {message: 'is already exist.'});

const User = module.exports = mongoose.model('User', UserSchema);
