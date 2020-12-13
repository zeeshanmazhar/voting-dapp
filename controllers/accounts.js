const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const moment = require('moment');
var moment_zone = require('moment-timezone');

var auth = require('./includes/auth');
var account = require('./includes/account');

// let Order = require('../models/orders');
// let Package = require('../models/packages');
let Transection = require('../models/transactions');
let Payout = require('../models/payout');
 let User = require('../models/user');
// let Earning = require('../models/earning');
// let DirectReferrals = require('../models/directreferrals'); 
// let Referral = require('../models/referrals');

var earnlyemails = require('./emails');

router.get('/user/account/transactions', auth.userAuth , function (req, res) {
    Transection.find({ "user_id": req.user._id }, function (err, transections) {
      if (err) {
        console.log(err);
      }
      else {
        
        if (!transections.length) {
          res.render('user/transactions',
          { 
            transactions: [],
            moment:moment,
            user:req.user 
        });
        }
        else {
          res.render('user/transactions',
          { 
            transactions: transections,
            moment:moment,
            user:req.user
           }
          );
        }
      }
    });
  });

  router.get('/admin/payoutrequest/:status', auth.adminAuth, function(req, res){
  
    let query = {};
    
    if (req.params.status != 'all') {
      query.status = req.params.status; 
  
    }
    var searchQuery = Payout.find(query) 
    searchQuery.lean().exec(function (err, payReqs) {
      if (err) {
        console.log(err);
        return;
      }
      else{
        var promises = payReqs.map( function(payReq) {      
          return User.find({_id:payReq.user_id},{username:-1}).then(function(results){    
            console.log(results);
            payReq.username = results[0].username;
            return payReq;
            });        
        });
        Promise.all(promises).then(function(results) {
          res.render('admin/requests',{
                    user: req.user,
                    requests:results,
                    moment:moment,
                    moment_zone : moment_zone
                });
      })
      }
   });
  
  
   
      
    // Payout.find(query, function(err, requests){
    //   if (err) {
    //     console.log(err);
    //   }
    //   else{
    //       res.render('admin/requests',{
    //         user: req.user,
    //         requests:requests,
    //         moment:moment
    //       });
    //   }   
    // });
  
  });

  router.get('/user/payout/:req', auth.userAuth, function(req, res){
    var mongodb = require("mongodb");
      if (mongodb.ObjectID.isValid(req.params.req)) {
    Payout.find({_id:req.params.req}, function(err, request) {
      if (err) {
        console.log(err);
      }
      else{
        if (request.length > 0) {
         
        if (request[0].user_id == req.user._id) {
          console.log(request[0]);
          
          res.render('user/payout_request',{
            user: req.user,
            request:request[0],
          });
        
        }
        else{
          redirect('/dashboard');
        }
        }
      }  
    });  
  }else{
    res.redirect('/dashboard');
  }
  });  

router.get('/admin/user/payouts/:usr', auth.adminAuth, function (req, res) {
    console.log(req.params.usr);

    Payout.
        find({ user_id: req.params.usr }, function (err, payouts) {
            if (err) {
                console.log(err);
            } else {
                console.log(payouts);
                res.send(payouts);
            }
        });
});

router.get('/user/account/payouts', auth.userAuth, function (req, res) {
  console.log(req.params.usr);

  Payout.
      find({ user_id: req.user._id }, function (err, payouts) {
          if (err) {
              console.log(err);
          } else {
            res.render('user/payouts',{
              payouts:payouts,
              user: req.user,
              moment:moment
          });
          }
      });
});

router.post('/admin/payout_status', auth.adminAuth, function(req, res){
  
  const user_id = req.body.user_id;
  const amount = req.body.amount;
  const total = req.body.total;
  console.log('body : ');
  console.log(req.body);
  console.log('--body end--');
  
  
  let query = {};
  query._id = req.body.req_id;

  let editReq = {};
  
  if (req.body.requestStatus == 'pay') {
    editReq.status = 'paid';
    editReq.reference = req.body.referrence;
  }
  else if(req.body.requestStatus == 'cancel'){
    editReq.status = 'canceled';
    editReq.reference = req.body.referrence;
  }

  Payout.updateOne(query, editReq, function (err,ret) {
    if (err) {
      console.log('err is :');
      console.log(err);  
    } else {
      console.log(ret);
      if (editReq.status == 'paid') {

          account.addTransaction(user_id,'confirmed','Payout Withdraw','withdraw',amount);

          tempDate = new Date();

          User.find({_id:user_id}).then(function(user) {

              earnlyemails.withdraw_amount(user[0].email, user[0].username, amount, user[0].balance, tempDate);  
          
          }).catch(function (err) {
            console.log(err);
          });

      }else if(editReq.status == 'canceled'){

          account.updateBalance('id', user_id, '+', total);
      
      }

      req.flash('success', 'Request Updated');
      res.redirect('/admin/payout/'+req.body.req_id);
            
    }
  });  
});

router.get('/admin/payout/:req', auth.adminAuth, function(req, res){
  Payout.find({_id:req.params.req}, function(err, request) {
    if (err) {
      console.log(err);
      res.redirect('/dashboard');
    }
    else{
      if (request.length > 0) {
        User.find({_id:request[0].user_id}, function (err, requester) {
          console.log(requester);
          res.render('admin/view_request',{
            user: req.user,
            request:request[0],
            requester:requester[0]
          });
        });  
      }
      else{
        res.redirect('/dashboard')
      }
    }  
  });  
});

