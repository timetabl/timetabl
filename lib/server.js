'use strict';

const util = require('util');
const path = require('path');
const express = require('express');
const passport = require('passport');
const Q = require('q');

const app = express();
app.enable('trust proxy');
app.disable('x-powered-by');
app.set('view engine', 'jade');

if (process.env.NODE_ENV !== 'production') {
  util.log('development mode / livereload on ' + process.env.LIVERELOAD_PORT);
  app.use(require('connect-livereload')({port: process.env.LIVERELOAD_PORT}));
  app.use(express.static('www'));
  app.use(require('morgan')('dev'));
}

require('./session')(app);

app.use(require('body-parser').urlencoded({
  extended: true
}));

app.locals = require('./locals');

app.use((req, res, next) => {
  if (req.isAuthenticated()) {
    res.locals.my = req.user;
    req.admin = res.locals.admin = req.user.userid === 'holies';
  } else {
    res.locals.my = {};
    req.admin = res.locals.admin = false;
  }
  next();
});
app.use(require('./router_system'));
app.use('/t', require('./router_t'));
app.use('/x', require('./router_x'));
app.use('/user', require('./router_user'));
app.use('/curriculum', require('./router_curriculum'));
app.use('/calculator', require('./router_calculator'));
app.use('/rating', require('./router_rating'));
app.use('/noticeboard', require('./router_noticeboard'));
app.use((err, req, res, next) => {
  util.log("error on " + req.method + " " + req.originalUrl);
  if (err) {
    util.log(err.stack);
  }
  res.status(500).render('error', {
    message: '타임테이블에 오류 발생... 털썩.'
  });
});

const PORT = process.env.HTTP_PORT || 2006;

module.exports = exports = app.listen(PORT, process.env.HTTP_BIND || '127.0.0.1', () => {
  util.log("listening on port " + PORT);
});
