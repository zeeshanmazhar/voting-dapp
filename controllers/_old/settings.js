const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const moment = require('moment');

let Settings = require('../models/settings');
let Order = require('../models/orders');
let Earning = require('../models/earning');
let Transection = require('../models/transections');
let User = require('../models/user');
let Referral = require('../models/referrals');
let BinaryPoints = require('../models/binarypoints');
let Payout = require('../models/payout');
let DirectReferrals = require('../models/directreferrals');

var ccbemails = require('./emails');

router.get('/admin/settings', adminAuth, function(req, res){

  Settings.find({}).then(function(settings){
    console.log(settings);
      if (settings.length > 0) {
        res.render('admin/settings',{
          user: req.user,
          settings:settings[0],
        });  
      }else{
        newSettings = new Settings({
          referrer: '',
          btc_address: ''

        });
        newSettings.save(function (err, ret) { if (err) console.log(err); else{ res.redirect('admin/settings') } });
      }
      
       
  }).catch(function(err) {
    console.log(err);
  });  

});

router.post('/admin/settings', adminAuth, function(req, res){
  console.log(req.body);
  
    sets= {};
    sets.referrer = req.body.referrer;
    sets.btc_address = req.body.btc_address;
    
    Settings.updateOne({_id:req.body.set_id}, sets ,function(err, rets){
      if (err) {
        console.log(err);
      }
      req.flash('success', 'Settings Updated');
        res.render('admin/settings',{
          user: req.user,
          settings:sets,
        });
         
    });  
  });


  router.get('/admin/settings/reports', adminAuth, function(req, res) {

    res.render('admin/report', {
        user: req.user
    });

  });

  router.post('/admin/settings/reports', adminAuth, function(req, res) {
    
    var arr = [];
    
    let fdate, tdate, pfdate, ptdate = '';
  
    
    if (req.body.from_date == '') {
      req.flash('danger', 'From date is required.');
        return res.render('admin/report', {
            user: req.user
        });  
    }else{
      fdate = Date.parse(req.body.from_date).toString();
      pfdate = new Date(req.body.from_date);
    }

    if (req.body.to_date == '') {
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth());
          todate = moment(today).format("X");

          ptdate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
           


    }
    else{
         tdate = Date.parse(req.body.to_date).toString();
         ptdate = new Date(req.body.to_date);
    }

    console.log('Dates are ', ptdate, pfdate);
    

                                                        
    Order.aggregate([{
      $match: { $and: [{ order_type: 'real', order_status: 'paid',  activation_date:  {$gte:fdate  ,  $lte:tdate} }] },
              }, {
              $group: {
                _id: null,
                total: {
                $sum: "$total"
                  }
                }
              }]).then(function (totalAmount) {

              if (totalAmount.length > 0) {
                if (totalAmount[0].total > 0) {
                  arr.sale = totalAmount[0].total;
                  }
                else {
                  arr.sale = 0;
                    }    
                  }else{
                    arr.sale = 0;
                  }

               }).then(function () {

                      Payout.aggregate([{
                        $match: { $and: [{ status: 'paid', created:  { $gte:pfdate , $lte:ptdate}  }] },
                    }, {
                        $group: {
                            _id: null,
                            total: {
                                $sum: "$amount"
                            }
                        }
                    }]).then(function (totalAmount) {

                        if (totalAmount[0].total > 0) {
                            arr.totalPayout = totalAmount[0].total;
                        }
                        else {
                            arr.totalPayout = 0;
                        }

                    }).then(function () {
                      console.log(arr);
                      
                        res.render('admin/report', {
                          data:arr,
                          user: req.user
                        });                      
                    })
                 
               })

  });

  



  router.get('/settings/ghouri/:status', function(req, res){
  
    console.log(req.params);
    
      sets= {};
      if (req.params.status == 'up') {
        sets.system = 'On';
        Settings.updateMany( sets ,function(err, rets){
          if (err) {
            console.log(err);
          }
          console.log(rets);
          
            res.send('system is on');  
        });    
      }
      else if (req.params.status == 'down') {
        sets.system = 'Off';
        Settings.updateMany( sets ,function(err, rets){
          if (err) {
            console.log(err);
          }
          console.log(rets);
            res.send('system is off');  
        });
      }else{
        res.send('wrong system status');
      }    
  });


router.get('/admin/settings/pinaccount', adminAuth, function(req, res) {

    res.render('admin/pinaccount', {
                user: req.user,
            });

});  

