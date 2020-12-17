const express = require('express');
const router = express.Router();

var User = require('../models/user');
var Ballot = require('../models/ballot');
var Vote = require('../models/vote');

router.get('/all_ballots', function (req, res) {
    Ballot.find({status : 'active'}).then(function (ballots) {
        res.render('select_pole.ejs',{ballots:ballots});        
    })    
});


router.get('/ballot_candidate/:ballot_id' , function(req , res){
    console.log('ballot Id' , req.params.ballot_id);
    User.find({ballot_id : req.params.ballot_id }).then(function(candidates){
        console.log('candidate' , candidates);

        res.render('select_candidate.ejs' , {
            candidates : candidates,
            ballot_id : req.params.ballot_id
        })
    })
})

router.get('/add_cnic/:candidate_id/:ballot_id' , function(req , res){
    console.log('candidate_id' , req.params.candidate_id);
    console.log('ballot Id' , req.params.ballot_id);

    var candidate_id = req.params.candidate_id;
    var ballot_id = req.params.ballot_id;

    Ballot.findOne({_id : req.params.ballot_id}).then(function(ballot){
        console.log('ballot' , ballot.title);

        User.findOne({_id : req.params.candidate_id}).then(function(candidate){
            console.log('Candidate' , candidate.name);

            res.render('cast_vote' , {
                candidate_id : candidate_id,
                candidate_name : candidate.name,
                ballot_id : ballot_id,
                ballot_name : ballot.title
            })
        })
    })
  
})

router.post('/cast_vote', function (req, res) {

    console.log('cnic', req.body.cnic);

    User.findOne({ cnic: req.body.cnic }).then(function (got_user) {
        console.log('got_user', got_user);

        Vote.findOne({ voter_cnic: req.body.cnic }).then(function (find_user) {
            console.log('find_user', find_user);

            if (got_user != null) {
                if (find_user != null) {
                    req.flash('danger', 'Your Have already Casted Your Vote!.');
                    res.redirect("/dashboard/vote_casted");
                } else {
                    var vote = new Vote();
                    vote.voter_cnic = req.body.cnic;
                    vote.candidate_name = req.body.candidate_name;
                    vote.candidate_id = req.body.candidate_id;
                    vote.candidate_name = req.body.candidate_name;
                    vote.ballot_id = req.body.ballot_id;
                    vote.ballot_name = req.body.ballot_name;

                    //res.send(vote);
                    vote.save((err, docs) => {
                        if (err) {
                            console.log(err);
                            req.flash('danger', err);
                        }
                        else {
                            req.flash('success', 'Vote added successfully.');
                            console.log('Vote Added Successfully');
                            res.redirect("/dashboard/vote_casted");
                        }
                    })
                    
                }
                
            } else {
                req.flash('danger', 'This Voter is not registered.');
                res.redirect("/dashboard/add_cnic/" + req.body.candidate_id + "/" + req.body.ballot_id);
            }
        })
    })
})

router.get('/vote_casted' , function(req , res){
    res.render('done_vote');
})





module.exports = router;