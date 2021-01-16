const mongoose = require('mongoose');


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
  
  password: {
    type: String,
    // required: true
    default : ''
  },

  username: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  mobile: {
    type: String,
    default: ''
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
    // enum: Object.values(userType),
    default: 'user'
  },
  ballot_id: {
    type: String,
    default : ''
  },
  name: {
    type: String,
    default : ''
  },
  cnic : {
    type: String,
    default : ''
  },
  v_id : {
    type: String,
    default : '',
  },
  c_id: {
    type: String,
    default : '',
  },
  c_symbol: {
    type: String,
    default : ''
  },
  c_image: [{
    type: String,
    default : ''
  }],

});



Object.assign(UserSchema.statics, {
  Status,
});

Object.assign(UserSchema.statics, {
  userType,
});


const User = module.exports = mongoose.model('User', UserSchema);



//----------------------------------------------------------------------
