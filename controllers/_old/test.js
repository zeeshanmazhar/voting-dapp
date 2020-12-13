const express = require('express');
const router = express.Router();
const moment = require('moment');
const Client = require('node-rest-client').Client;
var sb = require('satoshi-bitcoin');

let Mining = require('../models/machineMining');
let User = require('../models/user');
let Referral = require('../models/referrals');
let Order = require('../models/orders');
let DirectReferrals = require('../models/directreferrals');
let BinaryPoints = require('../models/binarypoints');
let Transection = require('../models/transections');
let Earning = require('../models/earning');
let Payout = require('../models/payout');
let Settings = require('../models/settings');
let Newsletter = require('../models/newsletter');
let Package = require('../models/packages');

var ccbemails = require('./emails');

router.get('/tesii', function(req, res) {

    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    res.send(ip);

});

router.get('/paytest', function(req, res) {

    res.render('user/pay.ejs', {
        user: req.user
    });

});


function emailtoall() {
    // last skip  : 1700
    // last limit : 400
    // next start : 02:15
    User.find({status:'active'}).skip(2100).limit(400).then(function (usrs) {
        console.log(usrs.length);
        
        usrs.forEach((usr, index) => {
            setTimeout(() => {
                console.log(usr.username); 
               // ccbemails.president_message(usr.username,usr.email);
        } , index * 1000)
        });
    })
}

 // emailtoall();

function checkCall(orderid, token) {
    return new Promise((resolve, reject) => {
        const client = new Client();
        // my_xpub = 'xpub6CwhpTpcdbGyjUc6RBLSouJ3VMkkxe9qypvDKdDPcHBZcTYtkTMQiVDFV8nSkjxhBQY6ao1221QwpWJ8pMaYy2tKf8hoDM9aS24Fnd7P282';
        my_xpub = 'xpub6CwhpTpcdbGymVpxW9GybFuCMExoQz4wHMusbGDVesQHw3bQW3rfLiSvCbRG7twts3xaDKyHM8XjW1ZHawTwPUQAw3jkEn1HuTrs1sPm6Ux';
        my_api_key = 'ac3dee80-97cc-4c15-96bd-17130799daa8';
        my_callback_url = 'https://ccbtcmining.com/packageverify/' + orderid + '/' + token;
        root_url = 'https://api.blockchain.info/v2/receive/callback_log?';
        parameters = 'callback=' + encodeURIComponent(my_callback_url) + '&key=' + my_api_key;
        client.get(
            root_url + '?' + parameters,
            function(data) {
                console.log(parameters);
                
                console.log('response data');
                console.log(data);
                resolve(data);
            }
        );
    });
}

// checkCall('5d8e3f58da772347d87d1371','V0JEDX11569603416841');



router.get('/checkusert',function (req,res) {
    len = 0;
    User.find({status:'active'}).then(function (usrs) {
        usrs.forEach((usr, index) => {
            setTimeout(() => {
                if ( usr.limit > 0 ) {
                    Transection.find({user_id:usr._id, address:'ROI', date : "1567296000000"}).then(function (ut) {
                        if (ut.length > 1) {   
                            console.log('**************************');
                            console.log(ut);
                            Transection.updateOne({_id:ut[1]._id}, {date:'1567382400000'}, function (err, re) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log(re);
                                }
                            });
                            console.log('**************************');
                        }
                    })           
                }
            }, index * 50);
        });
        res.send({len : usrs.length})
    })
})


router.get('/checkUserLimit',function (req,res) {
    len = 0;
    User.find({}).then(function (usrs) {
        usrs.forEach((usr, index) => {
            setTimeout(() => {
                if ( usr.limit > 0 ) {
                   // changeLimit(usr._id,(usr.limit/2));           
                }
            }, index * 50);
        });
        res.send({len : usrs.length})
    })
    
})

function checkForT() {
    var user_id = '5c8c730298b430159190c882';
    Transection.find({user_id:user_id,trans_type:'deposit'})
        .then(function (trs) {
            
        })

        Order.find({user_id:user_id}).then(function (ord) {
            Earning.find({order_id:ord[0]._id}).then(function (min) {
                min.forEach(m => {
                    console.log(m.earned);
                    
                    Transection.find({date:m.date, user_id:user_id,amount:m.earned})
                        .then(function (trs) {
                            console.log(trs);
                        })
                });
            })
        })
}

// checkForT();


function checkForOrderLimits(){
    User.find({limit:{$gte:1} })
        .then(function (usrs) {            
            usrs.forEach((usr,index) => {
                setTimeout(() => {
                    checkOrderforLimit(usr)           
                }, index * 50);
            });
        })
}

function checkOrderforLimit(usr) {
    return new Promise((resolve, reject)=>{
        var user_limit = 0;

        TotalLimitOfCompletedOrders(usr).then(function (tlc) {
            user_limit = user_limit + tlc;
        }).then(function () {

            Order.find({user_id:usr._id,status:'active'})
            .then(function (ords) {
                ords.forEach(ord => {
                    user_limit = user_limit + (ord.price * 5);
                    if (usr.earned > user_limit ) {
                        getDateOfAmount(usr._id,user_limit).then(function (dt) {
                            getMiningTillDate(ord._id,dt).then(function (min) {
                                console.log(min.total);
                                deleteMiningTransactions(min.mining,usr);
                                
                            }).then(function () {
                                console.log('------------------------');
                                console.log('Earned '+ usr.earned);
                                console.log('Limit '+user_limit);
                                console.log(usr.username);
                                console.log(dt);
                                console.log('Date : '+ moment(dt).format('LLL'));
                                console.log('Start Date : '+ moment.unix(ord.activation_date/1000).format('LLL'));
                                console.log('Order : '+ord.order_id);
                            })                            
                        })   
                    }
                });
            })

        })

        
    })
}



function TotalLimitOfCompletedOrders(usr) {
    return new Promise((resolve, reject)=>{
        var total = 0;
        Order.aggregate([{
            $match: { $and: [{ user_id: usr._id, status: 'completed' }] },
        }, {
            $group: {
                _id: null,
                total: {
                    $sum: "$amount"
                }
            }
        }]).then(function (totalAmount) {
            
            if (totalAmount.length > 0) {
                if (totalAmount[0].total > 0) {
                    console.log(totalAmount);
                     resolve(totalAmount[0].total*5);
                }
                else {
                    resolve(0);
                }
            }
            else {
                resolve(0);
            }

        })
    })
}

function getDateOfAmount(user_id,amount) {
    return new Promise((resolve, reject)=>{
    var ttr = 0;
    var date;
    Transection.find({user_id:user_id,trans_type:'deposit'})
        .then(function (trs) {
            trs.forEach(tr => {

                if (ttr <= amount) {
                   // console.log(ttr);
                   // console.log(tr.created);
                    date =tr.created;
                    ttr = ttr + tr.amount;                    
                }else{
                    resolve(date);
                }
                
            });
      //      resolve(date);
        }) 
    })
}

function getMiningTillDate(order_id,date) {
    return new Promise((resolve, reject)=>{
    var t = 0;
    Earning.find({order_id:order_id,created:{$gte:date}})
        .then(function (min) {
           min.forEach(m => {
               if (!isNaN(m.earned)) {
                t = t+(m.earned*1);
               }
            });
            console.log('Total',t);
            
            resolve({mining:min,total:t});
        })
    })
}

function deleteMiningTransactions(min,usr) {
    return new Promise((resolve, reject)=>{
                                        min.forEach(async m => {
                                            await findTrans(m,usr);
                                        }); 
    })
}


function findTrans(m,usr) {
    return new Promise((resolve, reject)=>{

                                      if (!isNaN(m.earned)) {
                                        // console.log('minded Date : ',m.created);
                                        // var returned_endate = moment(new Date(m.created)).subtract(1, 'date');
                                        // console.log(returned_endate);
                                        
                                        
                                        // console.log(m.created);
                                        // var date = new Date(m.created);
                                        // date.setHours(0, 0, 0, 0);
                                        // var justDate = date.getTime();
                                        // console.log(justDate);
                                        

                                        // justDate =justDate.toString();
                                        
                                        // user_id:usr._id,address:'ROI',amount:m.earned,
                                        Transection.find({date:m.date, user_id:usr._id,amount:m.earned})
                                        .then(function name(params) {
                                            console.log(params[0]);
                                            
                                             console.log("******");
                                        })

                                      }
                                      resolve();
                                
    })
}


function getMiningTillDate1(order_id,date) {
    return new Promise((resolve, reject)=>{
        
        Earning.aggregate([{
            $match: { $and: [{order_id:order_id,created:{$gte:date}}] },
        }, {
            $group: {
                _id: null,
                total: {
                    $sum: "$earned"
                }
            }
        }]).then(function (totalAmount) {
            
            if (totalAmount.length > 0) {
                if (totalAmount[0].total > 0) {
                     resolve(totalAmount[0].total);
                }
                else {
                    resolve(0);
                }
            }
            else {
                resolve(0);
            }

        })
    })
}



