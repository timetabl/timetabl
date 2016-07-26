'use strict';

const crypto = require('crypto');
const Q = require('q');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const db = require('./db');
const passwords = require('./passwords');

passport.use(new LocalStrategy((username, password, done) => {
  return db.qone('SELECT id,userid,univ,passwd FROM students WHERE userid=?', [username]).then(user => {
    if (user && passwords.compare(password, user.passwd)) {
      if (passwords.deprecated(user.passwd)) {
        db.q('UPDATE students SET passwd=? WHERE id=?', [passwords.hash(password), user.id]);
      }
      db.q('UPDATE students SET last_access=NOW() WHERE id=?', [user.id]);
      delete user.passwd;
      return user;
    } else {
      return Q.delay(3000).thenResolve(false);
    }
  }).nodeify(done);
}));

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser((id, done) => db.qone('SELECT id,userid,univ FROM students WHERE id=?', [id]).then(user => user || false).nodeify(done));

module.exports = app => {
  app.use(require('cookie-session')({
    name: 'timetabl6',
    secret: __filename
  }));
  app.use(passport.initialize());
  app.use(passport.session());
};
