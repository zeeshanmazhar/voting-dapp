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
        console.log('ballots' , ballots);
        res.render('admin/add_candidate' , {
            ballots : ballots
        });
    
    })
    
        
});

router.post('/add_candidate' , auth.adminAuth , function(req , res){

    User.findOne({c_id : req.body.c_id}).then(function(found){
        console.log('found' , found);
        if(found == null)
        {
            if(req.body.ballot != ''){
                var candidate = new User();
                candidate.ballot_id = req.body.ballot;
                candidate.name = req.body.name;
                candidate.c_id = req.body.c_id;
                candidate.c_symbol = req.body.c_symbol;
                candidate.user_type = 'candidate';

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

})


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
            var voter = new User();
            voter.name = req.body.name;
            voter.v_id = req.body.v_id;
            voter.cnic = req.body.cnic;
            voter.user_type = 'voter';

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