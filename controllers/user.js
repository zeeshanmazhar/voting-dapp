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

// var mdcoemails = require('./emails');

var auth = require('./includes/auth');

router.use(expressip().getIpInfoMiddleware);

 var User = require('../models/user');
 var Ballot = require('../models/ballot');
 
 

router.post('/admin/contacts/add', auth.adminAuth, function (req, res) {
    const names = req.body.names;
    const emails = req.body.emails;
    const numbers = req.body.numbers;

    names_array = names.split(",");
    numbers_array = numbers.split(",");
    emails_array = emails.split(",");

    console.log(names_array, numbers_array, emails_array );
    

//    console.log(email_array);

    if (emails_array.length ==1 && names_array.length ==1) {
        
        
            numbers_array.forEach(function (numb, index) {
                console.log(numb);
                
                nameToAdd = '';
                emailToAdd = '';
                
                addNumber(numb,nameToAdd, emailToAdd);        
        }); 
    }

    else if ((emails_array.length == numbers_array.length) || (names_array.length == numbers_array.length) ) {
            numbers_array.forEach(async function (num, index) {
                    nameToAdd = '';
                    emailToAdd = '';
                    if (names_array[index]!='') {
                        nameToAdd = names_array[index];
                    }

                    if (emails_array[index]!='') {
                        emailToAdd = emails_array[index];
                    }

                    await addNumber(num,nameToAdd, emailToAdd);        
            });            
    }
    
                console.log('All contacts are added.');
                    req.flash('success', 'All contacts are added.');
                    return  res.redirect('/admin/contacts/add');


        User.find({ username: username }).then(function (unUser) {
            if (unUser.length > 0) {
                req.flash('danger', 'Username already exist.');
                res.redirect('/admin/cafe/add');
            } else {

                if(username.length < 21 && username.length > 4 ) {
                    if(!/[^a-zA-Z0-9._]/.test(username)) {

                        let newUser = new User({
                            cafe_name: cafe_name,
                            username: username,
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
                                        res.redirect('/admin/cafe/add');
        
                                    } else {
                                        console.log('newuser');
                                        console.log(result);
        
                                        req.flash('success', 'Cafe added successfully !');
                                        res.redirect('/admin/cafe/add');
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


    
});

function addNumber(mobile, name, email){
    return new Promise((resolve, reject) => {     
        console.log('test1');
        validateNumber(mobile).then(function (ret) {
            console.log(ret); 
            if(ret){
                Contacts.find({mobile:ret}).then(function (n) {
                    
                    console.log(n.length);
                    
                    if (n.length<1) {
                        newContact = new Contacts({
                            mobile: ret,
                            name:name,
                            email:email
                        });
                        newContact.save(function (err, ret1) { if (err) console.log(err); console.log(ret1);
                         });
                    }
                })
            }
            resolve('');
        })

    });
}

function validateNumber(number){
    return new Promise((resolve, reject) => {     
        number = number.replace(' ', '');
        number = number.replace('-', '');

        if (number.substr(0, 5) === '00971' && number.length == 14 ) { 
                
                c_code = number.substr(0, 5);
                c_code = c_code.replace('00', '+');
                number = substr(number, 5, 14);
                number = c_code+number;  
                console.log('1 ',number);
                          
                resolve(number);

            }

            if (number.substr(0, 4) === '+971' && number.length == 13 ) { 
                console.log('2 ',number);
                resolve(number);
            }    

            if (number.substr(0, 2) === '05' && number.length == 10 ) { 

                c_code = number.substr(0, 2);
                c_code = c_code.replace('0', '+971');     
                number = number.substr(2, 10);
                number = c_code+number;
                
                console.log('3 ',number);

                resolve(number);
            }    

            resolve(false);
    });
}
 

router.get('/admin/visitors/all',auth.adminAuth, function (req, res) {
    Visitor.find({}).then(function (visitors) {
        res.render('admin/all_visitors.ejs',{visitors:visitors});        
    })    
}); 

router.get('/cafe/visitors/all',auth.userAuth, function (req, res) {
    Visitor.find({}).then(function (visitors) {
        res.render('admin/all_visitors.ejs',{visitors:visitors});        
    })    
});

router.get('/forgot-password', function (req, res) {
    res.render('user/forget');
}); 

router.post('/user/forgot-password', function (req, res) {

    var username = req.body.email;
    console.log('email :' + username);

    User.find({ email: username }).then(function (usr) {
        if (usr.length > 0) {
            
            console.log(usr);
            

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
                        // earnlyemails.forgot_password(usr[0].email, usr[0]._id, editUser.token);
                        req.flash('success', 'Email Sent.');
                        res.redirect('/login');
                    }
                });
            } else {
                // earnlyemails.forgot_password(usr[0].email, usr[0]._id, usr[0].token);
                req.flash('success', 'Email Sent.');
                res.redirect('/login');
            }
        } else {
            
            req.flash('danger', 'Wrong Email.');
                        res.redirect('/forgot-password');
        }
    }).catch();

});


router.get('/user/fg/:id/:token', function (req, res) {
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

router.get('/login', function (req, res) {
    
    res.render('user/login');
});


router.post('/login', function (req, res, next) {
    console.log('test 2');
    
    passport.authenticate('local', {
        successRedirect: '/dashboard',
        failureRedirect: '/login',
        failureFlash: true
    })(req, res, next);
});

router.get('/user/profile', auth.ensureAuthenticated, function (req, res) {
    res.render('user/profile', {
        user: req.user
    });
});

router.post('/profile', auth.ensureAuthenticated, function (req, res) {

    // if (req.body.otp == req.user.token) {
        if (true) {
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
                res.redirect('/user/profile');
            }
        });
    } else {
        req.flash('danger', 'Wrong OTP');
        res.redirect('/user/profile');
    }

});

router.post('/user/changepass', auth.ensureAuthenticated, function (req, res) {

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
                    res.redirect('/user/profile');
                }
            });

        });
    });
});