// checkForOrderLimits();



function changeLimit(user_id,newLimit) {
    return new Promise((resolve, reject)=>{
        
        let editUser = {};
        editUser.limit = newLimit;
        editUser.orders = 'active';

        let query = { _id: user_id };

        User.updateOne(query, editUser, function (err, re) {
            if (err) {
                console.log(err);
                resolve();
            } else {
                console.log(re);
                resolve();
            }
        });
    }) 
}

router.get('/checkUserLength',function (req,res) {
    len = 0;
    User.find({}).then(function (usrs) {
        usrs.forEach(usr => {

            if (usr.username.length > len  ) {
                len = usr.username.length;
                console.log(len + usr.username);
            }
        });
        res.send({len : usrs.length})
    })
})



// router.get('/checkDate',function (req,res) {
//     len = 0;

//     Order.find({status:'active'}).then(function (usrs) {
//         usrs.forEach((usr, index) => {
//             setTimeout(() => {
                
//                 console.log('Old Date : '+ moment.unix(usr.completion_date/1000).format('LLL'));
//                 const formatted = moment.unix(usr.completion_date/1000).subtract(1, 'd').format('LLL');
//                 console.log('New Date : '+formatted); 

//                 timestamp = moment(formatted).format("X");

//                 timestamp = timestamp * 1000;
//                 updateOrderDate(usr.order_id,timestamp);

//             }, index * 200);

//         });
//         res.send({len : usrs.length})
//     })
// })


function updateOrderDate (order_id, completion_date) {
    return new Promise((resolve, reject) => {
    let order = {};
        order.completion_date = completion_date;

        let query = { order_id: order_id };
        Order.updateOne(query, order, function(err, result) {
            if (err) {
                console.log(err);
                return;
            } else {
                console.log(result);
            }
            resolve();
        })
    })
}



router.get('/blockUsers',adminAuth,function (req, res) {

var searchQuery = Payout.find({status:'pending'}) 
  searchQuery.lean().exec(function (err, payReqs) {
    if (err) {
      console.log(err);
      return;
    }
    else{
      var promises = payReqs.map( function(payReq) {
                
          return  Order.find({user_id:payReq.user_id}).then( function (ord) {
                console.log(ord);
                payReq.ord = ord[0];
                payReq.order  = ord[0].price;
                payReq.orderType  = ord[0].order_types;
                return  getTotalPayouts(payReq.user_id.toString()).then(function (tots) {
                    payReq.tt = tots;
               }).then(function () {
                  return User.find({_id:payReq.user_id}).then(function (usr) {
                       payReq.username = usr[0].username;
                   }).then(function () {
                    return payReq;
                   })
                
              })
              
            })
      });
        Promise.all(promises).then(function(results) {
            //res.send(results)
            res.render('admin/blockUsers', {
                user: req.user,
                results:results
            });
        })
    }

})
    
})

router.post('/test/blockUser',adminAuth, function(req, res) {
    User.find({_id:req.body.user_id}).then(function (usr) {

        blockUser(req.body.user_id)
        cancelP(req.body.user_id).then(function () {
        ccbemails.block_account(usr[0].username, usr[0].email);

            res.send({ 'stat': 'yes', 'message':usr[0].username+' is blocked.' });    
       
        }) 
        
        
         
    })
    
})

