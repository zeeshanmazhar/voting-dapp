const mongoose = require('mongoose');

var uniqueValidator = require('mongoose-unique-validator');

const Status = Object.freeze({
  Active: 'active',
  Deactive: 'deactive'
});

const VoteSchema = mongoose.Schema({
  voter_cnic: {
    type: String,
    default: ''
  },
  candidate_id: {
    type: String,
    default: ''
  },
  candidate_name: {
    type: String,
    default: ''
  },
  ballot_id: {
    type: String,
    default: ''
  },
  ballot_name: {
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

Object.assign(VoteSchema.statics, {
  Status,
});
 
const Vote = module.exports = mongoose.model('vote', VoteSchema);
