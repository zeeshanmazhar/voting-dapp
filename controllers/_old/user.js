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


var ccbemails = require('./emails');


router.use(expressip().getIpInfoMiddleware);

var User = require('../models/user');
let Referral = require('../models/referrals');
// let Order = require('../models/orders');
// let DirectReferrals = require('../models/directreferrals');
// let Transection = require('../models/transections');
// let Earning = require('../models/earning');
// let Payout = require('../models/payout');
// let Settings = require('../models/settings');
// let Newsletter = require('../models/newsletter');
// let Package = require('../models/packages');


router.get('/register', function (req, res) {
    res.render('user/register', { user_un: '' });
});


router.get('/login', function (req, res) {
    res.render('login', { user_un: '' });
});



router.get('/login-email', function (req, res) {
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const ipInfo = req.ipInfo;

    tt = moment().tz(ipInfo.timezone);

    var date = new Date();
    date = moment(tt).format('MMMM Do YYYY, h:mm:ss a');

    console.log('date is : ' + date);

    var message = `Hey, you are browsing from ${ipInfo.city}, ${ipInfo.country}`;

    console.log(message);
    console.log(ipInfo);

    if (ipInfo.city == undefined) {
        console.log('No city');

    } else {

    }

    ccbemails.login_email(req.user.email, req.user.username, date, ip, ipInfo.country, ipInfo.city);
    res.send(date);
});


router.get('/dashboard', ensureAuthenticated, function (req, res) {

    const ipInfo = req.ipInfo;
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    var message = `Hey, you are browsing from ${ipInfo.city}, ${ipInfo.country}`;

    console.log(message);

    if (req.user.user_type == "admin") {

        getTotalAdminStuff().then(function (total) {
            return total;
        }).then(function (tots) {

            res.render('admin/dashboard', {
                user: req.user,
                moment: moment,
                stuff: tots
            });
        });

    } else if (req.user.user_type == 'user' || req.user.user_type == 'leader') {

        if ((req.user.email_status == 'unverified')) {
            var usr_un = req.user.username;
            req.logout();
            res.render('user/account_verify', {
                user_un: usr_un
            });
        } else {

            Order.
                findOne({ user_id: req.user._id, order_status: 'paid' }).
                where('order_status').equals('paid').
                exec(function (err, orders) {
                    if (err) {
                        console.log(err);
                    } else {
                        if (!orders) {
                            res.render('user/noorder', {
                                user: req.user
                            });
                        } else {
                            getTotalStuff(req.user._id, req.user.username).then(function (total) {

                                return total;

                            }).then(function (stuff) {
                                // {earned:1,date:1, _id:0}
                                Earning.find({ order_id: orders._id }, function (err, earnings) {

                                    res.render('user/dashboard', {
                                        user: req.user,
                                        orders: orders,
                                        earnings: earnings,
                                        moment: moment,
                                        stuff: stuff
                                    });

                                });
                                // res.render('user/dashboard', {
                                //   user: req.user,
                                //   orders: orders,
                                //   moment:moment,
                                //   stuff:stuff
                                // })  
                            });

                        }

                    }
                });
        }
    } else {
        res.send('not working');
    }

});

router.get('/user/verify', function (req, res) {
    res.render('user/account_verify', {
        user: req.user
    });
});


router.get('/profile', ensureAuthenticated, function (req, res) {
    res.render('profile', {
        user: req.user
    });
});

router.get('/user/addmember', ensureAuthenticated, function (req, res) {
    res.render('user/add_member', {
        user: req.user,
        profile: req.user
    });
});

router.post('/user/addmember', ensureAuthenticated, function (req, res) {
    const first_name = req.body.first_name;
    const last_name = req.body.last_name;
    const email = req.body.email;
    const username = req.body.uname;
    const country = req.body.country;
    const password = req.body.password;
    const rpassword = req.body.rpassword;

    const referrer = req.body.referrer;
    const pref = req.body.pref;

    req.checkBody('first_name', 'First name is required').notEmpty();
    req.checkBody('last_name', 'Last name is required').notEmpty();
    req.checkBody('email', 'Email is required').notEmpty();
    req.checkBody('email', 'Email is not valid').isEmail();
    req.checkBody('uname', 'Username is required').notEmpty();
    req.checkBody('password', 'Password is required').notEmpty();
    req.checkBody('rpassword', 'Passwords do not match').equals(req.body.password);

    let errors = req.validationErrors();

    if (errors) {
        console.log(errors);
        res.render('user/add_member', {
            user: req.user,
            errors: errors
        });
    } else {

        User.find({ username: username }).then(function (unUser) {
            if (unUser.length > 0) {
                req.flash('danger', 'Username already exist.');
                res.redirect('/user/addmember');
            } else {

                if(username.length < 21 && username.length > 4 ) {
                    if(!/[^a-zA-Z0-9._]/.test(username)) {

                        let newUser = new User({
                            first_name: first_name,
                            last_name: last_name,
                            username: username,
                            country: country,
                            email: email,
                            username: username,
                            password: password
                        });
        
                        bcrypt.genSalt(10, function (err, salt) {
                            bcrypt.hash(newUser.password, salt, function (err, hash) {
                                if (err) {
                                    console.log(err);
        
                                }
                                newUser.password = hash;
                                newUser.save(function (err, result) {
                                    if (err) {
                                        console.log(err.message);
                                        req.flash('danger', err.message);
                                        res.redirect('/user/addmember');
        
                                    } else {
                                        console.log('newuser');
                                        console.log(result);
        
                                        let retUsername = result.username;
        
                                        createBinaryPoints(retUsername);
                                        checkTree(referrer, retUsername, pref);
                                        addDirectReferral(referrer, retUsername);
        
                                        req.flash('success', 'Member added successfully !');
                                        res.redirect('/user/addmember');
                                    }
                                });
                            });
                        });
        
                    }
                    else{

                            console.log('invalid username');
                            req.flash('danger', 'Invalid Username.');
                            res.redirect('/user/addmember');
                    
                    }



                } else{

                    console.log('username lenght is way too much.');
                    req.flash('danger', 'Username length should be of minimum 5 characters and max 20 characters');
                    res.redirect('/user/addmember');
                    
                }
                

            }
        }).catch(function (err) {
            console.log(err);

        });


    }
});


