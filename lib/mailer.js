var email = require('mailer'),
    fs = require('fs'),
    message = require('../mail-message');

function sendFile(fileName, attachment, cb) {
  console.log('Sending mail');
  message.attachments = [{
    filename: fileName,
    contents: attachment
  }];

  email.send(message, function (err, result) {
    if (err) console.log(err);

    clearMessage();
    cb(result);
  });
}

function clearMessage() {
  message.attachments = null;
}

exports.sendFile = sendFile;
