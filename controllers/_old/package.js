const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const moment = require('moment');
const Client = require('node-rest-client').Client;
const cron = require('node-cron');
var sb = require('satoshi-bitcoin');

var ccbemails = require('./emails');

let Package = require('../models/packages');
let Order = require('../models/orders');
let Transection = require('../models/transections');
let DirectReferrals = require('../models/directreferrals');
let Referral = require('../models/referrals');
let User = require('../models/user');
let BinaryPoints = require('../models/binarypoints');
let Voucher = require('../models/voucher');
let tokenOrders = require('../models/tokenorders');

router.get('/admin/packages', adminAuth, function(req, res) {
    Package.find({}, function(err, packages) {
        if (err) {
            console.log(err);
        } else {
            res.render('packages', {
                user: req.user,
                packages: packages
            });
        }
    });
});

router.get('/user/purchase_package', userAuth, function(req, res) {
    Package.find({}, function(err, packages) {
        if (err) {
            console.log(err);
        } else {
            res.render('user/user_packages', {
                user: req.user,
                packages: packages
            });
        }
    });
});


router.get('/user/order/:order', userAuth, function(req, res) {
    Order.find({ order_id: req.params.order }, function(err, order) {
        if (err) {
            console.log(err);
        } else {
            if (order.length > 0) {
            
                if (order[0].order_status == 'unpaid') {
                    Voucher.find({"order_id":req.params.order}).then(function (vouch) {
                        
                        checkForVouchers(req.params.order).then(function (vtotal) {
                        res.render('order_process', {
                            user: req.user,
                            order: order[0],
                            vouchers:vouch,
                            vTotal: vtotal
                        });
                    });
                    });
                } else {

                    Package.findById({ _id: order[0].package_id }, function(err, package) {
                        if (err) { console.log(err); }
                        Voucher.find({"order_id":req.params.order}).then(function (vouch) {
                            checkForVouchers(req.params.order).then(function (vtotal) {
                                
                                res.render('order', {
                                    user: req.user,
                                    order: order[0],
                                    orderUser: req.user,
                                    package: package,
                                    vouchers:vouch,
                                    vTotal : vtotal
                                });
                                
                            })
                            
                        })  
                        
                    });
                }
        }else{
            res.redirect('/dashboard');
        }

        } 
    });
});

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

router.post('/user/order/checkstatus', function(req, res) {
    console.log(req.body.order_id);
    
    Order.find({ "order_id": req.body.order_id }, function(err, ordr) {
        if (err) {
            console.log(err);
        } else {
                        
            if (ordr.length > 0 ) {
                res.send({ 'order': 'yes', 'order_status': ordr[0].order_status });
             } else {
                res.send({ 'order': 'no' });
            }
        }
    });
});


router.post('/user/wallet/tokenstatus', function(req, res) {
    console.log(req.body.order_id);
    
    tokenOrders.find({ "order_id": req.body.order_id }, function(err, ordr) {
        
        if (err) {
            console.log(err);
        } else {
                        
            if (ordr.length > 0 ) {
                res.send({ 'order': 'yes', 'order_status': ordr[0].order_status });
             } else {
                res.send({ 'order': 'no' });
            }
        }
    });
});

router.get('/admin/order/:order', adminAuth, function(req, res) {
    Order.find({ order_id: req.params.order }, function(err, order) {
        if (err) {
            console.log(err);
        } else {
            if (order.length > 0) {


                Package.find({ _id: order[0].package_id }).then(function(package) {
                    User.find({ _id: order[0].user_id }).then(function(orderUser) {
                        DirectReferrals.find({ referred_to: orderUser[0].username }).then(function(refDetails) {
                            Voucher.find({"order_id":req.params.order}).then(function (vouch) {
                                checkForVouchers(req.params.order).then(function (vtotal) {
                            res.render('order', {
                                user: req.user,
                                order: order[0],
                                orderUser: orderUser[0],
                                package: package[0],
                                refDetails: refDetails[0],
                                vouchers:vouch,
                                vTotal:vtotal
                            });
                        }).catch(function (err) {
                            console.log(err);
                            res.redirect('/dashboard');
                        })
                        }).catch(function (err) {
                            console.log(err);
                            res.redirect('/dashboard');
                        })
                        }).catch(function (err) {
                            console.log(err);
                            res.redirect('/dashboard');
                        });
    
                    }).catch(function(err) {
                        console.log(err);
                        res.redirect('/dashboard');
                    });
    
                }).catch(function(err) {
                    console.log(err);
                    res.redirect('/dashboard');
                });    
            }
            else{
                res.redirect('/dashboard');
            }
            
        }
    });
});

router.get('/admin/token/:order', adminAuth, function(req, res) {
    tokenOrders.find({ order_id: req.params.order }, function(err, order) {
        if (err) {
            console.log(err);
        } else {
            if (order.length > 0) {

                    User.find({ _id: order[0].user_id }).then(function(orderUser) {
                        DirectReferrals.find({ referred_to: orderUser[0].username }).then(function(refDetails) {
                          
                            res.render('admin/token_view', {
                                user: req.user,
                                order: order[0],
                                orderUser: orderUser[0],
                                refDetails: refDetails[0]
                            });
                        
                        }).catch(function (err) {
                            console.log(err);
                            res.redirect('/dashboard');
                        });
    
                    }).catch(function(err) {
                        console.log(err);
                        res.redirect('/dashboard');
                    });
    
            }
            else{
                res.redirect('/dashboard');
            }
            
        }
    });
});


