const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const expressip = require('express-ip');
var moment = require("moment");
var nodemailer = require("nodemailer");
var xoauth2 = require("xoauth2");
var formidable = require('formidable');
var fs = require('fs');
var multer = require('multer');
var jstz = require('jstimezonedetect');
var moment_tz = require('moment-timezone');

//var ccbemails = require('./emails');

var auth = require('./auth');

router.use(expressip().getIpInfoMiddleware);

var User = require('../../models/user');

let Transaction = require('../../models/transactions');

class account {

    addTransaction(user_id, status, address, type, amount) {
        var date = new Date();
        date.setHours(0, 0, 0, 0);
        var justDate = date.getTime();        

        var newT = new Transaction({
            user_id: user_id,
            trans_status: status,
            address: address,
            trans_type: type,
            date: justDate,
            amount: amount
        });

        console.log(newT);
        

        newT.save(function(err, ret) {
            if (err) console.log(err);
            console.log('transaction added ' + amount);
        });
    
    }

updateAccount(qType, user, action, amount, status, address, type) {
    return new Promise((resolve, reject) => {
        let query;
        let toUpdate = {};
    
        if (qType == 'id') {
            query = { _id: user };
        }
        if (qType == 'username') {
            query = { username: user };
        }
    
        User.findOne(query)
            .then(function(result) {
    
                if (result.earned <= result.limit) {
    
                    console.log('amount is ' + amount);
    
                    let newB = parseFloat(result.balance);
    
                    if (action == '+') {
                        newB = newB + parseFloat(amount);
                          if (newB > result.limit) {
                              
                              let oldB = parseFloat(result.balance);
                              newB = parseFloat(result.limit);
                              let differ = newB - oldB;
                              amount = differ; 
                              toUpdate.balance = newB;
                              toUpdate.earned = result.earned + parseFloat(amount);
                              toUpdate.earned = toUpdate.earned.toFixed(2);
                          
                            }else{
                              toUpdate.balance = newB;
                              toUpdate.earned = result.earned + parseFloat(amount);
                              toUpdate.earned = toUpdate.earned.toFixed(2);
                          }
                      }
    
                    if (action == '-') {
                        newB = newB - parseFloat(amount);
                        toUpdate.balance = newB;
                    }
    
                    User.updateOne(query, toUpdate, function(err, ret) {
                        if (err) {
                            console.log('err is :');
                            console.log(err);
                        } else {
                            User.findOne(query, function(err, usr) {
                               let a = new account();
                                a.addTransaction(usr._id, status, address, type, amount);
                                resolve();
                                
                            });
                        }
                    });
                } else {
                    console.log('limit Exceed');
                    resolve();
                }
            })
            .catch();
        });
    }
    
     updateBalance(qType, user, action, amount) {
        return new Promise((resolve, reject) => {
        let query;
        if (qType == 'id') {
          query = { _id: user };    
        }
        if (qType == 'username') {
          query = { username: user };    
        }
        console.log('amount to deduct: '+ amount);
        
        User.findOne(query)
        .then(function (result) {
      
          console.log('-result-');
          console.log(result);
          
          let newB = parseFloat(result.balance);
          console.log('previous balance: '+newB);
          
          if (action == '+') {
            newB = newB + parseFloat(amount);
          }
          
          if (action == '-') {
            newB = newB - parseFloat(amount);
          }
          console.log('new balnace: '+newB);
          
          User.updateOne(query, { balance:newB }, function (err,ret) {
            if (err) {
              console.log('err is :');
              console.log(err); 
              resolve(); 
            } else {
              console.log('balance updated');
              resolve();
            }
          });
        })
        .catch(function (err) {
          console.log(err);
          resolve();
        });
        }); 
      }
}





module.exports = new account();