const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const moment = require('moment');


let Mining = require('../models/machineMining');
let Order = require('../models/orders');
let Package = require('../models/packages');
let Earning = require('../models/earning');
let User = require('../models/user');
let Referral = require('../models/referrals');
let Transection = require('../models/transections');
let BinaryPoints = require('../models/binarypoints');

router.get('/admin/mining', adminAuth, function(req, res) {

    Mining.find({}).then(function(minings) {

        res.render('admin/all_mining', {
            user: req.user,
            minings: minings,
            moment: moment
        });

    }).catch(function(err) {
        console.log(err);
    });

});

router.get('/admin/mining/add', adminAuth, function(req, res) {

    var date = new Date();
    date.setHours(0, 0, 0, 0);
    var time = date.getTime();

    res.render('admin/add_mining', {
        user: req.user
    });
});


router.post('/admin/mining/add', adminAuth, function(req, res) {

    var mined = req.body.mined_value;
    const mined_date = req.body.mined_date;
    const admin_id = req.user._id;


    req.checkBody('mined_value', 'Mined value is required').notEmpty();
    req.checkBody('mined_date', 'Mined date is required').notEmpty();
    console.log(mined_date);
    
    let date = Date.parse(mined_date).toString();
    console.log('Date : ');
    console.log(date);



    let errors = req.validationErrors();

    if (errors) {
        console.log(errors);
        res.render('admin/add_mining', {
            errors: errors,
            user: req.user
        });
    } else {
            mined = parseInt(mined);
            console.log(mined);
            
        
        c1Date = moment(new Date(mined_date)).format("YYYY-MM-DD");
        check = moment(new Date()).format("YYYY-MM-DD");            
        
        // if (!(moment(c1Date).isSame(check))) {
        //     req.flash('danger', 'You can only add mining for current date.');
        //     return res.redirect('/admin/mining/add');
        // }       

        if (mined > 80 || mined < 70) {
            req.flash('danger', 'Mining value should me between 70 and 80.');
            return res.redirect('/admin/mining/add');
        }
        
        if (isNaN(mined)) {
            req.flash('danger', 'Wrong mining value.');
            return res.redirect('/admin/mining/add');
        }

        

        let newMine = new Mining({
            mined: mined,
            mined_date: date,
            admin_id: admin_id
        });
        
        Mining.find({mined_date:date}).then(function (mine) {
            
            if (mine.length > 0) {
                req.flash('danger', 'Minging is already.');
                        res.redirect('/admin/mining/add');
            }else{
                newMine.save(function(err, result) {
                    if (err) {
                        console.log(err);
                    } else {
                        
                        payToAll(mined, date, admin_id);
        
                        req.flash('success', 'Minging detail is added.');
                        res.redirect('/admin/mining/add');
                    }
                });
            }
            
        })
        
    }
});


router.get('/user/mining', userAuth, function(req, res) {

    Order.find({ user_id: req.user._id, order_status: 'paid' }, function(err, orders) {
        if (err) {
            console.log(err);
        } else {
            Package.find({}, function(err, packages) {
                if (err) {
                    console.log(err);
                }
                console.log(orders);
                console.log(packages);

                res.render('user/all_mining', {
                    user: req.user,
                    orders: orders,
                    packages: packages,
                    moment: moment
                });
            });
        }
    });

});

router.get('/user/mine/:mine', userAuth, function(req, res) {

    var mongodb = require("mongodb");
    
   if (mongodb.ObjectID.isValid(req.params.mine)) {
    Order.
    find({ _id: req.params.mine }).then(function(orders) {
            
            if (orders.length > 0) {
                
                Earning.find({ order_id: orders[0]._id }, { earned: 1, date: 1, _id: 0 }, function(err, earnings) {
                    
                    res.render('user/single_mining', {
                        user: req.user,
                        orders: orders[0],
                        earnings: earnings,
                        moment: moment
                    });

                });
                
            } else {
                res.redirect('/dashboard');
            }
        }).catch(function(err) {
            console.log(err);
            return;
        });       
   } else {
    res.redirect('/dashboard');
    }


});

router.get('/checkFor6Months/:date', function (req, res) {
    Order.
    find({ status: 'active' },{activation_date:-1, completion_date:-1,order_id:-1,user_id:-1,package_id:-1}).
    then(function(orders, err) {
        if (err) {
            console.log(err);
        } else {
            console.log(orders);

           orders.forEach(function(order, index) {
            setTimeout(async function() {
                let cDate = order.completion_date;
                time = cDate / 1000;
                cDate = moment.unix(time).format("YYYY-MM-DD");
                check = moment.unix(req.params.date/1000).format("YYYY-MM-DD");            
                console.log('checkDate'+check);
                
                    if (moment(cDate).isSame(check)) {
                           console.log('Order Id : '+ order.order_id);
                           console.log('Yes today is the completion date');
                           await completeOrder(order.order_id, order.user_id);
                           await payMonthlyCharges(order.package_id, order.user_id);
                    }          
                },
                50 * index);
        })
        }
    });

    res.send('orders');
})