router.get('/admin/orders/:status', adminAuth, function(req, res) {

    let query = {};

    if (req.params.status != 'all') {
        query.order_status = req.params.status;

    }

    Order.aggregate(
        [{ $match: query },
            {
                $lookup: {
                    from: "users",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user_details"
                }
            },
            {
                $unwind:"$user_details"
            },
            {
                 $project:{ 
                           "_id":0,
                           "user_details.username":1,
                           "total":1,
                           "order_status":1,
                           "created":1,
                           "order_id":1,
                           "order_type":1
                           }
            }
        ]
    ).exec(function(err, orders) {
        if (err) {
            console.log(err);
        } else {
            
            res.render('admin/orders', {
                            user: req.user,
                            orders: orders,
                            moment: moment
                        });
        }
    });


    // Order.find(query, function(err, orders) {

    //     if (err) {
    //         console.log(err);
    //     } else {
    //         res.render('admin/orders', {
    //             user: req.user,
    //             orders: orders,
    //             moment: moment
    //         });
    //     }
    // });

});



router.get('/admin/tokens/:status', adminAuth, function(req, res) {

    let query = {};

    if (req.params.status != 'all') {
        query.order_status = req.params.status;

    }

    // Order.aggregate(
    //     [{ $match: query },
    //         {
    //             $lookup: {
    //                 from: "users",
    //                 localField: "user_id",
    //                 foreignField: "_id",
    //                 as: "user_details"
    //             }
    //         },
    //         {
    //             $unwind:"$user_details"
    //         },
    //         {
    //              $project:{ 
    //                        "_id":0,
    //                        "user_details.username":1,
    //                        "total":1,
    //                        "order_status":1,
    //                        "created":1,
    //                        "order_id":1,
    //                        "order_type":1
    //                        }
    //         }
    //     ]
    // ).exec(function(err, orders) {
    //     if (err) {
    //         console.log(err);
    //     } else {
            
    //         res.render('admin/orders', {
    //                         user: req.user,
    //                         orders: orders,
    //                         moment: moment
    //                     });
    //     }
    // });


    tokenOrders.find(query, function(err, orders) {

        if (err) {
            console.log(err);
        } else {
            res.render('admin/token_requests', {
                user: req.user,
                orders: orders,
                moment: moment
            });
        }
    });

});


router.get('/user/packages', userAuth, function(req, res) {

    Order.find({ user_id: req.user._id }, function(err, packages) {

        if (err) {
            console.log(err);
        } else {
            console.log(packages);

            res.render('user/packages', {
                user: req.user,
                packages: packages
            });
        }
    });

});

router.get('/package/verify/:id', function(req, res) {
    Package.findById(req.params.id, function(err, package) {
        if (err) {
            console.log(err);
        } else {
            res.render('purchase', {
                user: req.user,
                package: package
            });
        }
    });
});



router.get('/packageverify/:orderid/:token', function(req, res) {
    Order.find({ _id: req.params.orderid }).then(function(order) {

        if (req.params.token == order[0].token) {
            if (order[0].status != 'active'  ) {
                if (order[0].order_status != 'pending'  ) {
                let udpateorder = {};

                udpateorder.comment = 'payment done';
                udpateorder.order_status = 'pending';
                udpateorder.payed_through = 'direct_pay';

                let query = { _id: order[0]._id }

                Order.updateMany(query, udpateorder, function(err, result) { // May be updateOne
                    if (err) {
                        console.log(err);
                        return;
                    } else {

                        User.find({ _id: order[0].user_id }).then(function(user) {

                            ccbemails.order_payment(user[0].email, user[0].username, order[0].order_id);
                            ccbemails.admin_order_payment('zeeshan.zoniexx@gmail.com', user[0].username, order[0].order_id, order[0].total  );
                            ccbemails.admin_order_payment('andybbtec@gmail.com', user[0].username, order[0].order_id, order[0].total  );
                            res.json(result);

                        }).catch(function(err) {
                            console.log(err);
                        });

                    }
                });
            } else {
                res.json('Order is already pending!');
            }
            } else {
                res.json('Order is already active !');
            }
        } else {
            res.json('token not match');
        }

    }).catch(function(err) {
        res.json(err);
    });
});


router.get('/tokenverify/:orderid/:token', function(req, res) {
    tokenOrders.find({ _id: req.params.orderid }).then(function(order) {

        if (req.params.token == order[0].token) {
            if (order[0].order_status != 'pending'  ) {
                if (order[0].order_status != 'paid'  ) {
                let udpateorder = {};

                udpateorder.comment = 'payment done';
                udpateorder.order_status = 'pending';
             
                let query = { _id: order[0]._id }

                tokenOrders.updateMany(query, udpateorder, function(err, result) { // May be updateOne
                    if (err) {
                        console.log(err);
                        return;
                    } else {

                        User.find({ _id: order[0].user_id }).then(function(user) {

                            ccbemails.admin_order_payment('zeeshan.zoniexx@gmail.com', user[0].username, order[0].order_id, order[0].amount  );
                            ccbemails.admin_order_payment('andybbtec@gmail.com', user[0].username, order[0].order_id, order[0].amount  );
                            res.json(result);

                        }).catch(function(err) {
                            console.log(err);
                        });

                    }
                });
            } else {
                res.json('Order is already pending!');
            }
            } else {
                res.json('Order is already active !');
            }
        } else {
            res.json('token not match');
        }

    }).catch(function(err) {
        res.json(err);
    });
});


// router.get('/packageverify/:orderid/:token', function(req, res) {
//   Order.find({_id: req.params.orderid}).then(function (order) {
//     if (req.params.token == order[0].token) {
//       let udpateorder = {};
//         udpateorder.comment = 'payment done';
//         udpateorder.order_status = 'pending';
//         udpateorder.payed_through = 'direct_pay';
//          getPaymentUsd(order[0].address).then(function (data) {
//            return data;
//            console.log('data is here');
//            console.log(data);

//          }).then(function (data) {
//           console.log('data is here');
//           console.log(data.satoshi);
//           console.log('satoshi');

//           udpateorder.satoshi_paid = data.satoshi;
//            udpateorder.usd_paid = data.usd;
//            let query = {_id:order[0]._id}

//           Order.update(query, udpateorder, function(err,result){
//             if(err){
//               console.log(err);
//               return;
//             } else {
//               res.json(result);

//             }
//           });
//          });

//     }
//     else{
//       res.json('token not match');
//     }

