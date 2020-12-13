const mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

const Status = Object.freeze({
  Active: 'active',
  Deactive: 'deactive',
  Blocked: 'blocked'
});

const userType = Object.freeze({
  Cafe: 'cafe',
  Admin: 'admin'
});

const CafeSchema = mongoose.Schema({
  cafe_name: {
    type: String,
    required: true
  },
  username: {
    type: String,
    unique: true,
    required: [true, "can't be blank"],
    index: true
  },
  country: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  state: {
    type: String,
    default: ''
  },
  postcode: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    required: true,
    unique: true,
    required: [true, "can't be blank"],
    index: true
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
    default: 'cafe'
  }
});

Object.assign(CafeSchema.statics, {
  Status,
});

Object.assign(CafeSchema.statics, {
  userType,
});


CafeSchema.plugin(uniqueValidator, {message: 'is already exist.'});

const cafe = module.exports = mongoose.model('cafe', CafeSchema);