router.get('/user/account/request', auth.userAuth, function(req, res){

    res.render('user/withdraw_request',{
        user: req.user,
    });

})

router.post('/user/wallet/request', auth.userAuth, function(req, res){
   
  user_id = req.user._id.toString();
    
  const com = req.body.com;
  const amount = req.body.amount;
  const btc = req.body.btc;
  const total = parseFloat(com) + parseFloat(amount);
  const address = req.body.address;
  const otp = req.body.otp;

  
  if (true) { //  otp == req.user.token
    if (total <= req.user.balance) {  
      if (true) {  // amount <= 3000  
      //  todaysUserPayouts(user_id).then(function (pToday) {
            if (true) {  // pToday < 3000 
              // var allowed = 3000 - pToday;
                
                  if ( false ) { // total > allowed
                    req.flash('danger',"You are already requested $"+pToday+". You can withdraw more $"+(3000 - pToday)+" today.");
                    res.redirect('/user/wallet/request');                            
                  }else{
                    let newRequest = new Payout({
                      com:com,
                      amount:amount,
                      btc:btc,
                      total:total,
                      user_id:req.user._id,
                      address:address
                      });
                      newRequest.save(function(err,request){
                          if(err){
                            console.log(err);
                            req.flash('danger',err.message);
                            res.redirect('/user/account/request'); 
                          }
                           else {
                            earnlyemails.payout_request( req.user.email, req.user.username, amount, address );          
                           account.updateBalance('id', req.user._id, '-', total); 
                            req.flash('success','Reqeust is Processed.');
                              res.redirect('/user/account/request');
                          } 
                        });
                  }
            }
     //   });
        
        
      }else{
        req.flash('danger','Your maximum payout request limit is $3000.');
              res.redirect('/user/wallet/request');
      }
         
    }else{
              req.flash('danger','Requested amount is more then your account balance.');
              res.redirect('/user/wallet/request');
    }  
  }else{
              req.flash('danger','invalid OTP.');
              res.redirect('/user/wallet/request');
  }    
  
});

function todaysUserPayouts(user_id) {
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  return new Promise((resolve,reject)=>{
    Payout.aggregate([{
      $match : { created: {$gte: today}, user_id: user_id  },
      },{
          $group : {
              _id : null,
              total : {
                  $sum : "$total"
              }
          }
      }]).then(function (py) {
  
          if(py.length > 0){
              resolve(py[0].total); 
          }else{
            resolve(0);
          }
      
      })
  })
  
}


router.post('/admin/payout_status1', auth.adminAuth, function(req, res){
  
  const user_id = req.body.user_id;
  const amount = req.body.amount;
  const total = req.body.total;
  console.log('body : ');
  console.log(req.body);
  console.log('--body end--');
   
  
  let query = {};
  query._id = req.body.req_id;

  let editReq = {};
  
  if (req.body.requestStatus == 'pay') {
    editReq.status = 'paid';
    editReq.reference = req.body.referrence;
  }
  else if(req.body.requestStatus == 'cancel'){
    editReq.status = 'canceled';
    editReq.reference = req.body.referrence;
  }

  Payout.updateOne(query, editReq, function (err,ret) {
    if (err) {
      console.log('err is :');
      console.log(err);  
    } else {
      console.log(ret);
      if (editReq.status == 'paid') {

          account.addTransection(user_id,'confirmed','Money Withdraw','withdraw',amount);

          tempDate = new Date();

          User.find({_id:user_id}).then(function(user) {
          
              earnlyemails.withdraw_amount(user[0].email, user[0].username, amount, user[0].balance, tempDate);  
          
          }).catch(function (err) {
            console.log(err);
          });

      }else if(editReq.status == 'canceled'){

          account.updateBalance('id', user_id, '+', total);
      
      }

      req.flash('success', 'Request Updated');
      res.redirect('/admin/payout/'+req.body.req_id);
            
    }
  });  
});



router.post('/user/chart_data', auth.userAuth, function (req, res) {
  var arr = [];
  var months = [];
  var start, end = moment();
  var month = "";

  for (let index = 5; index >= 0; index--) {

    start = moment().startOf("month").subtract(index, 'M').toDate();
    end = moment().endOf("month").subtract(index, 'M').toDate();
    month = moment().endOf("month").subtract(index, 'M').format('MMMM');

 
    Transection.aggregate([{
          $match : { $and : [{trans_type:'deposit' ,user_id:req.user._id.toString(),created: { $gte: start, $lt: end } }] },
      },{
          $group : {
              _id : null,
              total : {
                  $sum : "$amount"
              }
          }
      }]).then(function (t) {
        if (!t[0]) {
          total = 0;
        }
        else{
          total = t[0].total;
          
        }
         months.push(moment().endOf("month").subtract(index, 'M').format('MMMM'));
        arr.push(total);
        if (index == 0) {
          return res.send({data:arr, months:months});
        }
      });
  }  

});





function getEarningBetween2Dates() {
    
}


module.exports = router;