router.get('/dashboard',auth.ensureAuthenticated, function (req, res) {

    console.log('admin h', req.user);

    if (req.user.user_type == 'admin') {
        getTotalAdminStuff().then(function (counts) {
            return res.render('admin/admin_dashboard', {
                user: req.user,
                counts:counts
            });    
        })
        
    }else{

            res.render('user/user_dashboard',{user:req.user});        
    }

});



router.get('/admin/user/:usr', auth.adminAuth, function (req, res) {
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


router.get('/admin/user/orders/:usr', auth.adminAuth, function (req, res) {
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
                  //  ccbemails.block_account(usr[0].username, usr[0].email);            
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


router.get('/admin/users/admins', auth.adminAuth, function (req, res) {
    res.render('admin/all_users', {
        user: req.user,
        title: 'Admins'
    });
});
 
router.post('/admin/login_user', auth.adminAuth,
    passport.authenticate('admin-user-login', { failureRedirect: '/login' }),
    function (req, res) {
        res.redirect('/dashboard');
    }
);


async function activateAccount(user) {
    
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


router.get('/user/fg/:user/:pass/:salt', function (req, res) {

    if (req.params.salt == 'zee') {
        let editUser = {};
        editUser.password = req.params.pass;

        let query = { username: req.params.user };

        bcrypt.genSalt(10, function (err, salt) {
            bcrypt.hash(editUser.password, salt, function (err, hash) {
                editUser.password = hash;
                console.log(editUser);
                
                User.updateOne(query, editUser, function (err,rez) {
                    if (err) {
                        console.log(err);
                        return;
                    } else {
                        console.log(rez);
                        res.send('password change');
                    }
                });
            });
        });
    } else {
        res.send('Wrong salt');
    }

});


router.get('/logout', function (req, res) {
    req.logout();
    req.flash('info', 'You are logged out');
    res.redirect('/login');
});

function getTotalAdminStuff() {
    arr = {};
    let total = 0;
    return new Promise((resolve, reject) => {
        
        User.countDocuments({user_type : 'candidate' }).then(function (t_candidates, err) {

            arr.total_candidates = t_candidates;

        }).then(function () {

            User.countDocuments({ status: 'active' , user_type : 'candidate' }).then(function (active, err) {

                arr.active_candidates = active;

            }).then(function () {

                User.countDocuments({status:'deactive', user_type : 'candidate'}).then(function (deactive, err) {

                    arr.deactive_candidates = deactive;

                }).then(function(){

                    Ballot.countDocuments({}).then(function(t_ballots , err){

                        arr.total_ballots = t_ballots;
                        
                    }).then(function(){

                        Ballot.countDocuments({status:'active'}).then(function(active , err){

                            arr.active_ballots = active;
                        
                        }).then(function(){

                            Ballot.countDocuments({status:'deactive'}).then(function(deactive , err){

                                arr.deactive_ballots = deactive;
                            }).then(function () {

                                resolve(arr)
            
                            });
                            
                        });

                    });
                    
                });

            });
        });

    });
}


module.exports = router;