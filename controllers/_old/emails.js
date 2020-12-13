const express = require('express');
var nodemailer = require("nodemailer");
var moment = require("moment");
// let transporter = nodemailer.createTransport({
//     host: 'smtp.gmail.com',
//     port: 465,
//     secure: true, // true for 465, false for other ports
//     auth: {
//         user: 'no-reply@ccbtcmining.com', // generated gmail user
//         pass: 'uae***123' // generated gmail account password
//     },
//     tls: { rejectUnauthorized: false }
// });

let transporter = nodemailer.createTransport({
    host: 'mail.privateemail.com',
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: 'no-reply@ccbtcmining.com', // generated gmail user
        pass: 'ccbtcreply123' // generated gmail account password
    },
    tls: { rejectUnauthorized: false }
});


class ccb_emails {

    login_email(to, uname, date, ip, country, city) {
        // Generate test SMTP service account from gmail
        nodemailer.createTestAccount((err, account) => {
            // create reusable transporter object using the default SMTP transport


            // setup email data with unicode symbols
            let mailOptions = {
                from: '"CCB - Successful Login" <no-reply@ccbtcmining.com>', // sender address
                to: to, // list of receivers 
                subject: 'Successful Login from IP: ' + ip + ' - ' + date, // Subject line
                text: '', // plain text body
                html: 'Hello ' + uname + ', <br><br>' +
                    'You successfully logged in from this IP: <b>' + ip + '</b>.<br>' +

                    'Location: ' + city + ',' + country +

                    '<br><br>If you do not recognize this login, reset your password.' +
                    '<br><br>This email was sent from an unmonitored mailbox.' +

                    '<br>You are receiving this email because you have a CCB Mining account.' +
                    '<br>CCB Mining Corporation, 20 Lonos Street, Office 304, Egkomi 2406 Nicosia, Cyprus' +
                    '<br><br>Regards,' +

                    '<br><br>CCB Mining<br>' +

                    '<div style="font-weight:bold; color:#1f1f4d"><img style="width:100px" src="https://ccbtcmining.com/home/img/email-logo.png"/>' +

                    '<br><a href="https://www.ccbtcmining.com" style="font-size:20px;color:#1f1f4d">CCB Mining</a></div>'

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

    send_invitation(to, uname) {
        // Generate test SMTP service account from gmail
        nodemailer.createTestAccount((err, account) => {
            // create reusable transporter object using the default SMTP transport


            // setup email data with unicode symbols
            let mailOptions = {
                from: '"CCB - Invitation Email" <no-reply@ccbtcmining.com>', // sender address
                to: to, // list of receivers 
                subject: 'Invitation Email', // Subject line
                text: '', // plain text body
                html: 'Hello, <br>' +
                    'I found a great online earning system and you can join it too absolutely free.<br><br>' +

                    'Here is the link: https://ccbtcmining.com/login?ref=' + uname +

                    '<br><br>If clicking the link does not work you can copy the link into your browser window or type it there directly.' +
                    '<br><br>This email was sent from an unmonitored mailbox.' +

                    '<br>You are receiving this email because you have a CCB Mining account.' +
                    '<br>CCB Mining Corporation, 20 Lonos Street, Office 304, Egkomi 2406 Nicosia, Cyprus' +
                    '<br><br>Regards,' +

                    '<br><br>Your CCB Team<br>' +

                    '<div style="font-weight:bold; color:#1f1f4d"><img style="width:100px" src="https://ccbtcmining.com/home/img/email-logo.png"/>' +

                    '<a href="https://www.ccbtcmining.com" style="font-size:20px;color:#1f1f4d">CCB Mining</a></div>'

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

    leader_account_roi(to, username) {
        // Generate test SMTP service account from gmail
        nodemailer.createTestAccount((err, account) => {
            // create reusable transporter object using the default SMTP transport


            // setup email data with unicode symbols
            let mailOptions = {
                from: '"CCB - Leader Account Notification" <no-reply@ccbtcmining.com>', // sender address
                to: to, // list of receivers 
                subject: 'CCB - Leader Account Notification', // Subject line
                text: '', // plain text body
                html: 'Dear Valued Member, <br><br>' +

                    'CCB Management have decided to hold back your account (username: ' + username + ') ROI until the terms of your account have been met from your end.' +

                    'As you are aware you have been priviledged with a "Leader" account after special approval from CCB Management. Once the agreed amount of sales have been added by your direct reference your ROI will be activated as per norm from there on.' +

                    'If you may have any further queries please do not hesitate to contact us on <a href="mailto:contactus@ccbtcmining.com">contactus@ccbtcmining.com</a>' +
                    '<br><br>This email was sent from an unmonitored mailbox.' +

                    '<br>You are receiving this email because you have a CCB Mining account.' +
                    '<br>CCB Mining Corporation, 20 Lonos Street, Office 304, Egkomi 2406 Nicosia, Cyprus' +
                    '<br><br>Regards,' +

                    '<div style="font-weight:bold; color:#1f1f4d"><img style="width:100px" src="https://ccbtcmining.com/home/img/email-logo.png"/>' +

                    '<p style="margin:0px; font-size:14px;">CCB Management.</p>' +
                    '-----------------------------<br> ' +
                    '<a href="https://www.ccbtcmining.com" style="font-size:20px;color:#1f1f4d">CCB Mining</a></div>'
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

    activate_account1(username, to, id, token) {
        // Generate test SMTP service account from gmail
        nodemailer.createTestAccount((err, account) => {
            // create reusable transporter object using the default SMTP transport


            // setup email data with unicode symbols
            let mailOptions = {
                from: '"CCB - Account Verification" <no-reply@ccbtcmining.com>', // sender address
                to: to, // list of receivers 
                subject: 'CCB - ( ' + username + ' ) Account Verification', // Subject line
                text: '', // plain text body
                html: 'Hello ' + username + ', <br>' +
                    'Thank you for registering your CCB Mining account. To finally activate your account please click the following link.<br><br>' +

                    '<a target="_blank" href="https://ccbtcmining.com/verifyuser/' + id + '/' + token + '">' + 'https://ccbtcmining.com/verifyuser/' + id + '/' + token + '</a>' +

                    '<br><br>If clicking the link does not work you can copy the link into your browser window or type it there directly.' +
                    '<br><br>This email was sent from an unmonitored mailbox.' +

                    '<br>You are receiving this email because you have a CCB Mining account.' +
                    '<br>CCB Mining Corporation, 20 Lonos Street, Office 304, Egkomi 2406 Nicosia, Cyprus' +
                    '<br><br>Regards,' +

                    '<div style="font-weight:bold; color:#1f1f4d"><img style="width:100px" src="https://ccbtcmining.com/home/img/email-logo.png"/>' +

                    '<p style="margin:0px; font-size:14px;">CCB Account Dept.</p>' +
                    '-----------------------------<br> ' +
                    '<a href="https://www.ccbtcmining.com" style="font-size:20px;color:#1f1f4d">CCB Mining</a></div>'
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

    activate_account(username, to, id, token) {
        // Generate test SMTP service account from gmail
        nodemailer.createTestAccount((err, account) => {
            // create reusable transporter object using the default SMTP transport
            var date = new Date();
            date = moment(date).format('MMMM Do YYYY, h:mm:ss a');

            // setup email data with unicode symbols
            let mailOptions = {
                from: '"CCB - Verification Code" <no-reply@ccbtcmining.com>', // sender address
                to: to, // list of receivers 
                subject: 'CCB - ( ' + username + ' ) Verification Code - ' + date , // Subject line
                text: '', // plain text body
                html: 'Hello ' + username + ', <br>' +
                    'Thank you for registering your CCB Mining account. You can use given code for your account acctivation.<br><br>' +

                    '<h1>'+ token + '</h1>' +

                    '<br><br>This email was sent from an unmonitored mailbox.' +

                    '<br>You are receiving this email because you have a CCB Mining account.' +
                    '<br>CCB Mining Corporation, 20 Lonos Street, Office 304, Egkomi 2406 Nicosia, Cyprus' +
                    '<br><br>Regards,' +

                    '<div style="font-weight:bold; color:#1f1f4d"><img style="width:100px" src="https://ccbtcmining.com/home/img/email-logo.png"/>' +

                    '<p style="margin:0px; font-size:14px;">CCB Account Dept.</p>' +
                    '-----------------------------<br> ' +
                    '<a href="https://www.ccbtcmining.com" style="font-size:20px;color:#1f1f4d">CCB Mining</a></div>'
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

    block_account(username, to) {
        // Generate test SMTP service account from gmail
        nodemailer.createTestAccount((err, account) => {
            // create reusable transporter object using the default SMTP transport


            // setup email data with unicode symbols
            let mailOptions = {
                from: '"CCB - Account Notification" <no-reply@ccbtcmining.com>', // sender address
                to: to, // list of receivers 
                subject: 'CCB - ( ' + username + ' ) Account Notification', // Subject line
                text: '', // plain text body
                html: 'Dear ' + username + ', <br>' +
                    'As your account is in the roll out of operation, so we are blocking your account and in case we owe you something will send you an email after audit.<br><br>' +

                    'Most of things are communicated to you through your leaders and in case of ambiguity feel free to send us an email directly.' +

                    '<br><br>This email was sent from an unmonitored mailbox.' +

                    '<br>You are receiving this email because you have a CCB Mining account.' +
                    '<br>CCB Mining Corporation, 20 Lonos Street, Office 304, Egkomi 2406 Nicosia, Cyprus' +
                    '<br><br>Regards,' +

                    '<div style="font-weight:bold; color:#1f1f4d"><img style="width:100px" src="https://ccbtcmining.com/home/img/email-logo.png"/>' +

                    '<p style="margin:0px; font-size:14px;">CCB Account Dept.</p>' +
                    '-----------------------------<br> ' +
                    '<a href="https://www.ccbtcmining.com" style="font-size:20px;color:#1f1f4d">CCB Mining</a></div>'
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

    forgot_password(to, id, token) {
        // Generate test SMTP service account from gmail
        nodemailer.createTestAccount((err, account) => {
            // create reusable transporter object using the default SMTP transport


            // setup email data with unicode symbols
            let mailOptions = {
                from: '"CCB - Passsword Recover" <no-reply@ccbtcmining.com>', // sender address
                to: to, // list of receivers 
                subject: 'Recover Password', // Subject line
                text: '', // plain text body
                html: 'Hello, <br>' +
                    'This e-mail is in response to your recent request to recover a forgotten password. Password security features are in place to ensure the security of your profile information. To reset your password, please click the link below and follow the instructions provided.<br><br>' +

                    'https://ccbtcmining.com/user/forgot/' + id + '/' + token +

                    '<br><br>If clicking the link does not work you can copy the link into your browser window or type it there directly.' +
                    '<br><br>This email was sent from an unmonitored mailbox.' +

                    '<br>You are receiving this email because you have a CCB Mining account.' +
                    '<br>CCB Mining Corporation, 20 Lonos Street, Office 304, Egkomi 2406 Nicosia, Cyprus' +

                    '<br><br>Regards,' +

                    '<div style="font-weight:bold; color:#1f1f4d"><img style="width:100px" src="https://ccbtcmining.com/home/img/email-logo.png"/>' +

                    '<p style="margin:0px; font-size:14px;">CCB Account Dept.</p>' +
                    '-----------------------------<br> ' +
                    '<a href="https://www.ccbtcmining.com" style="font-size:20px;color:#1f1f4d">CCB Mining</a></div>'
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

    order_payment(to, username, order_id) {
        // Generate test SMTP service account from gmail
        nodemailer.createTestAccount((err, account) => {
            // create reusable transporter object using the default SMTP transport

            // setup email data with unicode symbols
            let mailOptions = {
                from: '"CCB - Payment Recieved" <no-reply@ccbtcmining.com>', // sender address
                to: to, // list of receivers 
                subject: 'CCB - Order# ' + order_id, // Subject line
                text: '', // plain text body
                html: 'Dear <b>' + username + '</b>, <br><br>' +
                    'Thank you for your active participation in our mining platform.' +
                    'Your payment against the selected mining package has been received and your account is under the process of activation.<br>' +

                    '<br>We hope you enjoy our bonus returns and keep spreading the word with your peers.<br>' +

                    '<br><br><br>This email was sent from an unmonitored mailbox.' +

                    '<br>You are receiving this email because you have a CCB Mining account.' +
                    '<br>CCB Mining Corporation, 20 Lonos Street, Office 304, Egkomi 2406 Nicosia, Cyprus<br><br>' +
                    'Sincerely,' +
                    '<div style="font-weight:bold; color:#1f1f4d"><img style="width:100px" src="https://ccbtcmining.com/home/img/email-logo.png"/>' +

                    '<p style="margin:0px; font-size:14px;">CCB Mining</p>' +
                    '-----------------------------<br> ' +
                    '<a href="https://www.ccbtcmining.com" style="font-size:20px;color:#1f1f4d">CCB Mining</a></div>'
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

    admin_order_payment(to, username, order_id , paid ) {
        // Generate test SMTP service account from gmail
        nodemailer.createTestAccount((err, account) => {
            // create reusable transporter object using the default SMTP transport

            // setup email data with unicode symbols
            let mailOptions = {
                from: '"CCB - Payment Recieved" <no-reply@ccbtcmining.com>', // sender address
                to: to, // list of receivers 
                subject: 'CCB - Order# ' + order_id +' Amount : '+paid, // Subject line
                text: '', // plain text body
                html: 'Dear <b>' + username + '</b>, <br><br>' +
                    'Thank you for your active participation in our mining platform.' +
                    'Your payment against the selected mining package has been received and your account is under the process of activation.<br>' +

                    '<br>We hope you enjoy our bonus returns and keep spreading the word with your peers.<br>' +

                    '<br><br><br>This email was sent from an unmonitored mailbox.' +

                    '<br>You are receiving this email because you have a CCB Mining account.' +
                    '<br>CCB Mining Corporation, 20 Lonos Street, Office 304, Egkomi 2406 Nicosia, Cyprus<br><br>' +
                    'Sincerely,' +
                    '<div style="font-weight:bold; color:#1f1f4d"><img style="width:100px" src="https://ccbtcmining.com/home/img/email-logo.png"/>' +

                    '<p style="margin:0px; font-size:14px;">CCB Mining</p>' +
                    '-----------------------------<br> ' +
                    '<a href="https://www.ccbtcmining.com" style="font-size:20px;color:#1f1f4d">CCB Mining</a></div>'
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

    order_approved(to, username, order_id) {
        // Generate test SMTP service account from gmail
        nodemailer.createTestAccount((err, account) => {
            // create reusable transporter object using the default SMTP transport

            // setup email data with unicode symbols
            let mailOptions = {
                from: '"CCB - Account Package Approved" <no-reply@ccbtcmining.com>', // sender address
                to: to, // list of receivers 
                subject: 'CCB - Order# ' + order_id, // Subject line
                text: '', // plain text body
                html: 'Dear <b>' + username + '</b>, <br><br>' +
                    '<b>Congratulations!</b> Your account package has been successfully validated and approved.<br>' +
                    'Just log in and monitor how your mining resources are being allocated everyday and browse through other important features as well.<br>' +

                    '<br>We hope you enjoy our bonus returns and keep spreading the word with the world around you.<br>' +

                    '<br><br><br>This email was sent from an unmonitored mailbox.' +

                    '<br>You are receiving this email because you have a CCB Mining account.' +
                    '<br>CCB Mining Corporation, 20 Lonos Street, Office 304, Egkomi 2406 Nicosia, Cyprus<br><br>' +
                    'Sincerely,' +
                    '<div style="font-weight:bold; color:#1f1f4d"><img style="width:100px" src="https://ccbtcmining.com/home/img/email-logo.png"/>' +

                    '<p style="margin:0px; font-size:14px;">CCB Mining</p>' +
                    '-----------------------------<br> ' +
                    '<a href="https://www.ccbtcmining.com" style="font-size:20px;color:#1f1f4d">CCB Mining</a></div>'
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

    payout_request(to, username, amount, address) {
        // Generate test SMTP service account from gmail
        nodemailer.createTestAccount((err, account) => {
            // create reusable transporter object using the default SMTP transport

            // setup email data with unicode symbols
            let mailOptions = {
                from: '"CCB - Payout Request" <no-reply@ccbtcmining.com>', // sender address
                to: to, // list of receivers 
                subject: 'CCB - Payout Request', // Subject line
                text: '', // plain text body
                html: 'Dear <b>' + username + '</b>, <br><br>' +
                    'Your request to withdraw ' + amount + '$ from your account at CCB Mining has been received.<br>' +
                    'You will receive your withdrawn amount in your blockchain wallet ( ' + address + ' ) once processed.<br>' +

                    '<br>If you have not requested this withdrawal kindly contact us back immediately on <a href="mailto:contactus@ccbtcmining.com">contactus@ccbtcmining.com</a>.<br>' +

                    '<br><br><br>This email was sent from an unmonitored mailbox.' +

                    '<br>You are receiving this email because you have a CCB Mining account.' +
                    '<br>CCB Mining Corporation, 20 Lonos Street, Office 304, Egkomi 2406 Nicosia, Cyprus<br><br>' +
                    'Sincerely,' +
                    '<div style="font-weight:bold; color:#1f1f4d"><img style="width:100px" src="https://ccbtcmining.com/home/img/email-logo.png"/>' +

                    '<p style="margin:0px; font-size:14px;">CCB Mining</p>' +
                    '-----------------------------<br> ' +
                    '<a href="https://www.ccbtcmining.com" style="font-size:20px;color:#1f1f4d">CCB Mining</a></div>'
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

    withdraw_amount(to, username, amount, balance, date) {
        // Generate test SMTP service account from gmail
        nodemailer.createTestAccount((err, account) => {
            // create reusable transporter object using the default SMTP transport


            // setup email data with unicode symbols
            let mailOptions = {
                from: '"CCB - Debit Transaction Alert" <no-reply@ccbtcmining.com>', // sender address
                to: to, // list of receivers 
                subject: 'CCB - Debit Transaction Alert', // Subject line
                text: '', // plain text body
                html: 'Dear <b>' + username + '</b>, <br><br>' +
                    '$' + amount + ' is Debited from your account with following details.<br>' +

                    '<br><br>Mode : <b>Credit to Blockchain address. </b>' +

                    '<br><br>Date : ' + date +

                    '<br><br>Balance : $' + balance + '<br>' +
                    '<br><br><br>This email was sent from an unmonitored mailbox.' +

                    '<br>You are receiving this email because you have a CCB Mining account.' +
                    '<br>CCB Mining Corporation, 20 Lonos Street, Office 304, Egkomi 2406 Nicosia, Cyprus' +
                    '<div style="font-weight:bold; color:#1f1f4d"><img style="width:100px" src="https://ccbtcmining.com/home/img/email-logo.png"/>' +

                    '<p style="margin:0px; font-size:14px;">CCB Finance Dept.</p>' +
                    '-----------------------------<br> ' +
                    '<a href="https://www.ccbtcmining.com" style="font-size:20px;color:#1f1f4d">CCB Mining</a></div>'
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

    send_otp(username, to, otp, perpose) {
        // Generate test SMTP service account from gmail
        nodemailer.createTestAccount((err, account) => {
            // create reusable transporter object using the default SMTP transport

            // setup email data with unicode symbols
            let mailOptions = {
                from: '"CCB - OTP Notification" <no-reply@ccbtcmining.com>', // sender address
                to: to, // list of receivers 
                subject: 'CCB - 3D-Secure OTP Notification', // Subject line
                text: '', // plain text body
                html: 'Dear <b>' + username + '</b>, <br><br>' +
                    'Your One Time Password (OTP) ' + perpose + ' is ' + otp + '. The code is valid for 10 minutes.<br>' +

                    '<br>If you have not requested this kindly contact us back immediately on <a href="mailto:contactus@ccbtcmining.com">contactus@ccbtcmining.com</a>.<br>' +

                    '<br><br><br>This email was sent from an unmonitored mailbox.' +

                    '<br>You are receiving this email because you have a CCB Mining account.' +
                    '<br>CCB Mining Corporation, 20 Lonos Street, Office 304, Egkomi 2406 Nicosia, Cyprus<br><br>' +
                    'Sincerely,' +
                    '<div style="font-weight:bold; color:#1f1f4d"><img style="width:100px" src="https://ccbtcmining.com/home/img/email-logo.png"/>' +

                    '<p style="margin:0px; font-size:14px;">CCB Mining</p>' +
                    '-----------------------------<br> ' +
                    '<a href="https://www.ccbtcmining.com" style="font-size:20px;color:#1f1f4d">CCB Mining</a></div>'
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
    

    president_message(username, to) {
        // Generate test SMTP service account from gmail
        nodemailer.createTestAccount((err, account) => {
            // create reusable transporter object using the default SMTP transport

            // setup email data with unicode symbols
            let mailOptions = {
                from: '"CCB Mining" <no-reply@ccbtcmining.com>', // sender address
                to: to, // list of receivers 
                subject: 'CCB - A Letter to '+username+' From The President', // Subject line
                text: '', // plain text body
                html: '<!doctype html><html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"> <head><meta charset="UTF-8"> <meta http-equiv="X-UA-Compatible" content="IE=edge"> <meta name="viewport" content="width=device-width, initial-scale=1"><title>CCB - A Letter From The President</title> <style type="text/css">p{margin:10px 0;padding:0;}table{border-collapse:collapse;}h1,h2,h3,h4,h5,h6{display:block;margin:0;padding:0;}img,a img{border:0;height:auto;outline:none;text-decoration:none;}body,#bodyTable,#bodyCell{height:100%;margin:0;padding:0;width:100%;}.mcnPreviewText{display:none !important;}#outlook a{padding:0;}img{-ms-interpolation-mode:bicubic;}table{mso-table-lspace:0pt;mso-table-rspace:0pt;}.ReadMsgBody{width:100%;}.ExternalClass{width:100%;}p,a,li,td,blockquote{mso-line-height-rule:exactly;}a[href^=tel],a[href^=sms]{color:inherit;cursor:default;text-decoration:none;}p,a,li,td,body,table,blockquote{-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;}.ExternalClass,.ExternalClass p,.ExternalClass td,.ExternalClass div,.ExternalClass span,.ExternalClass font{line-height:100%;}a[x-apple-data-detectors]{color:inherit !important;text-decoration:none !important;font-size:inherit !important;font-family:inherit !important;font-weight:inherit !important;line-height:inherit !important;}a.mcnButton{display:block;}.mcnImage,.mcnRetinaImage{vertical-align:bottom;}.mcnTextContent{word-break:break-word;}.mcnTextContent img{height:auto !important;}.mcnDividerBlock{table-layout:fixed !important;}body,#bodyTable,#templateFooter{background-color:#FAFAFA;}#bodyCell{border-top:0;}h1{color:#202020 !important;font-family:Helvetica;font-size:32px;font-style:normal;font-weight:normal;line-height:125%;letter-spacing:-1px;text-align:center;}h2{color:#202020 !important;font-family:Helvetica;font-size:26px;font-style:normal;font-weight:normal;line-height:125%;letter-spacing:-.75px;text-align:left;}h3{color:#202020 !important;font-family:Helvetica;font-size:18px;font-style:normal;font-weight:normal;line-height:125%;letter-spacing:-.5px;text-align:left;}h4{color:#202020 !important;font-family:Helvetica;font-size:16px;font-style:normal;font-weight:normal;line-height:125%;letter-spacing:normal;text-align:left;}#templatePreheader{background-color:#26ABE2;border-top:0;border-bottom:0;}.preheaderContainer .mcnTextContent,.preheaderContainer .mcnTextContent p{color:#FAFAFA;font-family:Helvetica;font-size:10px;line-height:125%;text-align:left;}.preheaderContainer .mcnTextContent a{color:#FAFAFA;font-weight:normal;text-decoration:underline;}#templateHeader{background-color:#FAFAFA;border-top:0;border-bottom:0;}.headerContainer .mcnTextContent,.headerContainer .mcnTextContent p{color:#202020;font-family:Helvetica;font-size:14px;line-height:150%;text-align:left;}.headerContainer .mcnTextContent a{color:#26ABE2;font-weight:normal;text-decoration:underline;}#templateBody{background-color:#FAFAFA;border-top:0;border-bottom:0;}.bodyContainer .mcnTextContent,.bodyContainer .mcnTextContent p{color:#202020;font-family:Helvetica;font-size:14px;line-height:150%;text-align:left;}.bodyContainer .mcnTextContent a{color:#26ABE2;font-weight:normal;text-decoration:underline;}#templateFooter{border-top:0;border-bottom:0;}.footerContainer .mcnTextContent,.footerContainer .mcnTextContent p{color:#202020;font-family:Helvetica;font-size:10px;line-height:125%;text-align:left;}.footerContainer .mcnTextContent a{color:#202020;font-weight:normal;text-decoration:underline;}@media only screen and (max-width: 480px){body,table,td,p,a,li,blockquote{-webkit-text-size-adjust:none !important;}}@media only screen and (max-width: 480px){body{width:100% !important;min-width:100% !important;}}@media only screen and (max-width: 480px){.templateContainer{max-width:600px !important;width:100% !important;}}@media only screen and (max-width: 480px){.mcnRetinaImage{max-width:100% !important;}}@media only screen and (max-width: 480px){.mcnImage{height:auto !important;width:100% !important;}}@media only screen and (max-width: 480px){.mcnCartContainer,.mcnCaptionTopContent,.mcnRecContentContainer,.mcnCaptionBottomContent,.mcnTextContentContainer,.mcnBoxedTextContentContainer,.mcnImageGroupContentContainer,.mcnCaptionLeftTextContentContainer,.mcnCaptionRightTextContentContainer,.mcnCaptionLeftImageContentContainer,.mcnCaptionRightImageContentContainer,.mcnImageCardLeftTextContentContainer,.mcnImageCardRightTextContentContainer,.mcnImageCardLeftImageContentContainer,.mcnImageCardRightImageContentContainer{max-width:100% !important;width:100% !important;}}@media only screen and (max-width: 480px){.mcnBoxedTextContentContainer{min-width:100% !important;}}@media only screen and (max-width: 480px){.mcnImageGroupContent{padding:9px !important;}}@media only screen and (max-width: 480px){.mcnCaptionLeftContentOuter .mcnTextContent,.mcnCaptionRightContentOuter .mcnTextContent{padding-top:9px !important;}}@media only screen and (max-width: 480px){.mcnImageCardTopImageContent,.mcnCaptionBottomContent:last-child .mcnCaptionBottomImageContent,.mcnCaptionBlockInner .mcnCaptionTopContent:last-child .mcnTextContent{padding-top:18px !important;}}@media only screen and (max-width: 480px){.mcnImageCardBottomImageContent{padding-bottom:9px !important;}}@media only screen and (max-width: 480px){.mcnImageGroupBlockInner{padding-top:0 !important;padding-bottom:0 !important;}}@media only screen and (max-width: 480px){.mcnImageGroupBlockOuter{padding-top:9px !important;padding-bottom:9px !important;}}@media only screen and (max-width: 480px){.mcnTextContent,.mcnBoxedTextContentColumn{padding-right:18px !important;padding-left:18px !important;}}@media only screen and (max-width: 480px){.mcnImageCardLeftImageContent,.mcnImageCardRightImageContent{padding-right:18px !important;padding-bottom:0 !important;padding-left:18px !important;}}@media only screen and (max-width: 480px){.mcpreview-image-uploader{display:none !important;width:100% !important;}}@media only screen and (max-width: 480px){h1{font-size:24px !important;line-height:125% !important;}}@media only screen and (max-width: 480px){h2{font-size:20px !important;line-height:125% !important;}}@media only screen and (max-width: 480px){h3{font-size:18px !important;line-height:125% !important;}}@media only screen and (max-width: 480px){h4{font-size:16px !important;line-height:125% !important;}}@media only screen and (max-width: 480px){.mcnBoxedTextContentContainer .mcnTextContent,.mcnBoxedTextContentContainer .mcnTextContent p{font-size:18px !important;line-height:125% !important;}}@media only screen and (max-width: 480px){#templatePreheader{display:block !important;}}@media only screen and (max-width: 480px){.preheaderContainer .mcnTextContent,.preheaderContainer .mcnTextContent p{font-size:14px !important;line-height:115% !important;}}@media only screen and (max-width: 480px){.headerContainer .mcnTextContent,.headerContainer .mcnTextContent p{font-size:18px !important;line-height:125% !important;}}@media only screen and (max-width: 480px){.bodyContainer .mcnTextContent,.bodyContainer .mcnTextContent p{font-size:18px !important;line-height:125% !important;}}@media only screen and (max-width: 480px){.footerContainer .mcnTextContent,.footerContainer .mcnTextContent p{font-size:14px !important;line-height:115% !important;}}</style></head> <body leftmargin="0" marginwidth="0" topmargin="0" marginheight="0" offset="0"> <center> <table align="center" border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" id="bodyTable"> <tr> <td align="center" valign="top" id="bodyCell" style="padding-bottom:40px;"> <table border="0" cellpadding="0" cellspacing="0" width="100%"> <tr> <td align="center" valign="top"> <table border="0" cellpadding="0" cellspacing="0" width="100%" id="templatePreheader"> <tr> <td align="center" valign="top"> <table border="0" cellpadding="0" cellspacing="0" width="640" class="templateContainer"> <tr> <td valign="top" class="preheaderContainer" style="padding-top:9px; padding-bottom:9px;"><table border="0" cellpadding="0" cellspacing="0" width="100%" class="mcnTextBlock" style="min-width:100%;"> <tbody class="mcnTextBlockOuter"> <tr> <td valign="top" class="mcnTextBlockInner" style="padding-top:9px;"> <table align="left" border="0" cellpadding="0" cellspacing="0" style="max-width:100%; min-width:100%;" width="100%" class="mcnTextContentContainer"> <tbody><tr> <td valign="top" class="mcnTextContent" style="padding: 0px 18px 9px; text-align: center;"> <a target="_blank">CCB Mining</a> </td></tr></tbody></table> </td></tr></tbody></table></td></tr></table> </td></tr></table> </td></tr><tr> <td align="center" valign="top"> <table border="0" cellpadding="0" cellspacing="0" width="100%" id="templateHeader"> <tr> <td align="center" valign="top"> <table border="0" cellpadding="0" cellspacing="0" width="640" class="templateContainer"> <tr> <td valign="top" class="headerContainer" style="padding-top:9px; padding-bottom:9px;"><table border="0" cellpadding="0" cellspacing="0" width="100%" class="mcnImageBlock" style="min-width:100%;"> <tbody class="mcnImageBlockOuter"> <tr> <td valign="top" style="padding:9px" class="mcnImageBlockInner"> <table align="left" width="100%" border="0" cellpadding="0" cellspacing="0" class="mcnImageContentContainer" style="min-width:100%;"> <tbody><tr> <td class="mcnImageContent" valign="top" style="padding-right: 9px; padding-left: 9px; padding-top: 0; padding-bottom: 0; text-align:center;"> <a href="https://ccbtcmining.com/home/img/logo.png" title="" class="" target="_blank"> <img align="center" alt="" src="https://gallery.mailchimp.com/572cb2ced5f9e4d1a9c596ea2/images/56a84f56-45ff-41b2-8eac-88f0a72439cc.png" width="200" style="max-width:200px; padding-bottom: 0; display: inline !important; vertical-align: bottom;" class="mcnImage"> </a> </td></tr></tbody></table> </td></tr></tbody></table><table border="0" cellpadding="0" cellspacing="0" width="100%" class="mcnTextBlock" style="min-width:100%;"> <tbody class="mcnTextBlockOuter"> <tr> <td valign="top" class="mcnTextBlockInner" style="padding-top:9px;"> <table align="left" border="0" cellpadding="0" cellspacing="0" style="max-width:100%; min-width:100%;" width="100%" class="mcnTextContentContainer"> <tbody><tr> <td valign="top" class="mcnTextContent" style="padding-top:0; padding-right:18px; padding-bottom:9px; padding-left:18px;"> <br><h1>A Letter From The President</h1> </td></tr></tbody></table> </td></tr></tbody></table></td></tr></table> </td></tr></table> </td></tr><tr> <td align="center" valign="top"> <table border="0" cellpadding="0" cellspacing="0" width="100%" id="templateBody"> <tr> <td align="center" valign="top"> <table border="0" cellpadding="0" cellspacing="0" width="640" class="templateContainer"> <tr> <td valign="top" class="bodyContainer" style="padding-top:9px; padding-bottom:9px;"><table border="0" cellpadding="0" cellspacing="0" width="100%" class="mcnTextBlock" style="min-width:100%;"> <tbody class="mcnTextBlockOuter"> <tr> <td valign="top" class="mcnTextBlockInner" style="padding-top:9px;"> <table align="left" border="0" cellpadding="0" cellspacing="0" style="max-width:100%; min-width:100%;" width="100%" class="mcnTextContentContainer"> <tbody><tr> <td valign="top" class="mcnTextContent" style="padding-top:0; padding-right:18px; padding-bottom:9px; padding-left:18px;"> <h3>Dear '+username+',</h3> </td></tr></tbody></table> </td></tr></tbody></table><table border="0" cellpadding="0" cellspacing="0" width="100%" class="mcnTextBlock" style="min-width:100%;"> <tbody class="mcnTextBlockOuter"> <tr> <td valign="top" class="mcnTextBlockInner" style="padding-top:9px;"> <table align="left" border="0" cellpadding="0" cellspacing="0" style="max-width:100%; min-width:100%;" width="100%" class="mcnTextContentContainer"> <tbody><tr> <td valign="top" class="mcnTextContent" style="padding-top:0; padding-right:18px; padding-bottom:9px; padding-left:18px;"> As the 1st tenure successfully comes to an End, I would like to take the opportunity to thank you, CCB MINING loyal supporters, for your continued commitment to experiencing the difference with our powerful Packages and Profits.<br><br>We have learned a lot from your feedback this year, and from the countless surveys and polls, CCB Mining has conducted. I have learned that you arere a leader in your industries. Your Sales Skills are both groundbreaking and wave-making. I have learned that streamlining your company communication efforts is your #1 priority. And for a limited period of 15 Days, we are giving you a promotion to utilize <strong>50% on vouchers</strong>, and in addition, you will get 10% worth of <strong>Coins</strong> on purchase of every new package.<br><br>I hope that our tools and solutions have improved the way you do business this year. I hope that our around-the-clock support team has impressed you with their knowledge and friendliness. I hope that you have taken advantage of our International Meet &amp; Greet and free whitepapers. If not, I hope you will get involved in the Coming Malaysia Promotion, and I look forward to hearing your feedback.<br><br>Follow us on Insta at <a href="https://instagram.com/ccbmining">@CCBmining</a>&nbsp;and let us know how we are doing.<br><br>Thanks for a great year.<br><br><br>Sincerely,<br><br>Andrew Harniess<br><em>President, CCB MINING</em><br>&nbsp; </td></tr></tbody></table> </td></tr></tbody></table></td></tr></table> </td></tr></table> </td></tr><tr> <td align="center" valign="top"> <table border="0" cellpadding="0" cellspacing="0" width="100%" id="templateFooter"> <tr> <td align="center" valign="top"> <table border="0" cellpadding="0" cellspacing="0" width="640" class="templateContainer"> <tr> <td valign="top" class="footerContainer" style="padding-top:9px; padding-bottom:9px;"><table border="0" cellpadding="0" cellspacing="0" width="100%" class="mcnDividerBlock" style="min-width:100%;"> <tbody class="mcnDividerBlockOuter"> <tr> <td class="mcnDividerBlockInner" style="min-width: 100%; padding: 18px 18px 36px;"> <table class="mcnDividerContent" border="0" cellpadding="0" cellspacing="0" width="100%" style="min-width: 100%;border-top: 1px solid #DDDDDD;"> <tbody><tr> <td> <span></span> </td></tr></tbody></table><!-- <td class="mcnDividerBlockInner" style="padding: 18px;"> <hr class="mcnDividerContent" style="border-bottom-color:none; border-left-color:none; border-right-color:none; border-bottom-width:0; border-left-width:0; border-right-width:0; margin-top:0; margin-right:0; margin-bottom:0; margin-left:0;"/>--> </td></tr></tbody></table><table border="0" cellpadding="0" cellspacing="0" width="100%" class="mcnTextBlock" style="min-width:100%;"> <tbody class="mcnTextBlockOuter"> <tr> <td valign="top" class="mcnTextBlockInner" style="padding-top:9px;"> <table align="left" border="0" cellpadding="0" cellspacing="0" style="max-width:100%; min-width:100%;" width="100%" class="mcnTextContentContainer"> <tbody><tr> <td valign="top" class="mcnTextContent" style="padding-top:0; padding-right:18px; padding-bottom:9px; padding-left:18px;"> <em>Copyright © 2019 CCB Mining, All rights reserved.</em> </td></tr></tbody></table> </td></tr></tbody></table></td></tr></table> </td></tr></table> </td></tr></table> </td></tr></table> </center> </body></html>'
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


    pointCal(to) {
        // Generate test SMTP service account from gmail
        nodemailer.createTestAccount((err, account) => {
            // create reusable transporter object using the default SMTP transport

            // setup email data with unicode symbols
            let mailOptions = {
                from: '"CCB" <no-reply@ccbtcmining.com>', // sender address
                to: to, // list of receivers 
                subject: 'points', // Subject line
                text: '', // plain text body
                html: 'Hello, <br>' +
                    'points are calcluated'
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

    contact_support(subject, message, email, username) {
        // Generate test SMTP service account from gmail
        nodemailer.createTestAccount((err, account) => {
            // create reusable transporter object using the default SMTP transport

            // setup email data with unicode symbols
            let mailOptions = {
                from: 'CCB Support <no-reply@ccbtcmining.com>', // sender address
                to: 'support@ccbtcmining.com', // list of receivers 
                subject: subject+' - '+username, // Subject line
                text: '', // plain text body
                html: 'Subject : ' + subject+
                    '<br>Message : '+ message+
                    '<br>Username :'+ username+
                    '<br>Email : ' + email
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



    contact_us_mail(name, from, msg, phone) {
        // Generate test SMTP service account from gmail
        nodemailer.createTestAccount((err, account) => {
            // create reusable transporter object using the default SMTP transport

            // setup email data with unicode symbols
            let mailOptions = {
                from: '"' + name + '" <' + from + '>',
                to: 'munir.tariq@gmail.com', // list of receivers 
                subject: "Contact Form - From " + name, // Subject line
                text: '', // plain text body
                html: 'Phone: ' + phone + '<br/><br/>' + msg, // plain text body
            };

            // send mail with defined transport object
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return console.log(error);
                }
                console.log('Message sent: %s', info.messageId);
                // Preview only available when sending through an Ethereal account
                console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

            });
        });
    }



}

module.exports = new ccb_emails();