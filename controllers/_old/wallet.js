const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const moment = require('moment');
var moment_zone = require('moment-timezone');


let Mining = require('../models/machineMining');
let Order = require('../models/orders');
let Package = require('../models/packages');
let Transection = require('../models/transections');
let Payout = require('../models/payout');
let User = require('../models/user');
let Earning = require('../models/earning');
let DirectReferrals = require('../models/directreferrals'); 
let Referral = require('../models/referrals');

var ccbemails = require('./emails');

router.get('/user/wallet', userAuth, function(req, res){

  Transection.find({user_id:req.user._id}).then(function(transections){
      
    Payout.find({user_id:req.user._id}).then(function (payouts) {
      
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
      res.setHeader('Access-Control-Allow-Headers', 'Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers');
      res.setHeader('Cache-Control', 'no-cache');
        res.render('user/wallet',{
          user: req.user,
          transections:transections,
          payouts:payouts,
          moment:moment
        });  
      }).catch(function (err) {
        console.log(err);
      });      
  
    }).catch(function(err) {
    console.log(err);
  });  

});

router.get('/user/all_transections',userAuth , function (req, res) {
  Transection.find({ "user_id": req.user._id }, function (err, transections) {
    if (err) {
      console.log(err);
    }
    else {
      if (!transections.length) {
        res.send({ 'transections': [] });
      }
      else {
        res.send({ 'transections': transections });
      }
    }
  });
});

