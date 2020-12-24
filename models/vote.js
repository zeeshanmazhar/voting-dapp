const mongoose = require('mongoose');

var uniqueValidator = require('mongoose-unique-validator');

const Status = Object.freeze({
  Active: 'active',
  Deactive: 'deactive'
});

const VoteSchema = mongoose.Schema({
  voter_cnic: {
    type: String,
    required : true
  },
  voter_id: {
    type: String,
    required : true
  },
  candidate_id: {
    type: String,
    required : true
  },
  candidate_name: {
    type: String,
    required : true
  },
  ballot_id: {
    type: String,
    required : true
  },
  ballot_name: {
    type: String,
    required : true
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