router.post('/admin/settings/pinaccount2', adminAuth, function(req, res) {
        
        let editUser = {};

        if (req.body.newBal != "") {
          editUser.balance = req.body.newBal;
        }
        editUser.pinAccount = true;

        let query = { _id: req.body.user_id };
        console.log(editUser);
        console.log(query);
        
          User.updateOne(query, editUser, function (err,aa) {
              if (err) {
                  console.log(err);
                  return;
              } else {
                
                req.flash('success','User updated.');
                  res.render('admin/pinaccount', {
                    user: req.user,
                }); 
              }
          });


});  



router.post('/admin/settings/pinaccount', adminAuth, function(req, res) {
  
    if (req.body.username  != "") {
        User.find({username:req.body.username}).then(function (usr) {
            if (usr.length > 0) {
                
              // getTotalTrans(usr[0]._id.toString() ,"ROI").then(function (tots) {
              //   console.log("Tots : "+tots);
              // })

              // Transection.countDocuments({user_id:usr[0]._id,address:"ROI"}).then(function (cc) {
              //   console.log(cc);
              // });
              
              // Order.find({user_id : usr[0]._id, order_status:'paid' }).then(function (odr) {
              //   Earning.find({order_id:odr[0]._id}).then(function (earns) {
              //     console.log(earns.length);
              //     res.send(earns);
              //   });            
              // })
                
                getUserPinData(usr[0]._id,usr[0].username).then(function (data) {
                 
                    data.pinAccount = usr[0].pinAccount;    
                    data.userBalance = usr[0].balance;
                    data.userLimit = usr[0].limit;
                    data.user_id = usr[0]._id;
                      res.render('admin/pinaccount2', {
                        user: req.user,
                        data : data
                      });
                })
            }
            else{
                req.flash('danger','User not found.');
                res.render('admin/pinaccount', {
                  user: req.user,
              });
            }
        })
    }
    else{
      req.flash('danger','User not found.');
            res.render('admin/pinaccount', {
              user: req.user,
          });
    }
  
});

function getUserPinData(user_id, username) {
  return new Promise((resolve, reject)=>{

            arr = {}

            Order.find({user_id:user_id},{business:-1,activation_date:-1, price:-1,order_type:-1}).then(function (businessLimit) { 
              arr.busLimit = businessLimit[0].business;  
              arr.activation = businessLimit[0].activation_date;
              arr.orderPrice = businessLimit[0].price;
              arr.packType = businessLimit[0].order_type;
            }).then(function () {
                                
              getTotalPayouts(user_id.toString()).then(function (totalPayout) {
                  arr.totalPayout = totalPayout;
              }).then(function () {
                  getDirectBusiness(username).then(function (directBusiness) {
                    arr.directBusiness = directBusiness;
                  }).then(function () {
                    getTotalTrans(user_id.toString(), 'ROI').then(function name(totalROI) {
                      arr.totalROI = totalROI;
                    }).then( function () {
                      getTotalTrans(user_id.toString(), 'Binary Referral Bonus').then(function (totalBinary) {
                        arr.totalBinary = totalBinary;
                      }).then( function () {
                            resolve(arr)
                      } )
                    })
                  })            
              })
        })


  })
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
                
                if (ord.order_type == 'real' && ord.order_status == 'paid') {
                     tot = tot + ord.price;
                }
      
              });
        } 

      });  

        resolve(tot);
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


router.get('/admin/settings/block_users', adminAuth, function(req, res) {

  res.render('admin/block_users_settings', {
              user: req.user,
          });

});


