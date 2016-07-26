'use strict';

const Q = require('q');
const db = require('./db');

module.exports = exports = require('./router')();

exports.qget('/editnickname/:id', req => {
  if (!req.isAuthenticated()) {
    return 404;
  }
  let id = req.params.id;
  return db.qone("SELECT title, nickname FROM lectures NATURAL LEFT JOIN nicknames WHERE id = ? LIMIT 1", [id]).then(row => {
    if (!row) {
      return 404;
    }
    return {
      render: 'curriculum_editnickname',
      locals: {
        controller: 'curriculum',
        title: row.title,
        nickname: row.nickname ? row.nickname : row.title
      }
    };
  });
});

exports.qpost('/editnickname/:id', req => {
  if (!req.isAuthenticated()) {
    return 404;
  }
  var nickname;
  if (nickname = req.body.nickname.trim()) {
    return 205;
  } else {
    return db.q("REPLACE INTO nicknames (title, nickname) VALUES (?, ?)", [req.body.title, nickname]).thenResolve({
      render: 'curriculum_setnickname'
    });
  }
});

exports.qget('/info/:id', req => {
  if (!req.isAuthenticated()) {
    return 404;
  }
  return db.qone("SELECT univ|0 univno, id, litid, domain, title, lecturer, credits, remark, time_txt, location_txt, competitors FROM lectures WHERE id=?", [req.params.id]).then(row => {
    if (!row) {
      return 404;
    }
    return {
      expires: 300,
      render: 'curriculum_info',
      locals: row
    };
  });
});