router.post('/user/wallet/request', userAuth, function(req, res){
   
  user_id = req.user._id.toString();
    
  const com = req.body.com;
  const amount = req.body.amount;
  const btc = req.body.btc;
  const total = parseFloat(com) + parseFloat(amount);
  const address = req.body.address;
  const otp = req.body.otp;

  if (otp == req.user.token) {
    if (total <= req.user.balance) {
      if (amount <= 3000) {
        todaysUserPayouts(user_id).then(function (pToday) {
            if (pToday < 3000) {
              var allowed = 3000 - pToday;
                
                  if (total > allowed ) {
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
                            res.redirect('/user/wallet/request'); 
                          }
                           else {
                            ccbemails.payout_request( req.user.email, req.user.username, amount, address );          
                            updateBalance('id', req.user._id, '-', total); 
                            req.flash('success','Reqeust is Processed.');
                              res.redirect('/user/wallet/request');
                          } 
                        });
                  }
            }
        });
        
        
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

router.get('/user/wallet/request',async function (req, res) {
  
  if (req.user) {
  
    if (req.user.limit > 0 || req.user.earned > 0 ) {
      
        user_id = req.user._id.toString();

        var todays =  await todaysUserPayouts(user_id);
        var totalRoi = await  getTotalTrans(user_id,'ROI');
  
        withdrawPage(req.user).then(function (useStatus) {
          
          if(req.user.roi_status != 'default'){
            useStatus.roiStatus = req.user.roi_status; 
          }
          if (req.user.withdrawal_status != 'default') {
            useStatus.withdrawl = req.user.withdrawal_status;
          }
          
          
          res.render('user/withdraw_request',{
                                      user      : req.user,
                                      todays    : todays,
                                      totalRoi  : totalRoi,
                                      userStatus : useStatus,
                    });
            
          }).catch(function (err) {
              console.log(err);
          });

      }else{
        res.render('user/withdraw_request',{
              user      : req.user,
              todays    : todays,
              totalRoi  : 0,
              userStatus : {withdrawl : 'close',message:'Dear Member, You do not have any active mining packages yet. Please purchase a mining pack to continue using your accounts full functionality.'
              }
        });
      }
    
  }else{
    res.redirect('/logout');
  }  
});

function withdrawPage(user) {
      return new Promise((resolve,reject)=>{
        Order.find({user_id:user._id, order_status:'paid'},{order_id:-1,order_type:-1, promo:-1, business:-1,price:-1}).then(function (usrOrders) {
                    
          if (usrOrders[0].business) {
              minXbus = parseInt(usrOrders[0].business);
          }else{
            minXbus = 3;
          }
          console.log('Business : '+minXbus);
          
          if (usrOrders.length >0 ) {
            if (usrOrders[0].order_type == 'promo') {
              getDirectUsers(user.username, user.limit).then(function (direct) {
                      
                      if (usrOrders[0].promo == "") {
                         minDrect = 2;
                      }else{
                        minDrect = parseInt(usrOrders[0].promo);
                      }  
                       
                      if (direct.direct >= minDrect) {
                          getDirectBusiness(user.username).then(function (busi) {
                                
                              if ( busi.total >= (usrOrders[0].price*minXbus) ) {
                                      //if business is x then ROI and withdrawl is open      
                                        resolve({
                                              roiStatus : 'open', 
                                              withdrawl : 'open'
                                          });
    
                              }else{
                                // Add total ROI variable to block ROI
                                  resolve({
                                    roiStatus : 'close',
                                    withdrawl : 'open',
                                    message   : "Dear Miner, Our Return on Investment (ROI) policy has been recently revised. As per our new policy all Conditional Accounts which do not have a minimun of "+minXbus+"x Sales to show under their account will have all withdrawl requests revoked. This policy change is to encourage our valued leaders to grow their teams and further enhance their leadership skills."
                                  });
                              }
                          });
                      }else{
    
                        resolve({
                          roiStatus : 'block',
                          withdrawl : 'block',
                          message   : "Dear Miner, Our withdrawl policy has been recently revised. As per our new policy all Conditional Accounts which do not have a minimun of 2 Direct Referrals with minimum pack of $"+direct.minOrder+" under them will have all withdrawl requests revoked. This policy change is to encourage our valued leaders to grow their teams and further enhance their leadership skills."
                        });
                          
                      }
                                  
                  });         
                } 
                else{
                  
                  resolve({
                    roiStatus : 'open',
                    withdrawl : 'open',
                    order_type :'real'
                  });
                }
            
          }
        })
      });
}


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

let a = [];


function getDirectBusiness1(username) {
  return new Promise((resolve, reject) => {
    DirectReferrals.aggregate(
      [{ $match: { "referred_by": username } },
          {
              $lookup: {
                  from: "users",
                  localField: "referred_to",
                  foreignField: "username",
                  as: "users"
              },
          },
          { $lookup: { 
            from: "orders", 
            localField: "users._id", 
            foreignField: "user_id", 
            as: "orders"
          } 
          },
          {
            "$addFields": {
                "orders": {
                    "$arrayElemAt": [
                        {
                            "$filter": {
                                "input": "$orders",
                                "as": "ords",
                                "cond": {
                                    "$eq": [ "$$ords.order_type", "real" ]
                                }
                            }
                        }, 0
                    ]
                }
            }
        }
      ]
  ).exec(function(err, referrals) {
      if (err) {
          console.log(err);
      } else {
        tot = 0;
        referrals.forEach(bus => {
          console.log('Here');
          console.log(bus);
          
          if (bus.orders != undefined) {
          
              console.log(bus.orders);
              tot = tot + bus.orders.price;
          }

        });  

          resolve({total : tot});
      }
  });
  });
}

function getDirectBusiness(username) {
  return new Promise((resolve, reject) => {
    DirectReferrals.aggregate(
      [{ $match: { "referred_by": username } },
      {
          $lookup: {
              from: "users",
              localField: "referred_to",
              foreignField: "username",
              as: "users"
          },
      },
      { $lookup: { from: "orders", localField: "users._id", foreignField: "user_id", as: "orders" } }
      ]
  ).exec(function(err, referrals) {
      if (err) {
          console.log(err);
      } else {
        tot = 0;
        referrals.forEach(bus => {
              
          if (bus.orders != undefined) {
                bus.orders.forEach(ord => {
                  
                  if ((ord.order_type == 'real') && (ord.order_status == 'paid') ) {
                       tot = tot + ord.price;
                    }
        
                });
          } 

        });  

          resolve({total : tot});
      }
  });
  });
}


function getDirectUsers(username, limit) {

    if (limit <= 3000) {
      minOrder = 100;
    }
    else if(limit > 3000){
      minOrder = 100;
    }

  return new Promise((resolve, reject) => {
    DirectReferrals.aggregate(
      [{ $match: { "referred_by": username } },
          {
              $lookup: {
                  from: "users",
                  localField: "referred_to",
                  foreignField: "username",
                  as: "users"
              },
          },
          { $lookup: { 
            from: "orders", 
            localField: "users._id", 
            foreignField: "user_id", 
            as: "orders"
          } 
          },
          {
            "$addFields": {
                "orders": {
                    "$arrayElemAt": [
                        {
                            "$filter": {
                                "input": "$orders",
                                "as": "ords",
                                "cond": {
                                    "$eq": [ "$$ords.order_type", "real" ]
                                }
                            }
                        }, 0
                    ]
                }
            }
        }
      ]
  ).exec(function(err, referrals) {
      if (err) {
          console.log(err);
      } else {
        direct = 0;
        
        referrals.forEach(bus => {
        
            if ( bus.orders != undefined && bus.orders.price >= minOrder ) {
                      direct++;
            }
        });  

          resolve({direct : direct, minOrder:minOrder});
      }
  });
  });
}



function getTotalTrans(user_id, address) {
  return new Promise((resolve, reject) => {
    Transection.aggregate([{
      $match : { $and : [ {"user_id" : user_id, address:address} ] } ,
  },{
      $group : {
          _id : null,
          total : {
              $sum : "$amount"
          }
      }
  }]).then(function (totals) {

        if ( totals.length > 0) {
          resolve(totals[0].total);
        }else{
          resolve(0);
        }
  
      }).catch(function (err) {
          console.log(err);
          resolve('');
      });
  });
}


function getTotalPayouts(user_id) {
  return new Promise((resolve, reject) => {

    Payout.aggregate([{
      $match : {   "user_id" : user_id , status:'paid' } ,
  },{
      $group : {
          _id : null,
          total : {
              $sum : "$amount"
          }
      }
  }]).then(function (totals) {
        if ( totals.length > 0) {
          resolve(totals[0].total);          
        }else{
          resolve(0);
        }
          
      }).catch(function (err) {
          console.log(err);
          resolve('');
      });
  });
}

function getTotalOrderEarning(order_id) {
  return new Promise((resolve, reject) => {
    
    Earning.find({ "order_id" : order_id }).find(function (earns) {
      console.log(earns);
    });
    
    Earning.aggregate([{
      $match : { "order_id" : order_id } ,
  },{
      $group : {
          _id : null,
          total : {
              $sum : "$earned"
          }
      }
  }]).then(function (totals) {
      
        resolve(totals[0].total);
  
      }).catch(function (err) {
          console.log(err);
          resolve('');
      });
  });
}



function getUsername(user_id) {
  return new Promise((resolve, reject) => {
  
      User.find({_id:user_id}, function(err, result) {
          if (err) {
              console.log(err);
              return;
          } else {
              resolve(result[0].username);
          }
      });
  });
}

router.get('/admin/payoutrequest/:status', adminAuth, function(req, res){
  
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

router.get('/payouts/pendings/:code', function(req, res){
  if (req.params.code == 'ome') {
    let query = {};

    query.status = "pending"; 
  
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
          

          res.render('payoutsonly',{
                    requests:results,
                    moment:moment,
                    moment_zone : moment_zone
                });
      
        })
      }
   });
    
  }else{
    req.send("Wrong Code !!!");
  }  
  

});