router.post('/admin/settings/block_users', adminAuth, function(req, res) {
  var block_users = req.body.users_to_block.replace(/[ ,]+/g, ",");
  var block_user_array = block_users.replace(/\s/g, '');
  block_user_array = block_user_array.split(",");

  var not_block_users = req.body.users_leave.replace(/[ ,]+/g, ",");
  var not_block_users_array = not_block_users.replace(/\s/g, '');
  not_block_users_array = not_block_users_array.split(",");

  notFound = [];

   block_user_array.forEach((block_user, index) => {
    setTimeout(() => {

    if(!not_block_users_array.includes(block_user)){
                
                  User.find({username:block_user}).then(function (usr) {

                      if (usr.length > 0 ) {

                        if (req.body.status == 'block') {
                            
                            if (usr[0].status == 'active') {
                                
                                changeUserStatus(usr[0]._id,req.body.status);
                                cancelP(usr[0]._id).then(function () {
                               ccbemails.block_account(usr[0].username, usr[0].email);
                          
                              })  
                            }
                            else if (usr[0].status == 'block') {
                              changeUserStatus(usr[0]._id,req.body.status);
                              cancelP(usr[0]._id);
                            }
                            else{
                              changeUserStatus(usr[0]._id,req.body.status);
                            }
                          
                        }else if (req.body.status == 'active') {
                            changeUserStatus(usr[0]._id,req.body.status);
                        }else{
                          
                            changeUserStatus(usr[0]._id,req.body.status);

                        }

                        

                      }else{
                        console.log('user not found : ',block_user);
                        
                        notFound.push(block_user);
                        console.log('NOt found is here ',notFound);
                        
                      }
                    
                })
              
      
    }else{
      
    }
  }, index * 200);
   }); 
   req.flash('success','All users are blocked.');
  res.render('admin/block_users_settings', {
    user: req.user,
  });


});

function changeUserStatus(user_id, status) {
  return new Promise((resolve, reject)=>{
      let editUser = {};
      editUser.status = status;

      let query = { _id: user_id };

      User.updateOne(query, editUser, function (err,ret) {
          if (err) {
              console.log(err);
              resolve();
          } else {
              console.log(ret);
              resolve();
          }
      });
  }) 
}

function cancelP(user_id) {
  return new Promise((resolve, reject) =>{
          Payout.find({user_id:user_id , status:'pending'}).then(function (pays) {
            if (pays.length > 0) {
              pays.forEach((pay, index ) => {
                setTimeout(() => {
                    cancelPayouts(user_id, pay.total, pay._id)                       
                }, index * 200);
            });

            resolve('');
            }else{              
              resolve('');
            }
              
          })
  })
}

function cancelPayouts(user_id, total, req_id) {
    
  return new Promise((resolve, reject)=>{
      
      let query = {};
      query._id = req_id;

      let editReq = {};
      
          editReq.status = 'canceled';
          editReq.reference = 'Cancelled';

      Payout.updateOne(query, editReq, function (err,ret) {
          if (err) {
          console.log('err is :');
          console.log(err);  
          } else {
          console.log(ret);
               updateBalance('id', user_id, '+', total);
               resolve('');   
          }
      });

  })
}

function updateBalance(qType, user, action, amount) {
  return new Promise((resolve, reject) => {
      let query;
      if (qType == 'id') {
          query = { _id: user };
      }
      if (qType == 'username') {
          query = { username: user };
      }

      User.findOne(query)
          .then(function(result) {

              let newB = parseFloat(result.balance);
              let earned = parseFloat(result.earned);

              if (action == '+') {
                  newB = newB + parseFloat(amount);
              }

              if (action == '-') {
                  newB = newB - parseFloat(amount);
                  earned = earned - parseFloat(amount);
              }

              User.update(query, { balance: newB, earned: earned }, function(err, ret) {
                  if (err) {
                      console.log('err is :');
                      console.log(err);
                  } else {
                      console.log('balance updated');
                      resolve('');
                  }
              });
          })
          .catch(function(err) {
              console.log(err);
          });
  });
}



router.get('/admin/settings/custompoints', adminAuth, function(req, res) {

  res.render('admin/custom_points', {
              user: req.user,
          });

});

router.post('/admin/settings/custompoints', adminAuth, function(req, res) {
  
  if (req.body.username != '') {
    User.find({username:req.body.username}).then(function (usr) {
      if (usr.length > 0) {
        if (req.body.points != '') {
          PayAllParents(req.body.username, req.body.points, req.body.action).then(function () {
            req.flash('success','Point are done.');
            res.render('admin/custom_points', {
              user: req.user,
            });
          })
          
        }else{
          req.flash('success','Point are done.');
            res.render('admin/custom_points', {
              user: req.user,
            });

        }  
      }
      else{
        req.flash('danger','Username not found.');
            res.render('admin/custom_points', {
              user: req.user,
            });
      }  
    });
  }else{
    req.flash('danger','No username.');
            res.render('admin/custom_points', {
              user: req.user,
            });
  }

});


router.get('/admin/settings/business', adminAuth, function(req, res) {

  res.render('admin/business_change', {
              user: req.user,
          });

});

