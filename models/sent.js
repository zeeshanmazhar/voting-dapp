const mongoose = require('mongoose');

const sentSchema = mongoose.Schema({
  message_id: {
    type: String,
    required:true
  },
  contact_id: {
    type: String,
    required:true
  },
  channel: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    default: 'pending'
  },
  log: {
    type: String,
    default: ''
  },
  created: {
    type: Date,
    default: Date.now,
    required: true
  }
});
 
const sent = module.exports = mongoose.model('sent', sentSchema);
