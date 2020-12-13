const mongoose = require('mongoose');


const SettingsSchema = mongoose.Schema({
  referrer:{
    type: String,
    default: ''
  },
  btc_address:{
    type: String,
    default: ''
  },
  btc_image:{
    type: String,
    default: ''
  },
  system:{ 
    type:String,
    default:'On'
  }

});

 const Settings = module.exports = mongoose.model('Settings', SettingsSchema);
