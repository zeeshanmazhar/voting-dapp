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

var Ballot = require('../models/ballot');




router.get('/all_ballots', auth.adminAuth, function (req, res) {
    Ballot.find({}).then(function (ballots) {
        res.render('admin/all_ballots',{ballots:ballots});        
    })    
});


router.get('/add_ballot', auth.adminAuth, function (req, res) {
    
    res.render('admin/add_ballot');        
        
});

router.post('/add_ballot' , auth.adminAuth , function(req , res){
    var ballot = new Ballot();
    ballot.title = req.body.title;
    
    //res.send(ballot);

    ballot.save((err , docs) => {
        if (err) {
            console.log(err);
            req.flash('danger', err);
        }
        else {
            req.flash('success', 'Ballot added successfully.');
            console.log('Ballot Added Successfully');
            res.redirect("/ballot/all_ballots");
        }
    })
})


router.get('/change_status/:status/:ballot_id', function (req, res) {

    //table_no = req.cookies['table_no'];
    console.log('ID' , req.params.ballot_id);
    console.log('Status' , req.params.status);

    Ballot.findOne({_id:req.params.ballot_id}).then(function (ballotStatus) {
            if (ballotStatus ) {

                //console.log('Service',ballotStatus);
                let updateBallotStatus = {};
                updateBallotStatus.status = req.params.status;

                let query = {};

                query._id = ballotStatus._id.toString();

                //console.log(updatePark, query);

                Ballot.updateOne( query,updateBallotStatus, function (err, result) {
                    if (err) {
                        console.log(err);
                        return;
                    } else {
                        console.log(result);

                    }
                });

            }else{
                console.log('Error');
            }
    });

    res.redirect("/ballot/all_ballots");
});

module.exports = router;