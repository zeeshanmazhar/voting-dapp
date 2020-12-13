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
var twilio = require('twilio');


var auth = require('./includes/auth');

router.use(expressip().getIpInfoMiddleware);

var User = require('../models/user');
var Visitor = require('../models/visitors');

router.get('/test-api',function (req,res,next) {
    res.json({"message": "Welcome to EasyNotes application. Take notes quickly. Organize and keep track of all your notes."});
})

router.post('/add_visitor', function (req, res) {
    const mobile = req.body.mobile;
    const email = req.body.email;
    const name = req.body.name;

    Visitor.find({mobile:mobile}).then(function (visit) {
        if (visit.length > 0 ) {

            send_and_update_code(visit[0]._id,mobile);
                res.json({
                    "message": "Success.",
                    "status":200,
                    "data":visit[0]                       
                });
        }else{

            let newVisit = new Visitor({
                name: name,
                mobile: mobile,
                email: email
            });
        
            newVisit.save(function (err, result) {
                if (err) {
                    console.log(err.message);
                    res.json({
                            "message": "Error.",
                            "status":503,
                            "data":err.message                        
                        });
                } else {
                        send_and_update_code(result._id,mobile);
                        res.json({
                            "message": "Success.",
                            "status":200,
                            "data":result                       
                        });
                }
            });

        }
    })

    

});

function send_and_update_code(user_id,mobile) {
    return new Promise((resolve, reject)=>{

        generate_code().then(function (code) {

            let editUser = {};
                editUser.code = code;

                let query = { _id: user_id };
                console.log(query);

                Visitor.updateOne(query, editUser, function (err) {
                    if (err) {
                        console.log(err);
                        return;
                    } else {
                       send_code(mobile,code);
                        resolve();
                    }
                })
            
        })
        
})
}

function generate_code() {
    return new  Promise((resolve, reject)=>{
    var code = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    for (var i = 0; i < 4; i++)
        code += possible.charAt(Math.floor(Math.random() * possible.length));

     resolve(code);
    })
}  
 
 
// send_code('+971554480526','1122');
// send_code('+971543083963','1232');
// send_code('+971503853306','1111'); //kh
//  send_code('+971545380402','1111'); //shyma 
function send_code(mobile,code) {
    // var accountSid = 'AC40d3644a2f06b91b0b909cb4854454d3'; // Your Account SID from www.twilio.com/console
    // var authToken = 'cba2195315739f1feb0f2df94cc40575';   // Your Auth Token from www.twilio.com/console

    var accountSid = 'AC5a582f0ca9a7c40759d60f086f63b41e'; // Your Account SID from www.twilio.com/console
    var authToken = 'ac884b0b093f905f717d4b900d25bc04';   // Your Auth Token from www.twilio.com/console

    var client = new twilio(accountSid, authToken);
 
client.messages.create({  
    body: 'Zeeshan support Free Consultation! Get free PRO services in Dubai. Call: +971 50 385 3306 Visit: http://al-arabiyadubai.com',
    to: mobile,  // Text this number
    from:'+16463629588'
//    from: '+16786194524' // From a valid Twilio number
})
.then((message) => console.log(message));

        // client.messages
        //     .create({
        //         from: 'whatsapp:+16463629588',
        //         body: 'Hello there!',
        //         to: 'whatsapp:+971585812145'
        //     })
        // .then(message => console.log(message.sid));

}

module.exports = router;