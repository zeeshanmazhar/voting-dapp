const express = require('express');
const router = express.Router();

const fs = require('fs');
var moment = require("moment");

var User = require('../models/user');
var Ballot = require('../models/ballot');
var Vote = require('../models/vote');

ethers = require('ethers');
bytecode = fs.readFileSync(__dirname+'/../contracts/contracts_Voting_sol_Voting.bin').toString();
abi = JSON.parse(fs.readFileSync(__dirname+'/../contracts/contracts_Voting_sol_Voting.abi').toString());
provider = new ethers.providers.JsonRpcProvider();


router.get('/all_ballots', function (req, res) {
    var momentB = moment();
    Ballot.find({status : 'active', expire_date : {$gte : momentB}}).then(function (ballots) {
        //res.send(ballots[4].expire_date);
        //console.log('ballot', ballots);
        res.render('select_pole.ejs',{ballots:ballots});  
        //var date = moment(ballots[5].expire_date)
        //var now = moment();
        //res.send(ballots);

        // var momentA = moment(ballots[5].expire_date);
        // if (momentA > momentB) console.log('greater');
        // else if (momentA < momentB) console.log('less');
        // else console.log('equal');
    
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

router.post('/cast_vote', async function (req, res) {

            let voteHash = ''
            let _balot = await Ballot.findOne({_id:req.body.ballot_id})
            signer = provider.getSigner(0);
            let contract = new ethers.Contract(_balot.address, abi, signer);
            console.log(contract);

            // contract.totalVotesFor(ethers.utils.formatBytes32String(req.body.candidate_id)).then((f) => console.log(f))


    // check if Voter Exists
    User.findOne({ cnic: req.body.voter_cnic , v_id: req.body.voter_id }).then(function (got_user) {
        console.log('got_user', got_user);

        Vote.findOne({ voter_cnic: req.body.voter_cnic , voter_id : req.body.voter_id }).then(async function (find_user) {
            console.log('find_user', find_user);

            if (got_user != null) {
                if (find_user != null) {
                    req.flash('danger', 'Your Have already Casted Your Vote!.');
                    res.redirect("/dashboard/vote_casted");
                } else {

                    voteHash = await contract.voteForCandidate(ethers.utils.formatBytes32String( req.body.candidate_id))
                    console.log('vote hash', voteHash);

                    var vote = new Vote();
                    vote.voter_cnic = req.body.voter_cnic;
                    vote.voter_id = req.body.voter_id;
                    vote.candidate_name = req.body.candidate_name;
                    vote.candidate_id = req.body.candidate_id;
                    vote.candidate_name = req.body.candidate_name;
                    vote.ballot_id = req.body.ballot_id;
                    vote.ballot_name = req.body.ballot_name;
                    vote.hash = voteHash.hash;

                    //res.send(vote);

                    console.log('saving', vote);

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

router.get('/select_ballot', function (req, res) {
    Ballot.find({status : 'active'}).then(function (ballots) {
        res.render('admin/select_ballot.ejs',{ballots:ballots});        
    })    
});

router.get('/selected_ballot_candidate/:ballot_id' , function(req , res){
   
    User.find({ballot_id : req.params.ballot_id }).then(function(candidates){
        console.log('candidate' , candidates);
        
        Vote.find({}).then(function(votes){
            res.render('admin/ballot_candidate.ejs' , {
                candidates : candidates,
                votes : votes
            })

        })

        
    })
})

router.get('/get_votes', function (req,res) {

})


function castVote(ballotId, voterId, candId) {
    return new Promise((resolve, reject)=>{

        signer = provider.getSigner(0);
        factory = new ethers.ContractFactory(abi, bytecode, signer);

        factory.deploy(cands).then((c) => { 

        //    contract =  new ethers.Contract( c.address , abi , signer );
            //     let contract = new ethers.Contract(c.address, abi, signer);
            //     console.log(contract);

            //     console.log('====================================');
            //     console.log('');
            //     console.log('====================================');

            // contract.voteForCandidate(ethers.utils.formatBytes32String('5fe2ef310a9c3c06cdc9a255')).then((f) => {
                    
            //     console.log(f)

            // contract.totalVotesFor(ethers.utils.formatBytes32String('5fe2ef310a9c3c06cdc9a255')).then((f) => console.log(f))

            // })

            resolve(c);
            
        })


    })

}





module.exports = router;