const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
  title: {
    type: String,
    default: ''
  },
  body: {
    type: String,
    default: '',
  },
  admin: {
    type: String,
    required: true
  },
  created: {
    type: Date,
    default: Date.now,
    required: true
  }
});

 
 
const messages = module.exports = mongoose.model('messages', messageSchema);
