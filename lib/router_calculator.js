'use strict';

const Q = require('q');
const db = require('./db');

module.exports = exports = require('./router')();

const GRADES = {
  0: 'P',
  43: 'A+',
  40: 'A',
  37: 'A-',
  33: 'B+',
  30: 'B',
  27: 'B-',
  23: 'C+',
  20: 'C',
  17: 'C-',
  13: 'D+',
  10: 'D',
  7: 'D-',
  1: 'F'
};

const DEFAULT_ITEM = {
  subject: '',
  credits: '',
  grade: null
};

exports.qget('/', req => {
  if (!req.isAuthenticated()) {
    return 401;
  }
  return db.qget('SELECT data FROM calcs WHERE id=?', [req.user.id]).then(json => ({
    render: 'calculator_index',
    locals: {
      controller: 'calculator',
      currentMenu: 'calculator',
      items: json ? JSON.parse(json) : {},
      GRADES: GRADES,
      DEFAULT_ITEM: DEFAULT_ITEM
    }
  }));
});

exports.qpost('/save', req => {
  if (!req.isAuthenticated()) {
    return 401;
  }
  let items = {};
  for (let i = 0; i <= 239; i++) {
    let s = req.body.s[i];
    let c = parseFloat(req.body.c[i]);
    if (s || c) {
      items[i] = {
        subject: s.slice(0, 100),
        credits: c * 10 | 0,
        grade: req.body.g[i] | 0
      };
    }
  }
  let data = JSON.stringify(items);
  let q = data === '{}' ? db.q('DELETE FROM calcs WHERE id=?', [req.user.id]) : db.q('REPLACE INTO calcs (id,data) VALUES (?,?)', [req.user.id, data]);
  return q.thenResolve(204);
});