router.post('/admin/settings/business',adminAuth, function(req, res) {
  console.log(req.body);
  
  var newString = req.body.orders.replace(/[ ,]+/g, ",");
  var array = newString.replace(/\s/g, '');
  array = array.split(",");
  var oX = req.body.oX;

  array.forEach(element => {
      console.log('I am order : '+element);
      if (element != '') {
        changeOrderBusiness(element, oX);
      }
  });
  
    res.render('admin/business_change', {
        user: req.user,
    });

});

function changeOrderBusiness(order_id, oX) {
  return new Promise((resolve, reject) => {
      let order = {};
      order.business = parseInt(oX);

      let query = { order_id: order_id };
      Order.updateOne(query, order, function(err, result) {
          if (err) {
              console.log(err);
              return;
          } else {
            
              resolve('');
          }
      });
  });
}



  router.get('/admin/settings/orders', adminAuth, function(req, res) {

    res.render('admin/orders_change', {
                user: req.user,
            });

});



router.post('/admin/settings/orders',adminAuth, function(req, res) {
  console.log(req.body);
  
  var newString = req.body.orders.replace(/[ ,]+/g, ",");
  var array = newString.replace(/\s/g, '');
  array = array.split(",");
  var oType = req.body.oType;

  array.forEach(element => {
      console.log('I am order : '+element);
      if (element != '') {
        changeOrderType(element, oType);
      }
  });
  
    res.render('admin/orders_change', {
        user: req.user,
    });

});

function changeOrderType(order_id, oType) {
  return new Promise((resolve, reject) => {
      let order = {};
      order.order_type = oType;
      let query = { order_id: order_id };
      Order.updateOne(query, order, function(err, result) {
          if (err) {
              console.log(err);
              return;
          } else {
              resolve('');
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
        if (totals.length > 0) {
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




async function PayAllParents(user, points, action) {
  var parent = await getParent(user);
  if (parent == '') return 0;

  console.log('user is ' + user);
  console.log('paying to : ' + parent);

  await payFirstParent(parent, user, points, action);
  return await PayAllParents(parent, points, action);
}


function payFirstParent(parent, user, points, action) {
  Referral.find({ user: parent }, function(err, usr) {
      if (err) {
          console.log('err : ' + err);
      }
      if (usr.length > 0) {

          if (usr[0].left == user) {
              payPoints(usr[0].user, 'left', points, action);
              console.log('add points on left');
          } else if (usr[0].right == user) {
              payPoints(usr[0].user, 'right', points, action);
              console.log('add points on right');
          }
      }
  });
}


function payPoints(user, direction, points, action) {
  BinaryPoints.find({ user: user }, function(err, usr) {
      if (err) {
          console.log(err);
      } else {
          if (usr.length > 0) {
              let newPoints = 0;
              let LPoints = parseInt(usr[0].left);
              let RPoints = parseInt(usr[0].right);
              
              if (action == '+') {
                console.log('Action is +');
                
                  if (direction == 'left') {
                    newPoints = parseInt(LPoints) + parseInt(points);
                    } else if (direction == 'right') {
                        newPoints = parseInt(RPoints) + parseInt(points);
                    }
              }
              else if(action == '-'){
                console.log('Action is -');

                if (direction == 'left') {
                  newPoints = parseInt(LPoints) - parseInt(points);
              } else if (direction == 'right') {
                  newPoints = parseInt(RPoints) - parseInt(points);
              }
            }
              

              updatePoints(user, direction, newPoints);
          }
      }
  });
}

function updatePoints(user, direction, points) {

  let toUpdate = {};
  if (direction == 'left') {
      toUpdate.left = parseInt(points);
  } else if (direction == 'right') {
      toUpdate.right = parseInt(points);
  }

  let query = { user: user }

  BinaryPoints.updateOne(query, toUpdate, function(err) {
      if (err) {
          console.log(err);
          return;
      } else {
          Referral.find({ user: user }, function(err, usr) {
              if (usr.length > 0) {
                  if (usr[0].direct > 1) {
                      // calPoints(user);      
                  }
              }
          });
      }
  });

}

function getParent(user) {
  return new Promise((resolve, reject) => {
      Referral.find({ user: user }, function(err, usr) {
          if (err) {
              console.log('err : ' + err);
          }
          if (usr.length > 0) {

              resolve(usr[0].parent);
          } else {
              resolve('');
          }
      });
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