//   }).catch();
// });


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

function getUserOrders(user_id) {
    return new Promise((resolve, reject) => {
        highOrd = 0;
        Order.find({ user_id: user_id,  $and:[ {order_status: { $ne: 'pending' }}, {order_status: { $ne: 'unpaid' }} ]  },{price:-1,_id:0}, function(err, ords) {
            if (err) {
                console.log('err : ' + err);
            }   
            console.log(ords);
            
            if (ords.length > 0) {
                    ords.forEach(ord => {
                            if (ord.price > highOrd ) {
                                highOrd = ord.price;
                            }         
                    });
                    resolve(highOrd);

            } else {
                resolve(highOrd);
            }
        });
    });
}


router.get('/user/purchase/:id', userAuth, function(req, res) {
    
    var mongodb = require("mongodb");
    if (mongodb.ObjectID.isValid(req.params.id)) {
        Package.findById(req.params.id, function(err, package) {
            if (err) {
                console.log(err);
            } else {
                getUserOrders(req.user._id).then(function (ords) {
                    
                   if (package.price >= ords) {   
                        res.render('purchase', {
                            user: req.user,
                            package: package
                        });       

                   }else{
                    req.flash('danger', 'You cannot buy a package less then the amount you invested before.');
                    res.redirect('/user/purchase_package');
                   }
                })
                
            }
        });
    }
    else{
        res.redirect('/dashboard');
    }
});

router.post('/direct_pay', userAuth, function(req, res) {

    let order = {};
    order.payment_referrence = req.body.referrence;
    order.order_status = 'pending';
    order.payed_through = 'direct_pay';

    console.log(req.body);

    let query = { _id: req.body.order_id }

    Order.updateOne(query, order, function(err, result) {
        if (err) {
            console.log(err);
            return;
        } else {
            req.flash('success', 'Order is Updated.');
            res.redirect('/user/packages');
        }
    });
});


router.post('/wallet/accept_token', adminAuth, function(req, res) {

    let query = { order_id: req.body.order_id };
    let order = {};

    if (req.body.status_respose == 'disapprove') {
        order.order_status = 'unpaid';
        order.comment = req.body.comment;

        return res.redirect('/admin/token/'+req.body.order_id);
    }

    if (req.body.status_respose == 'approve') {

        order.order_status = 'paid';
        order.comment = req.body.comment;

        tokenOrders.find(query).then(function (ordr) {
                if (ordr.length > 0) {
                    console.log('tokesnsss',ordr);
                    
                    tokenOrders.updateOne(query, order, function(err, result) {
                        if (err) {
                            console.log(err);
                            return;
                        } else {
                                giveTokens(ordr[0].user_id, ordr[0].tokens);
                        }
                        return res.redirect('/admin/token/'+req.body.order_id);
                })   
            }
        });
    }
});

router.post('/direct_order_response', adminAuth, function(req, res) {

    let order_id = req.body.order_id;
    let user_id = req.body.user_id;
    let amount = req.body.amount;
    let package_id = req.body.package_id;

    var date = new Date();
    date.setHours(0, 0, 0, 0);
    var activation_date = date.getTime();

    var futureMonth = moment(activation_date).add(6, 'M').subtract(1, 'd'); 
    var fdate = new Date(futureMonth);
    fdate.setHours(0, 0, 0, 0);
    var completion_date = fdate.getTime();

    let order = {};
    if (req.body.status_respose == 'approve') {
        order.order_status = 'paid';
        order.status = 'active';
        order.comment = req.body.comment;
        order.activation_date = activation_date;
        order.completion_date = completion_date;
        order.order_type = req.body.order_type;
        order.business = req.body.business;
    }
    if (req.body.status_respose == 'disapprove') {
        order.order_status = 'unpaid';
        order.comment = req.body.comment;
    }

    let query = { order_id: req.body.order_id };
    console.log('order is here');

    console.log(order);

    Order.find(query).then(function (ordr) {
        if (ordr.length > 0) {
            
            if (ordr[0].order_status == 'pending') {
                
                Order.updateOne(query, order, function(err, result) {
                    if (err) {
                        
                        console.log(err);
                        return;
            
                    } else {
            
                        if (req.body.status_respose == 'approve') {
            
                            User.findOne({ _id: user_id })
                                .then(function(user) {
                                    
                                    console.log('User is here : ');
                                    console.log(user);
                                    
                                    ccbemails.order_approved(user.email, user.username, req.body.order_id);
            
                                    createBinaryPoints(user.username);
                                    activateAccount(user._id);
                                    updateLimit(user._id, package_id);
                                    updateUserToken(user._id, package_id);
            
                                    DirectReferrals.find({ referred_to: user.username }, function(err, ref) {
                                        if (err) {
                                            console.log(err);
                                        } else {
                                            if (ref.length > 0) {
                                                if (ref[0].referred_by != '') {
                                                    updateDirectRef(ref[0].referred_by);
                                                    if (req.body.direct_ref == 'yes') {
                                                        console.log("***************************************************");
            
                                                        payDirectReferral(order_id, ref[0].referred_by);
                                                    } else {
            
                                                        console.log("********************* No ******************************");
                                                        console.log('no direct referal');
            
                                                    }
            
                                                    if (req.body.send_points == 'yes') {
                                                        console.log("***************************************************");
                                                            Package.find({ _id: package_id }, { points: 1 }, function(err, package) {
                                                                if (err) {
                                                                    console.log(err);
                                                                } else {
                                                                    console.log('package for points');
            
                                                                    console.log(package);
                                                                    
                                                                    if (package.length > 0) {
                                                                        PayAllParents(user.username, package[0].points);
                                                                    }
            
                                                                }
            
                                                            });
            
                                                    }
                                                    else{
                                                        console.log("********************* No ******************************");
                                                        console.log('no points');
                                                    }
                                                
                                                }
                                            }
                                        }
                                    });
            
                                });
            
                            addTransection(user_id, 'confirmed', 'New Package Purchased', 'package', amount);
                        }
                        req.flash('success', 'Order is Updated.');
                        res.redirect('/admin/order/' + order_id);
                        console.log('Order updated!');
                    }
                });


            }else if(ordr[0].order_status == 'paid'){
                console.log('Order is already paid.');
                req.flash('success', 'Order is already paid.');
                res.redirect('/admin/order/' + req.body.order_id);

            }
            else{
                req.flash('danger', 'Error, Wrong Status');
            res.redirect('/admin/order/' + req.body.order_id);
            }

        }else{
            req.flash('danger', 'Error, Wrong Order');
            res.redirect('/admin/dashboard');
        }
    })


});

