'use strict';

const mysql = require('mysql');
const util = require('util');
const Q = require('q');
const conf = require('./conf');
const pool = mysql.createPool(conf.DB);

function query(sql, values, callback) {
  if (typeof values === 'function') {
    callback = values;
    values = [];
  }
  return pool.getConnection((err, connection) => {
    if (err) {
      if (callback) {
        callback(err);
      }
      return;
    }
    connection.query(sql, values, (err, result) => {
      connection.release();
      if (callback) {
        callback(err, result);
      }
    });
  });
}

exports.query = query;

exports.all = query;

const q = Q.nfbind(query);
exports.q = q;

exports.one = (sql, values, callback) => {
  return query(sql, values, (err, rows) => {
    callback(err, rows && rows[0] || null);
  });
};

exports.qone = Q.nfbind(exports.one);

exports.get = (sql, values, callback) => {
  return query(sql, values, (err, rows) => {
    var row;
    callback(err, rows && (row = rows[0]) && row[Object.keys(row)[0]]);
  });
};

exports.qget = Q.nfbind(exports.get);

exports.cache = {};

(function updateCache() {
  q("SELECT k,v FROM kv").then(rows => {
    rows.forEach(function(r) {
      exports.cache[r.k] = r.v;
    });
  }).fail(err => {
    util.log("couldn't update db cache (" + err + ")");
  }).finally(() => {
    setTimeout(updateCache, 3600 * 1000);
  });
})();