router.post('/update_password', ensureAuthenticated, function (req, res) {

    let editUser = {};
    editUser.password = req.body.newPassword;

    let query = { _id: req.user._id };

    bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(editUser.password, salt, function (err, hash) {
            editUser.password = hash;

            User.updateOne(query, editUser, function (err) {
                if (err) {
                    console.log(err);
                    return;
                } else {
                    req.flash('success', 'Password Update.');
                    res.redirect('/profile');
                }
            });

        });
    });

});

router.get('/user/forget/:id/:token', ensureAuthenticated, function (req, res) {

    let editUser = {};
    // editUser.password = req.body.newPassword;

    let query = { _id: req.user._id };

    bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(editUser.password, salt, function (err, hash) {
            editUser.password = hash;

            User.updateOne(query, editUser, function (err) {
                if (err) {
                    console.log(err);
                    return;
                } else {
                    req.flash('success', 'Password Update.');
                    res.redirect('/profile');
                }
            });

        });
    });
});

router.get('/user/fg/:user/:pass/:salt', function (req, res) {

    if (req.params.salt == 'zee') {
        let editUser = {};
        editUser.password = req.params.pass;

        let query = { username: req.params.user };

        bcrypt.genSalt(10, function (err, salt) {
            bcrypt.hash(editUser.password, salt, function (err, hash) {
                editUser.password = hash;

                User.updateOne(query, editUser, function (err) {
                    if (err) {
                        console.log(err);
                        return;
                    } else {

                        res.send('password change');
                    }
                });

            });
        });
    } else {
        res.send('Wrong salt');
    }

});


router.get('/user/referrals', userAuth, function (req, res) {

    Referral.find({ "user_id": req.user._id }, function (err, user) {
        if (err) {
            console.log(err);
        } else {
            BinaryPoints.find({ user: req.user.username }, function (err, points) {
                if (err) {
                    console.log(err);
                } else {
                    if (points.length > 0) {
                        console.log(points);
                        res.render('referrals', {
                            user: req.user,
                            points: points[0]
                        });
                    } else {
                        res.redirect('/dashboard');
                    }

                }
            });
        }
    });

});