router.post('/leader_account', userAuth, function(req, res, next) {

    var date = new Date();
    date.setHours(0, 0, 0, 0);
    var activation_date = date.getTime();

    var futureMonth = moment(activation_date).add(6, 'M');
    var fdate = new Date(futureMonth);
    fdate.setHours(0, 0, 0, 0);
    var completion_date = fdate.getTime();

    const package_id = req.body.pack_id;
    const leader_id = req.body.leader_id;
    const leader_username = req.body.leader_username;
    console.log(req.body);

    Package.find({ _id: package_id }).then(function(pack) {

        if (pack.length > 0) {
            const total = pack[0].price + pack[0].activation_charges;
            const token = getToken();

            orderId(function(order_id) {

                let newOrder = new Order({
                    total: total,
                    price: pack[0].price,
                    activation_charges: pack[0].activation_charges,
                    package_id: package_id,
                    user_id: leader_id,
                    order_id: order_id,
                    token: token,
                    payed_through: 'leader_account',
                    order_status: 'paid',
                    status: 'active',
                    activation_date: activation_date,
                    completion_date: completion_date,
                });

                newOrder.save(function(err, order) {

                    if (err) {
                        console.log('err');
                        console.log(err);
                    } else {
                        console.log('saved');
                        updateLimit(leader_id, package_id);
                        activateAccount(leader_id);
                        req.flash('success', 'Leader has assigned a package.');
                        res.redirect('/admin/user/' + leader_username);

                        // res.setHeader("Content-Type", "text/html");

                    }
                });
            });


        } else {
            // res.send('package not found!');
        }
    });


});


router.post('/user/purchase', userAuth, function(req, res) {

    const package_id = req.body.package_id;
    Package.find({ _id: package_id }).then(function(pack) {

        if (pack.length > 0) {
            const total = pack[0].price + pack[0].activation_charges;
            const token = getToken();
 
            orderId(function(order_id) {
                let newOrder = new Order({
                    total: total,
                    price: pack[0].price,
                    activation_charges: pack[0].activation_charges,
                    package_id: package_id,
                    user_id: req.user._id,
                    order_id: order_id,
                    token: token

                });

                newOrder.save(function(err, order) {
                    if (err) {
                        console.log(err);
                        return;
                    } else {
                        updateAddress(order._id, token);
                        req.flash('success', 'Order is Processed.');
                        res.setHeader("Content-Type", "text/html")
                        res.redirect('/user/order/' + order.order_id);
                    }
                });
            });
        } else {

        }
    });

});

router.get('/wallet', userAuth, function (req, res) {

    tokenOrders.find({user_id:req.user._id}).then(function (ordt) {
        console.log(ordt);
        
        res.render('user/crypto_wallet', { user: req.user,orders:ordt , moment:moment  });        
    })

});

router.get('/user/wallet/swaptokens', userAuth, function (req, res) {

        res.render('user/swap_tokens', { user: req.user , moment:moment  });        
    
});


router.post('/user/wallet/swaptokens_submit', userAuth, function (req, res) {

    console.log(req.body);

    if (req.user.balance < 1) {
        req.flash('danger', 'Insufficient Balance.');
                return res.redirect('/user/wallet/swaptokens');
    }
    
    if (req.body.amount > req.user.balance) {
        req.flash('danger', 'Insufficient Balance.');
        return res.redirect('/user/wallet/swaptokens');
    }


        User.findOne({ _id: req.user._id })
        .then(function(usr) {

            let toUpdate = {};
            toUpdate.tokens = usr.tokens + (req.body.tokens*1);
            toUpdate.balance = usr.balance - (req.body.amount*1);
            let query = { _id: req.user._id }

            User.updateOne(query, toUpdate, function(err) {
                if (err) {
                    req.flash('danger', err);
                return res.redirect('/user/wallet/swaptokens');
                    
                } else {
                   
                    tokenOrderId(function(order_id) { ;    
                        let newOrder = new tokenOrders({
                            tokens: req.body.tokens,
                            amount: req.body.amount,
                            user_id: req.user._id,
                            order_id: order_id,
                            token: "",
                            order_status:"paid"
                        });
                
                        newOrder.save(function(err, order) {
                            if (err) {
                                console.log(err);
                            }
                        });
                });
            
                req.flash('success', 'Tokens are added to your wallet.');
                return res.redirect('/user/wallet/swaptokens');
                    
                }
            });
        }).catch(function(err) {
            req.flash('danger', err);
                return res.redirect('/user/wallet/swaptokens');
        });

});



router.post('/wallet/requesttokens', userAuth, function(req, res) {

  //  const package_id = req.body.package_id;
    
  console.log(req.body);
  
        if (true) {
            
            const token = getToken();

            tokenOrderId(function(order_id) { 
                let newOrder = new tokenOrders({
                    tokens: req.body.tokens,
                    amount: req.body.dollar,
                    user_id: req.user._id,
                    order_id: order_id,
                    token: token
                });
                console.log();
                
                newOrder.save(function(err, order) {
                    if (err) {
                        console.log(err);
                        return;
                    } else {
                        console.log(order);
                        
                        updateTokenAddress(order._id, token);
                        res.setHeader("Content-Type", "text/html")
                        res.redirect('/wallet/paytokens/' + order.order_id);
                    }
                });
            });
        } else {

        }
});


