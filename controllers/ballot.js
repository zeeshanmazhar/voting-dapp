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

const path = require('path');

ethers = require('ethers');
bytecode = fs.readFileSync(__dirname+'/../contracts/contracts_Voting_sol_Voting.bin').toString();
abi = JSON.parse(fs.readFileSync(__dirname+'/../contracts/contracts_Voting_sol_Voting.abi').toString());
provider = new ethers.providers.JsonRpcProvider();

var auth = require('./includes/auth');

router.use(expressip().getIpInfoMiddleware);

var Ballot = require('../models/ballot');
var User = require('../models/user');


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

router.get('/compile/:ballot_id', auth.adminAuth, function (req, res) {

    var cands = [];

    Ballot.findOne({_id:req.params.ballot_id}).then(function (_ballot) {

        User.find({user_type : 'candidate', ballot_id:req.params.ballot_id}).then(function (candidates) {

            if (candidates.length > 0) {

                candidates.forEach((c, index) => {

                    cands.push(ethers.utils.formatBytes32String( c._id.toString()));
                    
                    if(candidates.length-1== index){
    
                            compileContract(cands).then(function (_c) {
    
                                Ballot.findOneAndUpdate({_id: req.params.ballot_id},{address:_c.address},{ new: true }, (err, docs)=>{
                                        console.log(docs);
                                        req.flash('success', 'Contract deployed.');

                                    res.redirect('/ballot/all_ballots');
    
                                })
                            })
                    }
    
                });

            }else{
                req.flash('danger', 'Add some candidates for this ballot.');
                res.redirect('/ballot/all_ballots');
            }
           
          
        })    

    })
        
});


function compileContract(cands) {
    return new Promise((resolve, reject)=>{

        signer = provider.getSigner(0);
        factory = new ethers.ContractFactory(abi, bytecode, signer);

        factory.deploy(cands).then((c) => { 

        //    contract =  new ethers.Contract( c.address , abi , signer );
            //     let contract = new ethers.Contract(c.address, abi, signer);
            //     console.log(contract);

            // contract.voteForCandidate(ethers.utils.formatBytes32String('5fe2ef310a9c3c06cdc9a255')).then((f) => {
                    
            //     console.log(f)

            // contract.totalVotesFor(ethers.utils.formatBytes32String('5fe2ef310a9c3c06cdc9a255')).then((f) => console.log(f))

            // })

            resolve(c);
            
        })


    })

}

module.exports = router;