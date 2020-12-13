const mongoose = require('mongoose');

var uniqueValidator = require('mongoose-unique-validator');

const Status = Object.freeze({
  Active: 'active',
  Deactive: 'deactive'
});

const visitorSchema = mongoose.Schema({
  name: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: '',
  },
  mobile: {
    type: String,
    required: true
  },
  created: {
    type: Date,
    default: Date.now,
    required: true
  },
  code:{
    type: String,
    default: '',
  },
  cafe:{
    type: String,
    default: '',
  },
  last_visit:{
    type: Date,
    default: Date.now,
    required: true
  },
  status: {
    type: String,
    enum: Object.values(Status),
    default: 'active'
  }
});

Object.assign(visitorSchema.statics, {
  Status,
});

const visitors = module.exports = mongoose.model('visitors', visitorSchema);