function payToAll(value, date, admin_id) {    
    Order.
    find({ status: 'active' }).
    then(function(orders, err) {
        if (err) {
            console.log(err);
        } else {
            orders.forEach(function(order, index) {
                setTimeout(function() {
                        payEarning(value, date, admin_id, order);
                    },
                    100 * index);
            })
        }
    });
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

    // for Residual Bonus

    for (let index = 1; index < 6; index++) {

        check = moment(sDate).add(index, 'M');

        ifday = moment().isSame(moment(check), 'day');
        if (ifday) {
            console.log('day to charge');
            console.log(order);
            await payMonthlyCharges(order.package_id, order.user_id);
        }
    }

    // for Residual Bonus    

    // for order completion

        c1Date = moment.unix(time).format("YYYY-MM-DD");
        check = moment(new Date()).format("YYYY-MM-DD");            

        if (moment(c1Date).isSame(check)) {
                console.log('Yes today is the completion date');
                await completeOrder(order.order_id, order.user_id);
                await payMonthlyCharges(order.package_id, order.user_id);
        }else{

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


    // for order completion


}


function payMonthlyCharges(pack_id, user_id) {
    return new Promise((resolve, reject) => {
        Package.find({ _id: pack_id }, function(err, packs) {

            if (err) {
                console.log('err : ' + err);
            }
            if (packs.length > 0) {

                if (packs[0].monthly_fees > 0) {

                    User.find({ _id: user_id }).then(function(usr) {
                        if (usr.length > 0) {
                            PayAllResidual(usr[0].username, packs[0].monthly_fees);
                        }

                    }).catch(
                        function(err) {
                            console.log(err);
                        }
                    );
                }
                resolve(packs[0]);
            } else {
                resolve('');
            }
        });
    });
}

function getParent(user) {
    return new Promise((resolve, reject) => {
        Referral.find({ user: user }, function(err, usr) {
            if (err) {
                console.log('err : ' + err);
            }
            if (usr.length > 0) {
                // console.log('user is : '+user);
                // console.log(usr);

                resolve(usr[0].parent);
            } else {
                resolve('');
            }
        });
    });
}

async function PayAllResidual(user, amount) {

    console.log('user for charging residual ' + user);

    updateAccount('username', user, '-', amount, 'confirmed', 'Package Renewal', 'withdraw');

    parent1 = await getParent(user);
    parent2 = await getParent(parent1);
    parent3 = await getParent(parent2);
    parent4 = await getParent(parent3);
    parent5 = await getParent(parent4);
    parent6 = await getParent(parent5);
    parent7 = await getParent(parent6);
    parent8 = await getParent(parent7);
    parent9 = await getParent(parent8);
    parent10 = await getParent(parent9);

    if (parent1 != '') {
        payResidual(parent1, amount, 10);
    }
    if (parent2 != '') {
        payResidual(parent2, amount, 5);
    }
    if (parent3 != '') {
        payResidual(parent3, amount, 3);
    }
    if (parent4 != '') {
        payResidual(parent4, amount, 2);
    }
    if (parent5 != '') {
        payResidual(parent5, amount, 1);
    }
    if (parent6 != '') {
        payResidual(parent6, amount, 1);
    }
    if (parent7 != '') {
        payResidual(parent7, amount, 1);
    }
    if (parent8 != '') {
        payResidual(parent8, amount, 1);
    }
    if (parent9 != '') {
        payResidual(parent9, amount, 1);
    }
    if (parent10 != '') {
        payResidual(parent10, amount, 1);
    }
}


function payResidual(parent, amount, percent) {
    bonus = parseFloat(amount) * (parseFloat(percent) / 100);
    console.log(parent + 'will get ' + bonus);
    updateAccount('username', parent, '+', bonus, 'confirmed', 'Residual Bonus', 'deposit');

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

                payROI(user_id, perDayEarn).then(function() {
                    resolve('');
                });

            }
        })
    });
}

async function payROI(user_id, amount) {

    return new Promise((resolve, reject) => {
        console.log('paying roi');
        console.log(amount);

        updateAccount('id', user_id, '+', amount, 'confirmed', 'ROI', 'deposit');
        resolve('');

    });
}

function completeOrder (order_id, user_id) {
    return new Promise((resolve, reject) => {
    let order = {};
        order.status = 'completed';

        let query = { order_id: order_id };
        Order.updateOne(query, order, function(err, result) {
            if (err) {
                console.log(err);
                return;
            } else {
                Order.find({user_id : user_id, status: 'active'})
                .then(function (usr_orders) {
                        if (usr_orders.length < 1 ) {
                            updatePointsToZero(user_id);    
                            updateLimitToZero(user_id);               
                        }
                })
            }
            resolve(true);
        })
    })
}



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
                    console.log(usr[0].username+'Both sides are now on zero');
                    
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




async function checkFor6Months(order) {

    return new Promise((resolve, reject) => {
        start  = order.activation_date, end = order.completion_date;
        
        var start = moment.unix((start/1000)).format('YYYY-MM-DD');
        var end = moment.unix((end/1000)).format('YYYY-MM-DD');
        
         dif = moment().diff(moment(start), 'months', true);
         
         console.log(dif);
         
        resolve('');

    });
}

async function updateAccount(qType, user, action, amount, status, address, type) {

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
                if (result.pinAccount == true && address=='ROI') {
                    
                    console.log('Pin Account , No ROI');
                    
                }else{
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
                }
                
            } else {
                console.log('limit Exceed');
            }
        })
        .catch();

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

let tree = [];

async function getAllParents(user) {
    var parent = await getParent(user);
    if (parent != '') {
        tree.push(parent);
        getAllParents(parent);
    }
}


async function PayAllParents(user) {
    var parent = await getParent(user);
    if (parent == '') return 0;
    console.log('paying to : ' + parent);
    //  await  tree.push(parent);
    return await PayAllParents(parent);
}

//(async () => console.log(await recursion('shan').then(()=> (console.log(tree)))))();
//PayAllParents('shan').then(()=> (console.log(tree)));

// Access Control

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