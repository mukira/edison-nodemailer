
/*=============================================================================

  Send a canned email message by pushing a button on the Intel Edison

=============================================================================*/

var config = require('config');
var nodemailer = require('nodemailer');
var winston = require('winston');
var mraa = require('mraa');
var LCD  = require('jsupm_i2clcd');

var sendMailPin = config.get('boardPins.sendMailButton');
var sendMailButton = new mraa.Gpio(sendMailPin);
sendMailButton.dir(mraa.DIR_IN);

var curMailbuttonState;
var oldMailbuttonState;

var user     = config.get('user');
var password = config.get('password');
var service  = config.get('service');

var mailto   = config.get('contacts.test');
var subject  = config.get('subjects.test');
var message  = config.get('messages.test');

var myLCD = new LCD.Jhd1313m1(6, 0x3E, 0x62);

myLCD.clear;
myLCD.setColor(0,128,0);
myLCD.setCursor(0,0);
myLCD.write("To:" + mailto);
myLCD.setCursor(1,0);
myLCD.write(subject);

// create reusable transporter object using SMTP transport
var transporter = nodemailer.createTransport({
    service: service,
    auth: {
        user: user,
        pass: password
    }
});

// setup e-mail data
var mailOptions = {
    from: user,
    to: mailto,
    subject: subject,
    text: message
};

periodicActivity();

// Main loop
function periodicActivity()
{
    oldMailbuttonState = curMailbuttonState;
    curMailbuttonState = sendMailButton.read();

    if ((oldMailbuttonState == 0) && (curMailbuttonState == 1)) {
        sendEmail();
        setTimeout(periodicActivity,1000);
    }
    setTimeout(periodicActivity,10);
}

/* =============================================================
                  Helper functions
   ============================================================= */

// Winston logger
var logger = new (winston.Logger)({
    transports: [
	new (winston.transports.Console)(),
	new (winston.transports.File)({ filename: './logs/sentEmail.log' })
    ]
});

// Log a email
var logEmail = function(message, subject, logLevel) {
    var logLine = message + ' >> mailto: ' + mailto;
    logLevel = logLevel || 'info';
    logger.log(logLevel, logLine);
};

// Send an email
var sendEmail = function () {
    // send mail with defined transport object
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
            logEmail(error, subject, 'error');
        } else {
            console.log('Message sent: ' + info.response);
            logEmail(message, subject);
        }
    });
}
