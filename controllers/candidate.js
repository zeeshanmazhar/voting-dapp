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

var auth = require('./includes/auth');

router.use(expressip().getIpInfoMiddleware);

var User = require('../models/user');
var Ballot = require('../models/ballot');


router.get('/all_candidates', auth.adminAuth, function (req, res) {
    User.find({user_type : 'candidate'}).then(function (candidates) {
        res.render('admin/all_candidates',{candidates:candidates});        
    })    
});

router.get('/add_candidate', auth.adminAuth, function (req, res) {

    Ballot.find({status : 'active'}).then(function(ballots)
    {
        //console.log('ballots' , ballots);
        res.render('admin/add_candidate' , {
            ballots : ballots
        });
    
    })
    
        
});

function getFileNames(files) {
    var arr = [];
    return new Promise((resolve, reject) => {
        if (!files) {
            return resolve([]);
        }
        files.forEach((file, key) => {
            arr.push(file.filename);
            if (files.length - 1 == key) {
                resolve(arr);
            }
        });
    })

}

var storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, __dirname.replace('controllers', '') + 'public/uploads/');
    },
    filename: function (req, file, callback) {

        var ext = file.mimetype.split('/')[1];
        callback(null, '-' + Date.now() + '.' + ext);
    }
});

const imageFilter = function (req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
        req.fileValidationError = 'Only image files are allowed!';
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

router.post('/add_new_candidate', auth.adminAuth, function(req, res){
    console.log('body', req.files);
    //res.send(req.body);
     var upload = multer({ storage: storage, fileFilter: imageFilter }).fields([{ name: 'c_image' }]);

     console.log(upload);
    // res.send(req.body);
    upload(req, res, function (err) {
        if (err) {
            console.log(err);
        }
        else {

            console.log(req.files);
            console.log('body', req.body);

            // getFileNames(req.files.c_image).then(function (images) {
            //     console.log('image' , images);
            //     res.send(images);
                
            // });

        }
    });

})

router.post('/add_candidate' , auth.adminAuth, function(req , res){

    var upload = multer({ storage: storage, fileFilter: imageFilter }).fields([{ name: 'c_image' }]);

    upload(req, res, function (err) {
        if (err) {
            console.log(err);
        }
        else {

            //console.log('body',req.body.c_id);
            console.log(req.files.c_image);
            
            getFileNames(req.files.c_image).then(function (images) {
                console.log('image' , images);

                User.findOne({c_id : req.body.c_id}).then(function(found){
                    console.log('found',found);

                    if(found == null){
                        if(req.body.ballot != '' || req.body.ballot != undefined){
                            var username = req.body.name + req.body.c_id;
                            username = username.replace(/\s/g, '');
                            //console.log('username' , username);

                            var email = req.body.name + req.body.c_id + '@example.com';
                            email = email.replace(/\s/g, '');
                            //console.log('email' , email);

                            var candidate = new User();
                            candidate.ballot_id = req.body.ballot;
                            candidate.name = req.body.name;
                            candidate.c_id = req.body.c_id;
                            candidate.c_symbol = req.body.c_symbol;
                            candidate.user_type = 'candidate';
                            candidate.username = username;
                            candidate.email = email;
                            candidate.c_image = images;

                            //res.send(candidate);

                            candidate.save((err, docs) => {
                                if (err) {
                                    console.log(err);
                                    req.flash('danger', err);
                                }
                                else {
                                    req.flash('success', 'Candidate added successfully.');
                                    console.log('Candidate Added Successfully');
                                    res.redirect("/candidate/all_candidates");
                                }
                            })

                        } else {
                            req.flash('danger', 'Select Ballot First.!');
                            res.redirect("/candidate/add_candidate");

                        }

                    } else {
                        req.flash('danger', 'Candidate already Exists.');
                        res.redirect("/candidate/add_candidate");

                    }
                })

                

               
                

            });

        }
    });


    //console.log('body', req.body);
    // User.find({c_id : req.body.c_id}).then(function(found){
    //     console.log('found' , found);
    //     if(found != null)
    //     {
    //         if(req.body.ballot != '' || req.body.ballot != undefined){
  
    //             console.log('name',req.body.name);
    //             console.log('id',req.body.c_id);
    //             console.log('ballot',req.body.ballot);
    //             var username = req.body.name + req.body.c_id;
    //             username = username.replace(/\s/g, '');
    //             //console.log('username' , username);
                
    //             var email = req.body.name + req.body.c_id + '@example.com';
    //             email = email.replace(/\s/g, '');
    //             //console.log('email' , email);

                
                
                
    //         } else {
    //             req.flash('danger', 'Select Ballot First.!');
    //             res.redirect("/candidate/add_candidate");

    //         }
            
    //     } else {
    //         req.flash('danger', 'Candidate already Exists.');
    //         res.redirect("/candidate/add_candidate");

    //     }
    // })

})

//Edit Candidate
router.get('/edit_candidate/:id', (req, res, next) => {
    console.log(req.params.id);
    User.findOneAndUpdate({_id: req.params.id},req.body, { new: true }, (err, docs)=>{

        //console.log('docs' , docs);

        Ballot.findOne({_id : docs.ballot_id}).then(function(ballot){

            //console.log('ballot' , ballot);

            res.render('admin/edit_candidate.ejs', 
            {
                candidate:docs,
                ballot : ballot 
            });
        })
        
        
    })
});

//Update Candidate
router.post('/update_candidate/:id', (req, res, next) => {
    
    User.findByIdAndUpdate({_id: req.params.id},req.body, (err)=>{
        if (err) {
            console.log(err);
            next(err);
            req.flash('danger', err);
        } else {
            req.flash('success', 'Candidate Updated successfully.');
            res.redirect('/candidate/all_candidates');
        }
    })
});

//Delete Candidate
router.get('/delete_candidate/:id',(req, res)=>{
    User.findByIdAndDelete({_id:req.params.id}, err=>{
        if(err){
            console.log(err);
        }else{
            req.flash('success', 'Candidate Deleted successfully.');
            res.redirect('/candidate/all_candidates');
        }
    });
});

router.get('/change_status/:status/:candidate_id', function (req, res) {

    console.log('ID' , req.params.candidate_id);
    console.log('Status' , req.params.status);

    User.findOne({_id:req.params.candidate_id}).then(function (_candidateStatus) {
            if (_candidateStatus ) {

                //console.log('Service',_candidateStatus);
                let updateCandidateStatus = {};
                updateCandidateStatus.status = req.params.status;

                let query = {};

                query._id = _candidateStatus._id.toString();

                //console.log(updatePark, query);

                User.updateOne( query,updateCandidateStatus, function (err, result) {
                    if (err) {
                        console.log(err);
                        return;
                    } else {
                        console.log(result);

                    }
                });

            }else{
                //res.redirect("/candidate/all_candidate");
                console.log('Error');
            }
    });

    res.redirect("/candidate/all_candidates");
});


router.get('/all_voters', auth.adminAuth, function (req, res) {
    User.find({user_type : 'voter'}).then(function (voters) {
        res.render('admin/all_voters',{voters:voters});        
    })    
});

router.get('/add_voter', auth.adminAuth, function (req, res) {

    res.render('admin/add_voter');
        
});

router.post('/add_voter' , auth.adminAuth , function(req , res){

    User.findOne({cnic : req.body.cnic}).then(function(check)
    {
        if(check == null)
        {
            var username = req.body.name + req.body.c_id;
            username = username.replace(/\s/g, '');
            //console.log('username', username);

            var email = req.body.name + req.body.c_id + '@example.com';
            email = email.replace(/\s/g, '');
            //console.log('email', email);


            var voter = new User();
            voter.name = req.body.name;
            voter.v_id = req.body.v_id;
            voter.cnic = req.body.cnic;
            voter.user_type = 'voter';
            voter.username = username;
            voter.email = email;

            //res.send(voter);

            voter.save((err, docs) => {
                if (err) {
                    console.log(err);
                    req.flash('danger', err);
                }
                else {
                    req.flash('success', 'Voter added successfully.');
                    console.log('Voter Added Successfully');
                    res.redirect("/candidate/all_voters");
                }
            })
        } else{
            req.flash('danger', 'Voter already Exists.');
            res.redirect("/candidate/add_voter");
        }
    })  
})

//Edit Voter
router.get('/edit_voter/:id', (req, res, next) => {
    console.log(req.params.id);
    User.findOneAndUpdate({_id: req.params.id},req.body, { new: true }, (err, docs)=>{

        //console.log('docs' , docs);

        res.render('admin/edit_voter.ejs',
            {
                voter: docs
            });        
        
    })
});

//Update Hotel
router.post('/update_voter/:id', (req, res, next) => {
    
    User.findByIdAndUpdate({_id: req.params.id},req.body, (err)=>{
        if (err) {
            console.log(err);
            next(err);
            req.flash('danger', err);
        } else {
            req.flash('success', 'Voter Updated successfully.');
            res.redirect('/candidate/all_voters');
        }
    })
});

//Delete Candidate
router.get('/delete_voter/:id',(req, res)=>{
    User.findByIdAndDelete({_id:req.params.id}, err=>{
        if(err){
            console.log(err);
        }else{
            req.flash('success', 'Voter Deleted successfully.');
            res.redirect('/candidate/all_voters');
        }
    });
});

router.get('/voter/change_status/:status/:voter_id', function (req, res) {

    console.log('ID' , req.params.candidate_id);
    console.log('Status' , req.params.status);

    User.findOne({_id:req.params.voter_id}).then(function (_voterStatus) {
            if (_voterStatus ) {

                //console.log('Service',_voterStatus);
                let updateVoterStatus = {};
                updateVoterStatus.status = req.params.status;

                let query = {};

                query._id = _voterStatus._id.toString();

                //console.log(updatePark, query);

                User.updateOne( query,updateVoterStatus, function (err, result) {
                    if (err) {
                        console.log(err);
                        return;
                    } else {
                        console.log(result);

                    }
                });

            }else{
                //res.redirect("/candidate/all_candidate");
                console.log('Error');
            }
    });

    res.redirect("/candidate/all_voters");
});


module.exports = router;