router.get('/wallet/paytokens/:order', userAuth, function(req, res) {
    tokenOrders.find({ order_id: req.params.order }, function(err, order) {
        console.log(order);
        
        if (err) {
            console.log(err);
        } else {
            if (order.length > 0) {
            
                if (order[0].order_status == 'unpaid') {

                        res.render('user/paytokens', {
                            user: req.user,
                            order: order[0]
                        });

                } else {

                    res.render('user/paytokens', {
                        user: req.user,
                        order: order[0]
                    });
                           
                }
        }else{
            res.redirect('/wallet');
        }

        } 
    });
});





router.get('/admin/package_edit/:package', adminAuth, function(req, res) {
    Package.find({ _id: req.params.package }, function(err, pack) {
        if (err) {
            console.log(err);
            res.redirect('/admin/packages');
        } else {

            if (pack.length > 0) {
                console.log(pack);

                res.render('admin/edit_package', {
                    user: req.user,
                    package: pack[0]
                });
            } else {
                res.redirect('/admin/packages');
            }
        }
    });
});

router.post('/admin/package_edit', adminAuth, function(req, res) {
    let editPack = {};
    editPack.title = req.body.title;
    editPack.price = req.body.price;
    editPack.activation_charges = req.body.activation_charges;
    editPack.monthly_fees = req.body.monthly_fees;
    editPack.details = req.body.details;
    editPack.points = req.body.points;
    editPack.tokens = req.body.tokens;


    let query = { _id: req.body.pack_id }

    Package.updateOne(query, editPack, function(err) {
        if (err) {
            console.log(err);
            return;
        } else {
            req.flash('success', 'Package Updated');
            res.redirect('/admin/package_edit/' + req.body.pack_id);

        }
    });
});

router.get('/admin/package/add', adminAuth, function(req, res) {
    res.render('admin/add_package', {
        user: req.user
    });
});

router.post('/admin/package/add', adminAuth, function(req, res) {
    const title = req.body.title;
    const price = req.body.price;
    const duration = req.body.duration;
    const activation_charges = req.body.activation_charges;
    const monthly_fees = req.body.monthly_fees;
    const details = req.body.details;
    const admin_id = req.user._id;
    const points = req.body.points;

    req.checkBody('title', 'Title is required').notEmpty();
    req.checkBody('price', 'Price is required').notEmpty();
    req.checkBody('duration', 'Duration is required').notEmpty();
    req.checkBody('points', 'Points are required').notEmpty();

    let errors = req.validationErrors();

    if (errors) {
        console.log(errors);
        res.render('admin/package/add', {
            errors: errors
        });
    } else {
        let newPackage = new Package({
            title: title,
            duration: duration,
            price: price,
            admin_id: admin_id,
            details: details,
            activation_charges: activation_charges,
            monthly_fees: monthly_fees,
            points: points
        });

        newPackage.save(function(err) {
            if (err) {
                console.log(err);
                return;
            } else {
                req.flash('success', 'Package is added.');
                res.redirect('/admin/package/add');
            }
        });
    }
});

function payDirectReferral(order_id, ref) {
    Order.findOne({ order_id: order_id }, { package_id: 1 }, function(err, order) {
        Package.findOne({ _id: order.package_id }, function(err, package) {
            let bonus = (parseInt(package.price) * (10 / 100));
            updateAccount('username', ref, '+', bonus, 'confirmed', 'Direct Referral Bonus', 'deposit');
            // updateDirectRef(ref);
        });
    });
}

function updateDirectRef(parent) {
    Referral.find({ user: parent }, { direct: 1 }, function(err, usr) {
        if (err) {
            console.log(err);
        } else {
            console.log('-direct info-');
            console.log(usr);
            console.log('-direct info-');

            num = parseInt(usr[0].direct);
            num = num + 1;

            let ref = {};
            ref.direct = num;

            let query = { user: parent }

            Referral.updateMany(query, ref, function(err) { // May be updateOne
                if (err) {
                    console.log(err);
                    return;
                } else {
                    console.log('Direct Updated');
                }
            });
        }
    });
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
        .then(function(result) {

            if (result.earned <= result.limit) {

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

                User.updateOne(query, toUpdate, function(err, ret) {
                    if (err) {
                        console.log('err is :');
                        console.log(err);
                    } else {
                        User.findOne(query, function(err, usr) {
                            addTransection(usr._id, status, address, type, amount);

                        });
                    }
                });
            } else {
                console.log('limit Exceed');
            }
        })
        .catch();

}


