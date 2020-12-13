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
let Voucher = require('../models/voucher');

var ccbemails = require('./emails');


router.get('/user/voucher/create', userAuth, function(req, res){
    Package.find({status:'active'}).then(function (packs) {
        
        res.render('user/create_voucher',{
            user: req.user,
            packs : packs
          });
        

    }).catch(function (err) {
        console.log(err);
        // redirect to dashboard
        
    })
    
  });



  router.get('/user/vouchers', userAuth, function(req, res){
    Voucher.find({user_id:req.user._id}).then(function (vouchers) {
        
        res.render('user/all_vouchers',{
            user: req.user,
            vouchers : vouchers,
            moment: moment
          });
        

    }).catch(function (err) {
        console.log(err);
        // redirect to dashboard
        res.redirect('/dashboard');
    })
    
  });

  router.get('/admin/vouchers/:status', adminAuth, function(req, res){

    let query = {};

    if (req.params.status != 'all') {
        query.status = req.params.status;
    }

    Voucher.find( query ).then(function (vouchers) {
        
        res.render('admin/all_voucher',{
            user: req.user,
            vouchers : vouchers,
            moment: moment
          });
        

    }).catch(function (err) {
        console.log(err);
        // redirect to dashboard
        res.redirect('/dashboard');
    })
    
  });


  router.get('/admin/voucher/:vouch', adminAuth, function(req, res) {
    
    Voucher.find({voucher_id:req.params.vouch}, function(err, voucher) {
      
      if (err) {
            console.log(err);
        } else {
            if (voucher.length > 0) {
              Package.find({_id :voucher[0].pack_id}).then(function (pack) {

                if (pack.length > 0) {

                   User.find({_id:voucher[0].user_id}).then(function (usr) {
                    
                    if (usr.length > 0) {
                      
                      res.render('user/view_voucher', {
                        user: req.user,
                        voucher: voucher[0],
                        voucher_from : usr[0].username,
                        pack: pack[0]
                      });

                    }
                    else{

                      res.render('user/view_voucher', {
                        user: req.user,
                        voucher: voucher[0],
                        voucher_from : '',
                        pack: pack[0]
                      });
                    }
                  })

                }else{
                    // redirect to all vouchers
                    res.redirect('/dashboard');
                }
                
              })
              
            }else{
                    // redirect to all vouchers
                    res.redirect('/dashboard');
            }
        }
    });
});



  router.get('/user/vouchersnew', userAuth, function(req, res){
          
          Voucher.aggregate(
            [{ $match: { "user_id": req.user._id.toString() } },
            {
                $lookup: {
                    from: "packages",
                    localField: "pack_id",
                    foreignField: "_id",
                    as: "pack"
                },
            }
            ]
        ).exec(function (err, vouchers) {
            if (err) {
                console.log(err);
            } else {
                res.send(vouchers)
              // res.render('user/all_vouchers',{
              //   user: req.user,
              //   vouchers : vouchers
              // });
            }
        });
    
  });

  router.get('/user/voucher/:vouch', userAuth, function(req, res) {
    
    Voucher.find({voucher_id:req.params.vouch}, function(err, voucher) {
      
      if (err) {
            console.log(err);
        } else {
            if (voucher.length > 0) {
              Package.find({_id :voucher[0].pack_id}).then(function (pack) {

                if (pack.length > 0) {

                  User.find({_id:voucher[0].user_id}).then(function (usr) {

                    if (usr.length > 0) {
                      
                      res.render('user/view_voucher', {
                        user: req.user,
                        voucher: voucher[0],
                        voucher_from : usr[0].username,
                        pack: pack[0]
                      });

                    }
                    else{

                      res.render('user/view_voucher', {
                        user: req.user,
                        voucher: voucher[0],
                        voucher_from : '',
                        pack: pack[0]
                      });
                    }
                  })

                  
                }else{
                    // redirect to all vouchers
                    res.redirect('/user/vouchers');
                }
                
              })
              
            }else{
                    // redirect to all vouchers
                    res.redirect('/user/vouchers');
            }
        }
    });
});

  router.post('/user/voucher/create', userAuth, function(req, res){
   
    user_id = req.user._id.toString();
      
    const com = 0;
    const amount = req.body.amount;
    const total = parseFloat(com) + parseFloat(amount);
    const pack = req.body.pack;
    const userFor = req.body.for;
    const otp = req.body.otp;
    
    voucherId(function (voucher_id) {
        Package.find({price : pack}).then(function (packi) {
            
            if (total <= req.user.balance) {
                
                let newVoucher = new Voucher({
                        com:com,
                        amount:amount,
                        total:total,
                        user_id:req.user._id,
                        user_for : userFor,
                        voucher_id : voucher_id,
                        pack_id: packi[0]._id
                    });
        
                    console.log(newVoucher);
                    
                    newVoucher.save(function(err,request){
                        if(err){
                          console.log(err);
                          req.flash('danger',err.message);
                          res.redirect('/user/voucher/create'); 
                        }
                         else {          
                          updateBalance('id', req.user._id, '-', total); 
                          req.flash('success','Voucher is Created. Voucher id is : '+voucher_id);
                            res.redirect('/user/voucher/create');
                        } 
                      });
        
        
            }else{
                req.flash('danger',"Error Occured.");
                res.redirect('/user/voucher/create');
            }
            
         })         
    });

});
  
  
  

  router.post('/voucher/packprice',userAuth, function (req, res) {
    Package.find({ "_id": req.body.id },{price:-1}, function (err, pack) {
        if (err) {
            console.log(err);
        } else {
            
            if (!pack.length) {
                res.send({ 'pack': 'no' });
            } else {
                res.send({ 'pack': 'yes', 'pack': pack[0].price });
            }

        }
    });
});