function cancelP(user_id) {
    return new Promise((resolve, reject) =>{
            Payout.find({user_id:user_id , status:'pending'}).then(function (pays) {
                pays.forEach((pay, index ) => {
                    setTimeout(() => {
                        cancelPayouts(user_id, pay.total, pay._id)                       
                    }, index * 200);
                });
                resolve('');
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

function blockUser(user_id) {
    return new Promise((resolve, reject)=>{
        let editUser = {};
        editUser.status = 'block';

        let query = { _id: user_id };

        User.updateOne(query, editUser, function (err) {
            if (err) {
                console.log(err);
                resolve();
            } else {
                resolve();
            }
        });
    }) 
}



 
function getUserData(user_id) {
    
    return new Promise((resolve, reject)=>{
        arr = {}
        User.find({_id:user_id}).then(function (usr) {
            
            arr.username = usr[0].username;

            Order.find({user_id:user_id,order_status:'paid'}).then( function (ord) {
                var tOrd = 0;
                ord.forEach(or => {
                    tOrd = tOrd + or.price;
                });
                
                getTotalPayouts(user_id.toString()).then(function (tots) {
                    arr.total = tots;
                    arr.order  = tOrd;
                arr.order_type = ord[0].order_type;
                }).then(function () {
                    resolve(arr);
                })
            })
        }) 
    })
}



router.get('/thisMonth',function (req, res) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth());
    timestamp = moment(today).format("X");
     
    Order.aggregate([{
        $match: { $and: [{ order_type: 'real', order_status: 'paid', activation_date:{$gte:timestamp} }] },
    }, {
        $group: {
            _id: null,
            total: {
                $sum: "$total"
            }
        }
    }]).then(function (totalAmount) {
        res.send(totalAmount);
        if (totalAmount.length > 0) {
            
        }
        else {
            res.send('Nai aya result');
            
        }

    })

});

router.get('/todaySale',function (req, res) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    timestamp = moment(today).format("X");
     
    Order.aggregate([{
        $match: { $and: [{ order_type: 'real', order_status: 'paid', activation_date:{$gte:timestamp} }] },
    }, {
        $group: {
            _id: null,
            total: {
                $sum: "$total"
            }
        }
    }]).then(function (totalAmount) {
       
        if (totalAmount.length > 0) {
            res.send(totalAmount);     
        }
        else {
            res.send('Nai aya result');
            
        }

    })

});



router.get('/userTest',function (req, res) {
    let newUser = new User({
        first_name: "Mike",
        last_name: "ROss",
        username: "mross", 
        gender: "male",
        country: "p",
        email: "mross@gmail.com",
        password: "mrossi",
        token: "token"
    });

    newUser.save(function(err, result) {
        if (err) {
            console.log(err);
            if (err) {
                console.log(err.message);
            }

            res.send({ 'user': err.message });
        } else {
                res.send('User is enter');
            }
    })
})


function checkAllUsers() {
    User.find({}).then(function (usrs) {
        usrs.forEach(usr => {
            //console.log(usr);
            
        });
        usrs.forEach(usr => {
            if (usr.user_type != 'admin') {
                Referral.find({user:usr.username}).then(function (tree_ref) {
                    
                    if (tree_ref.length > 0) {
                        if (tree_ref[0].user =='tester') {

                            console.log(tree_ref[0]);
                        }    
                    }else{
                        DirectReferrals.find({referred_to:usr.username}).then(function (ref) {
                            if (ref.length > 0) {
                                console.log(ref);
                                if (ref[0].referred_to ==  ref[0].referred_by) {
                                    console.log('It has same referred by and referred to');
                                }
                            }else{
                                console.log(usr.username+ ' Direct ki info bhi nai h');
                                
                            }
                        })
                        console.log(usr.username+' is not in tree');
                    }
                })    
            }
        });
    }).catch(function (err) {
        console.log(err);
    })
}

// checkAllUsers();

router.get('/roileaders/:leader', function(req, res) {
    User.find({ username: req.params.leader }).then(function(users) {
        if (users.length > 0) {
            users.forEach(async user => {

                //   await getUserEarning(user);

                //    ccbemails.leader_account_roi(user.email, user.username);
            });

            res.send(users);
        } else {
            res.send('user not found');
        }

    }).catch(function(err) {
        console.log(err);
    });
});

router.get('/changeOrders',adminAuth, function(req, res) {
    Order.find({ order_status: 'paid', payed_through:'direct_pay' },{order_id:-1, address:-1}).then(function(orders) {
        console.log(orders);
        
        if (orders.length > 0) {
            console.log('Length of Orders :'+ orders.length);
            
            orders.forEach(function(ord , idx) {
                console.log('order: '+ord.order_id);
                setTimeout(() => {
                    console.log('iteration # '+idx);
                    changeOrder(ord.order_id);
                }, 100);
            }); 
            
            res.send(orders);

        } else {
            res.send('user not found');
        }

    }).catch(function(err) {
        console.log(err);
    });
});

// Sending Roi to the Users from matching Earnings
router.get('/sendingR/:userid', function(req, res) {
    User.find({username:req.params.userid}).then(function (usr) {
        Order.find({ order_status: 'paid', user_id:usr[0]._id }).then(function(orders) {
            
            updateLimit(usr[0]._id,orders[0].package_id).then(function (back) {
                console.log(back);
                
                if (back == 1) {


                    Earning.find({order_id:orders[0]._id}).then(function (earns) {
                        console.log(earns);

                        earns.forEach(function(earn, index) {
                            setTimeout(function() {
                                Transection.find({user_id:usr[0]._id,address:'ROI',date:earn.date}).then(function (rois) {
                                    if (rois.length > 0) {
                                        console.log('Date '+ earn.date);
                                        console.log(rois);
                                        
                                    }else{
                                        console.log('Date '+ earn.date+" NOt found in trans ");
                                        console.log(earn.earned);
                                        payROI(orders[0].user_id, earn.earned, earn.date).then(function() {
                                            console.log('Done !!!');
                                        });
                                       // payEarning(earn.earned, earn.date, earn.admin_id, orders[0]);
                                    }
                                });
                                },
                                100 * index);
                        })

                        
                    })        
                }else{
                    console.log('Limit not updated !!!');
                }
            })
            
            if (orders.length > 0) {
                
                
                res.send(orders);
    
            } else {
                res.send('user not found');
            }
    
        }).catch(function(err) {
            console.log(err);
        });    
    })
});


// sending ROI of specific Date //////////////////////

router.get('/checkSendRoi', adminAuth , function(req, res) {
    value = 75;
    admin_id = req.user._id;
    date = '1562371200000';
    Order.
    find({ status: 'active' }).
    then(function(orders, err) {
        if (err) {
            console.log(err);
        } else {
            orders.forEach(function(order, index) {
                setTimeout(function() {
                    
                    Transection.find({user_id:order.user_id.toString(),address:'ROI',date:'1562371200000'}).then(function (trans) {
                        if (trans.length < 1) {
                            getUserName(order.user_id.toString()).then(function (usr) {
                                console.log(usr);
                            })
                        }
                    })                  
                      
                    },
                    100 * index);
            })
            res.send('checkSendingROI');
        }
    });
});



router.get('/sendRoi', adminAuth , function(req, res) {
    
    value = 74;
    admin_id = req.user._id;
    date = '1562371200000';
    Order.
    find({ status: 'active' }).
    then(function(orders, err) {
        if (err) {
            console.log(err);
        } else {
            orders.forEach(function(order, index) {
                setTimeout(function() {
                   // console.log(order);
                    
                    Transection.find({user_id:order.user_id.toString(),address:'ROI',date:'1562371200000'}).then(function (trans) {
                        if (trans.length < 1) {
                            payEarning(value, date, admin_id, order);
                        }
                    })                  
                      
                    },
                    50 * index);
            })
            res.send('sendRoi');
        }
    });
});


function getUserName(user_id) {
    return new Promise((resolve, reject)=>{
        User.find({_id:user_id}).then(function (usr) {
            resolve(usr[0].username);
        })
    });
}

// Ending Sending ROI of specific Date //////////////////////

///// CHeck direct business ///////////////////////////////

router.get('/checkDirectBusiness',function (req,res) {
    total = 0;
    User.find({account:'active',email:'miann3507@gmail.com'},{_id:-1,username:-1,limit:-1}).then(function (users) {
        users.forEach( async usr => {
            console.log(usr.username +' - '+usr.limit/5);
            total = total+usr.limit/5;
            console.log(total);
            
            
         var x  =  await totalBusiness(usr._id).then(function (tot) {
             
                if (tot >= 3000) {
                    console.log(usr.username);
                    console.log(tot);                    
                }
             
            })   
        });
        res.send({count : users.length});
    });
});


function totalBusiness(user_id) {
   // gte = 1551384000000
   // lte = 1555272000000

    const dates= {
        "$gte": new Date("2019-05-01T00:00:00.000Z"),
        "$lte": new Date("2019-07-30T00:00:00.000Z")
    }
    user_id = user_id.toString();
    
    return new Promise((resolve,reject)=>{
      Transection.aggregate([{
        $match : { created:dates, user_id: user_id, address:'Binary Referral Bonus'  },
        },{
            $group : {
                _id : null,
                total : {
                    $sum : "$amount"
                }
            }
        }]).then(function (py) {
                
            if(py.length > 0){
               // console.log(py[0].total);
                resolve(py[0].total); 
            }else{
              //  console.log('NOthing');
              resolve(0);
            }
        
        })
    })
    
  }



////////////////////////////////////////////////



//////////////////////Checking Promo accounts againts direct and business //////////////////////////

var totalPayout = 0; 

router.get('/totalp',function (req, res) {
    res.send({'total' : totalPayout})
})

router.get('/checkPromo',function (req,res) {

        var newString = '2W5G46'.replace(/[ ,]+/g, ",");
  var array = newString.replace(/\s/g, '');
  array = array.split(",");
 // console.log(array);
    array.forEach(function (arr ,index) {
        setTimeout(function() {
        Order.find({ order_status:'paid', order_id:arr},{_id:-1,user_id:-1, activation_date:-1,business:-1,price:-1,order_type:-1}).then(function (orders) {
            usr = orders[0];

                       User.find({_id:usr.user_id.toString()}).then(async function (u) {
                        console.log(" ");  
                     //   console.log("********************************************************");
                           var business;
                           if (u.length > 0  &&  u[0].username != 'tester' && u[0].username != 'Forever'  ) {
                            
                            console.log('User : '+u[0].username);
                            console.log('Account Type : '+usr.order_type);
                            console.log('Business : '+usr.business+'x');
                            console.log('Balance : '+u[0].balance.toFixed(2));
                            console.log('Email : '+u[0].email);                
                            console.log('Activation Date : '+ moment.unix(usr.activation_date / 1000).format("LL"));
                            console.log('Package : '+ (usr.price));
                             await  getTotalPayouts(u[0]._id.toString()).then(function (tots) {
                                  console.log('Total Payout : '+tots);
                                  totalPayout = totalPayout + tots; 
                                }).then( async function () {
    
                                    await getDirectBusiness(u[0].username).then(function (busi) {
                                        console.log('Total Direct Business : '+busi);
                                        business = busi;
                                    }).then( async function () {
                                        
                                        await getTotalTrans(u[0]._id.toString(),'ROI').then(function (roi) {
                                         //   console.log('Total ROI : '+roi);
                                        //     if (business >= usr.price*usr.business ) {
                                        // //        console.log('User has fullfilled his business');
                                        //     }else{
                                        //   //      console.log('User has not fulfilled his business');
                                        //         var allowed = u[0].balance - roi;
                                        //         allowed = allowed.toFixed(2);
                                        //     //    console.log('After Removing ROI, New balance will be : '+allowed);
                                        //         if (allowed < 10) {
                                        //              console.log(u[0].username);
                                        //             changeOrd(arr).then(function () {
                                        //                 changeUser(u[0]._id,u[0].earned);     
                                        //             })
                                        //       //      console.log('User account balance is in negative, '+allowed);
                                        //         }  
                                        //     }
                                        })
            
                                    }) 
                                    
                                })
            
                               
                           }else{
                               if (u[0].username != 'tester') {
                                    console.log(usr+'not found');    
                               }
                           }
                       })              
                  
        });       
    },
    1000 * index); 
    })
    res.send({count : array.length});
});




// router.get('/checkPromo',function (req,res) {
    
//     Order.find({order_type:'promo', order_status:'paid'},{_id:-1,user_id:-1, activation_date:-1,business:-1,price:-1}).then(function (orders) {
         
//         orders.forEach(function(usr, index) {
    
//             setTimeout(function() {
//                    User.find({_id:usr.user_id.toString()}).then(async function (u) {
//                     console.log(" ");  
//                     console.log("********************************************************");
//                        var business;
//                        if (u.length > 0  &&  u[0].username != 'tester' ) {
                                                      
//                         console.log('X Business : '+usr.business);
//                         console.log('User : '+u[0].username);
//                         console.log('Balance : '+u[0].balance);
//                         console.log('Email : '+u[0].email);                
//                         console.log('Activation Date : '+ moment.unix(usr.activation_date / 1000).format("LL"));
//                         console.log('Package : '+ (u[0].limit/10));
//                          await  getTotalPayouts(u[0]._id.toString()).then(function (tots) {
//                               console.log('Total Payout : '+tots);
//                             }).then( async function () {

//                                 await getDirectBusiness(u[0].username).then(function (busi) {
//                                     console.log('Total Direct Business : '+busi);
//                                     business = busi;
//                                 }).then( async function () {
                                    
//                                     await getTotalTrans(u[0]._id.toString(),'ROI').then(function (roi) {
//                                         console.log('Total ROI : '+roi);
//                                         if (business >= usr.price*usr.business ) {
//                                             console.log('User has fullfilled his business');
//                                         }else{
//                                             console.log('User has not fulfilled his business');
//                                             var allowed = u[0].balance - roi;
//                                             console.log('After Removing ROI, New balance will be : '+allowed);
//                                             if (allowed < 1) {
//                                                 console.log('User account balance is in negative, '+allowed);
//                                             }  
//                                         }
//                                     })
        
//                                 }) 
                                
//                             })
        
                           
//                        }else{
//                            if (u[0].username != 'tester') {
//                                 console.log(usr+'not found');    
//                            }
//                        }
//                    })              
                  
//                 },
//                 1500 * index);
//         })
//         res.send({count : orders.length});
//     });
// });


function getTotalPayouts(user_id, dates) {
    return new Promise((resolve, reject) => {
        check = {};
        check.user_id = user_id;
        check.status = "paid";
        if (dates) {
            check.created = dates;            
        }

      Payout.aggregate([{
        $match : check ,
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

 
function changeOrd (order_id) {
    return new Promise((resolve, reject) => {
    let order = {};
        order.activation_charges = 10;
        order.package_id = "5c0f9824a9217f111dc29f7c";
        order.total = 110;
        order.price = 100;

        let query = { order_id: order_id };
        Order.updateOne(query, order, function(err, result) {
            if (err) {
                console.log(err);
                return;
            } else {
         //       console.log(result);
            }
            resolve();
        })
    })
}

function changeUser(user_id,earned) {
    return new Promise((resolve, reject) => {
     //   console.log(earned);
        let usr = {};
        usr.limit = 1000 + parseInt(earned);
        usr.balance = 0;
        
   //     console.log(usr);
        

        let query = { _id: user_id };
        User.updateOne(query, usr, function(err, result) {
            if (err) {
                console.log(err);
                return;
            } else {
       //         console.log(result);
            }
            resolve()
        })
    })
}
 

  router.get('/checkUser' , function(req, res) {
      totalPrice = 0;
      totalPayout = 0;
    
    var newString = 'syedfaraz faislabad amirbashir sharjeel1 Sarfaraz2 hamzamughal farazhassan Malik96 Sarfaraz1 adnanbardana asif syedfarazccbtc Sarfaraz Izhankhan98 sharjeel sharjeel5 sharjeel3 sharjeel4 amir1 Abdul1 abdul2 Abdulccb Safccb Amirccb Shahood Shuraimccb Maazccb Aaziz rana3 ali98 ali99 Ali94 ali97 rana2 Ali93 Rana1993 Ali96 Malik1993 Ali95 aisha96 Adnan1993 arsalan.alam6 noor673 rehman tajjm hussainsaifuddin1995 mamoonali Minhajz Nida AbbasMustafa Annus.aslam syedarsalanali rockscoor peshawar Samrannafees Joji Ramz Fazilkhan ABDULAHAD Ufaraz Kamrangatta sonnita igroup786 ceojaybee  Sarmad fadiaimran Ghazanfarccb Sheikh Moinkhan Shahidsheikh Shahidsheikh Shahidsheikh Ntakween Azharahmed Zaidshah Mshahid Mshahid Fahadali Arshadali Farooqccb Umarfaraz Bilalhaneef306 uzmasaleem Khawaja Mccb Rizwan.Uddin96 Shahid%20ccb Anas%20ccb Mzahid Mubeenccb1 Zohaib Adnanccb1 M%20farhan saeed shahg anasahmed habiba habiba mehmood_78 Ubaid Alibukshkhan sarfarazali faizan Mimran ali786 khalid kanwaal Arslan2 Sjad richccb imrank deex8 BitcoinEmpress Playerccb Anus Sharjeelrumeel Farooq vivienne17 babaruddin Panda Wahabchopra Millionaire360 saltaf Maten famycool25 Hamzaqadir Hamzaqadir Sheri Sharjeel'.replace(/[ ,]+/g, ",");
    var array = newString.replace(/\s/g, '');
  
    array = array.split(",");
    console.log(array);
    
  array.forEach(function(usr, index) {
    
    setTimeout(function() {
           User.find({username:usr}).then(async function (u) {
            console.log(" ");  
            console.log("********************************************************");
               
               if (u.length > 0) {
                console.log('User : '+u[0].username);
                console.log('Email : '+u[0].email);                

                 await  getTotalPayouts(u[0]._id.toString()).then(function (tots) {
                      console.log('Total Payout : '+tots);
                      totalPayout = totalPayout + tots*1;
                      
                    }).then( async function () {
                            
                        await getDirectBusiness(u[0].username).then(function (busi) {
                            console.log('Total Direct Business : '+busi);
                        }).then( async function () {
                            
                            // await getTotalTrans(u[0]._id.toString(),'ROI').then(function (roi) {
                            //     console.log('Total ROI : '+roi);
                            // })
                            getUserData(u[0]._id.toString()).then(function (ord) {
                                    console.log('Package : '+ ord.order);
                                    console.log('Package Type : '+ ord.order_type);

                                    totalPrice = totalPrice + ord.order;
                                    console.log('Total Order Prcie :'+totalPrice);
                                   // console.log('Overall Total Payout :'+totalPayout);
                                    

                            })

                        })
                        
                    })

                   
               }else{
                   console.log(usr+'not found');
               }
           })              
          
        },
        1000 * index);
})

  res.send(array);
});


/////////////////////////////////////////////////////////////////////////////////////////////////////

router.get('/mian',function (req,res) {
    User.find({email:'snowwell555@gmail.com',limit:{$gt:1}},{username:-1}).then(function (usrs) {
        
        usrs.forEach(u => {
            console.log(u.username);
        });

        res.send(usrs);
        
    })
})



////////////////////////////////////////////////////////////////////////////////////////////////////


router.get('/transCheck' , function(req, res) {


  
    var newString = 'Pak111 Usman04 imran1 imran2 imran3 pak012 pak013 pak014 pak015'.replace(/[ ,]+/g, ",");
    var array = newString.replace(/\s/g, '');
    array = array.split(",");
    

            
              array.forEach(function(usr, index) {
  
                setTimeout(function() {
                       User.find({username:usr}).then(async function (u) {
                        console.log(" ");  
                        console.log("********************************************************");
              
                           if (u.length > 0) {
                            console.log('User : '+u[0].username);
              
                             await  trans(u[0]._id.toString()).then(function (tots) {
                                 
                                tots.forEach(tran => {
                                    
                                    console.log('Amount : '+tran.amount +' -- ' + moment(tran.created).format('LL'));
                                });               
                               
                                    })
                               
                           }else{
                               console.log(usr+'not found');
                           }
                       })              
                      
                    },
                    1000 * index);
              })  
        





res.send(array);
});


function trans(user_id) {
    return new Promise((resolve, reject) => {
        
        Transection.find({ user_id: user_id, address: 'Binary Referral Bonus' }).then(function(trans) {
            
           if (trans.length > 0) {
                // trans.forEach(tran => {
                //     console.log('Amount :'+tran.amount);
                //     console.log('Date : '+ moment(tran.created).format('LLL'));
                // });   
                resolve(trans);            
           } 
           resolve([]);

           
            
        }).catch(function(err) {
            console.log(err);
        });
     
    });
}



////////////////////////////////////////////////////////////////////////////////////////////////////





////////////////////////////////////////////////////////////////////////////////////////////////////


router.get('/checkUserPayout' , function(req, res) {
  
    var newString = 'syedfaraz faislabad amirbashir sharjeel1 Sarfaraz2 hamzamughal farazhassan Malik96 Sarfaraz1 adnanbardana asif syedfarazccbtc Sarfaraz Izhankhan98 sharjeel sharjeel5 sharjeel5 sharjeel3 sharjeel4 sharjeel4 amir1 Abdul1 abdul2 Abdulccb Safccb Amirccb Shahood Shuraimccb Maazccb Aaziz rana3 ali98 ali99 Ali94 ali97 rana2 Ali93 Rana1993 Ali96 Malik1993 Ali95 aisha96 Adnan1993 arsalan.alam6 noor673 rehman tajjm hussainsaifuddin1995 mamoonali Minhajz Nida AbbasMustafa Annus.aslam syedarsalanali rockscoor peshawar Samrannafees Joji Ramz Fazilkhan ABDULAHAD Ufaraz Kamrangatta sonnita igroup786 ceojaybee  Sarmad fadiaimran Ghazanfarccb Sheikh Moinkhan Shahidsheikh Shahidsheikh Shahidsheikh Ntakween Azharahmed Zaidshah Mshahid Mshahid Fahadali Arshadali Farooqccb Umarfaraz Bilalhaneef306 uzmasaleem Khawaja Mccb Rizwan.Uddin96 Shahid%20ccb Anas%20ccb Mzahid Mubeenccb1 Zohaib Adnanccb1 M%20farhan saeed shahg anasahmed habiba habiba mehmood_78 Ubaid Alibukshkhan sarfarazali faizan Mimran ali786 khalid kanwaal Arslan2 Sjad richccb imrank deex8 BitcoinEmpress Playerccb Anus Sharjeelrumeel Farooq vivienne17 babaruddin Panda Wahabchopra Millionaire360 saltaf Maten famycool25 Hamzaqadir Hamzaqadir Sheri Sharjeel'.replace(/[ ,]+/g, ",");
    var array = newString.replace(/\s/g, '');
    array = array.split(",");
    console.log(array);
    var totalPayout = 0;

    const dates= {
        "$gte": new Date("2019-07-01T00:00:00.000Z"),
        "$lte": new Date("2019-07-30T00:00:00.000Z")
    }

array.forEach(function(usr, index) {
  
  setTimeout(function() {
         User.find({username:usr}).then(async function (u) {
          console.log(" ");  
          console.log("********************************************************");

             if (u.length > 0) {
              console.log('User : '+u[0].username);
              console.log('Email : '+u[0].email);                

               await  getTotalPayouts(u[0]._id.toString(), dates).then(function (tots) {
                    console.log('Total Payout : '+tots);
                    totalPayout = totalPayout + tots*1;
                    console.log('Total : '+totalPayout);
                  })

                 
             }else{
                 console.log(usr+'not found');
             }
         })              
        
      },
      100 * index);
})

res.send(array);
});



////////////////////////////////////////////////////////////////////////////////////////////////////





function updateLimit(user_id, pack_id) {
    return new Promise((resolve,reject)=>{
        Package.findOne({ _id: pack_id }).then(function(pack) {

            limit = pack.price * 10;
    
            User.findOne({ _id: user_id })
                .then(function(user) {
    
                    let toUpdate = {};
                    toUpdate.limit = user.limit + limit;
                    let query = { _id: user_id }
    
                    User.update(query, toUpdate, function(err) {
                        if (err) {
                            console.log(err);
                            return;
                        } else {
                            console.log('Limit is updated!');
                            resolve(1);
                        }
                    });
                }).catch(function(err) {
                    console.log(err);
                    resolve(false);
                });
    
        }).catch(function(err) {
            console.log(err);
            resolve(false);
        });
    })
    

}

function checkCompletion(order_id) {
    return new Promise(()=>{
        Order.
    findOne({ status: 'active', order_id:order_id },{completion_date:-1}).
    then(function(orders, err) {
        if (err) {
            console.log(err);
        } else {
            let cDate = orders.completion_date;
            time = cDate / 1000;
            cDate = moment.unix(time).format("YYYY-MM-DD");
            check = moment(new Date()).format("YYYY-MM-DD");            

            if (moment(cDate).isSame(check)) {
                resolve(true);
            }else{
                resolve(false);   
            }
        }
    });
    })
}



async function payEarning(value, date, admin_id, order) {

    let sDate = order.activation_date;
    let cDate = order.completion_date;
    let total = order.price;

    total = total * 1;
    time = sDate / 1000;
    sDate = moment.unix(time).format('L');

    time = cDate / 1000;
    cDate = moment.unix(time).format('L');

    sDate = moment(sDate, 'MM/DD/YYYY');
    cDate = moment(cDate, 'MM/DD/YYYY');

    totalDays = moment.duration(cDate.diff(sDate)).asDays();

    totalToEarn = total + (total * (value / 100));

    perDayEarn = totalToEarn / totalDays;
    perDayEarn = perDayEarn.toFixed(2);
    console.log('--earing today--');
    console.log(perDayEarn);

    var x = await saveDailyEarning(perDayEarn, date, admin_id, order._id, order.user_id, order.payed_through);

}

async function saveDailyEarning(perDayEarn, date, admin_id, order_id, user_id, order_type) {
    return new Promise((resolve, reject) => {

        newEarning = new Earning({
            earned: perDayEarn,
            date: date,
            admin_id: admin_id,
            order_id: order_id
        });

        newEarning.save(function(err, result) {
            if (err) {
                console.log('err');
                console.log(err);
            } else {
                console.log('earning save');
                console.log(result);

                payROI(user_id, perDayEarn, date).then(function() {
                    resolve('');
                });

            }
        })
    });
}

async function payROI(user_id, amount, date) {

    return new Promise((resolve, reject) => {
        console.log('paying roi');
        console.log(amount);

        updateAccount('id', user_id, '+', amount, 'confirmed', 'ROI', 'deposit', date).then(function () {
            resolve('');            
        })


    });
}


function changeOrder(order_id) {
    return new Promise((resolve, reject) => {
        const client = new Client();
        Order.find({order_id:order_id}).then(function (order) {
            console.log(order[0].address);
            if (order[0].address != "") {
                client.get('https://blockchain.info/rawaddr/' + order[0].address,
                function(data) {
                    
                    if (data) {
                        time = data['txs'][0].time;
                        if (data['txs'].length > 0) {
                            
                            console.log('txs has values.');
                            getBtcVal(time).then(function (btc) {
                                console.log('bb'+btc);
                                btcS = toBtc(data.total_received);
                                    price = btcS * btc;
                                  
                                    console.log('usd amount is ' + price);
                                    if (price < 0.50) {
                                        console.log('this is promo account');
                                        changeOrderType(order_id,'promo').then(function () {
                                            resolve('');
                                        });
                                    }
                                    else{
                                        changeOrderType(order_id,'real').then(function () {
                                            resolve('');
                                        });
                                    }
                            });    
                        }
                        else{
                            console.log('txs has no value.');
                            
                        }
                            
                    }else{
                        resolve('');
                    }
                });    
            }
            else{
                changeOrderType(order_id,'promo').then(function () {
                    resolve('');
                });
            }                        
        }).catch(function (err) {
            console.log(err);
        });
        
    });
}


function toBtc(value) {
    BTC = value / 100000000;
    return BTC;
}

function getBtcVal(time) {
    return new Promise((resolve, reject) => {
        const client = new Client();
        client.get("https://min-api.cryptocompare.com/data/pricehistorical?fsym=BTC&tsyms=USD&ts=" + time, async function(data, status) {

            resolve(data['BTC'].USD);

        });
    });
}


function changeOrderType(order_id, oType) {
    return new Promise((resolve, reject) => {
        console.log('i am order : '+order_id);
        
        let order = {};
        order.order_type = oType;
        let query = { order_id: order_id };
        Order.update(query, order, function(err, result) {
            if (err) {
                console.log(err);
                return;
            } else {
                resolve('');
            }
        });
    });
  }
 
  var left = 0;
  var right = 0;
  var leftBR = 0;
  var rightBR = 0;
  var leftBP = 0;
  var rightBP = 0;    
  var totalRealPpl = 0;

// Tahir : Total Payout   141727.731, Total Sale: 135350
 
    // getLeftRight('Muhammadi').then(function () {
    //       setTimeout(() => {   
    //         console.log('Left Real    :'+leftBR); 
    //         console.log('Right Real   :'+rightBR);
    //         console.log('Left Promo   :'+leftBP); 
    //         console.log('Right Promo  :'+rightBP);
    //         console.log('ppl  :'+totalRealPpl);          
    //       }, 10000);  
    //   });    

  function getLeftRight(user) {
    return new Promise((resolve, reject) => {
        Referral.find({ user: user }).then(async function(refDetails) {

            if (refDetails[0].left != '') {
                left++;
                leftBusiness(refDetails[0].left);
                    await calLeft(refDetails[0].left);
                    console.log('Left ' + left);                    
                
            }

            if (refDetails[0].right != '') {
                right++;
                rightBusiness(refDetails[0].right)
                    await calRight(refDetails[0].right);
                    console.log('Right ' + right);                    
                 
            }

            resolve('');
        }).catch(function(err) {
            console.log(err);
        });

    });
}

async function calLeft(user) {
    var child = await getChildren(user);
    if (child.left != '') {
        await calLeftRight(child.left, 'left');
        leftBusiness(child.left).then(function () {
            left++;    
        });
    }
    if (child.right != '') {
        await calLeftRight(child.right, 'left');
        leftBusiness(child.right).then(function () {
            left++;    
        });
    }
    if (child == '') return '';
}

async function calRight(user) {
    var child = await getChildren(user);

    if (child.left != '') {
        await calLeftRight(child.left, 'right');
        rightBusiness(child.left).then(function () {
            right++;    
        });
        
    }
    if (child.right != '') {
        await calLeftRight(child.right, 'right');
        rightBusiness(child.right).then(function () {
            right++;            
        });
    }
    if (child == '') return '';
}

async function calLeftRight(user, toAdd) {

    await getChildren(user).then(async function(child) {

        if (child.left != '') {
            await calLeftRight(child.left, toAdd).then(function() {
                if (toAdd == 'left') {
                    leftBusiness(child.left).then(function () {
                        left++;    
                    });
                }
                if (toAdd == 'right') {
                    rightBusiness(child.left).then(function () {
                        right++;    
                    });
                }
            });
        }

        if (child.right != '') {
            await calLeftRight(child.right, toAdd).then(function() {
                if (toAdd == 'left') {
                    leftBusiness(child.right).then(function () {
                        left++;    
                    });
                }
                if (toAdd == 'right') {
                    rightBusiness(child.right).then(function () {
                        right++;
                    });
                    
                }
            });
        }
        if (child == '') return '';
    });

}

 
function getChildren(user) {
    return new Promise((resolve, reject) => {
        Referral.find({ user: user }, function(err, usr) {
            if (err) {
                console.log('err : ' + err);
            }
            if (usr.length > 0) {
                resolve(usr[0]);
            } else {
                resolve('');
            }
        });
    });
} 

function leftBusiness(user) {
    return new Promise((resolve, reject) => {

        // const dates= {
        //     "$gte": "1551384000000",
        //     "$lte": "1555272000000"
        //     }

    User.find({username:user},{_id:-1,username:-1}).then(function(usr) {
        Order.find({user_id:usr[0]._id,order_status:'paid'},{price:-1, order_type:-1, order_id:-1,order_status:-1}).then(function (ords) {
            if (ords.length > 0) {
                ords.forEach(ord => {

                        
                       // console.log(usr[0].username);
                    if (ord.order_type == "real") {
                       // console.log((totalRealPpl++) +' - '+ usr[0].username + ' : '+ord.price);
                       // console.log('I am order : '+ ord.order_id+' and i am '+ord.price+' on left'+' and i am '+ ord.order_status);
                        leftBR = leftBR + parseFloat(ord.price);    
                    }else{
                       // console.log(usr[0].username);
                        leftBP = leftBP + parseFloat(ord.price);
                    }
                    resolve('');
                });     
            }
        })
    });
});
}



function rightBusiness(user) {
     return new Promise((resolve, reject) => {
    
        //     const dates= {
    //         "$gte": "1551384000000", 
    //         "$lte": "1555272000000"
    //         }
    User.find({username:user},{_id:-1,username:-1}).then(function(usr) {
        
        Order.find({user_id:usr[0]._id,order_status:'paid'},{price:-1, order_type:-1, order_id:-1,order_status:-1}).then(function (ords) {
            if (ords.length > 0) {
                ords.forEach(ord => {
                    console.log(usr[0].username);
                   //  console.log((totalRealPpl++) +' - '+ usr[0].username + ' : '+ord.price);
                    //console.log('I am order : '+ ord.order_id+' and i am '+ord.order_type +'on right'+' and i am '+ ord.order_status);
                    if (ord.order_type == "real") {
                       // console.log((totalRealPpl++) +' - '+ usr[0].username + ' : '+ord.price);
                       // console.log('I am order : '+ ord.order_id+' and i am '+ord.price +' on right'+' and i am '+ ord.order_status);
                      // console.log((totalRealPpl++) +' - '+ usr[0].username + ' : '+ord.price);
                       rightBR = rightBR + parseFloat(ord.price);    

                    }else{
                        
                      //  console.log('I am order : '+ ord.order_id+' and i am '+ord.price +' on right'+' and i am '+ ord.order_type);
                       //console.log(ord.order_id);
                        rightBP = rightBP + parseFloat(ord.price);
                    }
                    resolve('');             
                });    
            }
        })
    });
    });
}



 
async function getUserEarning(user) {
    await getTotalEarings(user._id).then(function(totEarn) {
        return totEarn;
    }).then(function(t) {
        console.log('t is here ' + t);
    });
}

function getTotalEarings(user_id) {
    return new Promise((resolve, reject) => {
        var totalEarnings = 0;
        Order.find({ user_id: user_id, payed_through: 'leader_account' }).then(async function(orders) {

            if (orders.length > 0) {
                console.log('order :');
                console.log(orders);

                await getEarnings(orders[0]._id, orders[0].user_id).then(function(tot) {
                    console.log('tot : ' + tot);
                    totalEarnings = totalEarnings + tot;
                });

            }

        }).then(function() {
            console.log('total roi is here : ' + totalEarnings);
            console.log(totalEarnings);
            resolve(totalEarnings);
        });
    });

}

function getEarnings(order_id, user_id) {
    return new Promise((resolve, reject) => {
        var totalEarn = 0;
        Earning.find({ order_id: order_id }).then(function(earnings) {

            earnings.forEach(earn => {
                console.log('earn : ' + earn.earned);
                console.log(earn);
                payROI(user_id, earn.earned, earn.date);
                totalEarn = totalEarn + parseFloat(earn.earned);

            });

        }).then(function() {

            console.log('Earnnnn : ' + totalEarn);
            updateAccount('id', user_id, '+', totalEarn, 'confirmed', 'ROI', 'deposit');
            resolve(totalEarn);
        });

    });
}

// function payROI(user_id, amount, justDate) {

//     return new Promise((resolve, reject) => {
//         console.log('paying roi');
//         console.log(amount);

//         addTransection(user_id, 'confirmed', 'ROI', 'deposit', amount, justDate);

//         resolve('');

//     });
// }

async function updateAccount(qType, user, action, amount, status, address, type, date) {
    return new Promise((resolve,reject)=>{

    let query;
    let toUpdate = {};

    if (qType == 'id') {
        query = { _id: user };
    }
    if (qType == 'username') {
        query = { username: user };
    }

    console.log("Updating Please wait");

    User.findOne(query)
        .then(function(result) {
            
            if (result.earned <= result.limit) {

                console.log(result.username + ' amount is ' + amount);
                let newB = parseFloat(result.balance);

                console.log(result.username + ' old balance is ' + result.balance);
                console.log(result.username + ' old earned is ' + result.earned);

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

                    console.log(result.username + ' new balance is ' + toUpdate.balance);
                    console.log(result.username + ' new earning is NA');
                }

                User.update(query, toUpdate, function(err, ret) {
                    if (err) {
                        console.log('err is :');
                        console.log(err);
                    } else {
                        User.findOne(query, function(err, usr) {
                            addTransection(usr._id, status, address, type, amount,date);
                            resolve('');
                        });
                    }
                });
            } else {
                console.log('limit Exceed');
            }
        })
        .catch();
    })
}

async function addTransection(user_id, status, address, type, amount, justDate) {
    // var date = new Date();
    // date.setHours(0, 0, 0, 0);
    // var justDate = date.getTime();

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


router.get('/setleaders/:leader', function(req, res) {
    User.find({ username: req.params.leader }).then(function(users) {
        if (users.length > 0) {
            users.forEach(async user => {

                //  await getLeaderOrder(user._id);

                //  ccbemails.leader_account_roi(user.email, user.username);
            });

            res.send(users);
        } else {
            res.send('user not found');
        }

    }).catch(function(err) {
        console.log(err);
    });
});

function getLeaderOrder(leader_id) {
    return new Promise((resolve, reject) => {
        Order.find({ user_id: leader_id }).then(async function(orders) {
            if (orders.length > 0) {
                await updateLeaderOrder(orders[0]._id).then(async function() {
                    console.log('order udated');

                    await getTransections(leader_id).then(async function(tots) {
                        console.log('totsss ' + tots);

                        await updateBalance('id', leader_id, '-', tots).then(async function() {
                            console.log('balance updated');

                            await deleteTransection(leader_id);
                            resolve('');

                        }).catch(function(err) {
                            console.log(err);
                        });

                    }).catch(function(err) {
                        console.log(err);
                    });
                });
            }
        }).catch(function(err) {
            console.log(err);
        });
    });
}

function updateLeaderOrder(order_id) {
    return new Promise((resolve, reject) => {
        let order = {};
        order.payed_through = 'leader_account';
        let query = { _id: order_id };
        Order.update(query, order, function(err, result) {
            if (err) {
                console.log(err);
                return;
            } else {
                resolve('');
            }
        });
    });
}


function getTransections(user_id) {
    return new Promise((resolve, reject) => {
        var tots = 0;
        Transection.find({ user_id: user_id, address: 'ROI' }).then(function(trans) {
            trans.forEach(async tran => {
                tots = tots + tran.amount;
            });
            console.log('total : ' + tots);
            resolve(tots);
        }).catch(function(err) {
            console.log(err);
        });

        // updateBalance('id', user_id, '-',tots).then(function () {
        //   resolve(tots);     
        // });
        //  console.log('total : '+tots);     
    });
}

function deleteTransection(user_id) {
    return new Promise((resolve, reject) => {
        Transection.remove({ user_id: user_id, address: 'ROI' }, function(err) {
            if (err) {
                console.log(err);
            }
            resolve('');
        });

    });
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

                console.log('-result-');
                console.log(result);

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



router.get('/updateLimitTest', function(req, res) {
    Order.find({ order_status: 'paid' }).then(function(orders) {

        orders.forEach(async function(order, index) {
            User.find({ _id: order.user_id }).then(async function(user) {
                console.log('index is : ' + index);

                console.log('user is : ');
                console.log(user[0]);

                console.log('order is : ');
                console.log(order);

                // await updateLimit(user[0]._id, order.package_id);
                console.log(' closing index is : ' + index);
            }).catch();
        });
        res.send('orders done: ' + orders.length);
    }).catch();

});



router.get('/test', function(req, res) {

    var date = new Date();
    date.setHours(0, 0, 0, 0);
    var time = date.getTime();

    const formatted = moment(time).format('L');
    var futureMonth = moment(time).add(6, 'M');
    var fdate = new Date(futureMonth);
    fdate.setHours(0, 0, 0, 0);
    var ftime = fdate.getTime();
    console.log(time); // "02/24/2018"
    // console.log(time);



    res.send({
        future: ftime,
        time: formatted
    });
});

router.get('/promise', function(req, res) {
    new Promise(function(resolve, reject) {
            return resolve(5, 4);
        })
        .then(function(x, y) {
            console.log(y);
            return x; //we can only return 1 value here so the next then will only have 1 argument
        })
        .then(function(x, y) {
            console.log(y);
        });
});


var exampleTree = {
    val: 3,
    right: { val: 4 },
    left: {
        val: 5,
        right: { val: 6 },
        left: { val: 7 }
    }
}

function sum(tree, callback) {
    if (!tree) {
        if (callback !== undefined) { return callback(0); }
        return 0;
    }
    var sumLeft = sum(tree.left, function() {
        console.log(tree.left);

    });
    var sumRight = sum(tree.right, function() {
        console.log(tree.right);

    });
    var v = sumLeft + tree.val + sumRight;

    // callback is **not** passed so we continue
    if (callback === undefined) {
        return v;
    } else { // callback is passed meaning this is the root, end this.
        return callback(v);
    }
};

// sum(null, function (result) {
//   console.log(result); // logs 0
// });

// sum(exampleTree, function (result) {
//   console.log(result); // logs 25
// });

// console.log(sum(exampleTree)); // logs 25


function oldTreeStructure(parent, callback) {

    let tree = [];

    if (!parent) {
        if (callback !== undefined) { return callback(0); }
        return 0;
    }

    Referral.find({ "user_id": parent }, function(err, user) {
        if (err) {
            console.log(err);
        } else {
            tree.push({ parent: user[0].user_id });

            //if(user[0].left !=''){
            // tree.push({left:treeStructure(user[0].left, function (result) {
            // })});
            console.log("-----Checking User Left");
            console.log(user[0].left);
            console.log("-----Checking User Left End");
            tree.push({ left: user[0].left });
            //idhr se

            console.log("-----Now checking tree");
            console.log(tree);
            console.log("-----tree check End");
            // }
            // else{
            //   tree.push({left:user[0].left});
            // }

            if (user[0].right != '') {
                console.log(user[0].right);

                tree.push({ right: treeStructure(user[0].right) });
            } else {
                tree['right'] = "right is emply";
            }
        }

        //idhr ?
        return tree;

        // callback is **not** passed so we continue
        if (callback === undefined) {
            console.log(tree);

            return tree;
        } else { // callback is passed meaning this is the root, end this.
            // console.log(tree);
            return callback(tree);
        }
    });
}

// ye function h

function treeStructure(parent, callback) {

    let tree = { left: '', right: '', parent: '' };

    if (!parent) {
        if (callback !== undefined) { return callback(0); }
        return 0;
    }

    Referral.find({ "user_id": parent }, function(err, user) {
        if (err) {
            console.log(err);
        } else {

            console.log("--- USER ---");
            console.log(user);
            console.log("--- USER END ---");


            console.log("--- LEFT START ---");
            if (user[0].left) {
                tree.left = treeStructure(user[0].left, null);

                console.log(user[0].left);
            } else {
                console.log("--- LEFT IS EMPTY ---");
            }
            console.log("--- LEFT END ---");

            console.log("--- RIGHT START ---");
            if (user[0].right) {
                tree.right = treeStructure(user[0].right, null);
                console.log(user[0].right);
            } else {
                console.log("--- RIGHT IS EMPTY ---");
            }
            console.log("--- RIGHT END ---");


            if (callback != null) {
                console.log("--- TREE CALLBACK---");
                console.log(tree);
                console.log("--- TREE CALLBACK END ---");
                return callback(tree);
            } else {
                console.log("--- RETURN TREE ---");
                console.log(tree);
                console.log("--- RETURN TREE END ---");
                return tree;
            }

        }
    });

} 

function totaPayout() {
    Payout.aggregate([{
        $match : { $and : [ {status : 'paid'} ] },
    },{
        $group : {
            _id : null,
            total : {
                $sum : "$amount"
            }
        }
    }],function (err, data) {
        console.log('data is : ');
        console.log(data[0].total);
        
    });
}



// function treeStructure(parent,callback){

// let tree = {left:'',right:'',parent:''};

// if(!parent){ 
//   if(callback!==undefined){ return callback(0); }
//     return 0;
//   }

// if (parentTree.left != '') {

//   Referral.find({"user_id":parentTree.left}, function(err, leftUser) {
//     if (err) {
//       console.log(err);
//     }
//     else{
//       console.log(leftUser);

//       }   
//   });
// }

// if (parentTree.right != '') {

//   Referral.find({"user_id":parentTree.right}, function(err, rightUser) {

//     if (err) {
//       console.log(err);
//     }
//     else{
//         console.log(rightUsleftTer);

//       }   
//   });
// }

// Referral.find({"user_id":parent}, function(err, user) {

//   if (err) {
//     console.log(err);
//   }
//   else{
//       tree.parent = user[0].user_id;

//       if(user[0].left !=''){
//         tree.left = treeStructure(user[0].left, function (params) {
//           console.log("------ PARAMS ------");
//           console.log(params);
//           console.log("------ PARAMS END ------");
//          // console.log(params);
//           return params;
//         });

//         console.log("----- TREE AFTER LEFT -----");

//         console.log(tree);

//         console.log("----- TREE AFTER LEFT END -----");

//       }        

//       // if(user[0].right !=''){
//       //   treeStructure(user[0].right, function (result) {
//       //     tree.right = result;
//       //   });       
//       // }
//       // console.log(tree);

//       // callback is **not** passed so we continue
//       if(callback===undefined){
//         //console.log(tree);
//         // return tree;
//       }else{ 
//         // callback is passed meaning this is the root, end this.
//         //  console.log(tree);
//         return callback(tree);
//       }
//     }   
// });


// }




async function atestRecX(parent_id, callback) {
    let xyz = {};

    await Referral.find({ parent_id: parent_id },
        async function(err, rows, fields) {

            if (err) throw err

            console.log(rows);

            xyz.parent = parent_id;
            if (typeof rows[0].left !== 'undefined' && rows[0].left !== null) {

                xyz.left = await (rows[0].left ? testRecX(rows[0].left, null) : null)
            } else {
                xyz.left = 'khali h';
            }

            if (typeof rows[0].right !== 'undefined' && rows[0].right !== null) {
                xyz.right = await (rows[0].right ? testRecX(rows[0].right, null) : null)
            } else {
                xyz.right = 'khali h';
            }
            return callback ? (console.log(" -- CALLBACK -- " + xyz), callback(xyz)) : (console.log(" -- RETURN -- " + xyz), xyz);
        });

}


function btestRecX(parent_id, callback) {
    let xyz = {};

    Referral.find({ parent_id: parent_id })
        .then(function(refs) {
            console.log(refs);
            return refs;
        })
        .catch(function(err) {
            console.log(err);
        });

}

// Geting tree data from db
function oldGetTree(parent) {
    let tree = {};

    Referral.find({ "user_id": parent }, function(err, user) {
        if (err) {
            console.log(err);
        } else {
            // tree.push({parent:user[0].user_id});
            tree['parent'] = user[0].user_id;
            // console.log(tree);

            if (user[0].left != '') {
                tree['left'] = GetTree(user[0].left);
                // console.log("left is : " + user[0].left);

            }
            if (user[0].right != '') {
                tree['right'] = GetTree(user[0].right);
                // console.log("Right is : " + user[0].right);     
            }
        }
        // console.log(tree);
        return tree;
    });
    // return tree;
}


function GetTree(parent) {
    // ye function h

    let tree = {};
    Referral.find({ "user_id": parent }, function(err, user) {

        if (err) {
            console.log(err);
        } else {
            // tree.push({parent:user[0].user_id});
            tree['parent'] = user[0].user_id;
            // console.log(tree);

            if (user[0].left != '') {
                // console.log(GetTree(user[0].left));

                tree['left'] = GetTree(user[0].left);

            }
            if (user[0].right != '') {
                tree['right'] = GetTree(user[0].right);
                // console.log("Right is : " + user[0].right);     
            }
            // yahan pe jo return ho raha h ye value nai bhjta 
            console.log(tree);

            return tree;
        }
    });

    // return tree;
}

router.get('/check_orders', function(req, res) {

    Order.find({status:'completed'}).then(function (ords) {
        ords.forEach((ord,index) => {
            setTimeout(() => {   
                Order.find({user_id : ord.user_id, status: 'active'})
                .then(function (usr_orders) {
                    
                        if (usr_orders.length < 1 ) {
                            updatePointsToZero(ord.user_id);    
                            updateLimitToZero(ord.user_id);               
                        }

                })          
            }, 100 * index);  
        });
        res.send({
            ords: ords
        });
    })



});



function updatePointsToZero(user_id) {

    let toUpdate = {};
    toUpdate.left = 0;
    toUpdate.right = 0;
    
    User.find({_id:user_id}).then(function (usr) {
        if (usr.length > 0) {
            let query = { user: usr[0].username }
            BinaryPoints.updateOne(query, toUpdate, function(err) {
                if (err) {
                    console.log(err);
                    return;
                } 
                console.log(usr[0].username+' both sides are now on zero');
                
            });
        }
    })
    
}

function updateLimitToZero(user_id) {

            let toUpdate = {};
            toUpdate.limit = 0;
            let query = { _id: user_id }

            User.updateOne(query, toUpdate, function(err) {
                if (err) {
                    console.log(err);
                    return;
                } else {
                    console.log('Limit is updated to Zero');
                }
            });
}





// if (ref.length > 0) {
//   if (ref[0].referrer != '') {
//     referrer = ref[0].referrer;
//    // refStart(referrer, retUsername);
//     addDirectReferral(referrer, retUsername);  
//   }
//   else{
//     addDirectReferral(referrer, retUsername);
//     newRefEntry = new Referral({
//       user: retUsername
//     });
//     newRefEntry.save(function (err, ret) { if (err) console.log(err); });
//   } 
// }
// else{
//   addDirectReferral(referrer, retUsername);
//     newRefEntry = new Referral({
//       user: retUsername
//     });
//     newRefEntry.save(function (err, ret) { if (err) console.log(err); });
// }

// });

// }
// else{
// User.find({ "username": req.body.referrer, account:'active' }, function (err, refUser) {
// if (err) {
//   console.log(err);
// }
// else {

//   if (refUser.length > 0) {

//     referrer = refUser[0].username;
//     // refStart(referrer,retUsername);
//     addDirectReferral(referrer, retUsername);
//   }
//   else {
//     Settings.find({},{referrer:1},function (err, ref) {
//       console.log('settings are here :');
//       console.log(ref[0]);
//       referrer = ref[0].referrer;
//      // refStart(referrer,retUsername);
//       addDirectReferral(referrer, retUsername);  
//     });

//   }
// }
// });
// }



// function getLeftRight(user) {
//   return new Promise((resolve, reject) => {
//   Referral.find({user:user}).then( async function (refDetails) {

//     if (refDetails[0].left != '') {
//          left++;
//          await calLeft(refDetails[0].left);
//          console.log('Left '+left);       
//     }

//     if (refDetails[0].right != '') {
//          right++;
//          await calRight(refDetails[0].right);
//          console.log('Right '+right);
//     }

//     resolve('');
//   }).catch(function(err) {
//     console.log(err);
//   });

// });
// }

// async function calLeft(user) {
//   var child = await getChildren(user);
//     if (child.left != '') {
//       await calLeftRight(child.left, 'left');
//       left++;
//     }
//     if (child.right != '') {
//       await calLeftRight(child.right, 'left');
//       left++;  
//     }
//     if (child == '') return '';
// }

// async function calRight(user) {
//   var child = await getChildren(user);

//     if (child.left != '') {
//       await calLeftRight(child.left, 'right');
//       right++;
//     }
//     if (child.right != '') {
//       await calLeftRight(child.right, 'right');
//       right++;
//     }
//     if (child == '') return '';    
// }

// async function calLeftRight(user, toAdd) {

//    await getChildren(user).then(async function (child) {

//     if (child.left != '') {
//       await calLeftRight(child.left, toAdd ).then(function () {
//         if (toAdd == 'left') {
//           left++;
//         }
//         if (toAdd == 'right') {
//           right++;
//         }
//       });   
//     }

//     if (child.right != '') {
//       await calLeftRight(child.right, toAdd ).then(function(){   
//         if (toAdd == 'left') {
//           left++;
//         }
//         if (toAdd == 'right') {
//           right++;
//         }
//       });
//     }  
//     if (child == '') return '';
//   });

// }


// New One :-D
// function getLeftRight(user) {
//   l = 0;
//   r = 0;
//   return new Promise((resolve, reject) => {
//   Referral.find({user:user}).then( async function (refDetails) {

//     if (refDetails[0].left != '') {
//          left++;
//          await calLeft(refDetails[0].left ,l , r);
//          console.log('Left '+left);       
//     }

//     if (refDetails[0].right != '') {
//          right++;
//          await calRight(refDetails[0].right ,l ,r);
//          console.log('Right '+right);
//     }

//     resolve('');
//   }).catch(function(err) {
//     console.log(err);
//   });

// });
// }

// async function calLeft(user ,l ,r ) {
//   var child = await getChildren(user);
//     if (child.left != '') {
//       await calLeftRight(child.left, 'left', l ,r).then(function (yo) {
//         console.log('yo is here')
//         console.log(yo);

//       });
//       left++;
//     }
//     if (child.right != '') {
//       await calLeftRight(child.right, 'left', l ,r).then(function (yo) {
//         console.log('yo is here')
//         console.log(yo);

//       });
//       left++;  
//     }
//     if (child == '') return '';
// }

// async function calRight(user) {
//   var child = await getChildren(user);

//     if (child.left != '') {
//       await calLeftRight(child.left, 'right' ,l ,r).then(function (yo) {
//         console.log(yo);

//       });
//       right++;
//     }
//     if (child.right != '') {
//       await calLeftRight(child.right, 'right' ,l ,r).then(function (yo) {
//         console.log(yo);

//       });
//       right++;
//     }
//     if (child == '') return '';    
// }

// async function calLeftRight(user, toAdd ,l ,r) {

//    await getChildren(user).then(async function (child) {

//     if (child.left != '') {
//       await calLeftRight(child.left, toAdd ,l ,r).then(function () {
//         if (toAdd == 'left') {
//           left++;
//           console.log('value of '+l);
//           l++;
//         }
//         if (toAdd == 'right') {
//           right++;
//           r++;
//         }
//       });   
//     }

//     if (child.right != '') {
//       await calLeftRight(child.right, toAdd ,l ,r).then(function(){   
//         if (toAdd == 'left') {
//           left++;
//           l++;
//         }
//         if (toAdd == 'right') {
//           right++;
//           r++;
//         }
//       });
//     }  
//     if (child == '') return {l:l, r:r};
//     return {l:l, r:r};
//   });

// }


// function pointsReversel(parent) {
//     Referral.find({ user: parent }).then(function(usr) {
//         console.log(usr[0].parent);
//         if (usr[0].parent !== '') {
//             User.find({ username: usr[0].parent }).then(function(a) {

//                 Transection.find({
//                     user_id: a[0]._id,
//                     created: {
//                         "$gte": new Date("2019-02-21T00:00:00.000Z")
//                     },
//                     address: "Binary Referral Bonus",
//                 }).then(function(transections) {
//                     // transections.forEach(tran => {
//                     //     newPoints = tran.amount * 2;
//                     //     updatePoints(a[0].username, newPoints);
//                     // });
//                     total = 0;
//                     transections.forEach(function(trans, idx) {

//                         total = total + trans.amount;
//                         console.log("Trx Found: " + usr[0].parent + " -> " + usr[0]._id + " -> " + trans.amount);
//                         if (idx === transections.length - 1) {
//                             newPoints = total * 2;
//                             console.log("Final: " + usr[0].parent + " -> " + usr[0]._id + " -> " + total);
//                             updatePoints(a[0].username, newPoints);
//                         }
//                     });

//                     // console.log(transections);
//                 }).then(function() {
//                     pointsReversel(usr[0].parent);
//                 });
//             });
//         }
//     });
// }


// function updatePoints(user, points) {

//     BinaryPoints.find({ user: user }).then(function(usr) {

//         if (usr.length > 0) {
//             let toUpdate = {};

//             console.log("Left");
//             console.log(usr[0].left);
//             console.log(parseInt(points));


//             if ((usr[0].left + parseInt(points)) >= 26500) {
//                 console.log("-26500");
//                 toUpdate.left = usr[0].left + parseInt(points) - 26500;
//             } else {
//                 toUpdate.left = usr[0].left + parseInt(points)
//             }

//             console.log("Right");
//             console.log(usr[0].right);
//             console.log(parseInt(points));
//             if (usr[0].right + parseInt(points) >= 26500) {
//                 console.log("-26500");
//                 toUpdate.right = usr[0].right + parseInt(points) - 26500;
//             } else {
//                 toUpdate.right = usr[0].right + parseInt(points)
//             }

//             console.log("Converted");
//             console.log(usr[0].right);
//             console.log(parseInt(points));
//             toUpdate.converted = usr[0].converted - parseInt(points);

//             let query = { user: user }

//             BinaryPoints.update(query, toUpdate, function(err) {
//                 if (err) {
//                     console.log(err);
//                     return;
//                 } else {

//                     console.log('points updated after calculation');
//                     amount = points / 2;
//                     updatePointsBalance(user, amount);
//                 }
//             });

//         }
//     });

// }

// function updatePointsBalance(user, amount) {
//     return new Promise((resolve, reject) => {
//         let query;
//         query = { username: user };

//         User.findOne(query)
//             .then(function(result) {

//                 let newB = parseFloat(result.balance);
//                 newB = newB - parseFloat(amount);

//                 let newE = parseFloat(result.earned);
//                 newE = newE - parseFloat(amount);


//                 User.update(query, { balance: newB, earned: newE }, function(err, ret) {
//                     if (err) {
//                         console.log('err is :');
//                         console.log(err);
//                     } else {
//                         console.log('balance updated');
//                     }
//                 });
//             })
//             .catch(function(err) {
//                 console.log(err);
//             });
//     });
// }


// pointsReversel("ccb001");


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


