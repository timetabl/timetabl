'use strict';

const request = require('request');

function to(path) {
  return 'http://localhost:2006' + path;
}

exports.testIndex = (test) =>
  request(to('/'), (err, res) => {
    test.ifError(err);
    test.equal(res.statusCode, 200);
    return test.done();
  });

exports.testTIndex = (test) =>
  request(to('/t/'), (err, res) => {
    test.ifError(err);
    test.equal(res.statusCode, 401);
    return test.done();
  });

exports.test = (function() {
  const req = request.defaults({
    jar: request.jar(),
    followRedirect: false
  });
  const USERID = '\uD83D\uDE00' + Date.now();
  const MESSAGE = '\uD83D\uDE00 @ ' + Date();
  const MESSAGE2 = '\uD83D\uDE01 @ ' + Date();
  let noteId = 0;
  return {
    createUser: function(test) {
      return req.post({
        url: to('/user/create'),
        form: {
          userid: USERID,
          passwd: USERID,
          passwd2: USERID,
          email: 'no@example.com',
          univ: 1
        }
      }, function(err, res) {
        test.ifError(err);
        test.equal(res.statusCode, 201);
        return test.done();
      });
    },
    login: function(test) {
      return req.post({
        url: to('/user/login'),
        form: {
          username: USERID,
          password: USERID
        }
      }, function(err, res) {
        test.ifError(err);
        test.equal(res.statusCode, 303);
        return test.done();
      });
    },
    logout: function(test) {
      return req({
        url: to('/user/logout')
      }, function(err, res) {
        test.ifError(err);
        test.equal(res.statusCode, 303);
        return test.done();
      });
    },
    loggedOut: function(test) {
      return req({
        url: to('/')
      }, function(err, res, body) {
        test.ifError(err);
        test.equal(res.statusCode, 200);
        test.ok(body.indexOf(USERID) < 0);
        return test.done();
      });
    },
    loginAgain: function(test) {
      return req.post({
        url: to('/user/login'),
        form: {
          username: USERID,
          password: USERID
        }
      }, function(err, res) {
        test.ifError(err);
        test.equal(res.statusCode, 303);
        return test.done();
      });
    },
    loggedIn: function(test) {
      return req({
        url: to('/')
      }, function(err, res, body) {
        test.ifError(err);
        test.equal(res.statusCode, 200);
        test.ok(body.indexOf(USERID) >= 0);
        return test.done();
      });
    },
    fixMute: function(test) {
      return require('../src/db').q('UPDATE students SET mute_till=NULL WHERE userid=?', [USERID]).done(function() {
        return test.done();
      });
    },
    writeNote: function(test) {
      return req.post({
        url: to('/noticeboard/create'),
        form: {
          x: 0,
          y: 0,
          color: 0,
          message: MESSAGE,
          name: ''
        }
      }, function(err, res) {
        test.ifError(err);
        test.equal(res.statusCode, 303);
        return test.done();
      });
    },
    checkNote: function(test) {
      return req(to('/noticeboard/show'), {
        followRedirect: true
      }, function(err, res) {
        test.ifError(err);
        test.equal(res.statusCode, 200);
        test.ok(res.body.indexOf(MESSAGE) >= 0);
        noteId = /id="n(\d+)"/.exec(res.body)[1];
        return test.done();
      });
    },
    replyNote: function(test) {
      return req.post({
        url: to('/noticeboard/reply'),
        form: {
          id: noteId,
          message: MESSAGE2,
          name: ''
        }
      }, function(err, res) {
        test.ifError(err);
        test.equal(res.statusCode, 303);
        return test.done();
      });
    },
    checkReplyNote: function(test) {
      return req({
        url: to('/noticeboard/show'),
        followRedirect: true
      }, function(err, res) {
        test.ifError(err);
        test.equal(res.statusCode, 200);
        test.ok(res.body.indexOf(MESSAGE2) >= 0);
        return test.done();
      });
    },
    deleteUser: function(test) {
      return req.post({
        url: to('/user/delete'),
        form: {
          sure: 1
        }
      }, function(err, res) {
        test.ifError(err);
        test.equal(res.statusCode, 200);
        return test.done();
      });
    },
    deleted: function(test) {
      return req(to('/t/'), function(err, res) {
        test.ifError(err);
        test.equal(res.statusCode, 401);
        return test.done();
      });
    }
  };
})();