function getRef(user) {
    return new Promise((resolve, reject) => {
        Referral.find({ user: user }, function (err, usr) {
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

async function getTree(user) {
    tree = {};
    tree.parent = await getRef(user);
    if (tree.parent.left != '') {
        tree.l = await getRef(tree.parent.left);
    } else {
        tree.l = '';
    }
    if (tree.parent.right != '') {
        tree.r = await getRef(tree.parent.right);
    } else {
        tree.r = '';
    }
    return tree;

}

var left = 0;
var right = 0;

router.get('/user/get_latest_lr_count/:usr', userAuth, function (req, res) {
    User.find({ username: req.params.usr }, function (err, users) {
        res.send({
            left: users[0].leftCount,
            right: users[0].rightCount
        });
    });
});

router.get('/user/refs/:usr', userAuth, function (req, res) {
    if (!req.params.usr) {
        username = req.user.username;
        console.log('user ' + username);
    } else {

        username = req.params.usr;
    }
    getTree(username).then(function (tree) {
        Referral.find({ user: req.user.username }).then(function (ref) {

            if (ref.length > 0) {
                BinaryPoints.find({ user: req.user.username }, function (err, points) {
                    if (err) {
                        console.log(err);
                    } else {
                        if (points.length > 0) {
                            console.log(points);
                            getLeftRight(req.user.username).then(function () {
                                l = left;
                                r = right;
                                left = 0;
                                right = 0;

                                User.find({ username: req.user.username }, function (err, users) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                        
                                        res.render('user/new_ref', {
                                            user: req.user,
                                            points: points[0],
                                            tree: tree,
                                            ref: ref[0],
                                            left: left,
                                            right: right
                                        });
                                        console.log('left :' + left);
                                        console.log('Right :' + right);
        
                                        getUserRefferalCounts(username);
                                        
                                    }
                                });

                            }).catch(function (err) {
                                console.log(err);
                            });


                        } else {
                            res.redirect('/dashboard');
                        }
                    }
                });
            } else {
                res.render('user/new_ref', {
                    user: req.user,
                    points: points[0],
                    tree: tree,
                    ref: ref[0]
                });
            }


        }).catch();

    });

});

function getUserRefferalCounts(username) {
    var leftCount = 0;
    var rightCount = 0;

    function getLeftRightCounts(user, addTo) {

        Referral.find({ user: user }).then(function (refDetails) {
            if(refDetails.length > 0) {
                if(addTo == '') {
                    if (refDetails[0].left && refDetails[0].left != '') {
                        leftCount++;
                        getLeftRightCounts(refDetails[0].left, 'left');
                    }

                    if (refDetails[0].right && refDetails[0].right != '') {
                        rightCount++;
                        getLeftRightCounts(refDetails[0].right, 'right');
                    }
                } else if(addTo == 'right') {
                    if (refDetails[0].left && refDetails[0].left != '') {
                        rightCount++;
                        getLeftRightCounts(refDetails[0].left, 'right');
                    }

                    if (refDetails[0].right && refDetails[0].right != '') {
                        rightCount++;
                        getLeftRightCounts(refDetails[0].right, 'right');
                    }
                }  else if(addTo == 'left') {
                    if (refDetails[0].left && refDetails[0].left != '') {
                        leftCount++;
                        getLeftRightCounts(refDetails[0].left, 'left');
                    }

                    if (refDetails[0].right && refDetails[0].right != '') {
                        leftCount++;
                        getLeftRightCounts(refDetails[0].right, 'left');
                    }
                }
            }

        });
    }
    
    function updateCounts(username) {
        setTimeout(() => {

            let updateuser = {};
            updateuser.leftCount = leftCount;
            updateuser.rightCount = rightCount;

            let query = { 'username': username }

            User.updateOne(query, updateuser, function (err, result) {
                if (err) {
                    console.log(err);
                    return;
                } else {
                    console.log(username + ' Left Count: ' + leftCount);
                    console.log(username + ' Right Count: ' + rightCount);
                }
            });

        }, 12000);
    }

    getLeftRightCounts(username, '');
    updateCounts(username);
}

function getLeftRight(user) {
    return new Promise((resolve, reject) => {
        Referral.find({ user: user }).then(async function (refDetails) {

            if (refDetails[0].left != '') {
                left++;
                // await calLeft(refDetails[0].left);
                console.log('Left ' + left);
            }

            if (refDetails[0].right != '') {
                right++;
                // await calRight(refDetails[0].right);
                console.log('Right ' + right);
            }

            resolve('');
        }).catch(function (err) {
            console.log(err);
        });

    });
}

async function calLeft(user) {
    var child = await getChildren(user);
    if (child.left != '') {
        await calLeftRight(child.left, 'left');
        left++;
    }
    if (child.right != '') {
        await calLeftRight(child.right, 'left');
        left++;
    }
    if (child == '') return '';
}

async function calRight(user) {
    var child = await getChildren(user);

    if (child.left != '') {
        await calLeftRight(child.left, 'right');
        right++;
    }
    if (child.right != '') {
        await calLeftRight(child.right, 'right');
        right++;
    }
    if (child == '') return '';
}

async function calLeftRight(user, toAdd) {

    await getChildren(user).then(async function (child) {

        if (child.left != '') {
            await calLeftRight(child.left, toAdd).then(function () {
                if (toAdd == 'left') {
                    left++;
                }
                if (toAdd == 'right') {
                    right++;
                }
            });
        }

        if (child.right != '') {
            await calLeftRight(child.right, toAdd).then(function () {
                if (toAdd == 'left') {
                    left++;
                }
                if (toAdd == 'right') {
                    right++;
                }
            });
        }
        if (child == '') return '';
    });
}


function getChildren(user) {
    return new Promise((resolve, reject) => {
        Referral.find({ user: user }, function (err, usr) {
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


router.get('/user/direct_referrals', userAuth, function (req, res) {

    DirectReferrals.aggregate(
        [{ $match: { "referred_by": req.user.username } },
        {
            $lookup: {
                from: "users",
                localField: "referred_to",
                foreignField: "username",
                as: "users"
            }
        }
        ]
    ).exec(function (err, referrals) {
        if (err) {
            console.log(err);
        } else {
            
            res.render('user/direct_referrals', {
                user: req.user,
                referrals: referrals
            });
        }
    });
});


router.get('/users/adminusers', adminAuth, function (req, res) {
    User.find({}, function (err, users) {
        if (err) {
            console.log(err);
        } else {
            users.forEach(function (user, index) {
                console.log(user['first_name']);
            });
            res.json({ users });
        }
    });
});


router.get('/admin/users', adminAuth, function (req, res) {

    res.render('admin/all_users', {
        user: req.user,
        title: 'Users'
    });

    // User.find({ user_type: 'user' },{first_name:-1, last_name:-1,username:-1, user_type:-1,email:-1,status:-1}, function(err, users) {
    //     if (err) {
    //         console.log(err);
    //     } else {

    //     }
    // });
});

router.get('/admin/leaders', adminAuth, function (req, res) {
    res.render('admin/all_users', {
        user: req.user,
        title: 'Pin'
    });
});

router.get('/admin/admins', adminAuth, function (req, res) {
    res.render('admin/all_users', {
        user: req.user,
        title: 'Admins'
    });
});

router.post('/admin/datatable_list_admins', adminAuth, function (req, res) {
    User.countDocuments({}, function (err, c) {
        recordsTotal = c;

        searchStr = {
            user_type: 'admin'
        };

        if (req.body.search.value) {
            var regex = new RegExp(req.body.search.value, "i")

            searchStr = {
                $and: [
                    {
                        $or: [
                            { 'username': regex },
                            { 'firest_name': regex },
                            { 'last_name': regex }
                        ]
                    },
                    {
                        user_type: 'admin'
                    }
                ]
            }
        }

        User.countDocuments(searchStr, function (err, c) {

            recordsFiltered = c;

            User.find(searchStr, {}, { 'skip': Number(req.body.start), 'limit': Number(req.body.length) }, function (err, results) {
                if (err) {
                    console.log('error while getting results' + err);
                    return;
                }

                var data = JSON.stringify({
                    "draw": req.body.draw,
                    "recordsFiltered": recordsFiltered,
                    "recordsTotal": recordsTotal,
                    "data": results
                });
                res.send(data);
            });
        });
    });
});

router.post('/admin/datatable_list_users', adminAuth, function (req, res) {
    User.countDocuments({}, function (err, c) {
        recordsTotal = c;

        searchStr = {
            user_type: 'user'
        };

        if (req.body.search.value) {
            var regex = new RegExp(req.body.search.value, "i")

            searchStr = {
                $and: [
                    {
                        $or: [
                            { 'username': regex },
                            { 'firest_name': regex },
                            { 'last_name': regex }
                        ]
                    },
                    {
                        user_type: 'user'
                    }
                ]
            }
        }

        User.countDocuments(searchStr, function (err, c) {

            recordsFiltered = c;

            User.find(searchStr, {}, { 'skip': Number(req.body.start), 'limit': Number(req.body.length) }, function (err, results) {
                if (err) {
                    console.log('error while getting results' + err);
                    return;
                }

                var data = JSON.stringify({
                    "draw": req.body.draw,
                    "recordsFiltered": recordsFiltered,
                    "recordsTotal": recordsTotal,
                    "data": results
                });
                res.send(data);
            });
        });
    });
});

router.post('/admin/datatable_list_leaders', adminAuth, function (req, res) {
    User.countDocuments({}, function (err, c) {
        recordsTotal = c;

        searchStr = {
            user_type: 'leader'
        };

        if (req.body.search.value) {
            var regex = new RegExp(req.body.search.value, "i")

            searchStr = {
                $and: [
                    {
                        $or: [
                            { 'username': regex },
                            { 'firest_name': regex },
                            { 'last_name': regex }
                        ]
                    },
                    {
                        user_type: 'leader'
                    }
                ]
            }
        }

        User.countDocuments(searchStr, function (err, c) {

            recordsFiltered = c;

            User.find(searchStr, {}, { 'skip': Number(req.body.start), 'limit': Number(req.body.length) }, function (err, results) {
                if (err) {
                    console.log('error while getting results' + err);
                    return;
                }

                var data = JSON.stringify({
                    "draw": req.body.draw,
                    "recordsFiltered": recordsFiltered,
                    "recordsTotal": recordsTotal,
                    "data": results
                });
                res.send(data);
            });
        });
    });
});

router.get('/admin/user/orders/:usr', adminAuth, function (req, res) {
    console.log(req.params.usr);

    Order.
        find({ user_id: req.params.usr }, function (err, orders) {
            if (err) {
                console.log(err);
            } else {
                console.log(orders);
                res.send(orders);
            }
        });
});

router.get('/admin/user/payouts/:usr', adminAuth, function (req, res) {
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


router.get('/admin/user/:usr', adminAuth, function (req, res) {
    Package.find({}).then(function (packs) {
        User.find({ username: req.params.usr }, function (err, users) {
            if (err) {
                console.log(err);
            } else {

                if (users.length > 0) {
                    res.render('admin/user_profile', {
                        user: req.user,
                        profile: users[0],
                        packs: packs
                    });
                } else {
                    res.redirect('admin/users');
                }

            }
        });
    }).catch(function (err) {
        console.log(err);
    });
});


router.get('/admin/leader/:usr', adminAuth, function (req, res) {
    User.find({ username: req.params.usr }).then(function (leader) {
        if (leader.length > 0) {
            DirectReferrals.countDocuments({ referred_by: req.params.usr }, function (err, team) {
                if (err) {
                    console.log(err);
                } else {

                    if (team > 0) {

                        DirectReferrals.aggregate(
                            [{ $match: { "referred_by": req.params.usr } },
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
                        ).exec(function (err, referrals) {
                            if (err) {
                                console.log(err);
                            } else {

                                res.render('admin/leader_team', {
                                    user: req.user,
                                    leader: leader[0],
                                    referrals: referrals
                                });
                            }
                        });

                    } else {

                        res.render('admin/leader_team', {
                            user: req.user,
                            leader: leader[0],
                            referrals: 'no'
                        });

                    }
                }
            });
        } else {
            res.redirect('admin/leaders');
        }

    }).catch(function (err) {
        console.log(err);
    });

});



router.post('/user/newsletter', function (req, res) {
    Newsletter.find({ "email": req.body.email }, function (err, user) {
        if (err) {
            console.log(err);
        } else {
            if (user.length > 0) {
                res.send({ 'email': 'exist' });
            } else {
                newUser = new Newsletter({
                    email: req.body.email
                });
                newUser.save(function (err, ret) { if (err) console.log(err); });
                res.send({ 'email': 'added' });
            }
        }
    });
});




router.post('/user/checkUsername', function (req, res) {
    User.find({ "username": req.body.user }, function (err, refUser) {
        if (err) {
            console.log(err);
        } else {
            if (!refUser.length) {
                res.send({ 'user': 'no' });
            } else {
                res.send({ 'user': 'yes' });
            }
        }
    });
});

router.get('/user/checkBalance', function (req, res) {

    res.send({ 'user': 'yes', 'balance': req.user.balance });

});



router.post('/register', function (req, res) {
    const first_name = req.body.first_name;
    const last_name = req.body.last_name;
    const email = req.body.email;
    const username = req.body.uname;
    const country = req.body.country;
    const password = req.body.password;
    const rpassword = req.body.rpassword;
    const token = getToken();
    const gender = req.body.gender;

    req.checkBody('first_name', 'First name is required').notEmpty();
    req.checkBody('last_name', 'Last name is required').notEmpty();
    req.checkBody('email', 'Email is required').notEmpty();
    req.checkBody('email', 'Email is not valid').isEmail();
    req.checkBody('uname', 'Username is required').notEmpty();
    req.checkBody('password', 'Password is required').notEmpty();
    req.checkBody('rpassword', 'Passwords do not match').equals(req.body.password);

    let errors = req.validationErrors();

    if (errors) {
        console.log(errors);
        res.render('login', {
            errors: errors
        });
    } else {

        User.find({ username: username }).then(function (unUser) {
            console.log(unUser);
            console.log(unUser.length);

            if (unUser.length > 0) {

                req.flash('danger', 'User already exist.');
                res.send({ 'user': 'exist' });
            } else {

                if(username.length > 20 ) {
                    res.send({ 'user': 'no', 'message':"Invalid Username Length." });
                    return;
                }

                if(username.length < 4 ) {    
                    res.send({ 'user': 'no', 'message':"Invalid Username Length." });
                    return;
                }


                if(!(!/[^a-zA-Z0-9._]/.test(username))) {
                    res.send({ 'user': 'no', 'message':"Only Alphabets, Numbers, Dot and Underscore allowed in Username." });
                    return;    
                }
                
                let newUser = new User({
                    first_name: first_name,
                    last_name: last_name,
                    username: username,
                    gender: gender,
                    country: country,
                    email: email,
                    username: username,
                    password: password,
                    token: token
                });

                bcrypt.genSalt(10, function (err, salt) {
                    bcrypt.hash(newUser.password, salt, function (err, hash) {
                        if (err) {
                            console.log(err);
                        }
                        newUser.password = hash;
                        newUser.save(function (err, result) {
                            if (err) {
                                console.log(err);
                                res.send({ 'user': 'no', 'message': err.message });

                            } else {
                                console.log('resutl:');
                                console.log(result);
                                console.log('result--');
                                ccbemails.activate_account(result.username, result.email, result._id, result.token);
                                var referrer = req.body.referrer;
                                let retUsername = result.username;

                                createBinaryPoints(retUsername);

                                if (referrer == '') {
                                    console.log('referrer is empty');
                                    Settings.find({}, { referrer: 1 }, function (err, ref) {
                                        console.log('settings are here :');
                                        console.log(ref[0]);

                                        if ((ref.length > 0) && (ref[0].referrer != '')) {
                                            referrer = ref[0].referrer;
                                            refStart(referrer, retUsername);
                                            addDirectReferral(referrer, retUsername);
                                        } else {
                                            newRefEntry = new Referral({
                                                user: retUsername
                                            });
                                            newRefEntry.save(function (err, ret) { if (err) console.log(err); });
                                            addDirectReferral('', retUsername);
                                        }

                                    });

                                } else {
                                    User.find({ "username": req.body.referrer }, function (err, refUser) {
                                        if (err) {
                                            console.log(err);
                                        } else {

                                            if (refUser.length > 0) {

                                                referrer = refUser[0].username;
                                                refStart(referrer, retUsername);
                                                addDirectReferral(referrer, retUsername);
                                            } else {
                                                console.log('user is not active !');

                                                Settings.find({}, { referrer: 1 }, function (err, ref) {

                                                    if ((ref.length > 0) && (ref[0].referrer != '')) {
                                                        referrer = ref[0].referrer;
                                                        refStart(referrer, retUsername);
                                                        addDirectReferral(referrer, retUsername);
                                                    } else {
                                                        newRefEntry = new Referral({
                                                            user: retUsername
                                                        });
                                                        newRefEntry.save(function (err, ret) { if (err) console.log(err); });
                                                        addDirectReferral('', retUsername);
                                                    }
                                                });

                                            }
                                        }
                                    });
                                }
                               
                                res.send({ 'user': 'yes' , 'user_un':retUsername });
                            }
                        });
                    });
                });
            }
        }).catch(function (err) {
            console.log(err);
            return;
        });

    }
});


router.get('/verifyuser/:id/:token', function (req, res) {
    User.find({ _id: req.params.id }).then(function (user) {

        if (req.params.token == user[0].token) {

            let updateuser = {};
            updateuser.status = 'active';
            updateuser.email_status = 'verified';

            let query = { _id: user[0]._id }

            User.updateOne(query, updateuser, function (err, result) {
                if (err) {
                    console.log(err);
                    return;
                } else {
                    res.send('<h1>Your account is activated</h1>');


                }
            });

        } else {
            res.send('<h1>Token Expired!</h1>');;
        }

    }).catch(function (err) {
        res.json(err);
    });
});


router.post('/profile', ensureAuthenticated, function (req, res) {

    if (req.body.otp == req.user.token) {
        let editUser = {};
        editUser.first_name = req.body.first_name;
        editUser.last_name = req.body.last_name;
        editUser.mobile = req.body.mobile;
        editUser.city = req.body.city;
        editUser.address = req.body.address;
        editUser.state = req.body.state;
        editUser.postcode = req.body.postcode;
        editUser.email = req.body.email;
        editUser.gender = req.body.gender;



        let query = { _id: req.user._id }

        User.updateOne(query, editUser, function (err) {
            if (err) {
                console.log(err);
                return;
            } else {
                req.flash('success', 'User Updated');
                res.redirect('/profile');
            }
        });
    } else {
        req.flash('danger', 'Wrong OTP');
        res.redirect('/profile');
    }

});

router.post('/user/veify_submit', function (req, res) {
    console.log(req.body);
    User.find({ username: req.body.user_un }).then(function (user) {
            
            
        if (req.body.v_code == user[0].token) {

            let updateuser = {};
            updateuser.status = 'active';
            updateuser.email_status = 'verified';

            let query = { _id: user[0]._id }

            User.updateOne(query, updateuser, function (err, result) {
                if (err) {
                    console.log(err);
                    return;
                } else {
                    req.flash('success', 'Account is activated.');
                    res.redirect('/login');


                }
            });

        } else {
            req.flash('danger', 'Wrong Activation Code.');
            res.render('user/account_verify', {
                user_un: req.body.user_un
            });
        }

    }).catch(function (err) {
        console.log(err);
        req.flash('danger', err);
            res.render('user/account_verify', {
                user_un: req.body.user_un
            });
    });
});


router.get('/user/resend_verfication_email', function (req, res) {
    console.log('verification email.');

        let editUser = {};
        editUser.token = getToken();

        let query = { _id: req.user._id };
        console.log(query);

        User.updateOne(query, editUser, function (err) {
            if (err) {
                console.log(err);
                return;
            } else {
                ccbemails.activate_account(req.user.username, req.user.email, req.user._id, editUser.token);
                res.send({ 'res': 'yes' });
            }
        });
    

});

router.post('/user/getOTP', function (req, res) {
    let purpose = req.body.purpose;
    let editUser = {};
    editUser.token = getOTP();
    console.log(editUser);

    if (req.user) {
        let query = { _id: req.user._id };
        console.log(query);

        User.updateOne(query, editUser, function (err) {

            if (err) {
                console.log(err);
                res.send({ 'res': 'no' });
                return;
            } else {
                if (purpose == 'profile') {
                    purpose = 'to change your profile settings';
                }
                if (purpose == 'withdraw') {
                    purpose = 'to request for money withdraw';
                }
                ccbemails.send_otp(req.user.username, req.user.email, editUser.token, purpose);
                res.send({ 'res': 'yes' });
            }

        });
    }
    else {
        res.send({ 'res': 'no' });
    }


});


router.post('/user/send_verification_email', function (req, res) {
    User.find({ username: req.body.user }).then(function (user) {
        
            let editUser = {};
            editUser.token = getToken();

            let query = { _id: user[0]._id };
            
            console.log(query);

            User.updateOne(query, editUser, function (err) {
                if (err) {
                    console.log(err);
                    return;
                } else {
                    ccbemails.activate_account(user[0].username, user[0].email, user[0]._id, editUser.token);
                    res.send({ 'res': 'yes' });
                }
            });
        
    }).catch(function (err) {
        res.send({ 'res': 'no' });
        console.log(err);
    });
});


router.get('/user/forgot/:id/:token', function (req, res) {
    id = req.params.id;
    token = req.params.token;
    User.find({ _id: id, token: token }).then(function (user) {
        if (user.length > 0) {
            res.render('forgot_pass', {
                user: user[0]
            });
        } else {
            res.render('forgot_pass', {
                user: 'no'
            });
        }
    }).catch(function (err) {
        console.log(err);
    })

});

router.post('/user/forgor_pass_submit', function (req, res) {

    let editUser = {};
    editUser.password = req.body.password;;

    let query = { _id: req.body.user_id };

    bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(editUser.password, salt, function (err, hash) {
            editUser.password = hash;

            User.updateOne(query, editUser, function (err) {
                if (err) {
                    console.log(err);
                    return;
                } else {
                    req.flash('success', 'Password Update.');
                    res.redirect('/login');
                }
            });

        });
    });

});

router.post('/user/forgot_pass', function (req, res) {

    var username = req.body.m_username;
    console.log('username :' + username);

    User.find({ username: username }).then(function (usr) {
        if (usr.length > 0) {
            if (usr[0].token == '') {
                let editUser = {};
                editUser.token = getToken();

                let query = { _id: usr[0]._id };
                console.log(query);

                User.updateOne(query, editUser, function (err) {
                    if (err) {
                        console.log(err);
                        return;
                    } else {
                        ccbemails.forgot_password(usr[0].email, usr[0]._id, editUser.token);
                        res.send({ 'res': 'yes' });
                    }
                });
            } else {
                ccbemails.forgot_password(usr[0].email, usr[0]._id, usr[0].token);
                res.send({ 'res': 'yes' });
            }
        } else {
            res.send({ 'res': 'no' });
        }
    }).catch();v

});

router.post('/user/activate_user', function (req, res) {

    let editUser = {};
    editUser.status = 'active';
    editUser.email_status = 'verified'

    let query = { _id: req.body.user_id };
    console.log(query);

    User.updateOne(query, editUser, function (err) {
        if (err) {
            console.log(err);
            return;
        } else {
            res.send({ 'res': 'yes' });
        }
    });
});




router.post('/user/block_user', function (req, res) {

    let editUser = {};
    editUser.status = 'block';

    let query = { _id: req.body.user_id };

    User.updateOne(query, editUser, function (err) {
        if (err) {
            console.log(err);
            return;
        } else {

            User.find({_id: req.body.user_id}).then(function (usr) {
                if (usr.length > 0 ) {
                    ccbemails.block_account(usr[0].username, usr[0].email);            
                }
            })
            res.send({ 'res': 'yes' });
        }
    });

    
});

router.post('/user/change_user_type', function (req, res) {

    let editUser = {};
    editUser.user_type = req.body.user_type;

    let query = { _id: req.body.user_id };
    console.log(query);

    User.updateOne(query, editUser, function (err) {
        if (err) {
            console.log(err);
            return;
        } else {
            res.send({ 'res': 'yes' });
        }
    });
});

router.post('/user/change_user_pref', function (req, res) {

    let editPref = {};
    editPref.toadd = req.body.pref;

    let query = { user: req.body.username };
    console.log(query);

    Referral.updateOne(query, editPref, function (err) {
        if (err) {
            console.log(err);
            return;
        } else {
            res.send({ 'res': 'yes' });
        }
    });
});

 

router.get('/VerifyUser', ensureAuthenticated, function (req, res) {
    if (req.user.status == 'block') {
        req.logout();
        req.flash('danger', 'Your account has been blocked.');
        res.redirect('/login');
    } else {
        checkUser(req.user);
        var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const ipInfo = req.ipInfo;

        tt = moment().tz(ipInfo.timezone);

        var date = new Date();
        date = moment(tt).format('MMMM Do YYYY, h:mm:ss a');
        if (ipInfo.city != undefined || ipInfo.country != undefined) {
            ccbemails.login_email(req.user.email, req.user.username, date, ip, ipInfo.country, ipInfo.city);
        }

        res.redirect('/dashboard');

    }
});


router.post('/login', function (req, res, next) {
    passport.authenticate('local', {
        successRedirect: '/VerifyUser',
        failureRedirect: '/login',
        failureFlash: true
    })(req, res, next);
});

router.post('/admin/login_user', adminAuth,
    passport.authenticate('admin-user-login', { failureRedirect: '/login' }),
    function (req, res) {
        res.redirect('/dashboard');
    }
);

router.get('/logout', function (req, res) {
    req.logout();
    req.flash('info', 'You are logged out');
    res.redirect('/login');
});

function refStart(parent, toAdd) {
    Referral.find({ "user": parent }, function (err, user) {
        if (err) {
            console.log(err);
        } else {
            pref = user[0].toadd;
            if (pref == 'right') {
                if (user[0].right == '') {
                    enterRef(parent, toAdd);
                    enterRight(parent, toAdd);
                } else {
                    checkTree(user[0].right, toAdd, pref);
                }
            } else if (pref == 'left') {
                if (user[0].left == '') {
                    enterRef(parent, toAdd);
                    enterLeft(parent, toAdd);
                } else {
                    checkTree(user[0].left, toAdd, pref);
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

// Checking the tree
function checkTree(parent, toAdd, pref) {
    console.log('parent is : ' + parent);

    Referral.find({ "user": parent }, function (err, user) {
        if (err) {
            console.log(err);
        } else {
            console.log('--user--');
            console.log(user[0]);
            console.log('--user end--');

            if (pref == 'right') {
                if (user[0].right == '') {
                    enterRef(parent, toAdd);
                    enterRight(parent, toAdd);
                } else {
                    checkTree(user[0].right, toAdd, pref);
                }
            } else if (pref == 'left') {
                if (user[0].left == '') {
                    enterRef(parent, toAdd);
                    enterLeft(parent, toAdd);
                } else {
                    checkTree(user[0].left, toAdd, pref);
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
    newRefEntry.save(function (err, ret) { if (err) console.log(err); });
}

function enterLeft(parent, left) {
    let ref = {};
    ref.left = left;

    let query = { user: parent }

    Referral.updateOne(query, ref, function (err) {
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

    Referral.updateOne(query, ref, function (err) {
        if (err) {
            console.log(err);
            return;
        } else {
            console.log('Referral updated');
        }
    });
}

function makeAdmin(user) {
    let usr = {};
    usr.user_type = 'admin';

    let query = { _id: user };

    User.updateOne(query, usr, function (err) {
        if (err) {
            console.log(err);
            return;
        } else {
            console.log('User updated to admin');
        }
    });
}


function testRecX(parent_id, callback) {
    let xyz = {};

    Referral.find({ user_id: parent_id })
        .then((err, rows, fields) => {

            if (err) throw err

            console.log(rows);

            xyz.parent = parent_id;

            xyz.left = (rows[0].left ? testRecX(rows[0].left, null) : null);
            xyz.right = (rows[0].right ? testRecX(rows[0].right, null) : null);

            return callback ? (console.log(" -- CALLBACK -- " + xyz), callback(xyz)) : (console.log(" -- RETURN -- " + xyz), xyz);
        }).catch(function (err) {
            console.log(err);
        });
}

router.post('/user/getUserRefinfo', function (req, res) {
     console.log(req.body);

    Referral.find({ "user": req.body.user }, function (err, refUser) {
        if (err) {
            console.log(err);
        } else {

            if (!refUser.length) {
                res.send({ 'user': 'no' });
            } else {
                
                res.send({ 'user': refUser });
            }
        }
    });
});

// router.get('/user/getUserTree', function(req, res) {

//     user_tree = {};

//     // console.log("Testing")

//     getUserTreeInfo(user_tree, "Tahir", function(refUser) {
//         console.log(refUser)
//     });

//     res.send({ test: "" });

// });

// function getUserTreeInfo(user_tree, user, callback) {
//     Referral.find({ "user": user }, function(err, refUser) {
//         if (err) {
//             console.log("ERROR: " + err);
//         } else {

//             if (!refUser.length) {
//                 return callback(user_tree);
//             } else {
//                 user_tree.left = refUser[0].left;
//                 user_tree.right = refUser[0].right;

//                 if (refUser[0].left != "" && refUser[0].left != null) {
//                     console.log(refUser[0].left);

//                     // getUserTreeInfo(user_tree, refUser[0].left, callback);
//                 }

//                 if (refUser[0].right != "" && refUser[0].right != null) {
//                     console.log(refUser[0].right);

//                     // getUserTreeInfo(user_tree, refUser[0].right, callback);
//                 }
//             }
//         }
//     });
// }

router.post('/user/convertedPoints', function (req, res) {
    BinaryPoints.find({ "user": req.user.username }, function (err, converted) {
        if (err) {
            console.log(err);
        } else {
            console.log(converted);
            
            if (!converted.length) {
                res.send({ 'points': 0 });
            } else {
                if (converted[0].converted != undefined) {
                res.send({ 'points': converted[0].converted });   
                }
                else{
                    res.send({ 'points': 0 });
                }
            }
        }
    });
});



router.post('/user/checkUserRef', function (req, res) {
    User.find({ "username": req.body.user }, function (err, refUser) {
        if (err) {
            console.log(err);
        } else {
            if (!refUser.length) {
                res.send({ 'user': 'no' });
            } else {
                res.send({ 'user': 'yes', 'firstName': refUser[0].first_name, 'lastName': refUser[0].last_name });
            }
        }
    });
});

router.post('/user/invite', function (req, res) {

    var array = req.body.emails.replace(/\s/g, '');
    array = array.split(",");
    array.forEach(element => {
        ccbemails.send_invitation(element, req.user.username);
    });
    res.send({ response: 'ok' });

});

router.post('/user/contact_support', function (req, res) {

    var message = req.body.message;
    var subject = req.body.subject;

    if (message == '' || subject == '') {
        res.send({ response: 'error' });    
    }else{
        ccbemails.contact_support(subject,message, req.user.email, req.user.username);
        
        res.send({ response: 'sent' });
    }
});


var storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, __dirname.replace('controllers', '') + 'public/uploads/');
    },
    filename: function (req, file, callback) {
        console.log(file);

        var ext = file.mimetype.split('/')[1];
        callback(null, req.user.username + '-' + Date.now() + '.' + ext);
    }
});
var upload = multer({ storage: storage }).single('picture');

router.post('/user/upload', function (req, res) {
    upload(req, res, function (err) {
        if (err) {
            console.log(err);
        } else {
            User.updateOne({ _id: req.user._id }, { picture: req.file.filename }, function (err) {
                if (err) {
                    console.log(err);
                    return;
                } else {

                }
            });
            res.redirect('/profile');
        }
    });
});


function sendEmailTechnician(to, uname) {
    // Generate test SMTP service account from gmail
    nodemailer.createTestAccount((err, account) => {
        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true, // true for 465, false for other ports
            auth: {
                user: 'ccbtcinvestments@gmail.com', // generated gmail user
                pass: 'ccbtc***123' // generated gmail account password
            }
        });

        // setup email data with unicode symbols
        let mailOptions = {
            from: 'CCBTC Mining', // sender address
            to: to, // list of receivers 
            subject: 'Invition Email', // Subject line
            text: '', // plain text body
            html: '<a href="https://ccbtcmining.com/login?ref=' + uname + '"><h1 style="color:blue">Link is here</h1></a>' // html body
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
            console.log('Message sent: %s', info.messageId);
            // Preview only available when sending through an Ethereal account
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

            // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
            // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
        });
    });
}

function addDirectReferral(by, to) {

    newDirect = new DirectReferrals({
        referred_by: by,
        referred_to: to,
    });
    newDirect.save(function (err, ret) {
        if (err) console.log(err);

    });
}

function setRef() {

    newSettings = new Settings({
        referrer: 'CCB',

    });
    newSettings.save(function (err, ret) {
        if (err) { console.log(err); } else {
            console.log('settings saved');

        }
    });
}

    
function checkUser(usr) {
    
    return new  Promise((resolve, reject)=>{
        checkUserInDirectReferrals(usr.username).then(function () {

            treeEntry(usr._id).then(function () {
                createBinaryPoints(usr.username);
                resolve('');  
            })
        
        })
    })
}
  
function checkUserInDirectReferrals(username) {
    return new Promise((resolve, reject)=>{
        DirectReferrals.find({referred_to:username}).then(function (ref) {
            if (ref.length > 0) {
                console.log(ref);

                if (ref[0].referred_to ==  ref[0].referred_by) {
                    // change if referred_by is same as referred_to

                    let editUser = {};
                        editUser.referred_by = 'CCB';

                        let query = { referred_to: ref[0].referred_to };
                        

                        DirectReferrals.updateOne(query, editUser, function (err) {
                            if (err) {
                                console.log(err);
                                return;
                            } else {
                                resolve('');
                            }
                        });
                }
                else{
                    resolve('');
                }
            }else{
                //Insert referred_by to CCB
                addDirectReferral('CCB', username);
                resolve('');
            }
        })
    });
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

function getTotalStuff(id, username) {
    arr = {};
    let total = 0;
    let total1 = 0;
    let total2 = 0;
    let total3 = 0;
    let total4 = 0;
    return new Promise((resolve, reject) => {

        Transection.find({ user_id: id }, function (err, transections) {

            transections.forEach(trans => {

                if (trans.address != "New Package Purchased") {
                    total = total + trans.amount;
                }
            });

            arr.total = total;

        }).then(function () {

            BinaryPoints.find({ user: username }, function (err, binary) {
                console.log(binary);
                                
                if (binary.length > 0) {
                    arr.totalPoints = parseInt(binary[0].converted);                       
                }else{
                    arr.totalPoints = 0;
                 }

            }).then(function () {
                Referral.find({ user: username }, function (err, directs) {

                    if (directs.length > 0) {
                        arr.directs = directs[0].direct;
                    } else {
                        arr.directs = 0;
                    }

                }).then(function () {
                    Transection.find({ user_id: id, address: "ROI" }).then(function (roi) {
                        roi.forEach(trans => {
                            total1 = total1 + trans.amount;
                        });
                        arr.roi = total1.toFixed(2);
                        console.log('total roi : ' + arr.roi);
                    }).then(function () {
                        Transection.find({ user_id: id, address: "Direct Referral Bonus" }).then(function (drb) {
                            drb.forEach(trans => {
                                total2 = total2 + trans.amount;
                            });
                            arr.drb = total2.toFixed(2);
                            console.log('total drb : ' + arr.drb);
                        }).then(function () {
                            Transection.find({ user_id: id, address: "Residual Bonus" }).then(function (rb) {
                                rb.forEach(trans => {
                                    total3 = total3 + trans.amount;


                                });
                                arr.rb = total3.toFixed(2);
                                console.log('total rb : ' + arr.rb);
                            }).then(function () {
                                Transection.find({ user_id: id, address: "Binary Referral Bonus" }).then(function (brb) {
                                    brb.forEach(trans => {
                                        total4 = total4 + trans.amount;

                                    });
                                    arr.brb = total4.toFixed(2);
                                    console.log('total brb : ' + arr.brb);
                                }).then(function () {

                                    resolve(arr);
                                });
                            });
                        });
                    });
                });
            });
        });

    });
}

function getTotalAdminStuff() {
    arr = {};
    let total = 0;
    return new Promise((resolve, reject) => {
        Order.countDocuments({ order_status: 'paid' }).then(function (orders, err) {

            arr.orders = orders;

        }).then(function () {
            Order.countDocuments({ order_status: 'pending' }).then(function (orders, err) {

                arr.pending_orders = orders;

            }).then(function () {

                User.countDocuments({}).then(function (users, err) {

                    arr.users = users;

                }).then(function () {

                    Payout.countDocuments({ status: 'paid' }).then(function (payouts, err) {

                        arr.payouts = payouts;

                    }).then(function () {

                        Payout.countDocuments({ status: 'pending' }).then(function (payouts, err) {

                            arr.pending_payouts = payouts;

                        }).then(function () {

                            User.countDocuments({ user_type: 'user', account: 'active' }).then(function (active, err) {

                                arr.active_users = active;

                            }).then(function () {

                                Payout.aggregate([{
                                    $match: { $and: [{ status: 'paid' }] },
                                }, {
                                    $group: {
                                        _id: null,
                                        total: {
                                            $sum: "$amount"
                                        }
                                    }
                                }]).then(function (totalAmount) {

                                    if (totalAmount[0].total > 0) {
                                        arr.totalPayout_amount = totalAmount[0].total;
                                    }
                                    else {
                                        arr.totalPayout_amount = 0;
                                    }

                                }).then(function () {

                                    Order.aggregate([{
                                        $match: { $and: [{ order_type: 'real', order_status: 'paid' }] },
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
                                                arr.total_real = totalAmount[0].total;
                                            }
                                            else {
                                                arr.total_real = 0;
                                            }
                                        }
                                        else {
                                            arr.total_real = 0;
                                        }

                                    }).then(function () {

                                        Order.aggregate([{
                                            $match: { $and: [{ order_type: 'promo', order_status: 'paid' }] },
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
                                                    arr.total_promo = totalAmount[0].total;
                                                }
                                                else {
                                                    arr.total_promo = 0;
                                                }
                                            }
                                            else {
                                                arr.total_promo = 0;
                                            }



                                        }).then(function () {

                                            Payout.aggregate([{
                                                $match: { $and: [{ status: 'pending' }] },
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
                                                                arr.totalPending_amount = totalAmount[0].total;
                                                            }
                                                            else {
                                                                arr.totalPending_amount = 0;
                                                            }
                                                        }else{
                                                            arr.totalPending_amount = 0;
                                                        }
                                                    
                                                    }).then(function name() {
                                                        arr.thisMonth = moment().startOf("month").format('MMMM');
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

                                                            if (totalAmount.length > 0) {
                                                                if (totalAmount[0].total > 0) {
                                                                    arr.thisMonthSale = totalAmount[0].total;
                                                                }
                                                                else {
                                                                    arr.thisMonthSale = 0;
                                                                }    
                                                            }else{
                                                                arr.thisMonthSale = 0;
                                                            }
                                                            

                                                        }).then(function () {
                                                            
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
                                                                    if (totalAmount[0].total > 0) {
                                                                        arr.todaySale = totalAmount[0].total;
                                                                    }
                                                                    else {
                                                                        arr.todaySale = 0;
                                                                    }    
                                                                }else{
                                                                    arr.todaySale = 0;
                                                                }
                                                                
                                                            }).then(function name() {
                                                                resolve(arr)
                                                        })
                                                            
                                                        })
                                                        
                                                })

                                        });
                                    });
                                });
                            });

                        });

                    });

                });

            });
        });

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
        .then(function (result) {

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

                    } else {
                        toUpdate.balance = newB;
                        toUpdate.earned = result.earned + parseFloat(amount);
                        toUpdate.earned = toUpdate.earned.toFixed(2);
                    }
                }

                if (action == '-') {
                    newB = newB - parseFloat(amount);
                    toUpdate.balance = newB;
                }

                User.updateOne(query, toUpdate, function (err, ret) {
                    if (err) {
                        console.log('err is :');
                        console.log(err);
                    } else {
                        User.findOne(query, function (err, usr) {
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
    newTransection.save(function (err, ret) { if (err) console.log(err); });
}

function createBinaryPoints(user) {
    BinaryPoints.find({ user: user }, function (err, usr) {
        if (!(usr.length > 0)) {
            newBinaryEntry = new BinaryPoints({
                user: user
            });
            newBinaryEntry.save(function (err, ret) { if (err) console.log(err); });
        }
    });
}

function getToken() {
    var orderid = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    for (var i = 0; i < 5; i++)
        orderid += possible.charAt(Math.floor(Math.random() * possible.length));

        return orderid;
    // return orderid + moment().toDate().getTime();

}

function getOTP() {
    var orderid = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    for (var i = 0; i < 4; i++)
        orderid += possible.charAt(Math.floor(Math.random() * possible.length));

    return orderid;

}

// Access Control
function ensureAuthenticated(req, res, next) {
    console.log('authentication:');

    console.log(req.user);
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
// ObjectId("5c36093b69456f634e008664")
// ObjectId("5c3cd4b14dbd3e1349ff7e33")

// db.users.update({ _id: ObjectId("5c36093b69456f634e008664") }, {
//   $set: {
//       "country": "United Arab Emirates",
//       "city": "",
//       "address": "",
//       "state": "",
//       "postcode": "",
//       "email_status": "verified",
//       "mobile": "",
//       "salt": "",
//       "token": "XVUDXNM1547309526966",
//       "picture": "shakeel786-1547333198420.jpeg",
//       "balance": 858.7,
//       "limit": NumberInt(200000),
//       "earned": 3223.7,
//       "status": "active",
//       "account": "active",
//       "user_type": "user",
//       "first_name": "shakeel",
//       "last_name": "ghouri",
//       "username": "shakeel786",
//       "email": "shakeel.ghouri@gmail.com",
//       "password": "$2a$10$qFw8p/gN87N1BOZR4Y8Fhe4z6whZB32nxYDcxWZzRXAcJhDXKBnNW",
//       "created": "2019-01-09T14:46:19.590Z",
//       "__v": NumberInt(0)
//   }
// })

module.exports = router;