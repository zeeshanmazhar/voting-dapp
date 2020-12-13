const mongoose = require('mongoose');

var uniqueValidator = require('mongoose-unique-validator');

const Status = Object.freeze({
  Active: 'active',
  Deactive: 'deactive'
});

const contactsSchema = mongoose.Schema({
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
  status: {
    type: String,
    enum: Object.values(Status),
    default: 'active'
  }
});

Object.assign(contactsSchema.statics, {
  Status,
});
 
const contacts = module.exports = mongoose.model('contacts', contactsSchema);