router.post('/user/voucher/check_voucher', function(req, res) {
    
    Order.find({ "order_id": req.body.order_id }, function(err, ordr) {
        if (err) {
            console.log(err);
        } else {
            var allow = ordr[0].price * 0.50;
            var remV = 0;
            if (ordr.length > 0 ) {
              Voucher.find({"voucher_id":req.body.voucher_id}).then(function (vouch) {
                if (vouch.length > 0) {
                 
                 if (vouch[0].status == 'ready') {
                  
                  if (vouch[0].pack_id == ordr[0].package_id) {
                                    
                    if (vouch[0].user_for == req.user.username) {
                       
                        checkForVouchers(req.body.order_id).then(function (totalv) {
                            
                            if (totalv <= allow) {
                                remV = allow - totalv;
                                
                                    if (vouch[0].amount <= remV) {
                                      
                                        updateVoucher(vouch[0].voucher_id, req.body.order_id, 'spent', vouch[0].user_id, vouch[0].amount);
                                        res.send({ 'voucher': 'yes', 'message':'Voucher is applied.' });

                                    }else{
                                         res.send({ 'voucher': 'no', 'message':'Voucher of $'+remV+' can only apply on this order. ' });                 
                                    }

                            }else{
                                 res.send({ 'voucher': 'no', 'message':'Order has already enough Vouchers' });
                                // Order has already enough Vouchers
                            
                            }
                            
                        })

                    }else{
                        // Voucher is not this user
                        res.send({ 'voucher': 'no', 'message':'Voucher is not for you' });
                    }
                }else{
                    // Voucher is not for this package
                    res.send({ 'voucher': 'no', 'message':'Voucher is not for this pack' });
                }
                  
                 }else{

                  res.send({ 'voucher': 'no', 'message':'Voucher is already spend or cancelled' });

                 } 
                 
                }else{
                     // Voucher is not found
                     res.send({ 'voucher': 'no', 'message':'Voucher not found' });
                }
 
            })   
            } else{
              res.send({ 'voucher': 'no', 'message':'Order not found' });
            }
            
        }
    });

});

function updateVoucher(voucher_id,order_id, status, user_id, amount) {
    let vouch = {};
    vouch.order_id = order_id;
    vouch.status = status;

    let query = { voucher_id: voucher_id };

    Voucher.updateOne(query, vouch, function (err) {
        if (err) {
            console.log(err);
            return;
        } else {
            console.log('Voucher is Updated');

            addTransection(user_id, 'confirmed', 'Voucher', 'withdraw' , amount);

        }
    });
}


function checkForVouchers(order_id) {
    return new  Promise((resolve, reject)=>{
        totalv = 0;
        Voucher.find({"order_id":order_id}).then(function (vouch) {
            console.log(vouch);
            if (vouch.length > 0) {
                vouch.forEach(v => {
                        totalv = totalv + parseFloat(v.total)      
                });   
                resolve(totalv)
            }
            else{
                resolve(0)
            }
        })
    })
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
  
  async function addTransection(user_id, status, address, type, amount) {
    var date = new Date();
    date.setHours(0, 0, 0, 0);
    var justDate = date.getTime();

    console.log('just date : ' + justDate);

    newTransection = new Transection({
        user_id: user_id,
        trans_status: status,
        address: address,
        trans_type: type,
        date: justDate,
        amount: amount
    });

    await newTransection.save(function(err, ret) {
        if (err) console.log(err);
        console.log('transection added ' + amount);

    });
}


/* Generate Order ID For New Order */
// Generate Order ID
function generateVoucherId(callback) {
    var voucherid = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    for (var i = 0; i < 6; i++)
        voucherid += possible.charAt(Math.floor(Math.random() * possible.length));

    return callback(voucherid);
}

// Check Order ID Exist
function voucherId(callback) {

    generateVoucherId(function(voucher_id) {
        Voucher.findOne({ voucher_id: voucher_id }, function(err, voucher) {
            console.log(voucher_id);
            if (!voucher) {
                return callback(voucher_id);
            } else if (voucher) {
                return voucherId();
            }
        });
    });
}
/* End Generate Order ID For New Order */



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