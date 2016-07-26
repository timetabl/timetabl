'use strict';

const util = require('util');
const fs = require('fs');
const url = require('url');
const conf = fs.existsSync('conf.php') ? JSON.parse(fs.readFileSync('conf.json', 'utf8')) : {};
const DB = conf.DSN || 'mysql://timetabl@localhost/timetabl?charset=utf8mb4&connectionLimit=10';

exports.DB = DB;

const MAILER = conf.SMTP_HOST === 'smtp.gmail.com' ? {
  service: 'Gmail',
  auth: {
    user: conf.SMTP_USERNAME,
    pass: conf.SMTP_PASSWORD
  }
} : null;

exports.MAILER = MAILER;

util.log("database: " + (DB.replace(/:[^@]*@/, ':****@')));

util.log(MAILER ? "mailer: " + MAILER.auth.user + " (" + MAILER.service + ")" : "mailer: none");
