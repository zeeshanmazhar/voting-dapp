const express = require('express');
const router = express.Router();

const cron = require('node-cron');

const expressip = require('express-ip');
var twilio = require('twilio');


var auth = require('./includes/auth');

router.use(expressip().getIpInfoMiddleware);

var User = require('../models/user');
var Contacts = require('../models/contacts');
var Messages = require('../models/messages');
var Sent = require('../models/sent');

router.get('/admin/messages/compile', auth.adminAuth, function(req, res){
        
        res.render('admin/compile_message',{
            user: req.user
          });
     
  });


router.post('/admin/messages/compile', auth.adminAuth, function(req, res) {

    console.log(req.body);

    var title = req.body.title;
    var message = req.body.message;


    req.checkBody('title', 'Title is required').notEmpty();
    req.checkBody('message', 'Message is required').notEmpty();
    
    let errors = req.validationErrors();

    if (errors) {
        console.log(errors);
        res.render('admin/compile_message', {
            errors: errors,
            user: req.user
        });
    } else {

        let newMessage = new Messages({
            title: title,
            body: message,
            admin: req.user._id
        });
    
        newMessage.save(function(err, result) {
                    if (err) {
                        console.log(err);
                    } else {
                        
                        req.flash('success', 'Message is added.');
                        res.render('admin/compile_message', {
                            user: req.user
                        });
                    }
                });
        
    }
});

router.get('/admin/messages/compiled', auth.adminAuth, function(req, res){
    Messages.find({}).then(function (msgs) {
          console.log(msgs);
            
        res.render('admin/compiled_message',{
            msgs: msgs,
            user: req.user
          });
    
    })
});

router.get('/admin/messages/send', auth.adminAuth, function(req, res){
    Messages.find({}).then(function (msgs) {
          console.log(msgs);
            
        res.render('admin/send_message',{
            msgs: msgs,
            user: req.user
          });
    
    }) 
});

router.post('/admin/messages/send', auth.adminAuth, function(req, res){

    channel = req.body.channel;
    message = req.body.message;

    Contacts.find({status:'active'}).then(function (usrs) {
        usrs.forEach((usr, index) => {
            console.log(usr);

            setTimeout(function() {
                sendMsg(usr._id,message, channel);
            },
            10 * index);
        });

       // return res.send(usrs);
    })

    res.redirect('/admin/messages/send');
    
    // Messages.find({}).then(function (msgs) {
    //       console.log(msgs);
            
    //     res.render('admin/send_message',{
    //         msgs: msgs,
    //         user: req.user
    //       });
    
    // })
});


function sendMsg(user_id, msg_id,channel) {

    return new Promise((resolve, reject) => {    
        Sent.find({contact_id:user_id,message_id:msg_id, channel:channel}).then(function (recipent) {
            if (recipent.length<1) {

            let newSent = new Sent({contact_id:user_id,message_id:msg_id, channel:channel});
            
                newSent.save(function(err, result) {
                            if (err) {
                                console.log(err);
                            } else {console.log(result);
                             }
                        });
            }

            resolve();
        })
    })    
}


router.get('/admin/messages/sent/:msg_id', auth.adminAuth, function(req, res){

    let query = {message_id:req.params.msg_id};
    Messages.find({_id:req.params.msg_id}).then(function (msg) { 
        if (msg.length) {
                
                var searchQuery = Sent.find(query) 
                searchQuery.lean().exec(function (err, sents) {
                if (err) {
                    console.log(err);
                    return;
                }
                else{
                    var promises = sents.map( function(snt) {     
                    return Contacts.find({_id:snt.contact_id}).then(function(results){
                        if (results.length>0) {
                            console.log(results[0]);
                            
                            if (results[0].name!='') {
                                snt.user = results[0].name;                        
                                }

                            snt.mobile = results[0].mobile;
                            
                            return snt;    
                            }else{
                                return snt;
                            }   

                        });       
                        
                    });
                    console.log('here');
                    Promise.all(promises).then(function(results) {
                        
                        return  res.render('admin/veiw_sent',{
                                    user: req.user,
                                    msgs:results,
                                });
                    })
                }
            });        
        }
    
    }).catch(function (err) {
        return err;
    }) 
});
 

function checkAndSendMsg() {
    
    Sent.findOne({status:'pending'}).then(function (toSend) {
        if (toSend) {
            Messages.findOne({_id:toSend.message_id}).then(function (msg) {
                Contacts.findOne({_id:toSend.contact_id}).then(function (cntct) {
                    if (cntct) {
                        send_code(cntct.mobile, msg.body, toSend._id);                        
                    }
                });  
            });
            
        }else{console.log('no msg in queue.');
        }
        
    });
}


cron.schedule('*/1 * * * *', function() {
    console.log('working');
    
    checkAndSendMsg();
});

// send_code('+971554480526','1122');
// send_code('+971543083963','1232');
// send_code('+971503853306','1111'); //kh
//  send_code('+971545380402','1111'); //shyma 

function send_code(mobile,body, sent_id) {

    var accountSid = 'AC5a582f0ca9a7c40759d60f086f63b41e'; // Your Account SID from www.twilio.com/console
    var authToken = 'ac884b0b093f905f717d4b900d25bc04';   // Your Auth Token from www.twilio.com/console

    var client = new twilio(accountSid, authToken);
 
    client.messages.create({  
        body: body,
        to: mobile,  // Text this number
        from:'+16463629588'
    })
    .then(function(message){ 

        console.log(message);

        let editSent = {};

        if (message.status == 'queued' || message.status == 'sent' || message.status == 'accepted') {

            editSent.status = 'sent';

        }else{
            editSent.status = 'error';
        }

         editSent.log = JSON. stringify(message);   
        
        let query = { _id: sent_id };
                console.log(query);

                Sent.updateOne(query, editSent, function (err) {
                    if (err) {
                        console.log(err);
                        return;
                    } else {
                    return;
                    }
                });

    
    });

}

module.exports = router;