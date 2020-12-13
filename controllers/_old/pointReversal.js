const express = require('express');
const router = express.Router();
const moment = require('moment');


let User = require('../models/user');
let Referral = require('../models/referrals');
let BinaryPoints = require('../models/binarypoints');
let Transection = require('../models/transections');

var ccbemails = require('./emails');

router.get('/pointRev/:leader', function(req, res) {
    User.find({ username: req.params.leader }).then(function(users) {
        if (users.length > 0) {
            pointsReversel(users[0].username);
            res.send(users);
        } else {
            res.send('user not found');
        }

    }).catch(function(err) {
        console.log(err);
    });
});


router.get('/admin/settings/reversepoints', adminAuth, function(req, res){

    res.render('admin/point_reversal',{
        user: req.user,
      });
  
  });

router.post('/admin/settings/reversepoints', adminAuth, function(req, res){
    
    direction = req.body.direction;
    points = req.body.points;
    username = req.body.username;

    removePoints(username, points, direction);
    req.flash('info', 'Points are removed.');
    res.render('admin/point_reversal',{
        user: req.user,
      });
  
});

function removePoints(user, points, direction) {
    User.find({ username: user }).then(function(usr) {
        
        if (usr[0].username !== '') {
            BinaryPoints.find({ user: usr[0].username }).then(async function(a) {
                console.log(a);
                points = parseInt(points);
                
                //res.send(a);

                if (direction == 'left') {
                    if (a[0].left >= points) {
                        console.log('left is greater then points');
                        deletePoints(user, points, direction);

                    }else{
                        console.log("left is less then points");
                        
                       await reversePoint(user).then(function () {
                        removePoints(user, points, direction);                           
                       })

                    }
                }
                if (direction == 'right') {
                    if (a[0].right >= points) {
                        deletePoints(user, points, direction);
                        console.log('right is greater then points');
                    }else{
                        console.log("right is less then points");

                         await reversePoint(user).then(function () {
                            removePoints(user, points, direction);                         
                        });

                    
                    }
                }

            });
        }
    });
} 

function reversePoint(parent) {
    return new Promise((resolve, reject) => {
        User.find({ username: parent }).then(function(usr) {

            if (usr[0].username !== '') {
                User.find({ username: usr[0].username }).then(function(a) {
                    toDel = usr[0]._id;
                    Transection.find({
                        user_id: usr[0]._id,
                        address: "Binary Referral Bonus",
                    }).then(function(transections) {
                        if (transections.length > 0) {
                            console.log(transections[0]);
                            
                            total = 0;
                            total = total + transections[0].amount;
                            toDel = transections[0]._id;
                            newPoints = total * 2;
                            updatePoints(usr[0].username, newPoints);
                            
                        }
                        else{
                            updatePoints(usr[0].username, 0);
                        }
                        
                    }).then(function() {
                        console.log('Deleting transection: '+toDel);
                        
                        Transection.remove({
                            _id: toDel,
                            address: "Binary Referral Bonus",
                        },function (err, data) {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log(data);
                            }
                        });

                    resolve('');
                    });
                });
            }
        });
    });
}

  

function pointsReversel(parent) {
    User.find({ username: parent }).then(function(usr) {
        console.log(usr[0].parent);
        if (usr[0].username !== '') {
            User.find({ username: usr[0].username }).then(function(a) {

                Transection.find({
                    user_id: a[0]._id,
                    address: "Binary Referral Bonus",
                }).then(function(transections) {
                    if (transections.length > 0) {
                        total = 0;
                    transections.forEach(function(trans, idx) {

                        total = total + trans.amount;
                        console.log("Trx Found: " + usr[0].username + " -> " + usr[0]._id + " -> " + trans.amount);
                        if (idx === transections.length - 1) {
                            newPoints = total * 2;
                            console.log("Final: " + usr[0].username + " -> " + usr[0]._id + " -> " + total);
                            updatePoints(a[0].username, newPoints);
                        }
                    });

                     console.log(transections);    
                    }
                    else{
                        updatePoints(a[0].username, 0);
                    }
                    
                }).then(function() {

                    Transection.deleteMany({
                        user_id: a[0]._id,
                        address: "Binary Referral Bonus",
                    },function (err, data) {
                        if (err) {
                            console.log(err);
                          } else {
                            console.log(data);
                          }
                    });

                   console.log('End');
                });
            });
        }
    });
}

function deletePoints(user, points, direction) {

    BinaryPoints.find({ user: user }).then(function(usr) {

        if (usr.length > 0) {
            let toUpdate = {};

            if (direction == 'left') {
                console.log("Left");
                console.log(usr[0].left);
                console.log(parseInt(points));

                toUpdate.left = usr[0].left - parseInt(points);    
            }

            if (direction == 'right') {
                console.log("Right");
                console.log(usr[0].right);
                console.log(parseInt(points));
            
                toUpdate.right = usr[0].right - parseInt(points);    
            }
            
            let query = { user: user }

            BinaryPoints.updateOne(query, toUpdate, function(err, data) {
                if (err) {
                    console.log(err);
                    return;
                } else {
                    console.log(data);
                }
            });

        }
    });

}


function updatePoints(user, points) {

    BinaryPoints.find({ user: user }).then(function(usr) {

        if (usr.length > 0) {
            let toUpdate = {};

            console.log("Left");
            console.log(usr[0].left);
            console.log(parseInt(points));

            toUpdate.left = usr[0].left + parseInt(points)
            
            console.log("Right");
            console.log(usr[0].right);
            console.log(parseInt(points));
            
            toUpdate.right = usr[0].right + parseInt(points)
            
            console.log("Converted");
            console.log(usr[0].right);
            console.log(parseInt(points));
            toUpdate.converted = usr[0].converted - parseInt(points);

            let query = { user: user }

            BinaryPoints.updateOne(query, toUpdate, function(err) {
                if (err) {
                    console.log(err);
                    return;
                } else {

                    console.log('points updated after calculation');
                    amount = points / 2;

                    updatePointsBalance(user, amount);
                }
            });

        }
    });

}

function updatePointsBalance(user, amount) {
    return new Promise((resolve, reject) => {
        let query;
        query = { username: user };

        User.findOne(query)
            .then(function(result) {

                let newB = parseFloat(result.balance);
                newB = newB - parseFloat(amount);

                let newE = parseFloat(result.earned);
                newE = newE - parseFloat(amount);


                User.updateOne(query, { balance: newB, earned: newE }, function(err, ret) {
                    if (err) {
                        console.log('err is :');
                        console.log(err);
                    } else {
                        console.log('balance updated');
                    }
                });
            })
            .catch(function(err) {
                console.log(err);
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



