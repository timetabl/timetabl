'use strict';

const Q = require('q');
const nodemailer = require('nodemailer');
const conf = require('./conf');

const transport = conf.MAILER ? nodemailer.createTransport(conf.MAILER) : null;

exports.send = (to, subject, message, callback) => {
  if (transport) {
    transport.sendMail({
      from: "타임테이블 <no-reply@timetabl.com>",
      replyTo: 'no-reply@timetabl.com',
      to,
      subject,
      text: message
    }, (err, res) => {
      callback(err);
    });
  } else {
    callback(new Error('no mailer'));
  }
};

exports.qsend = Q.nfbind(exports.send);
