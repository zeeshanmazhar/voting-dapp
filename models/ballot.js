const mongoose = require('mongoose');

var uniqueValidator = require('mongoose-unique-validator');

const Status = Object.freeze({
  Active: 'active',
  Deactive: 'deactive'
});

const ballotSchema = mongoose.Schema({
  title: {
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
  }
});

Object.assign(ballotSchema.statics, {
  Status,
});
 
const Ballot = module.exports = mongoose.model('ballot', ballotSchema);
