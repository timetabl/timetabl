'use strict';

const Q = require('q');
const db = require('./db');

module.exports = exports = require('./router')();

exports.qget('/', req => {
  var loggedin = req.isAuthenticated() ? db.qget("SELECT 1 FROM students WHERE id = ? AND IFNULL(mute_till < NOW(), 1)", [req.user.id]) : Q(false);
  return loggedin.then(value => ({
    render: 'noticeboard_index',
    locals: {
      controller: 'noticeboard',
      currentMenu: 'noticeboard',
      action: 'index',
      loggedin: value
    }
  }));
});

function toYMD(date) {
  date || (date = new Date);
  return String(date.getFullYear() * 10000 + date.getMonth() * 100 + 100 + date.getDate());
}

exports.qget('/show', req => ({
  redirect: req.originalUrl + '/' + toYMD() + '/0'
}));

exports.qget('/show/:ymd', req => ({
  redirect: req.originalUrl + '/0'
}));

const UNIT = 15;

exports.qget('/show/:ymd/:page', req => {
  var ymd = req.params.ymd || toYMD();
  var page = parseInt(req.params.page);
  var pages = 0;
  return db.qget("SELECT COUNT(*) FROM notices WHERE updated_on>=? AND updated_on<?+INTERVAL 1 DAY AND hidden != 1", [ymd, ymd]).then(value => {
    pages = Math.ceil(value / UNIT);
    return db.q("SELECT id, x, y, color FROM notices WHERE updated_on>=? AND updated_on<?+INTERVAL 1 DAY AND hidden != 1 ORDER BY updated_on DESC LIMIT ?, ?", [ymd, ymd, page * UNIT, UNIT]);
  }).then(entries => {
    if (!entries[0]) {
      return entries;
    }
    return db.q("SELECT id, name, UNIX_TIMESTAMP(created_at) created, created_at + INTERVAL 1 HOUR > NOW() recentness, LEFT(message,10000) message, student_id FROM notice_messages WHERE id IN (?) ORDER BY created_at", [
      entries.map(e => e.id)
    ]).then(rows => {
      var t = {};
      entries.forEach(function(e) {
        e.messages = [];
        t[e.id] = e;
      });
      rows.forEach(function(row) {
        t[row.id].messages.push(row);
      });
      return entries.reverse();
    });
  }).then(entries => ({
    expires: 3,
    render: 'noticeboard_show',
    locals: {
      action: 'show',
      loggedin: req.isAuthenticated(),
      ymd: ymd,
      page: page,
      pages: pages,
      entries: entries
    }
  }));
});

exports.qpost('/update', req => {
  db.q("UPDATE notices SET x = 1700 * LEAST(1, ?), y = ? WHERE id = ?", [req.body.x, req.body.y, req.body.id]);
  if (req.xhr) {
    return 204;
  } else {
    return {
      redirect: '/noticeboard/show'
    };
  }
});

exports.qpost('/create', req => {
  if (!req.body.message) {
    return 400;
  }
  if (!(req.user.id > 0)) {
    return 403;
  }
  if (req.body.name === 'holies' && req.user.userid !== 'holies') {
    return 403;
  }
  var x = parseInt(req.body.x);
  var y = parseInt(req.body.y);
  if (x === 4100 && y === 120) {
    x = 0 | 3900 + 400 * Math.random();
    y = 0 | 200 + 100 * Math.random();
  }
  return db.qget("SELECT 1 FROM students WHERE id = ? AND IFNULL(mute_till < NOW(), 1)", [req.user.id])
  .then(value => {
    if (!value) {
      throw Error('forbidden');
    }
    return db.q("SELECT student_id FROM notice_messages ORDER BY rid DESC LIMIT 3");
  })
  .then(rows => {
    if (!req.admin && rows.every(row => row.student_id === req.user.id)) {
      throw Error('vandalizing');
    }
  })
  .then(() => db.q("INSERT notices (x, y, color, updated_on) VALUES (1700 * LEAST(1, ?), ?, ?, NOW())", [x, y, req.body.color]))
  .then(result => db.query("INSERT notice_messages (id, name, student_id, message, created_at, ip) VALUES (?, ?, ?, ?, NOW(), INET_ATON(?))", [result.insertId, req.body.name, req.user.id, req.body.message, req.ip]))
  .then(() => ({
    redirect: req.xhr ? "/noticeboard/show" : 'back'
  }))
  .fail(err => {
    if (err.message === 'vandalizing') {
      return 404;
    }
    throw err;
  });
});

exports.qpost('/reply', req => {
  if (!req.body.message) {
    return 400;
  }
  if (!(req.user.id > 0)) {
    return 403;
  }
  if (req.body.name === 'holies' && req.user.userid !== 'holies') {
    return 403;
  }
  return db.qget("SELECT 1 FROM students WHERE id = ? AND IFNULL(mute_till < NOW(), 1)", [req.user.id])
  .then(value => {
    if (!value) {
      throw Error('forbidden');
    }
    return db.q("INSERT notice_messages (id, name, student_id, message, created_at, ip) VALUES (?, ?, ?, ?, NOW(), INET_ATON(?))", [req.body.id, req.body.name, req.user.id, req.body.message, req.ip]);
  })
  .then(() => db.q("UPDATE notices SET updated_on=NOW() WHERE id=? LIMIT 1", [req.body.id]))
  .then(() => ({
    redirect: req.xhr ? "/noticeboard/show" : 'back'
  }));
});

exports.qpost('/hide', req => {
  if (req.user.userid !== 'holies') {
    return 403;
  }
  return db.q("UPDATE notices SET hidden = 1 WHERE id = ?", [req.body.id]).thenResolve({
    json: 'ok'
  }).fail(err => ({
    json: {
      error: err
    }
  }));
});

exports.qpost('/show', req => {
  if (req.user.userid !== 'holies') {
    return 403;
  }
  return db.q("UPDATE notices SET hidden = 0 WHERE id = ?", [req.body.id]).thenResolve({
    json: 'ok'
  }).fail(err => ({
    json: {
      error: err
    }
  }));
});