router.post('/admin/payout_status', adminAuth, function(req, res){
  
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

          addTransection(user_id,'confirmed','Money Withdraw','withdraw',amount);

          tempDate = new Date();

          User.find({_id:user_id}).then(function(user) {

              ccbemails.withdraw_amount(user[0].email, user[0].username, amount, user[0].balance, tempDate);  
          
          }).catch(function (err) {
            console.log(err);
          });

      }else if(editReq.status == 'canceled'){

          updateBalance('id', user_id, '+', total);
      
      }

      req.flash('success', 'Request Updated');
      res.redirect('/admin/payout/'+req.body.req_id);
            
    }
  });  
});

router.get('/admin/payout/:req', adminAuth, function(req, res){
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

router.get('/user/payout/:req', userAuth, function(req, res){
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


router.get('/admin/wallet/payment', adminAuth, function(req, res){

  res.render('admin/custom_payment',{
    user: req.user
  });

});

router.post('/admin/wallet/payment',adminAuth, function(req, res){
    User.find({username:req.body.username}).then(function (usr) {
      if (usr.length > 0) {
        const amount = req.body.amount;
          const mined_date = req.body.p_date;
          const admin_id = req.user._id;
          const address = req.body.address;
          const username = req.body.username;
          
          req.checkBody('amount', 'Amount is required').notEmpty();
          req.checkBody('p_date', 'Date is required').notEmpty();
          
          let p_date = Date.parse(mined_date).toString();
            console.log(p_date);
            
          let errors = req.validationErrors();

          if(errors){
            console.log(errors);
            res.render('admin/custom_payment', {
              errors:errors,
              user:req.user
            });
          } else {
            
            pay_custom('username', username, '+', amount, 'confirmed', address, 'deposit', p_date);
            req.flash('success', 'Paid Successfully.');
            res.render('admin/custom_payment',{
              user: req.user
            });

          }
      }else{
        req.flash('danger', 'User Not Found.');
            res.render('admin/custom_payment',{
              user: req.user
            });
      }
    }).catch(function (err) {
      console.log(err);
      return;
    });
  
});


function pay_custom(qType, user, action, amount, status, address, type, pdate) {
  
  let query;
  let toUpdate = {};

  if (qType == 'id') {
    query = { _id: user };    
  }
  if (qType == 'username') {
    query = { username: user };    
  }

  User.findOne(query)
  .then(function (result) {    
    
    if (result.earned <= result.limit ) {

      console.log('amount is ' + amount);
      let newB = parseFloat(result.balance);

      if (action == '+') {
        newB = newB + parseFloat(amount);
          if (newB > result.limit) {
              
              oldB = parseFloat(result.balance);
              newB = parseFloat(result.limit);
              differ = newB - oldB;
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
  
      User.updateOne(query, toUpdate, function (err,ret) {
        if (err) {
          console.log('err is :');
          console.log(err);  
        } else {
          User.findOne(query,function(err, usr) {          
            custom_addTransection(usr._id,status,address,type,amount, pdate);
    
          });   
        }
      });      
    }
    else{

        // console.log('User is',result);
        // completeAllOrdersOnLimitExceed(result._id);
        console.log('limit Exceed');
    }
  })
  .catch(); 

}

function custom_addTransection(user_id,status,address,type,amount,justDate) {
  
  newTransection = new Transection({
    user_id: user_id,
    trans_status: status,
    address:address,
    trans_type:type,
    date:justDate,
    amount:amount
  });

  newTransection.save(function (err, ret) { 
    if (err) console.log(err); 
    console.log('transection added '+amount);

  });
}

function completeAllOrdersOnLimitExceed(user_id) {
  Order.find({user_id:user_id,status:'active'}).then(function (orders) {
        if (orders.length > 0) {
          orders.forEach(ord => {
            let order = {};
            order.status = 'completed';
            let query = { order_id: ord.order_id };
            Order.updateOne(query, order, function(err, result) {
                console.log(result);
            })   
          });
        }else{
          console.log('No active orders!!');
          
        }
        
  })
}


function updateAccount(qType, user, action, amount, status, address, type) {
  
  let query;
  let toUpdate = {};

  if (qType == 'id') {
    query = { _id: user };    
  }
  if (qType == 'username') {
    query = { username: user };    
  }

  User.findOne(query)
  .then(function (result) {    
    
    if (result.earned <= result.limit ) {

      console.log('amount is ' + amount);
      let newB = parseFloat(result.balance);

      if (action == '+') {
        newB = newB + parseFloat(amount);
        toUpdate.balance = newB;
        toUpdate.earned = result.earned + parseFloat(amount);
        toUpdate.earned = toUpdate.earned.toFixed(2);
      }
      
      if (action == '-') {
        newB = newB - parseFloat(amount);
        toUpdate.balance = newB;
      }
  
      User.updateOne(query, toUpdate, function (err,ret) {
        if (err) {
          console.log('err is :');
          console.log(err);  
        } else {
          User.findOne(query,function(err, usr) {          
            addTransection(usr._id,status,address,type,amount);
    
          });   
        }
      });      
    }
    else{
        console.log('limit Exceed');
    }
  })
  .catch(); 

}





function addTransection(user_id,status,address,type,amount) {
  var date = new Date();
  date.setHours(0,0,0,0);
  var justDate = date.getTime();
  
  console.log('just date : ' +justDate);

  newTransection = new Transection({
    user_id: user_id,
    trans_status: status,
    address:address,
    trans_type:type,
    date:justDate,
    amount:amount
  });

  newTransection.save(function (err, ret) { 
    if (err) console.log(err); 
    console.log('transection added '+amount);

  });
}



function updateBalance(qType, user, action, amount) {
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
      } else {
        console.log('balance updated');
      }
    });
  })
  .catch(function (err) {
    console.log(err);
  }); 
}


// Access Control
function ensureAuthenticated(req, res, next){
  if(req.isAuthenticated()){
    return next();
  } else {
    req.flash('danger', 'Please login');
    res.redirect('/login');
  }
}
function userAuth(req, res, next) {
    
  if (req.isAuthenticated()) {
    
    return next();
  } else {
    req.flash('danger', 'Please login');
    res.redirect('/login');
  }
}

function adminAuth(req, res, next) {
    
  if (req.isAuthenticated()) {
       if (req.user.user_type != 'admin') {
         res.redirect('/dashboard');
      }
    return next();
  } else {
    req.flash('danger', 'Please login');
    res.redirect('/login');
  }
}


module.exports = router;



// Order.find({user_id:req.user._id, order_status:'paid'},{order_id:-1,order_type:-1}).then(function (usrOrders) {
    
//   if (usrOrders.length >0 ) {
//     if (usrOrders[0].order_type == 'promo') {
//         Referral.find({user:req.user.username},{direct:-1}).then(function (direct) {
                  
//               console.log(direct);
                  
//               if (direct[0].direct > 1) {
//                   getDirectBusiness(req.user.username).then(function (busi) {
                      
//                       if (busi.total >= ((req.user.limit/10)*3)) {
//                               //if business is 3x then ROI and withdrawl is open      
//                                 res.render('user/withdraw_request',{
//                                       user      : req.user,
//                                       todays    : todays,
//                                       RoiStatus : 'open',
//                                       withdrawl : 'open'
//                                   });


//                       }else{
//                         // Add total ROI variable to block ROI

//                           res.render('user/withdraw_request',{
//                             user      : req.user,
//                             todays    : todays,
//                             RoiStatus : 'close',
//                             withdrawl : 'open',
//                             message   : "You have conditional account. Your ROI is block."
//                           });
//                       }
//                   });
//               }else{

//                 res.render('user/withdraw_request',{
//                   user      : req.user,
//                   todays    : todays,
//                   RoiStatus : 'block',
//                   withdrawl : 'block',
//                   message   : "You have conditional account. To open Payout Request, You Should have atleast 2 direct paid accounts."
//                 });
                  
//               }
                          
//           });         
//         } 
//         else{
          
//           res.render('user/withdraw_request',{
//             user      : req.user,
//             todays    : todays,
//             RoiStatus : 'open',
//             withdrawl : 'open',
//             order_type :'real'
//           });
//         }
    
      
//       // getTotalOrderEarning(usrOrders[0]._id.toString()).then(function (earns) {
//       //   console.log(earns);
//       // });

//   }
// })