function addTransection(user_id, status, address, type, amount) {
    var date = new Date();
    date.setHours(0, 0, 0, 0);
    var justDate = date.getTime();

    newTransection = new Transection({
        user_id: user_id,
        trans_status: status,
        address: address,
        trans_type: type,
        date: justDate,
        amount: amount
    });

    newTransection.save(function(err, ret) {
        if (err) console.log(err);
        console.log('transection added ' + amount);

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


// async function PayAllParents(user, points){

//   parent1 = await getParent(user);
//   parent2 = await getParent(parent1);
//   parent3 = await getParent(parent2);
//   parent4 = await getParent(parent3);
//   parent5 = await getParent(parent4);

//   if (parent1 != '') {
//     payFirstParent(parent1, user, points);    
//   }
//   if (parent2 != '') {
//     payFirstParent(parent2, parent1, points);    
//   }
//   if (parent3 != '') {
//     payFirstParent(parent3, parent2, points);    
//   }
//   if (parent4 != '') {
//     payFirstParent(parent4, parent3, points);    
//   }
//   if (parent5 != '') {
//     payFirstParent(parent5, parent4, points);    
//   }

// }

router.get('/admin/payPoints/:usr/:points', adminAuth, function(req, res) {
   // 
   User.find({username:req.params.usr}).then(function (u) {
       if (u.length > 0) {
        PayAllParents(req.params.usr, req.params.points);     
        console.log('User :'+req.params.usr+' Points:'+req.params.points);           
       }else{
           console.log('User not exist !');
       }
   }).catch(function (err) {
       console.log(err);
       return;
   });
   res.send('Hi');
}); 


async function PayAllParents(user, points) {
    var parent = await getParent(user);
    if (parent == '') return 0;

    console.log('user is ' + user);
    console.log('paying to : ' + parent);

    await payFirstParent(parent, user, points);
    return await PayAllParents(parent, points);
}


function payFirstParent(parent, user, points) {
    Referral.find({ user: parent }, function(err, usr) {
        if (err) {
            console.log('err : ' + err);
        }
        if (usr.length > 0) {

            if (usr[0].left == user) {
                payPoints(usr[0].user, 'left', points);
                console.log('add points on left');
            } else if (usr[0].right == user) {
                payPoints(usr[0].user, 'right', points);
                console.log('add points on right');
            }
        }
    });
}


function payPoints(user, direction, points) {
    BinaryPoints.find({ user: user }, function(err, usr) {
        if (err) {
            console.log(err);
        } else {
            if (usr.length > 0) {
                let newPoints = 0;
                let LPoints = parseInt(usr[0].left);
                let RPoints = parseInt(usr[0].right);
                if (direction == 'left') {
                    newPoints = parseInt(LPoints) + parseInt(points);
                } else if (direction == 'right') {
                    newPoints = parseInt(RPoints) + parseInt(points);
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

function updatePointsAfterCal(user, left, right, converted) {

    let toUpdate = {};

    toUpdate.left = parseInt(left);
    toUpdate.right = parseInt(right);
    toUpdate.converted = parseInt(converted);

    let query = { user: user }

    BinaryPoints.updateOne(query, toUpdate, function(err) {
        if (err) {
            console.log(err);
            return;
        } else {
            console.log('points updated after calculation');

        }
    });

}

async function activateAccount(user) {
    await treeEntry(user);
    let toUpdate = {};

    toUpdate.account = 'active';

    let query = { _id: user }
    User.updateOne(query, toUpdate, function(err) {
        if (err) {
            console.log(err);
            return;
        } else {

            console.log('Account is activated');

        }
    });

}

function updateLimit(user_id, pack_id) {

    Package.findOne({ _id: pack_id }).then(function(pack) {

        limit = pack.price * 5;

        User.findOne({ _id: user_id })
            .then(function(user) {

                let toUpdate = {};
                toUpdate.limit = user.limit + limit;
                let query = { _id: user_id }

                User.updateOne(query, toUpdate, function(err) {
                    if (err) {
                        console.log(err);
                        return;
                    } else {
                        console.log('Limit is updated!');
                    }
                });
            }).catch(function(err) {
                console.log(err);

            });

    }).catch(function(err) {
        console.log(err);
    });

}

function updateUserToken(user_id, pack_id) {

    Package.findOne({ _id: pack_id }).then(function(pack) {

        tokens = pack.tokens * 1;

        User.findOne({ _id: user_id })
            .then(function(user) {

                let toUpdate = {};
                toUpdate.tokens = user.tokens + tokens;
                let query = { _id: user_id }

                User.updateOne(query, toUpdate, function(err) {
                    if (err) {
                        console.log(err);
                        return;
                    } else {
                        console.log('User tokens is updated!');
                    }
                });
            }).catch(function(err) {
                console.log(err);

            });

    }).catch(function(err) {
        console.log(err);
    });

}


function giveTokens(user_id, tokens) {
        
    console.log('tok',tokens);
    
        User.findOne({ _id: user_id })
            .then(function(user) {

                let toUpdate = {};
                toUpdate.tokens = user.tokens + tokens;
                let query = { _id: user_id }

                User.updateOne(query, toUpdate, function(err) {
                    if (err) {
                        console.log(err);
                        return;
                    } else {
                        console.log('User tokens is updated!');
                    }
                });
            }).catch(function(err) {
                console.log(err);

            });

}

function swapTokens(user_id, tokens, amount) {
        
    console.log('tok',tokens);
    
        User.findOne({ _id: user_id })
            .then(function(user) {

                let toUpdate = {};
                toUpdate.tokens = user.tokens + tokens;
                toUpdate.balance = user.balance - amount;
                let query = { _id: user_id }

                User.updateOne(query, toUpdate, function(err) {
                    if (err) {
                        console.log(err);
                        return;
                    } else {
                        console.log('User tokens is updated!');
                    }
                });
            }).catch(function(err) {
                console.log(err);

            });

}



function calPoints(user) {
    BinaryPoints.find({ user: user }, function(err, usr) {
        if (err) {
            console.log(err);
        } else {

            let cap = 6000;
            let pointsPayOut = 0;
            let newPoints = 0;
            let LPoints = parseInt(usr[0].left);
            let RPoints = parseInt(usr[0].right);
            let convertedPoints = parseInt(usr[0].converted);
            let newLeftP = 0;
            let newRightP = 0;

            if (LPoints < RPoints) {
                if (LPoints <= cap) {
                    newPoints = RPoints - LPoints;
                    pointsPayOut = LPoints;
                    newLeftP = 0;
                    newRightP = newPoints;
                } else {
                    newLeftP = LPoints - cap;
                    newRightP = RPoints - cap;
                    pointsPayOut = cap;
                }
            } else if (RPoints < LPoints) {
                if (RPoints <= cap) {
                    newPoints = LPoints - RPoints;
                    pointsPayOut = RPoints;
                    newRightP = 0;
                    newLeftP = newPoints;
                } else {
                    newLeftP = LPoints - cap;
                    newRightP = RPoints - cap;
                    pointsPayOut = cap;
                }
            } else if (RPoints == LPoints) {
                if (RPoints <= cap) {
                    newPoints = LPoints;
                    pointsPayOut = RPoints;
                    newRightP = 0;
                    newLeftP = 0;
                } else {
                    newLeftP = LPoints - cap;
                    newRightP = RPoints - cap;
                    pointsPayOut = cap;
                }
            }

            if (pointsPayOut > 0) {
                convertedPoints = convertedPoints + pointsPayOut;
                updatePointsAfterCal(user, newLeftP, newRightP, convertedPoints);
                let pointToDollar = (pointsPayOut / 2);
                console.log("paying" + pointToDollar + ' to ' + user);

                updateAccount('username', user, '+', pointToDollar, 'confirmed', 'Binary Referral Bonus', 'deposit');
            }

        }
    });
}

function giveBinaryBonus() {
    BinaryPoints.find({}).then(function(users) {
        users.forEach(user => {
            Referral.find({ user: user.user }).then(function(usr) {
                if (usr.length > 0) {
                    if (usr[0].direct > 1) {
                        calPoints(usr[0].user);
                    }
                }
            }).catch(function(err) {
                console.log(err);
            });
            //      calPoints(user.user);
        });
    }).catch(function(err) {
        console.log(err);
    });
}



function oldCalPoints(user) {
    BinaryPoints.find({ user: user }, function(err, usr) {
        if (err) {
            console.log(err);
        } else {
            let pointsPayOut = 0;
            let newPoints = 0;
            let LPoints = parseInt(usr[0].left);
            let RPoints = parseInt(usr[0].right);
            let newLeftP = 0;
            let newRightP = 0;

            if (LPoints < RPoints) {
                newPoints = RPoints - LPoints;
                pointsPayOut = LPoints;
                newLeftP = 0;
                newRightP = newPoints;
            } else if (RPoints < LPoints) {
                newPoints = LPoints - RPoints;
                pointsPayOut = RPoints;
                newRightP = 0;
                newLeftP = newPoints;
            }
            if (pointsPayOut > 0) {
                updatePointsAfterCal(user, newLeftP, newRightP);
                let pointToDollar = (pointsPayOut / 2);
                updateAccount('username', user, '+', pointToDollar, 'confirmed', 'Binary Referral Bonus', 'deposit');
            }

        }
    });
}




function updateDirectReferral(by, to) {

    newDirect = new DirectReferrals({
        referred_by: by,
        referred_to: to
    });
    newDirect.save(function(err, ret) {
        if (err) console.log(err);

    });
}

function createBinaryPoints(user) {
    BinaryPoints.find({ user: user }, function(err, usr) {
        if (!(usr.length > 0)) {
            newBinaryEntry = new BinaryPoints({
                user: user
            });
            newBinaryEntry.save(function(err, ret) { if (err) console.log(err); });
        }
    });
}

// Access Control
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
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

/* Generate Order ID For New Order */
// Generate Order ID
function generateOrderId(callback) {
    var orderid = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    for (var i = 0; i < 6; i++)
        orderid += possible.charAt(Math.floor(Math.random() * possible.length));

    return callback(orderid);
}

// Check Order ID Exist
function orderId(callback) {

    generateOrderId(function(order_id) {
        Order.findOne({ order_id: order_id }, function(err, order) {
            console.log(order_id);
            if (!order) {
                return callback(order_id);
            } else if (order) {
                return orderId();
            }
        });
    });
}
/* End Generate Order ID For New Order */



// Generate Order ID
function generateTokenOrderId(callback) {
    var orderid = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    for (var i = 0; i < 6; i++)
        orderid += possible.charAt(Math.floor(Math.random() * possible.length));

    return callback(orderid);
}

// Check Order ID Exist
function tokenOrderId(callback) {

    generateTokenOrderId(function(order_id) {
        tokenOrders.findOne({ order_id: order_id }, function(err, order) {
            console.log(order_id);
            if (!order) {
                return callback(order_id);
            } else if (order) {
                return tokenOrderId();
            }
        });
    });
}
/* End Generate Order ID For New Order */



function getToken() {
    var orderid = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    for (var i = 0; i < 7; i++)
        orderid += possible.charAt(Math.floor(Math.random() * possible.length));

    return orderid + moment().toDate().getTime();

}

function getAddress(orderid, token) {
    return new Promise((resolve, reject) => {
        const client = new Client();
        // my_xpub = 'xpub6CwhpTpcdbGyjUc6RBLSouJ3VMkkxe9qypvDKdDPcHBZcTYtkTMQiVDFV8nSkjxhBQY6ao1221QwpWJ8pMaYy2tKf8hoDM9aS24Fnd7P282';
        // my_xpub = 'xpub6CwhpTpcdbGymVpxW9GybFuCMExoQz4wHMusbGDVesQHw3bQW3rfLiSvCbRG7twts3xaDKyHM8XjW1ZHawTwPUQAw3jkEn1HuTrs1sPm6Ux';
        
        my_api_key = 'ac3dee80-97cc-4c15-96bd-17130799daa8';
        my_callback_url = 'https://ccbtcmining.com/packageverify/' + orderid + '/' + token;
        root_url = 'https://api.blockchain.info/v2/receive';
        parameters = 'xpub=' + my_xpub + '&callback=' + encodeURIComponent(my_callback_url) + '&key=' + my_api_key;
        client.get(
            root_url + '?' + parameters,
            function(data) {
                console.log('response data');
                console.log(data);
                resolve(data.address);
            }
        );
    });
}

function getTokenAddress(orderid, token) {
    return new Promise((resolve, reject) => {
        const client = new Client();
        // my_xpub = 'xpub6CwhpTpcdbGyjUc6RBLSouJ3VMkkxe9qypvDKdDPcHBZcTYtkTMQiVDFV8nSkjxhBQY6ao1221QwpWJ8pMaYy2tKf8hoDM9aS24Fnd7P282';
        my_xpub = 'xpub6CwhpTpcdbGymVpxW9GybFuCMExoQz4wHMusbGDVesQHw3bQW3rfLiSvCbRG7twts3xaDKyHM8XjW1ZHawTwPUQAw3jkEn1HuTrs1sPm6Ux';
        my_api_key = 'ac3dee80-97cc-4c15-96bd-17130799daa8';
        my_callback_url = 'https://ccbtcmining.com/tokenverify/' + orderid + '/' + token;
        root_url = 'https://api.blockchain.info/v2/receive';
        parameters = 'xpub=' + my_xpub + '&callback=' + encodeURIComponent(my_callback_url) + '&key=' + my_api_key;
        client.get(
            root_url + '?' + parameters,
            function(data) {
                console.log('response data');
                console.log(data);
                resolve(data.address);
            }
        );
    });
}

async function getPaymentUsd(address) {
    btc = await getBtcPrice();
    return new Promise((resolve, reject) => {
        const client = new Client();
        console.log('address is ' + address);

        client.get(
            'https://blockchain.info/rawaddr/' + address,
            function(data) {

                console.log('address data');
                console.log(typeof data.total_received);

                paidS = data.total_received;
                console.log('paid in Sitoshi' + paidS);

                paidB = sb.toBitcoin(paidS);
                console.log('paid in btc ' + paidB);

                usdAmount = parseFloat(paidB) * parseFloat(btc);
                console.log('usd amount is ' + usdAmount);

                toRet = { satoshi: paidS, usd: usdAmount.toFixed(3) };

                resolve(toRet);
            }
        );
    });
}


// getPaymentUsd('1rm4SVHyX6bzLxQaCGJoCMeXqMRdXGovS');

function getBtcPrice() {
    return new Promise((resolve, reject) => {
        const client = new Client();

        client.get(
            'https://api.cryptonator.com/api/ticker/btc-usd',
            function(data) {
                console.log('btc data: ');
                console.log(data);

                resolve(parseFloat(data.ticker['price']));
            }
        );
    });
}

async function updateAddress(order_id, token) {
    var address = await getAddress(order_id, token);
    Order.find({ _id: order_id }).then(function(order) {
        console.log(order);

        if (order.length > 0) {

            let editOrder = {};
            editOrder.address = address;
            let query = { _id: order[0]._id }

            Order.updateOne(query, editOrder, function(err) {
                if (err) {
                    console.log(err);
                    return;
                } else {

                }
            });
        }
    }).catch();
}

async function updateTokenAddress(order_id, token) {
    var address = await getTokenAddress(order_id, token);
    tokenOrders.find({ _id: order_id }).then(function(order) {
        
        if (order.length > 0) {

            let editOrder = {};
            editOrder.address = address;
            let query = { _id: order[0]._id }

            tokenOrders.updateOne(query, editOrder, function(err) {
                if (err) {
                    console.log(err);
                    return;
                } else {

                }
            });
        }
    }).catch();
}

function treeEntry(userinfo) {

    return new Promise((resolve, reject) => {

        User.find({ _id: userinfo }).then(function(usr) {

            if (usr.length > 0) {

                Referral.find({ user: usr[0].username }).then(function(refUser) {
                    if (refUser.length > 0) {
                        console.log('user is also in tree');

                    } else {
                        DirectReferrals.find({ referred_to: usr[0].username }).then(function(refinfo) {
                            if (refinfo.length > 0) {
                                if (refinfo[0].referred_by != '') {
                                    refStart(refinfo[0].referred_by, refinfo[0].referred_to);
                                } else {
                                    newRefEntry = new Referral({
                                        user: refinfo[0].referred_to
                                    });
                                    newRefEntry.save(function(err, ret) { if (err) console.log(err); });
                                }
                            } else {
                                newRefEntry = new Referral({
                                    user: usr[0].username
                                });
                                newRefEntry.save(function(err, ret) { if (err) console.log(err); });
                            }

                        }).catch();

                    }
                }).catch();


            }


        }).catch();


        resolve('');
    });
}

function addDirectReferral(by, to) {

    newDirect = new DirectReferrals({
        referred_by: by,
        referred_to: to,
    });
    newDirect.save(function(err, ret) {
        if (err) console.log(err);

    });
}


function refStart(referrer, retUsername) {
    Referral.find({ "user": referrer }, function(err, user) {
        if (err) {
            console.log(err);
        } else {
            console.log('checking');
            console.log(user[0]);

            if (user[0].right == '') {
                enterRef(user[0].user, retUsername);
                enterRight(user[0].user, retUsername);
            } else if (user[0].left == '') {
                enterRef(user[0].user, retUsername);
                enterLeft(user[0].user, retUsername);
            } else {
                checkTree(user[0].user, retUsername, user[0].toadd);
            }
        }
    });
}

// Checking the tree
function checkTree(parent, toAdd, pref) {

    Referral.find({ "user": parent }, function(err, user) {
        if (err) {
            console.log(err);
        } else {
            if (pref == 'right') {
                if (user[0].right == '') {
                    enterRef(parent, toAdd);
                    enterRight(parent, toAdd);
                } else {
                    checkTree(user[0].left, toAdd);
                }
            } else if (pref == 'left') {
                if (user[0].left == '') {
                    enterRef(parent, toAdd);
                    enterLeft(parent, toAdd);
                } else {
                    checkTree(user[0].left, toAdd);
                }
            } else {
                if (user[0].left == '') {
                    enterRef(parent, toAdd);
                    enterLeft(parent, toAdd);
                } else {
                    checkTree(user[0].left, toAdd, pref);
                }
            }
        }
    });

}


// Enter Referrels
function enterRef(parent, user) {
    newRefEntry = new Referral({
        user: user,
        parent: parent
    });
    newRefEntry.save(function(err, ret) { if (err) console.log(err); });
}

function enterLeft(parent, left) {
    let ref = {};
    ref.left = left;

    let query = { user: parent }

    Referral.updateOne(query, ref, function(err) {
        if (err) {
            console.log(err);
            return;
        } else {
            console.log('Referral updated');
        }
    });
}

function enterRight(parent, right) {
    let ref = {};
    ref.right = right;

    let query = { user: parent };

    Referral.updateOne(query, ref, function(err) {
        if (err) {
            console.log(err);
            return;
        } else {
            console.log('Referral updated');
        }
    });
}

module.exports = router;